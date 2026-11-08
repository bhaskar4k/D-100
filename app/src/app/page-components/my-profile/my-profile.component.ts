import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { UserProfileService } from '../../services/user-profile.service';
import { UserProfileDetails } from '../../models/user-profile.model';
import { CustomAlertComponent } from '../../page-components-shared/custom-alert/custom-alert.component';
import { DateFormat, ResponseTypeColor } from '../../constants/commonConsts';
import { ChangePasswordDialogComponent, ChangePasswordDialogResult } from './change-password-dialog/change-password-dialog.component';

@Component({
    selector: 'app-my-profile',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './my-profile.component.html',
    styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit, OnDestroy {
    readonly DateFormat = DateFormat;

    Profile: UserProfileDetails | null = null;
    MatProgressBar = false;

    private profileSubscription?: Subscription;

    constructor(
        private userProfileService: UserProfileService,
        private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.Load();
    }

    ngOnDestroy(): void {
        this.profileSubscription?.unsubscribe();
    }

    OnRefresh(): void {
        if (this.MatProgressBar) {
            return;
        }
        this.Load();
    }

    // Opens the change-password dialog. On a successful change the dialog closes with `true`,
    // and we reload the profile so modifiedAt / Last Updated reflects the fresh timestamp.
    OnChangePassword(): void {
        if (this.MatProgressBar) {
            return;
        }

        const ref = this.dialog.open<ChangePasswordDialogComponent, undefined, ChangePasswordDialogResult>(
            ChangePasswordDialogComponent,
            {
                autoFocus: 'first-tabbable',
                disableClose: true,
            }
        );

        ref.afterClosed().subscribe(result => {
            if (result === true) {
                this.Load();
            }
        });
    }

    // One- or two-letter initials for the avatar tile. Uses the first letters of the first
    // two whitespace-separated words — falls back to '?' when the name is empty.
    GetInitials(name: string | null | undefined): string {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    AccountStatusLabel(profile: UserProfileDetails): string {
        if (profile.isDeleted) return 'Deleted';
        if (!profile.isActive) return 'Inactive';
        return 'Active';
    }

    AccountStatusClass(profile: UserProfileDetails): string {
        if (profile.isDeleted) return 'status-processing-failed';
        if (!profile.isActive) return 'status-no';
        return 'status-yes';
    }

    private Load(): void {
        this.MatProgressBar = true;
        this.profileSubscription?.unsubscribe();

        this.profileSubscription = this.userProfileService.GetDetails().subscribe({
            next: response => {
                this.MatProgressBar = false;

                if (!response.success) {
                    this.Profile = null;
                    this.dialog.open(CustomAlertComponent, {
                        data: { text: response.message, type: ResponseTypeColor.ERROR }
                    });
                    return;
                }

                this.Profile = response.data as UserProfileDetails;
            },
            error: () => {
                this.MatProgressBar = false;
                this.Profile = null;
                this.dialog.open(CustomAlertComponent, {
                    data: { text: 'Failed to load your profile.', type: ResponseTypeColor.ERROR }
                });
            }
        });
    }
}
