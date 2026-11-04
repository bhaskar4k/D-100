import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { UserStorageService } from '../../services/user-storage.service';
import { UserStorageDetails } from '../../models/user-storage.model';
import { CustomAlertComponent } from '../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../constants/commonConsts';
import { UNLIMITED_BYTES } from '../../constants/commonConsts';


// Base-1024 units mirror how GetReadableFileSize formats dataset sizes elsewhere, so the
// numbers people see here match what they see on the dataset grid.
const BYTE_UNITS: ReadonlyArray<{ label: string; divisor: bigint }> = [
    { label: 'PB', divisor: 1024n ** 5n },
    { label: 'TB', divisor: 1024n ** 4n },
    { label: 'GB', divisor: 1024n ** 3n },
    { label: 'MB', divisor: 1024n ** 2n },
    { label: 'KB', divisor: 1024n },
    { label: 'Byte', divisor: 1n },
];

@Component({
    selector: 'app-storage-control',
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './storage-control.component.html',
    styleUrl: './storage-control.component.css'
})
export class StorageControlComponent implements OnInit, OnDestroy {
    Details: UserStorageDetails | null = null;
    MatProgressBar = false;

    private detailsSubscription?: Subscription;

    constructor(
        private userStorageService: UserStorageService,
        private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.Load();
    }

    ngOnDestroy(): void {
        this.detailsSubscription?.unsubscribe();
    }

    OnRefresh(): void {
        if (this.MatProgressBar) {
            return;
        }
        this.Load();
    }

    IsUnlimited(bytes: string | null | undefined): boolean {
        if (!bytes) return false;
        try {
            return BigInt(bytes) >= UNLIMITED_BYTES;
        } catch {
            return false;
        }
    }

    // Formats a byte count into the largest unit where the whole part is >= 1, with two decimal
    // places. BigInt stays intact until the final divide by the unit's divisor as a Number — by
    // then we've reduced to a small enough ratio that f64 precision is fine for display.
    FormatBytes(bytes: string | null | undefined): string {
        if (bytes === null || bytes === undefined || bytes === '') {
            return '-';
        }

        let value: bigint;
        try {
            value = BigInt(bytes);
        } catch {
            return '-';
        }

        if (value <= 0n) {
            return '0 Byte';
        }

        if (value >= UNLIMITED_BYTES) {
            return 'Unlimited';
        }

        for (const unit of BYTE_UNITS) {
            if (value >= unit.divisor) {
                if (unit.divisor === 1n) {
                    return `${value.toString()} Byte${value === 1n ? '' : 's'}`;
                }
                // Convert via toString to keep the integer part exact, then divide with Number
                // for the fractional tail. Any value small enough to fall into this branch is
                // well under Number.MAX_SAFE_INTEGER.
                const whole = Number(value / unit.divisor);
                const remainder = Number(value % unit.divisor) / Number(unit.divisor);
                const amount = (whole + remainder).toFixed(2);
                return `${parseFloat(amount)} ${unit.label}`;
            }
        }

        return `${value.toString()} Byte`;
    }

    // 0–100 with two decimals. Returns null when the quota is unlimited or missing so the UI
    // can suppress the progress bar instead of drawing a flat line at 0.
    UsagePercentage(): number | null {
        if (!this.Details) return null;
        if (this.IsUnlimited(this.Details.allowedStorage)) return null;

        try {
            const allowed = BigInt(this.Details.allowedStorage);
            const used = BigInt(this.Details.usedStorage);
            if (allowed <= 0n) return null;

            // Scale into permille² (×10000) before converting to Number so two decimals of
            // precision survive even at huge allowed values.
            const scaled = Number((used * 10000n) / allowed) / 100;
            return Math.min(100, Math.max(0, scaled));
        } catch {
            return null;
        }
    }

    UsagePercentageDisplay(): string {
        const pct = this.UsagePercentage();
        if (pct === null) return '-';
        return `${pct.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
    }

    // Color band for the progress bar — green until the user is comfortably away from the cap,
    // amber in the warning window, red once they're nearly out of room.
    UsageColorClass(): string {
        const pct = this.UsagePercentage();
        if (pct === null) return 'usage-ok';
        if (pct >= 90) return 'usage-critical';
        if (pct >= 70) return 'usage-warning';
        return 'usage-ok';
    }

    PlanLabel(): string {
        if (!this.Details) return '-';
        return this.Details.planName ?? 'Custom';
    }

    PlanBadgeClass(): string {
        // Each known plan gets its own tint so the current plan reads at a glance. Unknown /
        // custom allocations fall back to a neutral style.
        const key = (this.Details?.planEnum ?? '').toUpperCase();
        switch (key) {
            case 'BRONZE': return 'plan-bronze';
            case 'SILVER': return 'plan-silver';
            case 'IRON': return 'plan-iron';
            case 'GOLD': return 'plan-gold';
            case 'DIAMOND': return 'plan-diamond';
            case 'UNLIMITED': return 'plan-unlimited';
            default: return 'plan-custom';
        }
    }

    private Load(): void {
        this.MatProgressBar = true;
        this.detailsSubscription?.unsubscribe();

        this.detailsSubscription = this.userStorageService.GetDetails().subscribe({
            next: response => {
                this.MatProgressBar = false;

                if (!response.success) {
                    this.Details = null;
                    this.dialog.open(CustomAlertComponent, {
                        data: { text: response.message, type: ResponseTypeColor.ERROR }
                    });
                    return;
                }

                this.Details = response.data as UserStorageDetails;
            },
            error: () => {
                this.MatProgressBar = false;
                this.Details = null;
                this.dialog.open(CustomAlertComponent, {
                    data: { text: 'Failed to load storage details.', type: ResponseTypeColor.ERROR }
                });
            }
        });
    }
}
