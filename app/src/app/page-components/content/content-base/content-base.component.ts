import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { MatDialog } from '@angular/material/dialog';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { FolderService } from '../../../services/folder.service';
import { ApiResponseDto } from '../../../models/dto.model';
import { catchError, map, Observable, of } from 'rxjs';
import { FolderCreateInputEntity, FolderDetailsEntity, FolderInfoEntity } from '../../../models/folder.model';
import { FileDetailsEntity, FileInfoEntity } from '../../../models/file.model';
import { CommonModule } from '@angular/common';
import { UploadComponent } from '../../../page-components-shared/file-common/upload/upload.component';
import { FolderContentComponent } from '../folder-content/folder-content.component';
import { FileContentComponent } from '../file-content/file-content.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileService } from '../../../services/file.service';
import { AddEditFolderComponent } from '../../../page-components-shared/folder-common/add-edit-folder/add-edit-folder.component';
import { FolderOperationType } from '../../../enums/folder-operation-type.enum';
import { FolderRoutingPage } from '../../../enums/common.enum';

@Component({
  selector: 'app-content-base',
  imports: [
    CommonModule,
    FolderContentComponent,
    FileContentComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './content-base.component.html',
  styleUrl: './content-base.component.css'
})
export class ContentBaseComponent {
  CurrentFolderId: string = 'root';
  FullFolderPath: FolderInfoEntity[] = [];

  AllFolder: FolderDetailsEntity = { HasFolder: false, FolderCount: 0, FoldersList: [] };
  RenderFolderList: boolean = true;

  AllFile: FileDetailsEntity = { HasFile: false, FileCount: 0, FilesList: [] };
  RenderFileList: boolean = true;

  MatProgressBar = false;
  MatProgressBar1 = false;
  FolderRoutingPage = FolderRoutingPage;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private folderService: FolderService,
    private fileService: FileService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const folder = params.get('folder')!;
      this.CurrentFolderId = folder;
    });

    this.HasAccessToFolder().subscribe(hasAccess => {
      if (!hasAccess) {
        this.router.navigate(['/error']);
      } else {
        this.GetAllChildFolders();
        this.GetAllChildFiles();
      }
    });
  }

  HasAccessToFolder(): Observable<boolean> {
    this.MatProgressBar = true;

    return this.folderService.ValidateFolderAccess(this.CurrentFolderId).pipe(
      map((response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success && response.statusCode === 200) {
          this.FullFolderPath = response.data || [] as FolderInfoEntity[];

          if (this.FullFolderPath.length === 0 || this.FullFolderPath[this.FullFolderPath.length - 1].FolderId !== this.CurrentFolderId) {
            this.dialog.open(CustomAlertComponent, { data: { text: "Failed to validate folder access.", type: ResponseTypeColor.ERROR } });
            return false;
          }

          return true;
        }

        this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        return false;
      }),
      catchError((ex) => {
        this.MatProgressBar = false;
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to validate folder access.", type: ResponseTypeColor.ERROR } });
        return of(false);
      })
    );
  }

  CreateFolder() {
    const dialogRef = this.dialog.open(AddEditFolderComponent, {
      data: {
        OperationType: FolderOperationType.CREATE
      },
      width: '30rem',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(folderName => {
      if (folderName) {
        let CreateFolderPayload: FolderCreateInputEntity = {
          FolderId: this.CurrentFolderId,
          FolderName: folderName,
        }

        this.MatProgressBar = true;

        this.folderService.CreateFolder(CreateFolderPayload).subscribe({
          next: (response: ApiResponseDto) => {
            this.MatProgressBar = false;

            if (response.success === true && response.statusCode === 200) {
              this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
              this.AllFolder.FolderCount += 1;
              this.AllFolder.HasFolder = true;
              this.AllFolder.FoldersList.reverse();
              this.AllFolder.FoldersList.push(response.data as FolderInfoEntity);
              this.AllFolder.FoldersList.reverse();
            } else {
              this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
            }
          },
          error: (err: any) => {
            this.dialog.open(CustomAlertComponent, { data: { text: "Failed to create folder.", type: ResponseTypeColor.ERROR } });
            this.MatProgressBar = false;
          }
        });
      }
    });
  }

  GetAllChildFolders() {
    this.RenderFolderList = false;
    this.MatProgressBar = true;

    this.folderService.GetAllChildFoldersByFolderId(this.CurrentFolderId).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === false || response.statusCode !== 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }

        this.AllFolder = response.data as FolderDetailsEntity;
        this.AllFolder.FoldersList.reverse();
        this.RenderFolderList = true;
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to fetch all folder lists.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar = false;
      }
    });
  }

  GetAllChildFiles() {
    this.RenderFileList = false;
    this.MatProgressBar1 = true;

    this.fileService.GetAllChildFilesByFolderId(this.CurrentFolderId).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar1 = false;

        if (response.success === false || response.statusCode !== 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }

        this.AllFile = response.data as FileDetailsEntity;
        this.AllFile.FilesList.reverse();
        this.RenderFileList = true;
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to fetch all file lists.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar1 = false;
      }
    });
  }

  UploadFile() {
    const dialogRef = this.dialog.open(UploadComponent, {
      data: { FolderId: this.CurrentFolderId },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((NewFile: FileInfoEntity) => {
      if (NewFile) {
        this.AllFile.FileCount += 1;
        this.AllFile.HasFile = true;
        this.AllFile.FilesList.reverse();
        this.AllFile.FilesList.push(NewFile as FileInfoEntity);
        this.AllFile.FilesList.reverse();
      }
    });
  }

  NavigateToFolder(Folder: FolderInfoEntity) {
    window.location.href = "/" + this.FolderRoutingPage.Content + "/" + Folder.FolderId;
  }

  IsMatProgressBarVisible(): boolean {
    return this.MatProgressBar || this.MatProgressBar1;
  }
}
