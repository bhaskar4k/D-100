import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../services/dataset.service';
import { DatasetItem } from '../../models/dataset.model';
import { Dropdown } from '../../models/common.model';
import { SingleSelectionDropdownComponent } from '../single-selection-dropdown/single-selection-dropdown.component';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../constants/commonConsts';

@Component({
  selector: 'app-dataset-selection',
  imports: [CommonModule, MatProgressSpinnerModule, SingleSelectionDropdownComponent],
  templateUrl: './dataset-selection.component.html',
  styleUrl: './dataset-selection.component.css'
})
export class DatasetSelectionComponent implements OnInit, OnDestroy {
  @Output() datasetChange = new EventEmitter<DatasetItem | null>();

  readonly PageSize = 1000;

  Loading = false;
  Datasets: DatasetItem[] = [];
  Options: Dropdown[] = [];
  SelectedOption: Dropdown | null = null;

  private loadSubscription?: Subscription;

  constructor(
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.Load();
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }

  OnDatasetChange(option: Dropdown): void {
    this.SelectedOption = option;
    const dataset = this.Datasets.find(d => d.datasetUid === option.id) ?? null;
    this.datasetChange.emit(dataset);
  }

  private Load(): void {
    this.Loading = true;
    this.loadSubscription?.unsubscribe();

    this.loadSubscription = this.datasetService.GetAll(1, this.PageSize).subscribe({
      next: response => {
        this.Loading = false;

        if (!response.success) {
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        const items: DatasetItem[] = response.data?.items ?? [];
        this.Datasets = items.filter(d => d.isActive && d.isProcessed);

        this.Options = this.Datasets.map(d => ({
          id: d.datasetUid,
          text: `${d.fileName}${d.extension}`
        }));
      },
      error: () => {
        this.Loading = false;
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load datasets.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
