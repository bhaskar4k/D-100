import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UploadProgress, UploadService, SupportedUploadExtensions } from '../../services/upload.service';
import { GetReadableFileSize } from '../../common/FileUtil';

@Component({
  selector: 'app-upload',
  imports: [],
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
  ErrorMessage = '';
  IsDragging = false;

  private subscription?: Subscription;

  constructor(private uploadService: UploadService) { }

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
    this.ErrorMessage = '';
    this.Progress = null;

    this.subscription = this.uploadService.Upload(this.SelectedFile).subscribe({
      next: progress => {
        this.Progress = progress;
      },
      error: error => {
        this.Uploading = false;
        this.ErrorMessage = error?.message ?? 'Upload failed.';
      },
      complete: () => {
        this.Uploading = false;
        this.Completed = true;
      }
    });
  }

  CancelUpload(): void {
    this.subscription?.unsubscribe();
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
    this.ErrorMessage = '';

    if (file && !this.uploadService.IsSupportedFile(file)) {
      this.SelectedFile = null;
      this.ErrorMessage = `Unsupported file type. Allowed: ${this.SupportedExtensions.join(', ')}`;
      return;
    }

    this.SelectedFile = file;
  }
}
