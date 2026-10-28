import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessingQueueCardComponent } from './processing-queue-card.component';

describe('ProcessingQueueCardComponent', () => {
  let component: ProcessingQueueCardComponent;
  let fixture: ComponentFixture<ProcessingQueueCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessingQueueCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessingQueueCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
