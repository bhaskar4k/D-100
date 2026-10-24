import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ResponseTypeColor, type ResponseTypeColor as ResponseType } from '../../constants/commonConsts';

export interface CustomDialogData {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // Drives the color + icon of the dialog. ERROR = destructive (red button), WARNING = yellow,
  // INFO/SUCCESS = primary. Defaults to WARNING when omitted.
  type?: ResponseType;
}

@Component({
  selector: 'app-custom-dialog',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './custom-dialog.component.html',
  styleUrl: './custom-dialog.component.css',
})
export class CustomDialogComponent {
  readonly ResponseTypeColor = ResponseTypeColor;

  title = 'Please confirm';
  message = '';
  confirmLabel = 'Approve';
  cancelLabel = 'Reject';
  headerClass = 'text-warning';
  iconClass = 'bi bi-exclamation-triangle-fill';
  confirmButtonClass = 'btn btn-warning';

  constructor(
    @Inject(MAT_DIALOG_DATA) data: CustomDialogData,
    private dialogRef: MatDialogRef<CustomDialogComponent, boolean>
  ) {
    this.message = data?.message ?? '';
    this.title = data?.title ?? this.title;
    this.confirmLabel = data?.confirmLabel ?? this.confirmLabel;
    this.cancelLabel = data?.cancelLabel ?? this.cancelLabel;

    switch (data?.type) {
      case ResponseTypeColor.ERROR:
        this.headerClass = 'text-danger';
        this.iconClass = 'bi bi-trash3-fill';
        this.confirmButtonClass = 'btn btn-danger';
        break;
      case ResponseTypeColor.SUCCESS:
        this.headerClass = 'text-success';
        this.iconClass = 'bi bi-check-circle-fill';
        this.confirmButtonClass = 'btn btn-success';
        break;
      case ResponseTypeColor.INFO:
        this.headerClass = 'text-primary';
        this.iconClass = 'bi bi-info-circle-fill';
        this.confirmButtonClass = 'btn btn-primary';
        break;
      default:
        this.headerClass = 'text-warning';
        this.iconClass = 'bi bi-exclamation-triangle-fill';
        this.confirmButtonClass = 'btn btn-warning';
    }
  }

  OnApprove(): void {
    this.dialogRef.close(true);
  }

  OnReject(): void {
    this.dialogRef.close(false);
  }
}
