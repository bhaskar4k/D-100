import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FileInfoEntity } from '../../../models/file.model';
import { GetFileIcon, GetFileType, GetReadableFileSize } from '../../../common/FileUtil';

@Component({
  selector: 'app-file-details',
  imports: [],
  templateUrl: './file-details.component.html',
  styleUrl: './file-details.component.css'
})
export class FileDetailsComponent implements OnInit {
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

  GetReadableFileSize = GetReadableFileSize;
  GetFileType = GetFileType;
  GetFileIcon = GetFileIcon;

  constructor(
    private dialogRef: MatDialogRef<FileDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileInfoEntity
  ) {
    this.File = data;
  }

  ngOnInit(): void {
    this.File = this.data;
  }

  close() {
    this.dialogRef.close(null);
  }
}
