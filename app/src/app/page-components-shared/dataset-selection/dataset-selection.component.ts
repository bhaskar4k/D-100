import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../services/dataset.service';
import { DatasetItem } from '../../models/dataset.model';
import { Dropdown } from '../../models/common.model';
import { DatasetProcessingStatus } from '../../enums/dataset-processing-status.enum';
import { SingleSelectionDropdownComponent } from '../single-selection-dropdown/single-selection-dropdown.component';
import { CustomAlertComponent } from '../custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../constants/commonConsts';

const IN_FLIGHT_STATUSES = new Set<number>([
  DatasetProcessingStatus.IN_QUEUE,
  DatasetProcessingStatus.PROCESSING
]);

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

  // Clears the current selection and re-fetches the dataset list. Callers trigger this when
  // something external (e.g. a job they just queued) may have changed what the list should
  // show.
  Reload(): void {
    this.SelectedOption = null;
    this.Load();
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
        this.Datasets = items.filter(d =>
          d.isActive && (d.isProcessed || IN_FLIGHT_STATUSES.has(d.processingStatus))
        );

        // Datasets going through IN_QUEUE / PROCESSING stay in the list so the user can see
        // something is happening to them, but they are rendered disabled with a status suffix
        // so another job can't be kicked off on top.
        this.Options = this.Datasets.map(d => {
          const inFlight = !d.isProcessed && IN_FLIGHT_STATUSES.has(d.processingStatus);
          const suffix = inFlight
            ? (d.processingStatus === DatasetProcessingStatus.IN_QUEUE
              ? ' (In Queue)'
              : ' (Under Processing)')
            : '';

          return {
            id: d.datasetUid,
            text: `${d.fileName}${d.extension}${suffix}`,
            disabled: inFlight
          };
        });
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
