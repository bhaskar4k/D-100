import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageControlComponent } from './storage-control.component';

describe('StorageControlComponent', () => {
  let component: StorageControlComponent;
  let fixture: ComponentFixture<StorageControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorageControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StorageControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
