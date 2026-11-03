import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryDuplicateHandlingComponent } from './history-duplicate-handling.component';

describe('HistoryDuplicateHandlingComponent', () => {
  let component: HistoryDuplicateHandlingComponent;
  let fixture: ComponentFixture<HistoryDuplicateHandlingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryDuplicateHandlingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryDuplicateHandlingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
