import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { DatasetService } from '../../services/dataset.service';
import { DatasetItem } from '../../models/dataset.model';
import { FILE_UPLOAD_STATUS_LABEL } from '../../enums/file-upload-status.enum';
import { GetReadableFileSize } from '../../common/FileUtil';
import { FormatDuration } from '../../common/CommonUtil';

@Component({
  selector: 'app-dataset',
  imports: [DatePipe, MatTableModule, MatPaginatorModule],
  templateUrl: './dataset.component.html',
  styleUrl: './dataset.component.css'
})
export class DatasetComponent implements OnInit, OnDestroy {
  readonly DisplayedColumns = [
    'fileName',
    'extension',
    'fileSize',
    'status',
    'uploadInitiatedOn',
    'uploadCompletedOn',
    'uploadingTime',
    'uploadedOn'
  ];
  readonly DateFormat = 'dd MMM yyyy, HH:mm:ss.SSS';
  readonly ReadableSize = GetReadableFileSize;
  readonly Duration = FormatDuration;
  readonly PageSizeOptions = [10, 25, 50, 100];
  readonly SearchDebounceMs = 300;

  Datasets: DatasetItem[] = [];
  Total = 0;
  PageIndex = 0;
  PageSize = 5;
  SearchText = '';
  Loading = false;
  ErrorMessage = '';

  private search$ = new Subject<string>();
  private searchSubscription?: Subscription;
  private loadSubscription?: Subscription;

  constructor(private datasetService: DatasetService) { }

  ngOnInit(): void {
    // Searching runs on the server so it covers every dataset, not just the current page.
    this.searchSubscription = this.search$
      .pipe(debounceTime(this.SearchDebounceMs), distinctUntilChanged())
      .subscribe(() => {
        this.PageIndex = 0;
        this.Load();
      });

    this.Load();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.loadSubscription?.unsubscribe();
  }

  OnSearch(value: string): void {
    this.SearchText = value.trim();
    this.search$.next(this.SearchText);
  }

  GetStatus(status: number): { label: string; color: string } {
    return FILE_UPLOAD_STATUS_LABEL[status] ?? { label: 'Unknown', color: 'status-init' };
  }

  OnPageChange(event: PageEvent): void {
    this.PageIndex = event.pageIndex;
    this.PageSize = event.pageSize;
    this.Load();
  }

  private Load(): void {
    this.Loading = true;
    this.ErrorMessage = '';

    // A newer request supersedes one still in flight, so a slow response can't overwrite fresher results.
    this.loadSubscription?.unsubscribe();

    this.loadSubscription = this.datasetService.GetAll(this.PageIndex + 1, this.PageSize, this.SearchText).subscribe({
      next: response => {
        this.Loading = false;

        if (!response.success) {
          this.ErrorMessage = response.message;
          return;
        }

        this.Datasets = response.data.items;
        this.Total = response.data.total;
      },
      error: () => {
        this.Loading = false;
        this.ErrorMessage = 'Failed to load datasets.';
      }
    });
  }
}
