import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import { KeyValuePairViewerComponent } from '../../../page-components-shared/key-value-pair-viewer/key-value-pair-viewer.component';
import { PreviewDatasetComponent, PreviewDatasetDialogData } from '../../../page-components-shared/preview-dataset/preview-dataset.component';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { DatasetItem } from '../../../models/dataset.model';
import {
  DatasetHistoryActionType,
  MissingValueHandlingHistoryItem
} from '../../../models/dataset-history.model';
import { DatasetHistoryService } from '../../../services/dataset-history.service';
import { DateFormat, ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-history-missing-value-handling',
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatasetSelectionComponent,
    KeyValuePairViewerComponent
  ],
  templateUrl: './history-missing-value-handling.component.html',
  styleUrl: './history-missing-value-handling.component.css'
})
export class HistoryMissingValueHandlingComponent implements OnInit, OnDestroy {
  readonly DateFormat = DateFormat;
  readonly DisplayedColumns = ['index', 'columnName', 'strategy', 'previousState', 'currentState', 'extraData', 'createdOn'];
  readonly PageSizeOptions = [5, 10, 25, 50, 100];
  readonly SearchDebounceMs = 200;

  MatProgressBar = false;
  SelectedDataset: DatasetItem | null = null;
  HistoryDataSource = new MatTableDataSource<MissingValueHandlingHistoryItem>([]);
  HistorySearchText = '';
  Loaded = false;

  private readonly historySearch$ = new Subject<string>();
  private historySubscription?: Subscription;
  private searchSubscription?: Subscription;

  // Paginator mounts only after the History block renders (gated by *ngIf), so bind it from a
  // setter that fires whenever the view child materializes.
  @ViewChild(MatPaginator) set HistoryPaginator(value: MatPaginator | undefined) {
    if (value) {
      this.HistoryDataSource.paginator = value;
    }
  }

  constructor(
    private historyService: DatasetHistoryService,
    private dialog: MatDialog
  ) {
    // Match against column name, strategy name, and the formatted applied-on date so the user
    // can search for the same text they see in the table. The previous/current state objects
    // are rendered through the key-value viewer and aren't practical to search as free text.
    this.HistoryDataSource.filterPredicate = (data, filter) => {
      const text = filter.trim().toLowerCase();
      if (!text) {
        return true;
      }
      const column = (data.columnName ?? '').toLowerCase();
      const strategy = (data.replacement_strategy_name ?? '').toLowerCase();
      // Format with the same DateFormat the template uses, so searching "nov 2026" or
      // "14:30" matches what the row actually shows. A missing/invalid date is skipped.
      let createdOn = '';
      if (data.createdOn) {
        try {
          createdOn = formatDate(data.createdOn as string | Date, DateFormat, 'en-US').toLowerCase();
        } catch {
          createdOn = '';
        }
      }
      return column.includes(text) || strategy.includes(text) || createdOn.includes(text);
    };
  }

  ngOnInit(): void {
    this.searchSubscription = this.historySearch$
      .pipe(debounceTime(this.SearchDebounceMs), distinctUntilChanged())
      .subscribe((text) => {
        this.HistoryDataSource.filter = text;
        if (this.HistoryDataSource.paginator) {
          this.HistoryDataSource.paginator.firstPage();
        }
      });
  }

  ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  OnDatasetChange(dataset: DatasetItem | null): void {
    this.SelectedDataset = dataset;
    this.HistoryDataSource.data = [];
    this.HistorySearchText = '';
    this.HistoryDataSource.filter = '';
    this.Loaded = false;

    if (!dataset) {
      return;
    }

    this.LoadHistory(dataset.datasetUid);
  }

  OnHistorySearch(value: string): void {
    this.HistorySearchText = value;
    this.historySearch$.next(value);
  }

  get CanPreview(): boolean {
    return !!this.SelectedDataset && this.SelectedDataset.isActive && this.SelectedDataset.isProcessed;
  }

  OnPreview(): void {
    if (!this.CanPreview || this.MatProgressBar || !this.SelectedDataset) {
      return;
    }

    this.dialog.open<PreviewDatasetComponent, PreviewDatasetDialogData>(
      PreviewDatasetComponent,
      {
        data: {
          datasetUid: this.SelectedDataset.datasetUid,
          fileName: this.SelectedDataset.fileName,
          extension: this.SelectedDataset.extension
        },
        autoFocus: 'first-tabbable',
        panelClass: 'preview-dataset-dialog',
        maxWidth: '80vw',
        width: 'min(max-content, 80vw)',
        minWidth: 'min(560px, 90vw)'
      }
    );
  }

  private LoadHistory(datasetUid: string): void {
    this.MatProgressBar = true;
    this.historySubscription?.unsubscribe();

    this.historySubscription = this.historyService
      .GetHistory(datasetUid, DatasetHistoryActionType.MissingValueHandling)
      .subscribe({
        next: response => {
          this.MatProgressBar = false;

          if (!response.success) {
            this.dialog.open(CustomAlertComponent, {
              data: { text: response.message, type: ResponseTypeColor.ERROR }
            });
            return;
          }

          this.HistoryDataSource.data = (response.data as MissingValueHandlingHistoryItem[]) ?? [];
          this.Loaded = true;

          if (this.HistoryDataSource.paginator) {
            this.HistoryDataSource.paginator.firstPage();
          }
        },
        error: () => {
          this.MatProgressBar = false;
          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to load dataset history.', type: ResponseTypeColor.ERROR }
          });
        }
      });
  }
}
