import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleMissingValueComponent } from './handle-missing-value.component';

describe('HandleMissingValueComponent', () => {
  let component: HandleMissingValueComponent;
  let fixture: ComponentFixture<HandleMissingValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleMissingValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleMissingValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
