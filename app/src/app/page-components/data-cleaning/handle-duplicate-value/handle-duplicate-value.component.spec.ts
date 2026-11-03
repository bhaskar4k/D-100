import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandleDuplicateValueComponent } from './handle-duplicate-value.component';

describe('HandleDuplicateValueComponent', () => {
  let component: HandleDuplicateValueComponent;
  let fixture: ComponentFixture<HandleDuplicateValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleDuplicateValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HandleDuplicateValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
