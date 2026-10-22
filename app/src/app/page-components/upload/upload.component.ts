import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { UploadProgress, UploadService, SupportedUploadExtensions } from '../../services/upload.service';
import { GetReadableFileSize } from '../../common/FileUtil';
import { CustomAlertComponent } from '../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../constants/commonConsts';

@Component({
  selector: 'app-upload',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent implements OnDestroy {
  readonly SupportedExtensions = SupportedUploadExtensions;
  readonly AcceptAttribute = SupportedUploadExtensions.join(',');
  readonly ReadableSize = GetReadableFileSize;

  SelectedFile: File | null = null;
  Progress: UploadProgress | null = null;
  Uploading = false;
  Completed = false;
  MatProgressBar = false;
  IsDragging = false;

  private subscription?: Subscription;

  constructor(
    private uploadService: UploadService,
    private dialog: MatDialog
  ) { }

  OnFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.SetFile(input.files?.[0] ?? null);
    input.value = '';
  }

  OnDragOver(event: DragEvent): void {
    event.preventDefault();
    this.IsDragging = true;
  }

  OnDragLeave(): void {
    this.IsDragging = false;
  }

  OnDrop(event: DragEvent): void {
    event.preventDefault();
    this.IsDragging = false;
    this.SetFile(event.dataTransfer?.files?.[0] ?? null);
  }

  StartUpload(): void {
    if (!this.SelectedFile || this.Uploading) {
      return;
    }

    this.Uploading = true;
    this.Completed = false;
    this.Progress = null;

    // The spinner covers only the start-up (initiating the upload session); once progress flows, the
    // progress bar takes over and stays usable (it has the Cancel button).
    this.MatProgressBar = true;

    this.subscription = this.uploadService.Upload(this.SelectedFile).subscribe({
      next: progress => {
        this.MatProgressBar = false;
        this.Progress = progress;
      },
      error: error => {
        this.MatProgressBar = false;
        this.Uploading = false;
        this.dialog.open(CustomAlertComponent, { data: { text: error?.message ?? 'Upload failed.', type: ResponseTypeColor.ERROR } });
      },
      complete: () => {
        this.Uploading = false;
        this.Completed = true;
        this.dialog.open(CustomAlertComponent, { data: { text: 'File uploaded successfully.', type: ResponseTypeColor.SUCCESS } });
      }
    });
  }

  CancelUpload(): void {
    this.subscription?.unsubscribe();
    this.MatProgressBar = false;
    this.Uploading = false;
    this.Progress = null;
  }

  FormatEta(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || !isFinite(seconds)) {
      return 'Calculating...';
    }

    const total = Math.ceil(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private SetFile(file: File | null): void {
    this.Completed = false;
    this.Progress = null;

    if (file && !this.uploadService.IsSupportedFile(file)) {
      this.SelectedFile = null;
      this.dialog.open(CustomAlertComponent, {
        data: { text: `Unsupported file type.\nAllowed: ${this.SupportedExtensions.join(', ')}`, type: ResponseTypeColor.ERROR }
      });
      return;
    }

    this.SelectedFile = file;
  }
}
