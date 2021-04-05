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

import com.mobi.rdf.api.Resource;

import java.util.List;
import java.util.Optional;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Enforcing sorting with the required sortBy and
 * optional ascending parameters.
 */
public class PaginatedSearchParams {
    private String searchText;
    private Resource typeFilter;
    private List<String> keywords;
    private Resource sortBy;
    private Boolean ascending;
    private Integer limit;
    private int offset;

    private PaginatedSearchParams(Builder builder) {
        this.searchText = builder.searchText;
        this.typeFilter = builder.typeFilter;
        this.keywords = builder.keywords;
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

    public Optional<List<String>> getKeywords() {
        return Optional.ofNullable(keywords);
    }

    public Optional<Resource> getSortBy() {
        return Optional.ofNullable(sortBy);
    }

    public Optional<Boolean> getAscending() {
        return Optional.ofNullable(ascending);
    }

    public Optional<Integer> getLimit() {
        return Optional.ofNullable(limit);
    }

    public int getOffset() {
        return offset;
    }

    public static class Builder {
        private Integer limit = null;
        private int offset = 0;
        private Resource sortBy = null;
        private String searchText = null;
        private Resource typeFilter = null;
        private List<String> keywords = null;
        private Boolean ascending = null;

        public Builder() {}

        public Builder limit(Integer limit) {
            this.limit = limit;
            return this;
        }

        public Builder offset(int offset) {
            this.offset = offset;
            return this;
        }

        public Builder sortBy(Resource sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        public Builder searchText(String val) {
            this.searchText = val;
            return this;
        }

        public Builder typeFilter(Resource val) {
            this.typeFilter = val;
            return this;
        }

        public Builder keywords(List<String> keywords) {
            this.keywords = keywords;
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
