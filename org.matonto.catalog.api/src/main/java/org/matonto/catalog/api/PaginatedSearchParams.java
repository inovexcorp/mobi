package org.matonto.catalog.api;

/*-
 * #%L
 * org.matonto.catalog.api
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

import org.matonto.rdf.api.Resource;

import java.util.Optional;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Enforcing sorting with the required sortBy and
 * optional ascending parameters.
 */
public class PaginatedSearchParams {
    private String searchText;
    private Resource typeFilter;
    private Resource sortBy;
    private Boolean ascending;
    private int limit;
    private int offset;

    private PaginatedSearchParams(Builder builder) {
        this.searchText = builder.searchText;
        this.typeFilter = builder.typeFilter;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.limit = builder.limit;
        this.offset = builder.offset;
    }

    public Optional<String> getSearchText() {
        return Optional.ofNullable(searchText);
    }

    public Optional<Resource> getTypeFilter() {
        return Optional.ofNullable(typeFilter);
    }

    public Resource getSortBy() {
        return sortBy;
    }

    public Optional<Boolean> getAscending() {
        return Optional.ofNullable(ascending);
    }

    public int getLimit() {
        return limit;
    }

    public int getOffset() {
        return offset;
    }

    public static class Builder {
        private final int limit;
        private final int offset;
        private final Resource sortBy;

        private String searchText = null;
        private Resource typeFilter = null;
        private Boolean ascending = null;

        /**
         * A builder for PaginatedSearchParams which requires a limit and offset for paging and a sorting preference.
         *
         * @param limit the maximum number of items on the page to be created
         * @param offset the index of where the page should start in the list of results
         * @param sortBy the IRI of the property the results should be sorted by
         */
        public Builder(int limit, int offset, Resource sortBy) {
            this.limit = limit;
            this.offset = offset;
            this.sortBy = sortBy;
        }

        public Builder searchText(String val) {
            this.searchText = val;
            return this;
        }

        public Builder typeFilter(Resource val) {
            this.typeFilter = val;
            return this;
        }

        public Builder ascending(boolean val) {
            this.ascending = val;
            return this;
        }

        public PaginatedSearchParams build() {
            return new PaginatedSearchParams(this);
        }
    }
}
