import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetColumnItem, DatasetDetailItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL } from '../../../enums/dataset-processing-status.enum';
import { DATA_TYPE_LABEL } from '../../../enums/data-type.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-dataset-info',
  imports: [CommonModule, DatePipe, RouterModule, MatTableModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './view-dataset-info.component.html',
  styleUrl: './view-dataset-info.component.css'
})
export class ViewDatasetInfoComponent implements OnInit, OnDestroy {
  readonly ColumnColumns = ['id', 'columnName', 'type', 'nullable', 'uniqueCount'];
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
  readonly FileIcon = GetFileIconByExtension;
  readonly Duration = FormatDuration;

  Dataset: DatasetDetailItem | null = null;
  Columns: DatasetColumnItem[] = [];
  MatProgressBar = false;

  private routeSubscription?: Subscription;
  private detailSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe((params) => {
      const uid = (params.get('id') ?? '').trim();

      if (!uid) {
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Dataset id is missing in the URL.', type: ResponseTypeColor.ERROR }
        });
        this.router.navigate(['/datasets']);
        return;
      }

      this.Load(uid);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.detailSubscription?.unsubscribe();
  }

  GetStatus(status: number): { label: string; color: string } {
    return FILE_UPLOAD_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetProcessingStatus(status: number): { label: string; color: string } {
    return DATASET_PROCESSING_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetTypeLabel(type: number): string {
    return DATA_TYPE_LABEL[type] ?? 'Unknown';
  }

  BackToList(): void {
    this.router.navigate(['/datasets']);
  }

  private Load(datasetUid: string): void {
    this.MatProgressBar = true;

    this.detailSubscription?.unsubscribe();

    this.detailSubscription = this.datasetService.GetDetails(datasetUid).subscribe({
      next: response => {
        this.MatProgressBar = false;

        if (!response.success) {
          this.Dataset = null;
          this.Columns = [];
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        this.Dataset = response.data.dataset;
        this.Columns = response.data.columns;
      },
      error: () => {
        this.MatProgressBar = false;
        this.Dataset = null;
        this.Columns = [];
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load dataset details.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
