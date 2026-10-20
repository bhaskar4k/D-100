import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { ResponseTypeColor, type ResponseTypeColor as ResponseType } from '../../constants/commonConsts';

@Component({
  selector: 'app-custom-alert',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './custom-alert.component.html',
  styleUrl: './custom-alert.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomAlertComponent implements OnInit {
  // Make the enum available in template
  ResponseTypeColor = ResponseTypeColor;
  title: string = 'Success';
  textColorClass: string = 'text-success';
  formattedText: string = '';
  buttonClass: string = 'alert-button success'; // Default class

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { text: string; type: ResponseType },
    private dialogRef: MatDialogRef<CustomAlertComponent>,
    private cdr: ChangeDetectorRef
  ) { }

  private bootstrapElements!: { css: HTMLLinkElement; js: HTMLScriptElement };

  ngOnInit(): void {
    this.formattedText = this.data.text.replace(/\n/g, '<br>');

    // Set classes based on alert type
    switch (this.data.type) {
      case ResponseTypeColor.WARNING:
        this.title = 'Warning';
        this.textColorClass = 'text-warning';
        this.buttonClass = 'btn btn-warning';
        break;
      case ResponseTypeColor.INFO:
        this.title = 'Information';
        this.textColorClass = 'text-primary';
        this.buttonClass = 'btn btn-primary';
        break;
      case ResponseTypeColor.ERROR:
        this.title = 'Error';
        this.textColorClass = 'text-danger';
        this.buttonClass = 'btn btn-danger';
        break;
      default:
        this.title = 'Success';
        this.textColorClass = 'text-success';
        this.buttonClass = 'btn btn-success';
    }

    // Trigger change detection
    this.cdr.markForCheck();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
