import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetColumnItem, DatasetDetailItem, DatasetDownloadPlan } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL, FileUploadStatus } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL } from '../../../enums/dataset-processing-status.enum';
import { DATA_TYPE_LABEL } from '../../../enums/data-type.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { CustomDialogComponent, CustomDialogData } from '../../../page-components-shared/custom-dialog/custom-dialog.component';
import { PreviewDatasetComponent, PreviewDatasetDialogData } from '../../../page-components-shared/preview-dataset/preview-dataset.component';
import { EditColumnNameComponent, EditColumnNameDialogData, EditColumnNameDialogResult } from '../edit-column-name/edit-column-name.component';
import { DownloadIngestedDatasetComponent, DownloadIngestedDatasetFormatDialogData, DownloadIngestedDatasetFormatDialogResult } from '../../../page-components-shared/download-ingested-dataset/download-ingested-dataset.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-dataset-info',
  imports: [
    CommonModule, DatePipe, RouterModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './view-dataset-info.component.html',
  styleUrl: './view-dataset-info.component.css'
})
export class ViewDatasetInfoComponent implements OnInit, OnDestroy {
  readonly ColumnColumns = ['id', 'columnName', 'type', 'nullable', 'uniqueCount', 'createdOn', 'modifiedOn', 'action'];
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
  readonly FileIcon = GetFileIconByExtension;
  readonly Duration = FormatDuration;
  readonly PageSizeOptions = [5, 10, 25, 50, 100];
  readonly SearchDebounceMs = 200;

  Dataset: DatasetDetailItem | null = null;
  Columns: DatasetColumnItem[] = [];
  ColumnDataSource = new MatTableDataSource<DatasetColumnItem>([]);
  ColumnSearchText = '';
  MatProgressBar = false;
  RenamingColumnIds = new Set<number>();
  DeletingColumnIds = new Set<number>();
  Downloading = false;

  private readonly columnSearch$ = new Subject<string>();
  private routeSubscription?: Subscription;
  private detailSubscription?: Subscription;
  private searchSubscription?: Subscription;

  // The second card (which hosts the paginator and sort) is wrapped in *ngIf="Dataset as D", so it
  // mounts only after data arrives. The setters below rebind the data source as soon as either
  // view child materializes, no matter the order.
  @ViewChild(MatPaginator) set ColumnPaginator(value: MatPaginator | undefined) {
    if (value) this.ColumnDataSource.paginator = value;
  }

  @ViewChild(MatSort) set ColumnSort(value: MatSort | undefined) {
    if (value) this.ColumnDataSource.sort = value;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) {
    this.ColumnDataSource.filterPredicate = (data, filter) => {
      const text = filter.trim().toLowerCase();
      if (!text) return true;

      const typeLabel = (DATA_TYPE_LABEL[data.type]?.label ?? '').toLowerCase();
      return data.columnName.toLowerCase().includes(text) || typeLabel.includes(text);
    };

    this.ColumnDataSource.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'columnName': return data.columnName.toLowerCase();
        case 'type': return DATA_TYPE_LABEL[data.type]?.label ?? '';
        case 'nullable': return data.nullable ? 1 : 0;
        case 'uniqueCount': return data.uniqueCount;
        case 'createdOn': return data.createdOn ? new Date(data.createdOn).getTime() : 0;
        case 'modifiedOn': return data.modifiedOn ? new Date(data.modifiedOn).getTime() : 0;
        default: return '';
      }
    };
  }

  ngOnInit(): void {
    this.searchSubscription = this.columnSearch$
      .pipe(debounceTime(this.SearchDebounceMs), distinctUntilChanged())
      .subscribe((text) => {
        this.ColumnDataSource.filter = text;
        if (this.ColumnDataSource.paginator) {
          this.ColumnDataSource.paginator.firstPage();
        }
      });

    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const uid = (params.get('id') ?? '').trim();

      if (!uid) {
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Dataset id is missing in the URL.', type: ResponseTypeColor.ERROR }
        });
        this.router.navigate(['/datasets']);
        return;
      }

      this.Load(uid);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.detailSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  GetStatus(status: number): { label: string; color: string } {
    return FILE_UPLOAD_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetProcessingStatus(status: number): { label: string; color: string } {
    return DATASET_PROCESSING_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetType(type: number): { label: string; color: string } {
    return DATA_TYPE_LABEL[type] ?? { label: 'Unknown', color: 'type-unknown' };
  }

  OnColumnSearch(value: string): void {
    this.ColumnSearchText = value;
    this.columnSearch$.next(value);
  }

  BackToList(): void {
    this.router.navigate(['/datasets']);
  }

  CanPreview(dataset: DatasetDetailItem): boolean {
    return dataset.isActive && dataset.isProcessed;
  }

  OnPreview(dataset: DatasetDetailItem): void {
    this.dialog.open<PreviewDatasetComponent, PreviewDatasetDialogData>(
      PreviewDatasetComponent,
      {
        data: { datasetUid: dataset.datasetUid, fileName: dataset.fileName, extension: dataset.extension },
        autoFocus: 'first-tabbable',
        panelClass: 'preview-dataset-dialog',
        maxWidth: '80vw',
        width: 'min(max-content, 80vw)',
        minWidth: 'min(560px, 90vw)'
      }
    );
  }

  CanDownload(dataset: DatasetDetailItem): boolean {
    // Processed datasets re-export in any format from the parquet mirror; unprocessed ones
    // whose upload is complete can still be downloaded as the raw file the user sent.
    return dataset.isActive && dataset.status === FileUploadStatus.COMPLETED;
  }

  OnDownload(dataset: DatasetDetailItem): void {
    if (this.Downloading) {
      return;
    }

    if (!dataset.isProcessed) {
      // No parquet mirror exists yet, so there is nothing to re-encode — just stream the
      // original uploaded file. Skip the format picker.
      this.StartRawDatasetDownload(dataset);
      return;
    }

    const dialogRef = this.dialog.open<DownloadIngestedDatasetComponent, DownloadIngestedDatasetFormatDialogData, DownloadIngestedDatasetFormatDialogResult>(
      DownloadIngestedDatasetComponent,
      {
        data: { datasetUid: dataset.datasetUid, fileName: dataset.fileName, extension: dataset.extension },
        autoFocus: 'first-tabbable'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.StartIngestedDatasetDownload(dataset, result.downloadedFileType);
    });
  }

  private StartIngestedDatasetDownload(dataset: DatasetDetailItem, downloadedFileType: number): void {
    this.Downloading = true;
    this.MatProgressBar = true;

    this.datasetService.PrepareDownloadIngestedDataset(dataset.datasetUid, downloadedFileType).subscribe({
      next: response => {
        if (!response.success) {
          this.Downloading = false;
          this.MatProgressBar = false;
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        const plan = response.data as DatasetDownloadPlan;
        this.StreamBlob(
          this.datasetService.DownloadIngestedDatasetBlob(dataset.datasetUid),
          plan.suggestedDownloadName
        );
      },
      error: () => {
        this.Downloading = false;
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to prepare the download.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  private StartRawDatasetDownload(dataset: DatasetDetailItem): void {
    this.Downloading = true;
    this.MatProgressBar = true;
    this.StreamBlob(
      this.datasetService.DownloadRawDatasetBlob(dataset.datasetUid),
      `${dataset.fileName}${dataset.extension}`
    );
  }

  private StreamBlob(request$: Observable<HttpResponse<Blob>>, suggestedName: string): void {
    request$.subscribe({
      next: response => {
        this.Downloading = false;
        this.MatProgressBar = false;

        if (!response.body) {
          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Download returned no file.', type: ResponseTypeColor.ERROR }
          });
          return;
        }

        // Prefer the server's Content-Disposition filename when present so the UI shows what
        // the backend decided (handles the Excel-zip case). Falls back to the suggested name.
        const header = response.headers.get('Content-Disposition') ?? '';
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(header);
        const fileName = decodeURIComponent(match?.[1] ?? match?.[2] ?? suggestedName).trim();

        const url = URL.createObjectURL(response.body);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.Downloading = false;
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to download the dataset.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  OnDeleteColumn(column: DatasetColumnItem): void {
    if (!this.Dataset || this.DeletingColumnIds.has(column.id)) {
      return;
    }

    const datasetUid = this.Dataset.datasetUid;

    const confirmRef = this.dialog.open<CustomDialogComponent, CustomDialogData, boolean>(
      CustomDialogComponent,
      {
        data: {
          title: 'Delete column',
          message: `Are you sure you want to delete column <strong>${column.columnName}</strong>?<br>This also drops it from the processed file.
          <br>This cannot be undone.
          <br>Although, you can bring it back from the unprocessed file.`,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          iconClass: 'bi bi-trash3-fill',
          type: ResponseTypeColor.ERROR
        }
      }
    );

    confirmRef.afterClosed().subscribe((approved) => {
      if (!approved) {
        return;
      }

      this.DeletingColumnIds.add(column.id);
      this.MatProgressBar = true;

      this.datasetService.DeleteColumn(datasetUid, column.id).subscribe({
        next: response => {
          this.DeletingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          if (response.success) {
            this.Load(datasetUid);
          }

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.DeletingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to delete column.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  OnEditColumn(column: DatasetColumnItem): void {
    if (!this.Dataset || this.RenamingColumnIds.has(column.id)) {
      return;
    }

    const datasetUid = this.Dataset.datasetUid;

    const dialogRef = this.dialog.open<EditColumnNameComponent, EditColumnNameDialogData, EditColumnNameDialogResult>(
      EditColumnNameComponent,
      {
        data: { datasetUid, columnId: column.id, columnName: column.columnName },
        autoFocus: 'first-tabbable'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !result.newName || result.newName === column.columnName) {
        return;
      }

      this.RenamingColumnIds.add(column.id);
      this.MatProgressBar = true;

      this.datasetService.UpdateColumnName(datasetUid, column.id, result.newName).subscribe({
        next: response => {
          this.RenamingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          if (response.success) {
            this.Load(datasetUid);
          }

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.RenamingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to rename column.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  private Load(datasetUid: string): void {
    this.MatProgressBar = true;

    this.detailSubscription?.unsubscribe();

    this.detailSubscription = this.datasetService.GetDetails(datasetUid).subscribe({
      next: response => {
        this.MatProgressBar = false;

        if (!response.success) {
          this.Dataset = null;
          this.Columns = [];
          this.ColumnDataSource.data = [];
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        this.Dataset = response.data.dataset;
        this.Columns = response.data.columns;
        this.ColumnDataSource.data = this.Columns;
      },
      error: () => {
        this.MatProgressBar = false;
        this.Dataset = null;
        this.Columns = [];
        this.ColumnDataSource.data = [];
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load dataset details.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
