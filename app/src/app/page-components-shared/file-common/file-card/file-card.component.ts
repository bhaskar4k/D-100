import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FileInfoEntity } from '../../../models/file.model';
import { FilePropertiesComponent } from '../file-properties/file-properties.component';
import { Subscription } from 'rxjs';
import { FileMenuStateService } from '../../../services/file-menu-state.service';
import { GetFileIcon, GetFileType } from '../../../common/FileUtil';
import { FileDeleteEmitEntity } from '../../../models/file.model';

@Component({
  selector: 'app-file-card',
  imports: [
    CommonModule,
    FilePropertiesComponent
  ],
  templateUrl: './file-card.component.html',
  styleUrl: './file-card.component.css'
})
export class FileCardComponent implements OnInit, OnDestroy {
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

  ShowMore: boolean = false;
  private sub: Subscription;

  GetFileType = GetFileType;
  GetFileIcon = GetFileIcon;

  constructor(
    private menuState: FileMenuStateService
  ) {
    this.sub = this.menuState.openId.subscribe(id => {
      this.ShowMore = id === this.fileId;
    });
  }

  get fileId(): string {
    return this.File?.FileId;
  }

  ngOnInit(): void {
    this.File = structuredClone(this.FileInfo);
  }

  ViewMoreInFile(event: MouseEvent): void {
    event.stopPropagation();
    this.menuState.toggle(this.fileId);
  }

  OnUpdateAnyFile(UpdatedFile: FileInfoEntity) {
    this.File = UpdatedFile;
    this.UpdatedFile.emit(this.File);
  }

  OnDeleteAnyFile(DeletedFile: FileDeleteEmitEntity) {
    this.DeletedFile.emit(DeletedFile);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
