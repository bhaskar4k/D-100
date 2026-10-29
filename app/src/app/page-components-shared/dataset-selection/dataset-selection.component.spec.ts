import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetSelectionComponent } from './dataset-selection.component';

describe('DatasetSelectionComponent', () => {
  let component: DatasetSelectionComponent;
  let fixture: ComponentFixture<DatasetSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatasetSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
