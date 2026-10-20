import { Component, Input } from '@angular/core';
import { FileDetailsEntity, FileInfoEntity } from '../../../models/file.model';
import { CommonModule } from '@angular/common';
import { FileCardComponent } from '../../../page-components-shared/file-common/file-card/file-card.component';
import { FileDeleteEmitEntity } from '../../../models/file.model';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-file-content',
  imports: [
    CommonModule,
    MatExpansionModule,
    FileCardComponent
  ],
  templateUrl: './file-content.component.html',
  styleUrl: './file-content.component.css'
})
export class FileContentComponent {
  @Input() AllFileDetails: FileDetailsEntity = { HasFile: false, FileCount: 0, FilesList: [] };
  @Input() MatExpansionState: boolean = false;

  AllFile: FileDetailsEntity = { HasFile: false, FileCount: 0, FilesList: [] };

  ngOnInit(): void {
    this.AllFile = this.AllFileDetails;
  }

  OnUpdateAnyFile(UpdatedFile: FileInfoEntity) {
    const index = this.AllFile.FilesList.findIndex(f => f.FileId === UpdatedFile.FileId);
    if (index !== -1) {
      this.AllFile.FilesList[index] = UpdatedFile;
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
