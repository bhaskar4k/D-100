import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadIngestedDatasetComponent } from './download-ingested-dataset.component';

describe('DownloadIngestedDatasetComponent', () => {
  let component: DownloadIngestedDatasetComponent;
  let fixture: ComponentFixture<DownloadIngestedDatasetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadIngestedDatasetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadIngestedDatasetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
