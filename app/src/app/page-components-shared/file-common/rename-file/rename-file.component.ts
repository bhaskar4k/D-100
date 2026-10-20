import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FileInfoEntity } from '../../../models/file.model';
import { FileRenameInputEntity } from '../../../models/file.model';
import { FileService } from '../../../services/file.service';
import { CustomAlertComponent } from '../../custom-alert/custom-alert.component';
import { ApiResponseDto } from '../../../models/dto.model';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rename-file',
  imports: [
    FormsModule,
    MatProgressSpinnerModule,
    CommonModule
  ],
  templateUrl: './rename-file.component.html',
  styleUrl: './rename-file.component.css'
})
export class RenameFileComponent implements OnInit {
  File: FileInfoEntity = {
    FileId: '',
    OriginalName: '',
    FileExtension: '',
    ContentType: '',
    FileSize: 0,
    Favourite: false,
    CreatedAt: '',
    UploadedAgo: '',
    ModifiedAt: '',
    Deleted: false,
    DeletedAt: '',
    AutoDeletingAt: ''
  };

  MatProgressBar: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<RenameFileComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileInfoEntity,
    private fileService: FileService,
    private dialog: MatDialog,
  ) {
    this.File = structuredClone(data) as FileInfoEntity;
  }

  ngOnInit(): void {
    this.File = structuredClone(this.data) as FileInfoEntity;
  }

  isSaveDisabled(): boolean {
    return this.File.OriginalName.trim().length === 0 || this.MatProgressBar;
  }

  save() {
    const trimmed = this.File.OriginalName.trim();
    if (trimmed) {
      let RenameFilePayload: FileRenameInputEntity = {
        FileId: this.File.FileId,
        UpdatedFileName: trimmed
      }

      this.MatProgressBar = true;

      this.fileService.RenameFile(RenameFilePayload).subscribe({
        next: (response: ApiResponseDto) => {
          this.MatProgressBar = false;

          if (response.success === true && response.statusCode === 200) {
            this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
            this.File = response.data as FileInfoEntity;
            this.dialogRef.close(this.File);
          } else {
            this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
            this.dialogRef.close(null);
          }
        },
        error: (err: any) => {
          this.dialog.open(CustomAlertComponent, { data: { text: "Failed to rename this file.", type: ResponseTypeColor.ERROR } });
          this.MatProgressBar = false;
          this.dialogRef.close(null);
        }
      });
    }
  }

  close() {
    this.dialogRef.close(null);
  }
}
