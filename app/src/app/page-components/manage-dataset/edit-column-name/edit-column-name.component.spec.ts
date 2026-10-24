import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditColumnNameComponent } from './edit-column-name.component';

describe('EditColumnNameComponent', () => {
  let component: EditColumnNameComponent;
  let fixture: ComponentFixture<EditColumnNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditColumnNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditColumnNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
