import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DOWNLOADED_FILE_TYPE_LABEL, DownloadedFileType } from '../../../enums/downloaded-file-type.enum';

export interface DownloadDatasetFormatDialogData {
  datasetUid: string;
  fileName: string;
  extension: string;
}

export interface DownloadDatasetFormatDialogResult {
  downloadedFileType: number;
}

interface FormatOption {
  value: number;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-download-dataset-format',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './download-dataset-format.component.html',
  styleUrl: './download-dataset-format.component.css'
})
export class DownloadDatasetFormatComponent {
  // CSV is the user-facing default: a single file, universally supported, and avoids the
  // Excel chunk-and-zip step. Users can still pick Excel or Parquet in one click.
  Selected: number = DownloadedFileType.CSV;

  readonly Formats: FormatOption[] = [
    {
      value: DownloadedFileType.Excel,
      label: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.Excel].label,
      icon: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.Excel].icon,
      description: 'Multiple .xlsx workbooks (1 million rows each) delivered as a zip. Slower than CSV and Parquet on large datasets.'
    },
    {
      value: DownloadedFileType.CSV,
      label: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.CSV].label,
      icon: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.CSV].icon,
      description: 'A single comma-separated file. Best for sharing or scripting.'
    },
    {
      value: DownloadedFileType.Parquet,
      label: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.Parquet].label,
      icon: DOWNLOADED_FILE_TYPE_LABEL[DownloadedFileType.Parquet].icon,
      description: 'Columnar binary format. Compact and typed; re-ingests cleanly.'
    }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DownloadDatasetFormatDialogData,
    private dialogRef: MatDialogRef<DownloadDatasetFormatComponent, DownloadDatasetFormatDialogResult | undefined>
  ) { }

  OnSelect(value: number): void {
    this.Selected = value;
  }

  OnCancel(): void {
    this.dialogRef.close();
  }

  OnDownload(): void {
    this.dialogRef.close({ downloadedFileType: this.Selected });
  }
}
