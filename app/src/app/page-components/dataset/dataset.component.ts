import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
export class DatasetComponent implements OnInit {
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

  Datasets: DatasetItem[] = [];
  Total = 0;
  PageIndex = 0;
  PageSize = 10;
  Loading = false;
  ErrorMessage = '';

  constructor(private datasetService: DatasetService) { }

  ngOnInit(): void {
    this.Load();
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

    this.datasetService.GetAll(this.PageIndex + 1, this.PageSize).subscribe({
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
