import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessingBaseComponent } from './processing-base.component';

describe('ProcessingBaseComponent', () => {
  let component: ProcessingBaseComponent;
  let fixture: ComponentFixture<ProcessingBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessingBaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessingBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
