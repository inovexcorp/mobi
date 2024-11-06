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
import { Component, EventEmitter, OnInit, OnChanges, SimpleChanges, Output, Input } from '@angular/core';

import { remove } from 'lodash';

import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { getBeautifulIRI } from '../../../shared/utility';
import { DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { SelectedEntityFilters } from '../../models/selected-entity-filters.interface';

/**
 * @class entity-search.EntitySearchFiltersComponent
 * 
 * The EntitySearchFiltersComponent is responsible for rendering and managing
 * the search filters for different record types in the entity search module.
 * It emits events when filters are updated, allowing other parts of the application
 * to react to changes in the selected filters.
 *
 * @param {Function} changeFilter A function that is called with a {@link entity-search.SelectedEntityFilters}
 * representing the updated values for each filter. This function should update the `typeFilters` binding.
 * @param {FilterItem[]} typeFilters The list of selected record type filter items
 */
@Component({
  selector: 'app-entity-search-filters',
  templateUrl: './entity-search-filters.component.html',
})
export class EntitySearchFiltersComponent implements OnInit, OnChanges {
  filters: ListFilter[] = [];
  recordFilterIndex = 0;

  @Input() typeFilters: FilterItem[] = [];
  @Output() changeFilter = new EventEmitter<SelectedEntityFilters>();

  constructor() {}

  ngOnInit(): void {
    // TODO: Pull this from the backend rather than being hardcoded
    const recordTypes = [
      `${ONTOLOGYEDITOR}OntologyRecord`,
      `${WORKFLOWS}WorkflowRecord`,
      `${DELIM}MappingRecord`,
      `${SHAPESGRAPHEDITOR}ShapesGraphRecord`
    ];

    const filterItems = recordTypes.map( type => ({
      value: type,
      display: getBeautifulIRI(type),
      checked: this.typeFilters.findIndex(item => item.value === type) >= 0,
    } as FilterItem));

    const componentContext = this;

    this.filters = [
      {
        title: 'Record Type',
        type: FilterType.CHECKBOX,
        numChecked: 0,
        hide: false,
        pageable: false,
        searchable: false,
        filterItems,
        onInit: function() {
          this.numChecked = componentContext.typeFilters.length;
        },
        setFilterItems: function() {},
        filter: function(filterItem: FilterItem) {
          if (filterItem.checked) {
            componentContext.typeFilters.push(filterItem);
          } else {
            remove(componentContext.typeFilters, typeFilter => typeFilter.value === filterItem.value);
          }
          this.numChecked = componentContext.typeFilters.length;
          componentContext.changeFilter.emit({chosenTypes: componentContext.typeFilters});
        }
      }
    ];

    this.filters.forEach(filter => {
      if ('onInit' in filter) {
        filter.onInit();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.typeFilters) {
      this.updateFilterList(changes.typeFilters.currentValue, changes.typeFilters.previousValue);
    }
  }

  /**
   * Updates the record types filter based on the current values and previous values provided. Only handles removed
   * values as that is the only use case expected.
   *
   * @param {FilterItem[]} currentValue The current list of selected type filters
   * @param {FilterItem[]} previousValue The previous list of selected type filters
   */
  updateFilterList(currentValue: FilterItem[], previousValue: FilterItem[]): void {
    if (currentValue?.length < previousValue?.length) {
      const recordTypeFilter = this.filters[this.recordFilterIndex];
      recordTypeFilter.filterItems
        .filter(item => currentValue.findIndex(updatedItem => updatedItem.value === item.value) < 0 && item.checked)
        .forEach(item => {
          item.checked = false;
        });
      recordTypeFilter.numChecked = currentValue.length;
    }
  }
}
