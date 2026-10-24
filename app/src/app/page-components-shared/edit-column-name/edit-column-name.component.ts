import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface EditColumnNameDialogData {
    datasetUid: string;
    columnId: number;
    columnName: string;
}

export interface EditColumnNameDialogResult {
    newName: string;
}

@Component({
    selector: 'app-edit-column-name',
    imports: [CommonModule, FormsModule, MatDialogModule],
    templateUrl: './edit-column-name.component.html',
    styleUrl: './edit-column-name.component.css',
})
export class EditColumnNameComponent {
    NewName = '';
    readonly MaxLength = 500;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: EditColumnNameDialogData,
        private dialogRef: MatDialogRef<EditColumnNameComponent, EditColumnNameDialogResult | undefined>
    ) {
        this.NewName = data.columnName ?? '';
    }

    get Trimmed(): string {
        return (this.NewName ?? '').trim();
    }

    // Only control chars are forbidden on columns; slashes and other punctuation are fine in a
    // real-world column name (e.g. "price/unit", "x>y"). Mirror of the API validator.
    get HasInvalidChar(): boolean {
        // eslint-disable-next-line no-control-regex
        return /[\x00-\x1f]/.test(this.Trimmed);
    }

    get IsValid(): boolean {
        return this.Trimmed.length > 0
            && this.Trimmed.length <= this.MaxLength
            && !this.HasInvalidChar
            && this.Trimmed !== (this.data.columnName ?? '').trim();
    }

    OnCancel(): void {
        this.dialogRef.close();
    }

    OnSave(): void {
        if (!this.IsValid) return;
        this.dialogRef.close({ newName: this.Trimmed });
    }
}
