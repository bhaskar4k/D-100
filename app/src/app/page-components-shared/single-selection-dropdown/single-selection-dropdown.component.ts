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
    if (changes['selectedItem'] && this.selectedItem) {
      this.selectedValue = this.selectedItem.id; // pre-select in mat-select
    }
  }

  onValueChange(value: string | number) {
    const selected = this.options.find(o => o.id === value);
    if (selected) {
      this.selectionChange.emit(selected);
    }
  }
}