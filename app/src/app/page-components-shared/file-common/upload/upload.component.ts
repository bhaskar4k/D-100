import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FileUploadService } from '../../../services/file-upload.service';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent implements OnInit {
  FolderId: string = '';
  SelectedFile: File | null = null;
  MatProgressBar = false;

  constructor(
    private dialogRef: MatDialogRef<UploadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public fileUploadService: FileUploadService,
    private dialog: MatDialog
  ) {
    this.FolderId = data.FolderId;
  }

  OnFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.SelectedFile = input.files[0];
    }
  }

  ngOnInit(): void {
    this.FolderId = this.data.FolderId;
  }

  async UploadFile(): Promise<void> {
    if (!this.SelectedFile) return;

    this.MatProgressBar = true;

    const fileToUpload = this.SelectedFile;
    this.SelectedFile = null;

    try {
      let UploadedFileInformation = await this.fileUploadService.StartBackgroundUpload(fileToUpload, this.FolderId);

      this.dialog.open(CustomAlertComponent, {
        data: { text: "File has been uploaded successfully.", type: ResponseTypeColor.SUCCESS }
      });

      this.dialogRef.close(UploadedFileInformation);
    }
    catch (error: any) {
      this.dialog.open(CustomAlertComponent, {
        data: { text: "Failed to upload the selected file.<br>Please try again later.", type: ResponseTypeColor.ERROR }
      });
    }
    finally {
      this.MatProgressBar = false;
    }
  }

  close() {
    this.dialogRef.close(null);
  }
}