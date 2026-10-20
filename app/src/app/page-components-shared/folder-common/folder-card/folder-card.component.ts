import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FolderDeleteEmitEntity, FolderInfoEntity } from '../../../models/folder.model';
import { FolderPropertiesComponent } from '../folder-properties/folder-properties.component';
import { FolderMenuStateService } from '../../../services/folder-menu-state.service';
import { Subscription } from 'rxjs';
import { FolderRoutingPage } from '../../../enums/common.enum';

@Component({
  selector: 'app-folder-card',
  imports: [
    FolderPropertiesComponent
  ],
  templateUrl: './folder-card.component.html',
  styleUrl: './folder-card.component.css'
})
export class FolderCardComponent implements OnInit {
  @Input() FolderRoutingPageName: FolderRoutingPage = FolderRoutingPage.Content;

  @Input() FolderInfo: FolderInfoEntity = {
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

  @Output() UpdatedFolder = new EventEmitter<FolderInfoEntity>();
  @Output() DeletedFolder = new EventEmitter<FolderDeleteEmitEntity>();

  ShowMore: boolean = false;
  private sub: Subscription;

  constructor(
    private menuState: FolderMenuStateService
  ) {
    this.sub = this.menuState.openId.subscribe(id => {
      this.ShowMore = id === this.folderId;
    });
  }

  get folderId(): string {
    return this.Folder?.FolderId;
  }

  ngOnInit(): void {
    this.Folder = this.FolderInfo;
  }

  NavigateToFolder() {
    window.location.href = "/" + this.FolderRoutingPageName + "/" + this.Folder.FolderId;
  }

  ViewMoreInFolder(event: MouseEvent) {
    event.stopPropagation();
    this.menuState.toggle(this.folderId);
  }

  OnUpdateAnyFolder(File: FolderInfoEntity) {
    this.Folder = File;
    this.FolderInfo = File;
    this.UpdatedFolder.emit(this.Folder);
  }

  OnDeleteAnyFolder(Deleted: FolderDeleteEmitEntity) {
    this.DeletedFolder.emit(Deleted);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
