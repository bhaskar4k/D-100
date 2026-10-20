import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FileInfoEntity } from '../../../models/file.model';
import { FileDeleteInputEntity, FileFavouriteInputEntity } from '../../../models/file.model';
import { DownloadService } from '../../../services/download.service';
import { FileMenuStateService } from '../../../services/file-menu-state.service';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { FileDetailsComponent } from '../file-details/file-details.component';
import { RenameFileComponent } from '../rename-file/rename-file.component';
import { FileService } from '../../../services/file.service';
import { ApiResponseDto } from '../../../models/dto.model';
import { CustomAlertComponent } from '../../custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { FileDeleteEmitEntity } from '../../../models/file.model';
import { CommonModule } from '@angular/common';
import { AnimationEvent } from '@angular/animations';

@Component({
  selector: 'app-file-properties',
  imports: [
    CommonModule
  ],
  templateUrl: './file-properties.component.html',
  styleUrl: './file-properties.component.css',
  animations: [
    trigger('popMenu', [

      state('open', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)',
        visibility: 'visible'
      })),

      state('closed', style({
        opacity: 0,
        transform: 'scale(0.92) translateY(-6px)',
        visibility: 'hidden'
      })),

      transition('closed => open', [
        animate('260ms cubic-bezier(0.2, 0.9, 0.3, 1.2)')
      ]),

      transition('open => closed', [
        animate('220ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])

    ])
  ]
})
export class FilePropertiesComponent {
  @Input() ShowMore = false;

  @Input() FileInfo: FileInfoEntity = {
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

  @Output() UpdatedFile = new EventEmitter<FileInfoEntity>();
  @Output() DeletedFile = new EventEmitter<FileDeleteEmitEntity>();

  MatProgressBar: boolean = false;
  IsFullyClosed = true;

  constructor(
    private downloadService: DownloadService,
    private elementRef: ElementRef,
    private menuState: FileMenuStateService,
    private dialog: MatDialog,
    private fileService: FileService,
  ) { }

  ngOnInit(): void {
    this.File = this.FileInfo;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.menuState.close();
    }
  }

  OnAnimStart(event: AnimationEvent) {
    // As soon as any transition begins, make sure the element is visible/animatable
    this.IsFullyClosed = false;
  }

  OnAnimDone(event: AnimationEvent) {
    // Only hide it from layout once it has fully finished closing
    this.IsFullyClosed = event.toState === 'closed';
  }

  ViewDetails() {
    this.dialog.open(FileDetailsComponent, {
      width: '60rem',
      data: this.File
    });
  }

  DownloadFile(): void {
    this.downloadService.DownloadSingleFile(this.File.FileId);
  }

  FavouriteFile() {
    this.File.Favourite = !this.File.Favourite;

    let FavouriteFilePayload: FileFavouriteInputEntity = {
      FileId: this.File.FileId,
      Favourite: this.File.Favourite
    }

    this.MatProgressBar = true;


    this.fileService.FavouriteFile(FavouriteFilePayload).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === true && response.statusCode === 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
          this.FileInfo = response.data as FileInfoEntity;
          this.File = response.data as FileInfoEntity;
          this.UpdatedFile.emit(response.data as FileInfoEntity);
        } else {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }

        this.menuState.close();
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to update favourite status of this file.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar = false;
        this.menuState.close();
      }
    });
  }

  RenameFile() {
    const dialogRef = this.dialog.open(RenameFileComponent, {
      data: this.File,
      width: '30rem',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((UpdatedFile: FileInfoEntity) => {
      if (UpdatedFile) {
        this.FileInfo = UpdatedFile;
        this.File = UpdatedFile;
        this.UpdatedFile.emit(UpdatedFile);
      }

      this.menuState.close();
    });
  }

  DeleteFile() {
    let DeleteFilePayload: FileDeleteInputEntity = {
      FileId: this.File.FileId,
    }

    this.MatProgressBar = true;

    const FileDeleteEmitEntity: FileDeleteEmitEntity = {
      Deleted: false,
      FileId: this.File.FileId
    };

    this.fileService.DeleteFile(DeleteFilePayload).subscribe({
      next: (response: ApiResponseDto) => {
        this.MatProgressBar = false;

        if (response.success === true && response.statusCode === 200) {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.SUCCESS } });
          FileDeleteEmitEntity.Deleted = true;
          this.DeletedFile.emit(FileDeleteEmitEntity);
        } else {
          this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
        }

        this.menuState.close();
      },
      error: (err: any) => {
        this.dialog.open(CustomAlertComponent, { data: { text: "Failed to delete this file.", type: ResponseTypeColor.ERROR } });
        this.MatProgressBar = false;
        this.menuState.close();
      }
    });
  }
}
