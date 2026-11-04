import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnChanges, Optional, SimpleChanges } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';

export interface KeyValueModalData {
  title?: string;
  data: unknown;
  showKeysHavingNullValue?: boolean;
}

interface KeyValueRow {
  key: string;
  value: string;
}

@Component({
  selector: 'app-key-value-pair-viewer',
  imports: [CommonModule, MatDialogModule, MatTableModule],
  templateUrl: './key-value-pair-viewer.component.html',
  styleUrl: './key-value-pair-viewer.component.css'
})
export class KeyValuePairViewerComponent implements OnChanges {
  // Inputs used when the component is embedded directly in a page template
  // (<app-key-value-pair-viewer [title]="..." [data]="..."/>). In modal mode they are ignored
  // and the component reads MAT_DIALOG_DATA instead.
  @Input() title: string = 'Details';
  @Input() data: unknown = null;
  // When true, keys whose value is null/undefined are shown (rendered as "-"). When false,
  // those entries are filtered out entirely. Defaults to true so existing callers see all
  // fields as they did before this input was added.
  @Input() showKeysHavingNullValue: boolean = true;

  readonly DisplayedColumns = ['key', 'value'];

  IsModal = false;
  Rows: KeyValueRow[] = [];

  constructor(
    // MatDialog injects MAT_DIALOG_DATA and MatDialogRef when the component is opened via
    // dialog.open(); when the component is used inline those injections are absent, hence
    // @Optional. The presence of dialogData is also the signal that puts us in modal mode.
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: KeyValueModalData | null,
    @Optional() private readonly dialogRef: MatDialogRef<KeyValuePairViewerComponent> | null
  ) {
    if (dialogData) {
      this.IsModal = true;
      this.title = dialogData.title ?? this.title;
      this.data = dialogData.data;
      this.showKeysHavingNullValue = dialogData.showKeysHavingNullValue ?? this.showKeysHavingNullValue;
      this.Rows = this.BuildRows(this.data);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild rows when the parent swaps the data input or flips the null-visibility input.
    // Skip in modal mode: the dialog instance is one-shot and its data is already captured
    // in the constructor.
    if (this.IsModal) {
      return;
    }

    if (changes['data'] || changes['showKeysHavingNullValue']) {
      this.Rows = this.BuildRows(this.data);
    }
  }

  OnClose(): void {
    this.dialogRef?.close();
  }

  private BuildRows(data: unknown): KeyValueRow[] {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return [];
    }

    return Object.entries(data as Record<string, unknown>)
      // Drop null/undefined entries entirely when the caller opts out; otherwise they still
      // show up with a "-" placeholder via FormatValue.
      .filter(([, rawValue]) => this.showKeysHavingNullValue || (rawValue !== null && rawValue !== undefined))
      .map(([rawKey, rawValue]) => ({
        key: this.HumanizeKey(rawKey),
        value: this.FormatValue(rawValue),
      }));
  }

  // "this_is_a_json_variable" -> "This is a json variable"
  // Only the first character is capitalized, underscores become spaces, everything else stays
  // as-is (so acronyms the user typed in UPPERCASE aren't accidentally lowercased on display).
  private HumanizeKey(key: string): string {
    if (!key) {
      return '';
    }
    const spaced = key.replace(/_/g, ' ').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }

  private FormatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
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
}
