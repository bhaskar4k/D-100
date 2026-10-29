import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetItem, DatasetColumnItem } from '../../../models/dataset.model';
import { Dropdown } from '../../../models/common.model';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import { SingleSelectionDropdownComponent } from '../../../page-components-shared/single-selection-dropdown/single-selection-dropdown.component';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { DATA_TYPE_LABEL } from '../../../enums/data-type.enum';
import { MISSING_VALUE_STRATEGY_OPTIONS } from '../../../enums/missing-value-strategy.enum';

interface NullableColumnRow {
  column: DatasetColumnItem;
  options: Dropdown[];
  selected: Dropdown | null;
}

@Component({
  selector: 'app-handle-missing-value',
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    DatasetSelectionComponent,
    SingleSelectionDropdownComponent
  ],
  templateUrl: './handle-missing-value.component.html',
  styleUrl: './handle-missing-value.component.css'
})
export class HandleMissingValueComponent implements OnDestroy {
  readonly StrategyOptions: Dropdown[] = MISSING_VALUE_STRATEGY_OPTIONS;

  SelectedDataset: DatasetItem | null = null;
  LoadingColumns = false;
  NullableColumns: NullableColumnRow[] = [];

  private columnSubscription?: Subscription;

  constructor(
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy(): void {
    this.columnSubscription?.unsubscribe();
  }

  OnDatasetChange(dataset: DatasetItem | null): void {
    this.SelectedDataset = dataset;
    this.NullableColumns = [];

    if (!dataset) {
      return;
    }

    this.LoadColumns(dataset.datasetUid);
  }

  OnColumnStrategyChange(row: NullableColumnRow, option: Dropdown): void {
    row.selected = option;
  }

  GetTypeLabel(type: number): string {
    return DATA_TYPE_LABEL[type]?.label ?? 'Unknown';
  }

  private LoadColumns(datasetUid: string): void {
    this.LoadingColumns = true;
    this.columnSubscription?.unsubscribe();

    this.columnSubscription = this.datasetService.GetDetails(datasetUid).subscribe({
      next: response => {
        this.LoadingColumns = false;

        if (!response.success) {
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        const columns: DatasetColumnItem[] = response.data?.columns ?? [];
        this.NullableColumns = columns
          .filter(c => c.nullable)
          .map(c => ({ column: c, options: this.StrategyOptions, selected: null }));
      },
      error: () => {
        this.LoadingColumns = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load dataset columns.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
