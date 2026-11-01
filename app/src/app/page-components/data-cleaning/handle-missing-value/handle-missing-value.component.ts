import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DataCleaningService } from '../../../services/data-cleaning.service';
import { DatasetItem, DatasetColumnItem } from '../../../models/dataset.model';
import {
  MissingValueReplacementStrategyEnum,
  MissingValueReplacementStrategyItem
} from '../../../models/data-cleaning.model';
import { Dropdown } from '../../../models/common.model';
import { DatasetSelectionComponent } from '../../../page-components-shared/dataset-selection/dataset-selection.component';
import { SingleSelectionDropdownComponent } from '../../../page-components-shared/single-selection-dropdown/single-selection-dropdown.component';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { DATA_TYPE_LABEL } from '../../../enums/data-type.enum';

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
export class HandleMissingValueComponent implements OnInit, OnDestroy {
  MatProgressBar = false;

  IsColumnListPulledFromDb = false;
  IsSearchStrategyPulledFromDb = false;

  SelectedDataset: DatasetItem | null = null;

  RowCount: number | null = null;
  NullableColumns: DatasetColumnItem[] = [];
  ColumnOptions: Dropdown[] = [];

  Strategies: MissingValueReplacementStrategyItem[] = [];
  StrategyOptions: Dropdown[] = [];

  SelectedColumn: Dropdown | null = null;
  SelectedStrategy: Dropdown | null = null;
  ConstantValue: string = '';

  private columnSubscription?: Subscription;
  private strategySubscription?: Subscription;

  constructor(
    private datasetService: DatasetService,
    private dataCleaningService: DataCleaningService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.LoadStrategies();
  }

  ngOnDestroy(): void {
    this.columnSubscription?.unsubscribe();
    this.strategySubscription?.unsubscribe();
  }

  get SelectedStrategyDetail(): MissingValueReplacementStrategyItem | null {
    if (!this.SelectedStrategy) {
      return null;
    }
    return this.Strategies.find(s => s.id === this.SelectedStrategy!.id) ?? null;
  }

  get IsConstantStrategy(): boolean {
    return this.SelectedStrategyDetail?.replacmentStrategyEnum === MissingValueReplacementStrategyEnum.Constant;
  }

  get SelectedColumnTypeLabel(): string {
    const column = this.SelectedColumnDetail;
    return column ? (DATA_TYPE_LABEL[column.type]?.label ?? 'Unknown') : '';
  }

  get SelectedColumnDetail(): DatasetColumnItem | null {
    if (!this.SelectedColumn) {
      return null;
    }
    return this.NullableColumns.find(c => c.id === this.SelectedColumn!.id) ?? null;
  }

  get SelectedColumnNullPercentage(): number | null {
    const column = this.SelectedColumnDetail;
    if (!column || this.RowCount === null || this.RowCount <= 0) {
      return null;
    }
    return (column.nullValueCount / this.RowCount) * 100;
  }

  AllowedDatatypeLabels(strategy: MissingValueReplacementStrategyItem): string[] {
    return (strategy.allowedDatatypeToBePerformedOn ?? [])
      .map(t => DATA_TYPE_LABEL[t]?.label)
      .filter((label): label is string => !!label);
  }

  get IsCleanDisabled(): boolean {
    if (this.MatProgressBar) {
      return true;
    }
    if (!this.SelectedDataset || !this.SelectedColumn || !this.SelectedStrategy) {
      return true;
    }
    if (this.IsConstantStrategy && this.ConstantValue.trim() === '') {
      return true;
    }
    return false;
  }

  OnClean(): void {
    // Cleaning logic will be wired up here; the button is already gated so this fires
    // only when a complete, valid selection is in hand.
  }

  OnDatasetChange(dataset: DatasetItem | null): void {
    this.SelectedDataset = dataset;
    this.IsColumnListPulledFromDb = false;
    this.RowCount = null;
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
    this.RebuildStrategyOptions();
  }

  OnStrategyChange(option: Dropdown): void {
    this.SelectedStrategy = option;
    this.ConstantValue = '';
  }

  private RebuildStrategyOptions(): void {
    const columnType = this.SelectedColumnDetail?.type;

    this.StrategyOptions = this.Strategies.map(s => {
      // No column picked yet, no gating: every strategy stays enabled. Once a column is
      // selected, each strategy is enabled only when its allowed-datatype list contains
      // that column's type (an empty list disables the strategy for every column).
      const disabled = columnType !== undefined
        && !(s.allowedDatatypeToBePerformedOn ?? []).includes(columnType);

      return {
        id: s.id,
        text: s.replacementStrategyName,
        disabled
      };
    });
  }

  private LoadStrategies(): void {
    this.MatProgressBar = true;
    this.strategySubscription?.unsubscribe();

    this.strategySubscription = this.dataCleaningService.GetMissingValueReplacementStrategies().subscribe({
      next: response => {
        this.MatProgressBar = false;

        if (!response.success) {
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        const strategies: MissingValueReplacementStrategyItem[] = response.data ?? [];
        this.Strategies = strategies;
        this.RebuildStrategyOptions();
        this.IsSearchStrategyPulledFromDb = true;
      },
      error: () => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load replacement strategies.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }

  private LoadColumns(datasetUid: string): void {
    this.MatProgressBar = true;
    this.IsColumnListPulledFromDb = false;
    this.columnSubscription?.unsubscribe();

    this.columnSubscription = this.datasetService.GetDetails(datasetUid).subscribe({
      next: response => {
        this.MatProgressBar = false;

        if (!response.success) {
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        this.RowCount = response.data?.dataset?.rowCount ?? null;
        const columns: DatasetColumnItem[] = response.data?.columns ?? [];
        this.NullableColumns = columns.filter(c => c.nullable);

        this.ColumnOptions = this.NullableColumns.map(c => ({
          id: c.id,
          text: `${c.columnName} (${DATA_TYPE_LABEL[c.type]?.label ?? 'Unknown'})`
        }));
        this.IsColumnListPulledFromDb = true;
      },
      error: () => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load dataset columns.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
