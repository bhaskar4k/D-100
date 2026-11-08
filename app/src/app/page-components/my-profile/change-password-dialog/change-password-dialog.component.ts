import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserProfileService } from '../../../services/user-profile.service';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';

// Dialog closes with `true` on a successful change, `undefined` on cancel/dismiss. The host
// page uses the result to decide whether to re-fetch the profile (so modifiedAt refreshes).
export type ChangePasswordDialogResult = true | undefined;

@Component({
    selector: 'app-change-password-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './change-password-dialog.component.html',
    styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent {
    // Minimum length mirrors the register form's Validators.minLength(8) and the API's own
    // guard, so the dialog never sends a payload the backend is about to refuse.
    readonly MinLength = 8;

    changePasswordForm = new FormGroup({
        currentPassword: new FormControl('', [Validators.required]),
        newPassword: new FormControl('', [Validators.required, Validators.minLength(this.MinLength)]),
        confirmPassword: new FormControl('', [Validators.required]),
    });

    ShowCurrent = false;
    ShowNew = false;
    ShowConfirm = false;
    Submitting = false;

    constructor(
        private dialogRef: MatDialogRef<ChangePasswordDialogComponent, ChangePasswordDialogResult>,
        private dialog: MatDialog,
        private userProfileService: UserProfileService,
    ) { }

    get NewPasswordValue(): string {
        return this.changePasswordForm.value.newPassword ?? '';
    }

    get ConfirmPasswordValue(): string {
        return this.changePasswordForm.value.confirmPassword ?? '';
    }

    get CurrentPasswordValue(): string {
        return this.changePasswordForm.value.currentPassword ?? '';
    }

    // The two mismatch / same-as-current checks live here rather than as form validators so
    // the inline helper text under each field can show them without pulling the second
    // field's control into every validator.
    get PasswordsMatch(): boolean {
        return this.NewPasswordValue === this.ConfirmPasswordValue;
    }

    get NewIsSameAsCurrent(): boolean {
        return this.NewPasswordValue.length > 0
            && this.NewPasswordValue === this.CurrentPasswordValue;
    }

    get IsValid(): boolean {
        return this.changePasswordForm.valid
            && this.PasswordsMatch
            && !this.NewIsSameAsCurrent;
    }

    OnCancel(): void {
        if (this.Submitting) return;
        this.dialogRef.close();
    }

    OnSave(): void {
        if (this.Submitting) return;

        if (!this.IsValid) {
            this.changePasswordForm.markAllAsTouched();
            return;
        }

        this.Submitting = true;

        this.userProfileService
            .ChangePassword(this.CurrentPasswordValue, this.NewPasswordValue)
            .subscribe({
                next: response => {
                    this.Submitting = false;

                    if (!response.success) {
                        this.dialog.open(CustomAlertComponent, {
                            data: { text: response.message, type: ResponseTypeColor.ERROR }
                        });
                        return;
                    }

                    this.dialog.open(CustomAlertComponent, {
                        data: { text: response.message, type: ResponseTypeColor.SUCCESS }
                    });
                    this.dialogRef.close(true);
                },
                error: () => {
                    this.Submitting = false;
                    this.dialog.open(CustomAlertComponent, {
                        data: { text: 'Failed to update the password.', type: ResponseTypeColor.ERROR }
                    });
                }
            });
    }
}
