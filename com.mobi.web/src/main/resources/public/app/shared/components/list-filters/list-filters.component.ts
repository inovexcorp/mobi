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
import { Component, Input } from '@angular/core';

import { FilterType, ListFilter } from '../../models/list-filter.interface';

/**
 * @class shared.ListFiltersComponent
 * 
 * Creates a div containing collapsible containers for various filters that can be performed on a list. Supports both
 * checkbox and radio based filter options. Supports filters where the options are paginated and searchable.
 * 
 * @param {ListFilter[]} filters The list of filters to display. All interactive behavior of the filter with the
 *  rendered buttons and inputs are handled by the logic provided by each object.
 */
@Component({
  selector: 'app-list-filters',
  templateUrl: './list-filters.component.html',
  styleUrls: ['./list-filters.component.scss']
})
export class ListFiltersComponent {
  readonly FilterType = FilterType;

  @Input() filters: ListFilter[];

  constructor() { }
}
