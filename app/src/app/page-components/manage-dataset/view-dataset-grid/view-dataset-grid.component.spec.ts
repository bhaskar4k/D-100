import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDatasetGridComponent } from './view-dataset-grid.component';

describe('ViewDatasetGridComponent', () => {
  let component: ViewDatasetGridComponent;
  let fixture: ComponentFixture<ViewDatasetGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDatasetGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDatasetGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
