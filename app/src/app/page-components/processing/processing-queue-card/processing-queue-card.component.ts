import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QueueStatus } from '../../../models/processing.model';

@Component({
  selector: 'app-processing-queue-card',
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './processing-queue-card.component.html',
  styleUrl: './processing-queue-card.component.css'
})
export class ProcessingQueueCardComponent {
  @Input({ required: true }) queue!: QueueStatus;

  // Clamped: a brief race can leave processing above maxParallel if the semaphore is misreported.
  get Utilization(): number {
    if (!this.queue || this.queue.maxParallel <= 0) return 0;
    return Math.min(100, Math.round((this.queue.processing / this.queue.maxParallel) * 100));
  }

  // Pure visual bucket, no data meaning: idle / busy / full gives the card its accent color.
  get CapacityLevel(): 'idle' | 'busy' | 'full' {
    const u = this.Utilization;
    if (u >= 100) return 'full';
    if (u > 0) return 'busy';
    return 'idle';
  }
}
