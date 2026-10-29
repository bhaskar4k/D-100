import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSingleSelectionComponent } from './custom-single-selection.component';

describe('CustomSingleSelectionComponent', () => {
  let component: CustomSingleSelectionComponent;
  let fixture: ComponentFixture<CustomSingleSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSingleSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomSingleSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
