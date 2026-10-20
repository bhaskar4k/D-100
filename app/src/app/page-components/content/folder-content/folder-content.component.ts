import { Component, Input, OnInit } from '@angular/core';
import { FolderDeleteEmitEntity, FolderDetailsEntity, FolderInfoEntity } from '../../../models/folder.model';
import { CommonModule } from '@angular/common';
import { FolderCardComponent } from '../../../page-components-shared/folder-common/folder-card/folder-card.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FolderRoutingPage } from '../../../enums/common.enum';

@Component({
  selector: 'app-folder-content',
  imports: [
    CommonModule,
    MatExpansionModule,
    FolderCardComponent
  ],
  templateUrl: './folder-content.component.html',
  styleUrl: './folder-content.component.css'
})
export class FolderContentComponent implements OnInit {
  @Input() AllFolderDetails: FolderDetailsEntity = { HasFolder: false, FolderCount: 0, FoldersList: [] };
  @Input() MatExpansionState: boolean = false;
  @Input() FolderRoutingPageName: FolderRoutingPage = FolderRoutingPage.Content;

  AllFolder: FolderDetailsEntity = { HasFolder: false, FolderCount: 0, FoldersList: [] };

  ngOnInit(): void {
    this.AllFolder = this.AllFolderDetails;
  }

  OnUpdateAnyFolder(UpdatedFolder: FolderInfoEntity) {
    const index = this.AllFolder.FoldersList.findIndex(f => f.FolderId === UpdatedFolder.FolderId);
    if (index !== -1) {
      this.AllFolder.FoldersList[index] = UpdatedFolder;
    }
  }

  OnDeleteAnyFolder(DeletedFolder: FolderDeleteEmitEntity) {
    if (DeletedFolder.Deleted === false) return;

    const index = this.AllFolder.FoldersList.findIndex(f => f.FolderId === DeletedFolder.FolderId);
    if (index !== -1) {
      this.AllFolder.FoldersList.splice(index, 1);
    }
  }
}
