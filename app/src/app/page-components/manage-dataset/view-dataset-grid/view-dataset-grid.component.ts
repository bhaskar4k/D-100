import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL, DatasetProcessingStatus } from '../../../enums/dataset-processing-status.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { CustomDialogComponent, CustomDialogData } from '../../../page-components-shared/custom-dialog/custom-dialog.component';
import { EditDatasetNameComponent, EditDatasetNameDialogData, EditDatasetNameDialogResult } from '../edit-dataset-name/edit-dataset-name.component';
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
