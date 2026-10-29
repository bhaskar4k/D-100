import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MISSING_VALUE_STRATEGY_OPTIONS, MissingValueStrategy } from '../../../enums/missing-value-strategy.enum';

@Component({
  selector: 'app-handle-missing-value',
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    DatasetSelectionComponent,
    SingleSelectionDropdownComponent
  ],
  templateUrl: './handle-missing-value.component.html',
  styleUrl: './handle-missing-value.component.css'
})
export class HandleMissingValueComponent implements OnDestroy {
  readonly StrategyOptions: Dropdown[] = MISSING_VALUE_STRATEGY_OPTIONS;
  readonly MissingValueStrategy = MissingValueStrategy;

  SelectedDataset: DatasetItem | null = null;
  LoadingColumns = false;

  NullableColumns: DatasetColumnItem[] = [];
  ColumnOptions: Dropdown[] = [];

  SelectedColumn: Dropdown | null = null;
  SelectedStrategy: Dropdown | null = null;
  ConstantValue: string = '';

  private columnSubscription?: Subscription;

  constructor(
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy(): void {
    this.columnSubscription?.unsubscribe();
  }

  get IsConstantStrategy(): boolean {
    return this.SelectedStrategy?.id === MissingValueStrategy.Constant;
  }

  get SelectedColumnTypeLabel(): string {
    if (!this.SelectedColumn) {
      return '';
    }
    const column = this.NullableColumns.find(c => c.id === this.SelectedColumn!.id);
    return column ? (DATA_TYPE_LABEL[column.type]?.label ?? 'Unknown') : '';
  }

  OnDatasetChange(dataset: DatasetItem | null): void {
    this.SelectedDataset = dataset;
    this.NullableColumns = [];
    this.ColumnOptions = [];
    this.SelectedColumn = null;
    this.SelectedStrategy = null;
    this.ConstantValue = '';

    if (!dataset) {
      return;
    }

    this.LoadColumns(dataset.datasetUid);
  }

  OnColumnChange(option: Dropdown): void {
    this.SelectedColumn = option;

    // Switching columns resets the per-column choice so the strategy dropdown
    // doesn't appear pre-filled with a selection from the previous column.
    this.SelectedStrategy = null;
    this.ConstantValue = '';
  }

  OnStrategyChange(option: Dropdown): void {
    this.SelectedStrategy = option;
    this.ConstantValue = '';
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
        this.NullableColumns = columns.filter(c => c.nullable);

        this.ColumnOptions = this.NullableColumns.map(c => ({
          id: c.id,
          text: `${c.columnName} (${DATA_TYPE_LABEL[c.type]?.label ?? 'Unknown'})`
        }));
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
