import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { DatasetService } from '../../services/dataset.service';
import { DatasetPreviewColumn, DatasetPreviewResult } from '../../models/dataset.model';
import { DATA_TYPE_LABEL, DataType } from '../../enums/data-type.enum';

const NumericTypes = new Set<number>([DataType.Integer, DataType.Float, DataType.Decimal]);

export interface PreviewDatasetDialogData {
  datasetUid: string;
  fileName?: string;
  extension?: string;
}

@Component({
  selector: 'app-preview-dataset',
  imports: [CommonModule, MatDialogModule, MatTableModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './preview-dataset.component.html',
  styleUrl: './preview-dataset.component.css'
})
export class PreviewDatasetComponent implements OnInit, OnDestroy {
  readonly ResolveType = (type: number) => DATA_TYPE_LABEL[type] ?? { label: 'Unknown', color: 'type-unknown' };
  readonly IsNumeric = (type: number) => NumericTypes.has(type);

  Loading = true;
  ErrorMessage = '';
  Preview: DatasetPreviewResult | null = null;
  DisplayedColumns: string[] = [];
  Rows: Record<string, unknown>[] = [];

  private previewSub?: Subscription;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewDatasetDialogData,
    private dialogRef: MatDialogRef<PreviewDatasetComponent>,
    private datasetService: DatasetService
  ) { }

  ngOnInit(): void {
    this.Load();
  }

  ngOnDestroy(): void {
    this.previewSub?.unsubscribe();
  }

  OnClose(): void {
    this.dialogRef.close();
  }

  // The cell value comes back from Python as a plain scalar for most types and as a str() fallback
  // for date / datetime / decimal / bytes, so we only normalize null and object cases here.
  CellValue(row: Record<string, unknown>, columnName: string): string {
    const value = row[columnName];

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  IsNullish(row: Record<string, unknown>, columnName: string): boolean {
    const value = row[columnName];
    return value === null || value === undefined;
  }

  private Load(): void {
    this.Loading = true;
    this.ErrorMessage = '';

    this.previewSub = this.datasetService.Preview(this.data.datasetUid).subscribe({
      next: response => {
        this.Loading = false;

        if (!response.success) {
          this.ErrorMessage = response.message || 'Could not load the dataset preview.';
          return;
        }

        const result = response.data as DatasetPreviewResult;
        this.Preview = result;
        // Column order follows T_COLUMN so the preview matches the details page.
        this.DisplayedColumns = result.columns.map((c: DatasetPreviewColumn) => c.columnName);
        this.Rows = result.rows ?? [];
      },
      error: () => {
        this.Loading = false;
        this.ErrorMessage = 'Failed to load the dataset preview.';
      }
    });
  }
}
