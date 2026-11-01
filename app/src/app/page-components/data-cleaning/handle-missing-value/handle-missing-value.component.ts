import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DataCleaningService } from '../../../services/data-cleaning.service';
import { DatasetItem, DatasetColumnItem } from '../../../models/dataset.model';
import { PreviewDatasetComponent, PreviewDatasetDialogData } from '../../../page-components-shared/preview-dataset/preview-dataset.component';
import {
  MissingValueReplacementStrategyEnum,
  MissingValueReplacementStrategyItem,
  HandleMissingValuePayload
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
    MatTooltipModule,
    DatasetSelectionComponent,
    SingleSelectionDropdownComponent
  ],
  templateUrl: './handle-missing-value.component.html',
  styleUrl: './handle-missing-value.component.css'
})
export class HandleMissingValueComponent implements OnInit, OnDestroy {
  @ViewChild(DatasetSelectionComponent) datasetSelection?: DatasetSelectionComponent;

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
  private cleanSubscription?: Subscription;

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
    this.cleanSubscription?.unsubscribe();
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

  private ResetComponentState(): void {
    this.SelectedDataset = null;
    this.IsColumnListPulledFromDb = false;
    this.RowCount = null;
    this.NullableColumns = [];
    this.ColumnOptions = [];
    this.SelectedColumn = null;
    this.SelectedStrategy = null;
    this.ConstantValue = '';
    this.RebuildStrategyOptions();
  }

  OnClean(): void {
    // IsCleanDisabled gates every mandatory field, so these narrowings are only for TS.
    if (!this.SelectedDataset || !this.SelectedColumn || !this.SelectedStrategy) {
      return;
    }

    const payload: HandleMissingValuePayload = {
      datasetUid: this.SelectedDataset.datasetUid,
      columnId: Number(this.SelectedColumn.id),
      strategyId: Number(this.SelectedStrategy.id),
      constantValue: this.IsConstantStrategy ? this.ConstantValue : null
    };

    this.MatProgressBar = true;
    this.cleanSubscription?.unsubscribe();

    this.cleanSubscription = this.dataCleaningService.HandleMissingValue(payload).subscribe({
      next: response => {
        this.MatProgressBar = false;

        const dialogRef = this.dialog.open(CustomAlertComponent, {
          data: {
            text: response.message,
            type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
          }
        });

        if (response.success) {
          // Reset this component's own state and ask the dataset-selection child to refetch
          // its list, so the row we just flipped to IN_QUEUE shows up with the "(In Queue)"
          // suffix without a full page reload.
          this.ResetComponentState();
          this.datasetSelection?.Reload();
        }
      },
      error: () => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to queue missing-value handling process.', type: ResponseTypeColor.ERROR }
        });
      }
    });
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
