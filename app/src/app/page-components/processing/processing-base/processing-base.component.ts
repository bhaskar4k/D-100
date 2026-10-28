import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ProcessingService } from '../../../services/processing.service';
import { QueueStatus } from '../../../models/processing.model';
import { CustomAlertComponent } from '../../../page-components-shared/custom-alert/custom-alert.component';
import { ResponseTypeColor } from '../../../constants/commonConsts';
import { ProcessingQueueCardComponent } from '../processing-queue-card/processing-queue-card.component';

@Component({
  selector: 'app-processing-base',
  imports: [CommonModule, MatProgressSpinnerModule, MatTooltipModule, ProcessingQueueCardComponent],
  templateUrl: './processing-base.component.html',
  styleUrl: './processing-base.component.css'
})
export class ProcessingBaseComponent implements OnInit, OnDestroy {
  readonly AutoRefreshMs = 3000;

  Queues: QueueStatus[] = [];
  Loading = false;
  AutoRefresh = true;
  LastUpdated: Date | null = null;
  HasLoadedOnce = false;

  private stop$ = new Subject<void>();
  private pollSubscription?: Subscription;
  private manualSubscription?: Subscription;

  constructor(
    private processingService: ProcessingService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.StartPolling();
  }

  ngOnDestroy(): void {
    this.stop$.next();
    this.stop$.complete();
    this.pollSubscription?.unsubscribe();
    this.manualSubscription?.unsubscribe();
  }

  OnRefresh(): void {
    this.manualSubscription?.unsubscribe();
    this.Loading = true;

    this.manualSubscription = this.processingService.GetQueueStatus().subscribe({
      next: (response) => this.ApplyResponse(response, true),
      error: () => this.OnLoadError(true)
    });
  }

  // Flips auto-refresh on/off. Off: stops the timer but leaves the last snapshot on screen; the
  // manual Refresh button still works. On: restarts polling from now.
  OnToggleAutoRefresh(): void {
    this.AutoRefresh = !this.AutoRefresh;

    if (this.AutoRefresh) {
      this.StartPolling();
    } else {
      this.stop$.next();
      this.pollSubscription?.unsubscribe();
      this.pollSubscription = undefined;
    }
  }

  TrackByQueue(_index: number, queue: QueueStatus): string {
    return queue.displayName;
  }

  private StartPolling(): void {
    this.pollSubscription?.unsubscribe();

    // timer(0, N) fires immediately and then every N ms; switchMap cancels an in-flight request
    // if a new tick arrives first, so slow responses never pile up.
    this.pollSubscription = timer(0, this.AutoRefreshMs)
      .pipe(
        takeUntil(this.stop$),
        switchMap(() => {
          if (!this.HasLoadedOnce) {
            this.Loading = true;
          }
          return this.processingService.GetQueueStatus();
        })
      )
      .subscribe({
        next: (response) => this.ApplyResponse(response, false),
        error: () => this.OnLoadError(false)
      });
  }

  private ApplyResponse(response: { success: boolean; message: string; data?: QueueStatus[] }, showAlertOnFail: boolean): void {
    this.Loading = false;
    this.HasLoadedOnce = true;

    if (!response.success) {
      if (showAlertOnFail) {
        this.dialog.open(CustomAlertComponent, { data: { text: response.message, type: ResponseTypeColor.ERROR } });
      }
      return;
    }

    this.Queues = response.data ?? [];
    this.LastUpdated = new Date();
  }

  private OnLoadError(showAlertOnFail: boolean): void {
    this.Loading = false;

    if (showAlertOnFail) {
      this.dialog.open(CustomAlertComponent, { data: { text: 'Failed to load queue status.', type: ResponseTypeColor.ERROR } });
    }
  }
}
