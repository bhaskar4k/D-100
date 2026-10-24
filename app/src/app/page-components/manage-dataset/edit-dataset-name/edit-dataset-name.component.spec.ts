import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDatasetNameComponent } from './edit-dataset-name.component';

describe('EditDatasetNameComponent', () => {
  let component: EditDatasetNameComponent;
  let fixture: ComponentFixture<EditDatasetNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDatasetNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDatasetNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
