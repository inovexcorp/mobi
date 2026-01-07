/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { ListFilter } from './list-filter.interface';

/**
 * A filter to be displayed in {@link shared.ListFiltersComponent} that has searchable items.
 */
export interface SearchableListFilter extends ListFilter {
  pagingData: { // Data about the current page of filter items being displayed
    limit: number,
    totalSize: number,
    pageIndex: number,
    hasNextPage: boolean
  },
  rawFilterItems: any[], // The raw list of items representing the filters
  searchModel: string, // The variable to bind the search bar to
  searchChanged: (value: string) => void, // Executed when the search model changes. Mainly meant to update any outside state to the new value
  searchSubmitted: () => void, // Executed when the search is submitted with ENTER. Should call nextPage at the end
  nextPage: () => void // Fetches the next page of filter items
}
