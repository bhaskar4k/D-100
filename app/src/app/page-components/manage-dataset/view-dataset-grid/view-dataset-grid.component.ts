import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL, DatasetProcessingStatus } from '../../../enums/dataset-processing-status.enum';
import { GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
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
    'action'
  ];

  ProcessingUids = new Set<string>();
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
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
    private dialog: MatDialog
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
    return row.processingStatus === DatasetProcessingStatus.NOT_INITIATED
      || row.processingStatus === DatasetProcessingStatus.FAILED;
  }

  OnPageChange(event: PageEvent): void {
    this.PageIndex = event.pageIndex;
    this.PageSize = event.pageSize;
    this.Load();
  }

  OnProcess(datasetUid: string): void {
    if (this.ProcessingUids.has(datasetUid)) {
      return;
    }

    this.ProcessingUids.add(datasetUid);

    this.datasetService.Process(datasetUid).subscribe({
      next: response => {
        this.ProcessingUids.delete(datasetUid);
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
