import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL } from '../../../enums/dataset-processing-status.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { CustomDialogComponent, CustomDialogData } from '../../../page-components-shared/custom-dialog/custom-dialog.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-view-deleted-dataset-grid',
  imports: [CommonModule, DatePipe, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './view-deleted-dataset-grid.component.html',
  styleUrl: './view-deleted-dataset-grid.component.css'
})
export class ViewDeletedDatasetGridComponent implements OnInit, OnDestroy {
  readonly DisplayedColumns = [
    'fileName',
    'extension',
    'fileSize',
    'status',
    'uploadedOn',
    'isProcessed',
    'modifiedOn',
    'autoDeletingOn',
    'action'
  ];

  // Server stores auto_deletion_time as UNIX seconds; UI needs a JS Date for the date pipe.
  ToDate(epochSeconds: number | null): Date | null {
    return epochSeconds === null ? null : new Date(epochSeconds * 1000);
  }

  // Compact "time left" badge next to the auto-deletion date: picks the two largest non-zero
  // units from months / days / hours / minutes / seconds, e.g. "29d 4h left", "7h 12m left".
  // Snapshot only — recomputed on each refresh / page change, not ticking live.
  TimeLeft(epochSeconds: number | null): string {
    if (epochSeconds === null) return '';

    let remaining = epochSeconds - Math.floor(Date.now() / 1000);
    if (remaining <= 0) return 'overdue';

    const units: Array<{ label: string; secs: number }> = [
      { label: 'mo', secs: 30 * 86400 },
      { label: 'd', secs: 86400 },
      { label: 'h', secs: 3600 },
      { label: 'm', secs: 60 },
      { label: 's', secs: 1 },
    ];

    const parts: string[] = [];
    for (const u of units) {
      const value = Math.floor(remaining / u.secs);
      if (value > 0) {
        parts.push(`${value}${u.label}`);
        remaining -= value * u.secs;
        if (parts.length === 2) break;
      }
    }

    return parts.length ? `${parts.join(' ')} left` : '< 1s left';
  }

  RestoringUids = new Set<string>();
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
  readonly FileIcon = GetFileIconByExtension;
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

  OnPageChange(event: PageEvent): void {
    this.PageIndex = event.pageIndex;
    this.PageSize = event.pageSize;
    this.Load();
  }

  OnRefresh(): void {
    this.Load();
  }

  OnRestore(row: DatasetItem): void {
    if (this.RestoringUids.has(row.datasetUid)) {
      return;
    }

    const confirmRef = this.dialog.open<CustomDialogComponent, CustomDialogData, boolean>(
      CustomDialogComponent,
      {
        data: {
          title: 'Restore dataset',
          message: `Restore <strong>${row.fileName}${row.extension}</strong>?<br>It will reappear in your active datasets list.`,
          confirmLabel: 'Restore',
          cancelLabel: 'Cancel',
          iconClass: 'bi bi-arrow-counterclockwise',
          type: ResponseTypeColor.SUCCESS
        }
      }
    );

    confirmRef.afterClosed().subscribe((approved) => {
      if (!approved) {
        return;
      }

      this.RestoringUids.add(row.datasetUid);
      this.MatProgressBar = true;

      this.datasetService.Restore(row.datasetUid).subscribe({
        next: response => {
          this.RestoringUids.delete(row.datasetUid);
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
          this.RestoringUids.delete(row.datasetUid);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to restore dataset.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  private Load(): void {
    this.MatProgressBar = true;

    this.loadSubscription?.unsubscribe();

    this.loadSubscription = this.datasetService.GetDeleted(this.PageIndex + 1, this.PageSize, this.SearchText).subscribe({
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
        this.dialog.open(CustomAlertComponent, { data: { text: 'Failed to load deleted datasets.', type: ResponseTypeColor.ERROR } });
      }
    });
  }
}
