import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryMissingValueHandlingComponent } from './history-missing-value-handling.component';

describe('HistoryMissingValueHandlingComponent', () => {
  let component: HistoryMissingValueHandlingComponent;
  let fixture: ComponentFixture<HistoryMissingValueHandlingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryMissingValueHandlingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryMissingValueHandlingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
