import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Dropdown } from '../../models/common.model';


@Component({
  selector: 'app-single-selection-dropdown',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './single-selection-dropdown.component.html',
  styleUrl: './single-selection-dropdown.component.css'
})
export class SingleSelectionDropdownComponent implements OnChanges {
  @Input() options: Dropdown[] = [];
  @Input() placeholder: string = 'Select Item';
  @Input() selectedItem: Dropdown | null = null;

  @Output() selectionChange = new EventEmitter<Dropdown>();

  selectedValue: string | number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Mirror selectedItem into the mat-select value for both branches:
    //   - truthy -> pre-select / switch to the new item in mat-select
    //   - null   -> clear mat-select so it falls back to the placeholder
    // Without the null branch, the parent setting selectedItem back to null
    // would leave the trigger showing the previous selection.
    if (changes['selectedItem']) {
      this.selectedValue = this.selectedItem ? this.selectedItem.id : null;
    }
  }

  onValueChange(value: string | number) {
    const selected = this.options.find(o => o.id === value);
    if (selected) {
      this.selectionChange.emit(selected);
    }
  }
}