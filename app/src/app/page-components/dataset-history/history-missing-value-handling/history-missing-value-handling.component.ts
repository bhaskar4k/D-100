import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import { KeyValuePairViewerComponent } from '../../../page-components-shared/key-value-pair-viewer/key-value-pair-viewer.component';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { DatasetItem } from '../../../models/dataset.model';
import {
  DatasetHistoryActionType,
  DatasetHistoryItem
} from '../../../models/dataset-history.model';
import { DatasetHistoryService } from '../../../services/dataset-history.service';
import { ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-history-missing-value-handling',
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatasetSelectionComponent,
    KeyValuePairViewerComponent
  ],
  templateUrl: './history-missing-value-handling.component.html',
  styleUrl: './history-missing-value-handling.component.css'
})
export class HistoryMissingValueHandlingComponent implements OnDestroy {
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly DisplayedColumns = ['index', 'columnName', 'previousState', 'currentState', 'createdOn'];

  MatProgressBar = false;
  SelectedDataset: DatasetItem | null = null;
  History: DatasetHistoryItem[] = [];
  Loaded = false;

  // The viewer below the table reflects whichever View button was last clicked. Null means
  // nothing is being viewed yet.
  SelectedViewTitle: string = '';
  SelectedViewData: unknown = null;
  SelectedRowIndex: number | null = null;
  SelectedView: 'previous' | 'current' | null = null;

  private historySubscription?: Subscription;

  constructor(
    private historyService: DatasetHistoryService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
  }

  OnDatasetChange(dataset: DatasetItem | null): void {
    this.SelectedDataset = dataset;
    this.History = [];
    this.Loaded = false;
    this.ResetSelectedView();

    if (!dataset) {
      return;
    }

    this.LoadHistory(dataset.datasetUid);
  }

  OnView(rowIndex: number, which: 'previous' | 'current', title: string, data: unknown): void {
    // Toggle off if the same cell is clicked again, so the user can close the viewer without
    // navigating away.
    if (this.SelectedRowIndex === rowIndex && this.SelectedView === which) {
      this.ResetSelectedView();
      return;
    }
    this.SelectedRowIndex = rowIndex;
    this.SelectedView = which;
    this.SelectedViewTitle = title;
    this.SelectedViewData = data;
  }

  IsViewActive(rowIndex: number, which: 'previous' | 'current'): boolean {
    return this.SelectedRowIndex === rowIndex && this.SelectedView === which;
  }

  private ResetSelectedView(): void {
    this.SelectedRowIndex = null;
    this.SelectedView = null;
    this.SelectedViewTitle = '';
    this.SelectedViewData = null;
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

          this.History = (response.data as DatasetHistoryItem[]) ?? [];
          this.Loaded = true;
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
