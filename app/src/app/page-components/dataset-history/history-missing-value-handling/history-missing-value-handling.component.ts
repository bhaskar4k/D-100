import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import { KeyValuePairViewerComponent } from '../../../page-components-shared/key-value-pair-viewer/key-value-pair-viewer.component';
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
    MatProgressSpinnerModule,
    DatasetSelectionComponent,
    KeyValuePairViewerComponent
  ],
  templateUrl: './history-missing-value-handling.component.html',
  styleUrl: './history-missing-value-handling.component.css'
})
export class HistoryMissingValueHandlingComponent implements OnDestroy {
  readonly DateFormat = DateFormat;
  readonly DisplayedColumns = ['index', 'columnName', 'strategy', 'previousState', 'currentState', 'createdOn'];

  MatProgressBar = false;
  SelectedDataset: DatasetItem | null = null;
  History: MissingValueHandlingHistoryItem[] = [];
  Loaded = false;

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

    if (!dataset) {
      return;
    }

    this.LoadHistory(dataset.datasetUid);
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

          this.History = (response.data as MissingValueHandlingHistoryItem[]) ?? [];
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
