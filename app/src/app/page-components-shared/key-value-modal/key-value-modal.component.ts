import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';

export interface KeyValueModalData {
    title?: string;
    data: unknown;
}

interface KeyValueRow {
    key: string;
    value: string;
}

@Component({
    selector: 'app-key-value-modal',
    imports: [CommonModule, MatDialogModule, MatTableModule],
    templateUrl: './key-value-modal.component.html',
    styleUrl: './key-value-modal.component.css',
})
export class KeyValueModalComponent {
    readonly DisplayedColumns = ['key', 'value'];

    Title = 'Details';
    Rows: KeyValueRow[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) data: KeyValueModalData,
        private dialogRef: MatDialogRef<KeyValueModalComponent>
    ) {
        this.Title = data?.title ?? this.Title;
        this.Rows = this.BuildRows(data?.data);
    }

    OnClose(): void {
        this.dialogRef.close();
    }

    private BuildRows(data: unknown): KeyValueRow[] {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return [];
        }

        return Object.entries(data as Record<string, unknown>).map(([rawKey, rawValue]) => ({
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
