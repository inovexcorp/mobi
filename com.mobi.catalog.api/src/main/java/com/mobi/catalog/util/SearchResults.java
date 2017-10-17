package com.mobi.catalog.util;

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

import com.mobi.catalog.api.PaginatedSearchResults;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

public class SearchResults {

    private SearchResults() {}

    @SuppressWarnings("unchecked")
    public static final PaginatedSearchResults EMPTY_RESULTS = new EmptyResults<>();

    @SuppressWarnings("unchecked")
    public static final <T> PaginatedSearchResults<T> emptyResults() {
        return (PaginatedSearchResults<T>) EMPTY_RESULTS;
    }

    private static class EmptyResults<E> implements PaginatedSearchResults<E>, Serializable {
        private static final long serialVersionUID = 2994432257552675130L;

        @Override
        public List<E> getPage() {
            return Collections.emptyList();
        }

        @Override
        public int getTotalSize() {
            return 0;
        }

        @Override
        public int getPageSize() {
            return 0;
        }

        @Override
        public int getPageNumber() {
            return 0;
        }

        // Preserves singleton property
        private Object readResolve() {
            return EMPTY_RESULTS;
        }
    }
}
