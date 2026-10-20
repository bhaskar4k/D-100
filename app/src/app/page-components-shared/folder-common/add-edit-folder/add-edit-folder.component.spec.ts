import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFolderComponent } from './add-edit-folder.component';

describe('AddEditFolderComponent', () => {
  let component: AddEditFolderComponent;
  let fixture: ComponentFixture<AddEditFolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFolderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
