/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { isEqual } from 'lodash';

import { FilterItem, SelectedFilterItems } from '../../models/filterItem.interface';

interface FilterChip {
  item: FilterItem,
  key: string
}

/**
 * @class shared.FiltersSelectedListComponent
 * 
 * This component is used to display a list of selected filters from an instance of {@link shared.ListFiltersComponent}
 * as a list of chips and allows users to remove filters.
 * 
 * @param {SelectedFilterItems} selectedFilters An object of filters from a parent component with their selected
 *    FilterItem(s) to be displayed
 */
@Component({
  selector: 'app-filters-selected-list',
  templateUrl: './filters-selected-list.component.html',
  styleUrls: ['./filters-selected-list.component.scss']
})
export class FiltersSelectedListComponent {
  private _filterChips: FilterChip[];
  private _selectedFilters: SelectedFilterItems;
  
  // TODO: this component can be updated once the state manangement is in place
  // @Input and @Output will be replace for a store.selector
  // for example: selectedFilters$ = this.store.select(state => state.filters);
  @Input() set selectedFilters(value: SelectedFilterItems) {
    this._selectedFilters = value;
    this._filterChips = [];
    Object.keys(value).forEach(key => {
      const selected = value[key];
      if (Array.isArray(selected)) {
        selected.forEach(item => {
          this._filterChips.push({ item, key });
        });
      } else if (selected) {
        this._filterChips.push({ item: selected, key });
      }
    });
  }

  get selectedFilters(): SelectedFilterItems {
    return this._selectedFilters;
  }

  @Output() selectedFiltersChange = new EventEmitter<SelectedFilterItems>();

  constructor() {}

  get filterChips(): FilterChip[] {
    return this._filterChips;
  }

  /**
   * Removes the specified filter from the selected filters list.
   *
   * @param filter The filter string to be removed.
   */
  removeFilter(chip: FilterChip, index: number): void {
    this._filterChips.splice(index, 1);
    const filterValue = this.selectedFilters[chip.key];
    if (Array.isArray(filterValue)) {
      // isEqual required as object references can get wonky
      this.selectedFilters[chip.key] = filterValue.filter(val => !isEqual(val, chip.item));
    } else {
      this.selectedFilters[chip.key] = undefined;
    }
    // we can replace this by adding an action.
    // for example  this.store.dispatch(FilterActions.RemoveFilter({ payload: filter }));
    this.selectedFiltersChange.emit(this.selectedFilters);
  }

  /**
   * Removes all selected filter items from all filters in `selectedFilters`, clearing out the chips as well.
   */
  reset(): void {
    this._filterChips = [];
    Object.keys(this.selectedFilters).forEach(key => {
      if (Array.isArray(this.selectedFilters[key])) {
        this.selectedFilters[key] = [];
      } else {
        this.selectedFilters[key] = undefined;
      }
    });
    this.selectedFiltersChange.emit(this.selectedFilters);
  }
}
