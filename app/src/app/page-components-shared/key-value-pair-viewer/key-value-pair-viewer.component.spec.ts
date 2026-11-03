import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyValuePairViewerComponent } from './key-value-pair-viewer.component';

describe('KeyValuePairViewerComponent', () => {
  let component: KeyValuePairViewerComponent;
  let fixture: ComponentFixture<KeyValuePairViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyValuePairViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyValuePairViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
