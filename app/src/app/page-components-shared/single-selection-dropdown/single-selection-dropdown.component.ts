import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
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
  @Input() searchPlaceholder: string = 'Search...';

  @Output() selectionChange = new EventEmitter<Dropdown>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  selectedValue: string | number | null = null;
  searchText: string = '';
  visibleIds = new Set<string | number>();

  ngOnChanges(changes: SimpleChanges): void {
    // Mirror selectedItem into the mat-select value for both branches:
    //   - truthy -> pre-select / switch to the new item in mat-select
    //   - null   -> clear mat-select so it falls back to the placeholder
    // Without the null branch, the parent setting selectedItem back to null
    // would leave the trigger showing the previous selection.
    if (changes['selectedItem']) {
      this.selectedValue = this.selectedItem ? this.selectedItem.id : null;
    }

    if (changes['options']) {
      this.updateVisible();
    }
  }

  get visibleCount(): number {
    return this.visibleIds.size;
  }

  isVisible(opt: Dropdown): boolean {
    return this.visibleIds.has(opt.id);
  }

  onValueChange(value: string | number): void {
    const selected = this.options.find(o => o.id === value);
    if (selected) {
      this.selectionChange.emit(selected);
    }
  }

  onPanelOpenedChange(opened: boolean): void {
    if (opened) {
      // Panel is created lazily, so defer focus until the input is in the DOM.
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    } else {
      // Defer the search reset until mat-select's close animation finishes, otherwise
      // the panel re-renders mid-fade and the close looks abrupt.
      setTimeout(() => {
        this.searchText = '';
        this.updateVisible();
      }, 220);
    }
  }

  onSearchChange(): void {
    this.updateVisible();
  }

  // Letters, arrows, space and typeahead keys would otherwise reach mat-select and jump
  // focus to a matching option, so block everything except Escape (lets the panel close).
  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      event.stopPropagation();
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.updateVisible();
    this.searchInput?.nativeElement.focus();
  }

  private updateVisible(): void {
    const text = this.searchText.trim().toLowerCase();
    this.visibleIds = new Set(
      text
        ? this.options.filter(o => o.text.toLowerCase().includes(text)).map(o => o.id)
        : this.options.map(o => o.id)
    );
  }
}
