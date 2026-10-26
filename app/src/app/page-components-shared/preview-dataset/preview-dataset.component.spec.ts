import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewDatasetComponent } from './preview-dataset.component';

describe('PreviewDatasetComponent', () => {
  let component: PreviewDatasetComponent;
  let fixture: ComponentFixture<PreviewDatasetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewDatasetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
