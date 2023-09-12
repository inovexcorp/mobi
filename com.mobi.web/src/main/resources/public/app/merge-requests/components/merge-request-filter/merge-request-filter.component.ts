/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { forEach } from 'lodash';

import { MergeRequestFilter } from '../../models/merge-request-filter';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestFilterEvent } from '../../models/merge-request-filter-event';
import { getBeautifulIRI } from '../../../shared/utility';

@Component({
  selector: 'merge-request-filter',
  templateUrl: './merge-request-filter.component.html',
  styleUrls: ['./merge-request-filter.component.scss']
})
export class MergeRequestFilterComponent implements OnInit {
  filters: MergeRequestFilter[];
  requestStatusOptions = [
    { value: false, label: 'Open' },
    { value: true, label: 'Accepted' }
  ];
  @Input() catalogId: string;
  @Input() requestStatus: boolean;
  @Output() changeFilter = new EventEmitter<MergeRequestFilterEvent>();
  statusValue: any;

  constructor(public state: MergeRequestsStateService) {}

  ngOnInit(): void {
    const componentContext = this;
    const statusOptionMap = {};
    const statusTypeFilter: MergeRequestFilter = {
      title: 'Request Status',
      hide: false,
      pageable: false,
      searchable: false,
      filterItems: [],
      onInit: function() {
        this.setFilterItems();
      },
      getItemText: function(filterItem: FilterItem) {
        return getBeautifulIRI(filterItem.value);
      },
      setFilterItems: function() {
        this.filterItems = componentContext.requestStatusOptions.map( item => {
          statusOptionMap[item.label] = item.value;
          //select default value
          if (componentContext.requestStatus === item.value) {
            componentContext.statusValue = item.label;
          }
          return {
            value: item.label,
            checked: item.value === componentContext.requestStatus
          };
        });
      },
      filter: function(filterItem: FilterItem) {
        const value = statusOptionMap[filterItem.value];

        if (filterItem.checked) {
          forEach(this.filterItems, typeFilter => {
            if (typeFilter.value !== filterItem.value) {
              typeFilter.checked = false;
            }
          });
          componentContext.changeFilter.emit({
            requestStatus: value
          });
        }
      },
      setFilter: function (value:string)  {
        const obj = {
          value: value ,
          checked: true
        };
        this.filter(obj);
      }
    };

    this.filters = [statusTypeFilter];
    forEach(this.filters, filter => {
      if ('onInit' in filter) {
        filter.onInit();
      }
    });
  }
}
