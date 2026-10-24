import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../../services/dataset.service';
import { DatasetColumnItem, DatasetDetailItem } from '../../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../../enums/file-upload-status.enum';
import { DATASET_PROCESSING_STATUS_LABEL } from '../../../enums/dataset-processing-status.enum';
import { DATA_TYPE_LABEL } from '../../../enums/data-type.enum';
import { GetFileIconByExtension, GetReadableFileSize } from '../../../common/FileUtil';
import { FormatDuration } from '../../../common/CommonUtil';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { CustomDialogComponent, CustomDialogData } from '../../../page-components-shared/custom-dialog/custom-dialog.component';
import { EditColumnNameComponent, EditColumnNameDialogData, EditColumnNameDialogResult } from '../edit-column-name/edit-column-name.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-view-dataset-info',
  imports: [
    CommonModule, DatePipe, RouterModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './view-dataset-info.component.html',
  styleUrl: './view-dataset-info.component.css'
})
export class ViewDatasetInfoComponent implements OnInit, OnDestroy {
  readonly ColumnColumns = ['id', 'columnName', 'type', 'nullable', 'uniqueCount', 'action'];
  readonly DateFormat = 'dd MMM yyyy HH:mm:ss';
  readonly ReadableSize = GetReadableFileSize;
  readonly FileIcon = GetFileIconByExtension;
  readonly Duration = FormatDuration;
  readonly PageSizeOptions = [5, 10, 25, 50, 100];
  readonly SearchDebounceMs = 200;

  Dataset: DatasetDetailItem | null = null;
  Columns: DatasetColumnItem[] = [];
  ColumnDataSource = new MatTableDataSource<DatasetColumnItem>([]);
  ColumnSearchText = '';
  MatProgressBar = false;
  RenamingColumnIds = new Set<number>();
  DeletingColumnIds = new Set<number>();

  private readonly columnSearch$ = new Subject<string>();
  private routeSubscription?: Subscription;
  private detailSubscription?: Subscription;
  private searchSubscription?: Subscription;

  // The second card (which hosts the paginator and sort) is wrapped in *ngIf="Dataset as D", so it
  // mounts only after data arrives. The setters below rebind the data source as soon as either
  // view child materializes, no matter the order.
  @ViewChild(MatPaginator) set ColumnPaginator(value: MatPaginator | undefined) {
    if (value) this.ColumnDataSource.paginator = value;
  }

  @ViewChild(MatSort) set ColumnSort(value: MatSort | undefined) {
    if (value) this.ColumnDataSource.sort = value;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private datasetService: DatasetService,
    private dialog: MatDialog
  ) {
    this.ColumnDataSource.filterPredicate = (data, filter) => {
      const text = filter.trim().toLowerCase();
      if (!text) return true;

      const typeLabel = (DATA_TYPE_LABEL[data.type]?.label ?? '').toLowerCase();
      return data.columnName.toLowerCase().includes(text) || typeLabel.includes(text);
    };

    this.ColumnDataSource.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'columnName': return data.columnName.toLowerCase();
        case 'type': return DATA_TYPE_LABEL[data.type]?.label ?? '';
        case 'nullable': return data.nullable ? 1 : 0;
        case 'uniqueCount': return data.uniqueCount;
        default: return '';
      }
    };
  }

  ngOnInit(): void {
    this.searchSubscription = this.columnSearch$
      .pipe(debounceTime(this.SearchDebounceMs), distinctUntilChanged())
      .subscribe((text) => {
        this.ColumnDataSource.filter = text;
        if (this.ColumnDataSource.paginator) {
          this.ColumnDataSource.paginator.firstPage();
        }
      });

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
    this.searchSubscription?.unsubscribe();
  }

  GetStatus(status: number): { label: string; color: string } {
    return FILE_UPLOAD_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetProcessingStatus(status: number): { label: string; color: string } {
    return DATASET_PROCESSING_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  GetType(type: number): { label: string; color: string } {
    return DATA_TYPE_LABEL[type] ?? { label: 'Unknown', color: 'type-unknown' };
  }

  OnColumnSearch(value: string): void {
    this.ColumnSearchText = value;
    this.columnSearch$.next(value);
  }

  BackToList(): void {
    this.router.navigate(['/datasets']);
  }

  OnDeleteColumn(column: DatasetColumnItem): void {
    if (!this.Dataset || this.DeletingColumnIds.has(column.id)) {
      return;
    }

    const datasetUid = this.Dataset.datasetUid;

    const confirmRef = this.dialog.open<CustomDialogComponent, CustomDialogData, boolean>(
      CustomDialogComponent,
      {
        data: {
          title: 'Delete column',
          message: `Are you sure you want to delete column <strong>${column.columnName}</strong>?<br>This also drops it from the processed file.
          <br>This cannot be undone.
          <br>Although, you can bring it back from the unprocessed file.`,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          iconClass: 'bi bi-trash3-fill',
          type: ResponseTypeColor.ERROR
        }
      }
    );

    confirmRef.afterClosed().subscribe((approved) => {
      if (!approved) {
        return;
      }

      this.DeletingColumnIds.add(column.id);
      this.MatProgressBar = true;

      this.datasetService.DeleteColumn(datasetUid, column.id).subscribe({
        next: response => {
          this.DeletingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          if (response.success) {
            this.Load(datasetUid);
          }

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.DeletingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to delete column.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
  }

  OnEditColumn(column: DatasetColumnItem): void {
    if (!this.Dataset || this.RenamingColumnIds.has(column.id)) {
      return;
    }

    const datasetUid = this.Dataset.datasetUid;

    const dialogRef = this.dialog.open<EditColumnNameComponent, EditColumnNameDialogData, EditColumnNameDialogResult>(
      EditColumnNameComponent,
      {
        data: { datasetUid, columnId: column.id, columnName: column.columnName },
        autoFocus: 'first-tabbable'
      }
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !result.newName || result.newName === column.columnName) {
        return;
      }

      this.RenamingColumnIds.add(column.id);
      this.MatProgressBar = true;

      this.datasetService.UpdateColumnName(datasetUid, column.id, result.newName).subscribe({
        next: response => {
          this.RenamingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          if (response.success) {
            this.Load(datasetUid);
          }

          this.dialog.open(CustomAlertComponent, {
            data: {
              text: response.message,
              type: response.success ? ResponseTypeColor.SUCCESS : ResponseTypeColor.ERROR
            }
          });
        },
        error: () => {
          this.RenamingColumnIds.delete(column.id);
          this.MatProgressBar = false;

          this.dialog.open(CustomAlertComponent, {
            data: { text: 'Failed to rename column.', type: ResponseTypeColor.ERROR }
          });
        }
      });
    });
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
          this.ColumnDataSource.data = [];
          this.dialog.open(CustomAlertComponent, {
            data: { text: response.message, type: ResponseTypeColor.ERROR }
          });
          return;
        }

        this.Dataset = response.data.dataset;
        this.Columns = response.data.columns;
        this.ColumnDataSource.data = this.Columns;
      },
      error: () => {
        this.MatProgressBar = false;
        this.Dataset = null;
        this.Columns = [];
        this.ColumnDataSource.data = [];
        this.dialog.open(CustomAlertComponent, {
          data: { text: 'Failed to load dataset details.', type: ResponseTypeColor.ERROR }
        });
      }
    });
  }
}
