import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDeletedDatasetGridComponent } from './view-deleted-dataset-grid.component';

describe('ViewDeletedDatasetGridComponent', () => {
  let component: ViewDeletedDatasetGridComponent;
  let fixture: ComponentFixture<ViewDeletedDatasetGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDeletedDatasetGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDeletedDatasetGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
