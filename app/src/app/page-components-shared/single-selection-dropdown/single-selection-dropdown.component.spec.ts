import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleSelectionDropdownComponent } from './single-selection-dropdown.component';

describe('SingleSelectionDropdownComponent', () => {
  let component: SingleSelectionDropdownComponent;
  let fixture: ComponentFixture<SingleSelectionDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleSelectionDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleSelectionDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
