import { Component, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import {
  KeyValueModalComponent,
  KeyValueModalData
} from '../../../page-components-shared/key-value-modal/key-value-modal.component';
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
    DatasetSelectionComponent
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

  OnView(title: string, data: Record<string, unknown> | null): void {
    this.dialog.open<KeyValueModalComponent, KeyValueModalData>(KeyValueModalComponent, {
      data: { title, data },
      autoFocus: 'first-tabbable',
      panelClass: 'key-value-dialog',
      maxWidth: '80vw',
      width: 'min(560px, 90vw)'
    });
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
