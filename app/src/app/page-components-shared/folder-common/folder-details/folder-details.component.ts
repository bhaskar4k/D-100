import { Component, Inject, OnInit } from '@angular/core';
import { FolderInfoEntity, SubfolderAndFileCountOutputEntity } from '../../../models/folder.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GetReadableFileSize } from '../../../common/FileUtil';
import { FolderService } from '../../../services/folder.service';
import { ApiResponseDto } from '../../../models/dto.model';
import { CustomAlertComponent } from '../../custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';

@Component({
  selector: 'app-folder-details',
  imports: [],
  templateUrl: './folder-details.component.html',
  styleUrl: './folder-details.component.css'
})
export class FolderDetailsComponent implements OnInit {
  Folder: FolderInfoEntity = {
    FolderId: '',
    FolderName: '',
    Depth: 0,
    SubFolderCount: 0,
    FilesCount: 0,
    TotalSize: 0,
    Favourite: false,
    CreatedAt: '',
    CreatedAgo: '',
    ModifiedAt: '',
    Deleted: false,
    DeletedAt: '',
    AutoDeletingAt: ''
  };

  MatProgressBar: boolean = false;
  GetReadableFileSize = GetReadableFileSize;

  constructor(
    private dialogRef: MatDialogRef<FolderDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FolderInfoEntity,
    private folderService: FolderService,
    private dialog: MatDialog,
  ) {
    this.Folder = data;
    this.GetSubfolderAndFileCount();
  }

  GetSubfolderAndFileCount() {
    this.MatProgressBar = true;

    this.folderService.GetSubfolderAndFileCount(this.Folder.FolderId).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === true && response.statusCode === 200) {
          let SubFolderAndFileCountOutput: SubfolderAndFileCountOutputEntity = response.data as SubfolderAndFileCountOutputEntity;
          this.Folder.SubFolderCount = SubFolderAndFileCountOutput.TotalSubFolderCount;
          this.Folder.FilesCount = SubFolderAndFileCountOutput.TotalFileCount;
        } else {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to fetch sub folder & file count.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar = false;
      }
    });
  }

  ngOnInit(): void {
    this.Folder = this.data;
  }

  close() {
    this.dialogRef.close(null);
  }
}
