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
import { FilterItem } from './filterItem.interface';

export enum FilterType {
  CHECKBOX,
  RADIO
}
/**
 * A filter to be displayed in {@link shared.ListFiltersComponent}.
 */
export interface ListFilter {
  title: string, // The display title of the filter
  type: FilterType, // The type of filter to display
  hide: boolean, // Whether the filter is hidden. Used with the mat-expansion-panel
  pageable: boolean, // Whether the filter items should be paginated
  searchable: boolean, // Whether the filter items are searchable. If so should be a SearchableListFilter
  filterItems: FilterItem[], // The displayed list of filter items
  numChecked: number, // The number of items checked
  onInit: () => void, // To be called when the filter first loads
  getItemText: (filterItem: FilterItem) => string, // Gets the display text of the filter
  setFilterItems: () => void, // Sets the list of filter items
  filter: (filterItem: FilterItem) => void // Executes the represented filter optionally using a specific provided
                                           //filter item. If checkbox, expected to update the numChecked variables
}
