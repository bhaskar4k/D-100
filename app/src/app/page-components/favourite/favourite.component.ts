import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomAlertComponent } from '../../page-components-shared/custom-alert/custom-alert.component';
import { MatDialog } from '@angular/material/dialog';
import { ResponseTypeColor } from '../../constants/commonConsts';
import { FolderService } from '../../services/folder.service';
import { ApiResponseDto } from '../../models/dto.model';
import { FolderDetailsEntity, FolderInfoEntity } from '../../models/folder.model';
import { FileDeleteEmitEntity, FileDetailsEntity, FileInfoEntity } from '../../models/file.model';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileService } from '../../services/file.service';
import { FolderRoutingPage } from '../../enums/common.enum';
import { FileCardComponent } from '../../page-components-shared/file-common/file-card/file-card.component';


@Component({
  selector: 'app-favourite',
  imports: [
    CommonModule,
    FileCardComponent,
    MatProgressSpinnerModule
  ],
  templateUrl: './favourite.component.html',
  styleUrl: './favourite.component.css'
})
export class FavouriteComponent {
  AllFile: FileDetailsEntity = { HasFile: false, FileCount: 0, FilesList: [] };
  RenderFileList: boolean = true;

  MatProgressBar = false;

  FolderRoutingPage = FolderRoutingPage;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private folderService: FolderService,
    private fileService: FileService
  ) { }

  ngOnInit() {
    this.GetAllChildFiles();
  }

  GetAllChildFiles() {
    this.RenderFileList = false;
    this.MatProgressBar = true;

    this.fileService.GetAllFavouriteFiles().subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === false || response.statusCode !== 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }

        this.AllFile = response.data as FileDetailsEntity;
        this.AllFile.FilesList.reverse();
        this.RenderFileList = true;
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to fetch all file lists.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar = false;
      }
    });
  }

  IsMatProgressBarVisible(): boolean {
    return this.MatProgressBar;
  }

  OnUpdateAnyFile(UpdatedFile: FileInfoEntity) {
    const index = this.AllFile.FilesList.findIndex(f => f.FileId === UpdatedFile.FileId);
    if (index !== -1) {
      if (this.AllFile.FilesList[index].Favourite === true && UpdatedFile.Favourite === false) {
        this.AllFile.FilesList.splice(index, 1);
      } else {
        this.AllFile.FilesList[index] = UpdatedFile;
      }
    }
  }

  OnDeleteAnyFile(DeletedFile: FileDeleteEmitEntity) {
    if (DeletedFile.Deleted === false) return;

    const index = this.AllFile.FilesList.findIndex(f => f.FileId === DeletedFile.FileId);
    if (index !== -1) {
      this.AllFile.FilesList.splice(index, 1);
    }
  }
}
