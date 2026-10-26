import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL, FileUploadStatus } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL, DatasetProcessingStatus } from '../../../enums/dataset-processing-status.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { CustomDialogComponent, CustomDialogData } from '../../../page-components-shared/custom-dialog/custom-dialog.component';
import { EditDatasetNameComponent, EditDatasetNameDialogData, EditDatasetNameDialogResult } from '../edit-dataset-name/edit-dataset-name.component';
import { PreviewDatasetComponent, PreviewDatasetDialogData } from '../../../page-components-shared/preview-dataset/preview-dataset.component';
import { DownloadIngestedDatasetComponent, DownloadIngestedDatasetFormatDialogData, DownloadIngestedDatasetFormatDialogResult } from '../../../page-components-shared/download-ingested-dataset/download-ingested-dataset.component';
import { DatasetDownloadPlan } from '../../../models/dataset.model';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-dataset-grid',
  imports: [CommonModule, DatePipe, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './view-dataset-grid.component.html',
  styleUrl: './view-dataset-grid.component.css'
})
export class ViewDatasetGridComponent implements OnInit, OnDestroy {
  readonly DisplayedColumns = [
    'fileName',
    'extension',
    'fileSize',
    'status',
    'uploadedOn',
    'isProcessed',
    'processingStatus',
    'processedOn',
    'modifiedOn',
    'action'
  ];

  ProcessingUids = new Set<string>();
  DeletingUids = new Set<string>();
  RenamingUids = new Set<string>();
  DownloadingUids = new Set<string>();
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
  readonly FileIcon = GetFileIconByExtension;
  readonly Duration = FormatDuration;
  readonly PageSizeOptions = [10, 25, 50, 100];
  readonly SearchDebounceMs = 300;

  Datasets: DatasetItem[] = [];
  Total = 0;
  PageIndex = 0;
  PageSize = 5;
  SearchText = '';
  MatProgressBar = false;

  private search$ = new Subject<string>();
  private searchSubscription?: Subscription;
  private loadSubscription?: Subscription;

  constructor(
    private datasetService: DatasetService,
    private dialog: MatDialog,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Searching runs on the server so it covers every dataset, not just the current page.
    this.searchSubscription = this.search$
      .pipe(debounceTime(this.SearchDebounceMs), distinctUntilChanged())
      .subscribe(() => {
        this.PageIndex = 0;
        this.Load();
      });

    this.Load();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
  }

  OnSearch(value: string): void {
    this.SearchText = value.trim();
    this.search$.next(this.SearchText);
  }

  GetStatus(status: number): { label: string; color: string } {
    return FILE_UPLOAD_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetProcessingStatus(status: number): { label: string; color: string } {
    return DATASET_PROCESSING_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  CanProcess(row: DatasetItem): boolean {
    return row.isActive && (row.processingStatus === DatasetProcessingStatus.NOT_INITIATED
      || row.processingStatus === DatasetProcessingStatus.FAILED);
  }

  CanDelete(row: DatasetItem): boolean {
    return row.isActive && row.processingStatus !== DatasetProcessingStatus.IN_QUEUE &&
      row.processingStatus !== DatasetProcessingStatus.PROCESSING;
  }

  OnPageChange(event: PageEvent): void {
    this.PageIndex = event.pageIndex;
    this.PageSize = event.pageSize;
    this.Load();
  }

  OnRefresh(): void {
    this.Load();
  }

  OnInfo(datasetUid: string): void {
    this.router.navigate(['/datasets/view'], { queryParams: { id: datasetUid } });
  }

  CanPreview(row: DatasetItem): boolean {
    return row.isActive && row.isProcessed;
  }

  CanDownload(row: DatasetItem): boolean {
    // Processed datasets can be re-exported in any format from the parquet mirror; unprocessed
    // ones whose upload is complete can still be downloaded as the raw file the user sent.
    return row.isActive && row.status === FileUploadStatus.COMPLETED;
  }

  OnDownload(row: DatasetItem): void {
    if (this.DownloadingUids.has(row.datasetUid)) {
      return;
    }

    if (!row.isProcessed) {
      // No parquet mirror exists yet, so there is nothing to re-encode — just stream the
      // original uploaded file. Skip the format picker.
      this.StartRawDatasetDownload(row);
      return;
    }

    const dialogRef = this.dialog.open<DownloadIngestedDatasetComponent, DownloadIngestedDatasetFormatDialogData, DownloadIngestedDatasetFormatDialogResult>(
      DownloadIngestedDatasetComponent,
      {
        data: { datasetUid: row.datasetUid, fileName: row.fileName, extension: row.extension },
        autoFocus: 'first-tabbable'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.StartIngestedDatasetDownload(row, result.downloadedFileType);
    });
  }

  private StartIngestedDatasetDownload(row: DatasetItem, downloadedFileType: number): void {
    this.DownloadingUids.add(row.datasetUid);
    this.MatProgressBar = true;

    this.datasetService.PrepareDownloadIngestedDataset(row.datasetUid, downloadedFileType).subscribe({
      next: response => {
        if (!response.success) {
          this.DownloadingUids.delete(row.datasetUid);
          this.MatProgressBar = false;
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        const plan = response.data as DatasetDownloadPlan;
        this.StreamBlob(this.datasetService.DownloadIngestedDatasetBlob(row.datasetUid), row.datasetUid, plan.suggestedDownloadName);
      },
      error: () => {
        this.DownloadingUids.delete(row.datasetUid);
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to prepare the download.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  private StartRawDatasetDownload(row: DatasetItem): void {
    this.DownloadingUids.add(row.datasetUid);
    this.MatProgressBar = true;
    this.StreamBlob(
      this.datasetService.DownloadRawDatasetBlob(row.datasetUid),
      row.datasetUid,
      `${row.fileName}${row.extension}`
    );
  }

  private StreamBlob(request$: Observable<HttpResponse<Blob>>, datasetUid: string, suggestedName: string): void {
    request$.subscribe({
      next: response => {
        this.DownloadingUids.delete(datasetUid);
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
        this.DownloadingUids.delete(datasetUid);
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to download the dataset.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  OnPreview(row: DatasetItem): void {
    this.dialog.open<PreviewDatasetComponent, PreviewDatasetDialogData>(
      PreviewDatasetComponent,
      {
        data: { datasetUid: row.datasetUid, fileName: row.fileName, extension: row.extension },
        autoFocus: 'first-tabbable',
        panelClass: 'preview-dataset-dialog',
        maxWidth: '80vw',
        width: 'min(max-content, 80vw)',
        minWidth: 'min(560px, 90vw)'
      }
    );
  }

  OnEdit(row: DatasetItem): void {
    if (this.RenamingUids.has(row.datasetUid)) {
      return;
    }

    const dialogRef = this.dialog.open<EditDatasetNameComponent, EditDatasetNameDialogData, EditDatasetNameDialogResult>(
      EditDatasetNameComponent,
      {
        data: { datasetUid: row.datasetUid, fileName: row.fileName, extension: row.extension },
        autoFocus: 'first-tabbable'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !result.newName || result.newName === row.fileName) {
        return;
      }

      this.RenamingUids.add(row.datasetUid);
      this.MatProgressBar = true;

      this.datasetService.UpdateName(row.datasetUid, result.newName).subscribe({
        next: response => {
          this.RenamingUids.delete(row.datasetUid);
          this.MatProgressBar = false;
          this.Load();

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.RenamingUids.delete(row.datasetUid);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to rename dataset.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  OnDelete(datasetUid: string, fileName: string, extension: string): void {
    if (this.DeletingUids.has(datasetUid)) {
      return;
    }

    const confirmRef = this.dialog.open<CustomDialogComponent, CustomDialogData, boolean>(
      CustomDialogComponent,
      {
        data: {
          title: 'Delete dataset',
          message: `Are you sure you want to delete <strong>${fileName}${extension}</strong>?`,
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

      this.DeletingUids.add(datasetUid);
      this.MatProgressBar = true;

      this.datasetService.Delete(datasetUid).subscribe({
        next: response => {
          this.DeletingUids.delete(datasetUid);
          this.MatProgressBar = false;
          this.Load();

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.DeletingUids.delete(datasetUid);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to delete dataset.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  OnProcess(datasetUid: string): void {
    if (this.ProcessingUids.has(datasetUid)) {
      return;
    }

    this.ProcessingUids.add(datasetUid);
    this.MatProgressBar = true;

    this.datasetService.Process(datasetUid).subscribe({
      next: response => {
        this.ProcessingUids.delete(datasetUid);
        this.MatProgressBar = false;
        this.Load();

        this.dialog.open(CustomAlertComponent, {
          data: {
            text: response.message,
            type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
          }
        });
      },
      error: () => {
        this.ProcessingUids.delete(datasetUid);
        this.MatProgressBar = false;

        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to queue dataset for processing.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  private Load(): void {
    this.MatProgressBar = true;

    // A newer request supersedes one still in flight, so a slow response can't overwrite fresher results.
    this.loadSubscription?.unsubscribe();

    this.loadSubscription = this.datasetService.GetAll(this.PageIndex + 1, this.PageSize, this.SearchText).subscribe({
      next: response => {
        this.MatProgressBar = false;

        if (!response.success) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
          return;
        }

        this.Datasets = response.data.items;
        this.Total = response.data.total;
      },
      error: () => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, { data: { text: 'Failed to load datasets.', type: ResponseTypeColor.ERROR } });
      }
    });
  }
}
