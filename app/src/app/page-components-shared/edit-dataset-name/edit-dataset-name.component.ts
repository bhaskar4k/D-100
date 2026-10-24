import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface EditDatasetNameDialogData {
    datasetUid: string;
    fileName: string;
    extension: string;
}

export interface EditDatasetNameDialogResult {
    newName: string;
}

@Component({
    selector: 'app-edit-dataset-name',
    imports: [CommonModule, FormsModule, MatDialogModule],
    templateUrl: './edit-dataset-name.component.html',
    styleUrl: './edit-dataset-name.component.css',
})
export class EditDatasetNameComponent {
    NewName = '';
    readonly MaxLength = 255;

    // Characters disallowed in a filename on disk. Mirror of the API's validator in
    // DatasetService.UpdateName so the user sees the problem before submitting.
    private readonly InvalidChars = /[\\/:*?"<>|]/;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: EditDatasetNameDialogData,
        private dialogRef: MatDialogRef<EditDatasetNameComponent, EditDatasetNameDialogResult | undefined>
    ) {
        this.NewName = data.fileName ?? '';
    }

    get Trimmed(): string {
        return (this.NewName ?? '').trim();
    }

    get HasInvalidChar(): boolean {
        return this.InvalidChars.test(this.Trimmed);
    }

    get IsValid(): boolean {
        return this.Trimmed.length > 0
            && this.Trimmed.length <= this.MaxLength
            && !this.HasInvalidChar
            && this.Trimmed !== (this.data.fileName ?? '').trim();
    }

    OnCancel(): void {
        this.dialogRef.close();
    }

    OnSave(): void {
        if (!this.IsValid) return;
        this.dialogRef.close({ newName: this.Trimmed });
    }
}
