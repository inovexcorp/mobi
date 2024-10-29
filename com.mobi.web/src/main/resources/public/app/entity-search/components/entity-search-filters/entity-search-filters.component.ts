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
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

import { remove } from 'lodash';

import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { getBeautifulIRI } from '../../../shared/utility';
import { DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { EntitySearchStateService } from '../../services/entity-search-state.service';

/**
 * @class entity-search.EntitySearchFiltersComponent
 * The EntitySearchFiltersComponent is responsible for rendering and managing
 * the search filters for different record types in the entity search module.
 * It emits events when filters are updated, allowing other parts of the application
 * to react to changes in the selected filters.
 *
 * @param {Function} changeFilter A function that expects a parameter of the list of currently selected recordTypes
 * whenever the filters are updated.
 *
 */
@Component({
  selector: 'app-entity-search-filters',
  templateUrl: './entity-search-filters.component.html',
})
export class EntitySearchFiltersComponent implements OnInit {
  filters: ListFilter[] = [];

  @Output() changeFilter = new EventEmitter<{chosenTypes: string[]}>();

  constructor(private es: EntitySearchStateService) {}

  ngOnInit(): void {
    const recordTypes = [
      `${ONTOLOGYEDITOR}OntologyRecord`,
      `${WORKFLOWS}WorkflowRecord`,
      `${DELIM}MappingRecord`,
      `${SHAPESGRAPHEDITOR}ShapesGraphRecord`
    ];

    const filterItems = recordTypes.map( type => ({
      value: type,
      checked: this.es.selectedRecordTypes.includes(type),
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
          this.numChecked = componentContext.es.selectedRecordTypes.length;
        },
        getItemText: function(filterItem: FilterItem) {
          return getBeautifulIRI(filterItem.value);
        },
        setFilterItems: function() {},
        filter: function(filterItem: FilterItem) {
          if (filterItem.checked) {
            componentContext.es.selectedRecordTypes.push(filterItem.value);
          } else {
            remove(componentContext.es.selectedRecordTypes, function(type) {
              return type === filterItem.value;
            });
          }
          this.numChecked = componentContext.es.selectedRecordTypes.length;
          componentContext.changeFilter.emit({chosenTypes: componentContext.es.selectedRecordTypes});
        }
      }
    ];

    this.filters.forEach(filter => {
      if ('onInit' in filter) {
        filter.onInit();
      }
    });
  }

}
