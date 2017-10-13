package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import java.util.List;

public interface PaginatedSearchResults<T> {

    /**
     * Returns the results from the current page.
     *
     * @return the Set of results from the current page.
     */
    List<T> getPage();

    /**
     * Returns the total size of results for all pages.
     *
     * @return the total size of results for all pages.
     */
    int getTotalSize();

    /**
     * Returns the page size provided for the search.
     *
     * @return the page size provided for the search.
     */
    int getPageSize();

    /**
     * Returns the current page number for these results. Page numbers start at 1.
     *
     * @return the current page number for these results.
     */
    int getPageNumber();
}
