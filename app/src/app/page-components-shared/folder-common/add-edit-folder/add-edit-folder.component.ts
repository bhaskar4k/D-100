import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FolderOperationType } from '../../../enums/folder-operation-type.enum';
import { IsNullOrEmptyOrUndefined } from '../../../common/CommonUtil';

@Component({
  selector: 'app-add-edit-folder',
  imports: [FormsModule],
  templateUrl: './add-edit-folder.component.html',
  styleUrl: './add-edit-folder.component.css'
})
export class AddEditFolderComponent implements OnInit {
  FolderName: string = '';
  OperationType: FolderOperationType = FolderOperationType.CREATE;
  OperationTypeText = "Create";

  FolderOperationType = FolderOperationType;

  constructor(
    private dialogRef: MatDialogRef<AddEditFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.UpdateDefaultValues();
  }

  ngOnInit(): void {
    this.UpdateDefaultValues();
  }

  UpdateDefaultValues() {
    if (this.data.OperationType === FolderOperationType.RENAME && this.data.FolderInfo !== null) {
      this.FolderName = this.data.FolderInfo.FolderName;
    }

    this.OperationType = this.data.OperationType;

    if (this.OperationType === FolderOperationType.CREATE) {
      this.OperationTypeText = "Create";
    } else if (this.OperationType === FolderOperationType.RENAME) {
      this.OperationTypeText = "Rename";
    } else if (this.OperationType === FolderOperationType.DELETE) {
      this.OperationTypeText = "Delete";
    } else if (this.OperationType === FolderOperationType.FAVOURITE) {
      this.OperationTypeText = "Favourite";
    } else {
      this.OperationTypeText = "Unknown Operation";
    }
  }

  isSaveDisabled(): boolean {
    return this.FolderName.trim().length === 0;
  }

  save() {
    const trimmed = this.FolderName.trim();
    if (trimmed) {
      this.dialogRef.close(trimmed);
    }
  }

  close() {
    this.dialogRef.close(null);
  }
}
