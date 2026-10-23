import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDatasetInfoComponent } from './view-dataset-info.component';

describe('ViewDatasetInfoComponent', () => {
  let component: ViewDatasetInfoComponent;
  let fixture: ComponentFixture<ViewDatasetInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDatasetInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDatasetInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
