package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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

import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchParamsBuilder;
import org.matonto.rdf.api.Resource;

import java.util.Optional;

public class SimpleSearchParams implements PaginatedSearchParams {
    private String searchTerm;
    private Resource typeFilter;
    private Resource sortBy;
    private Boolean ascending;
    private int limit;
    private int offset;

    @Override
    public Optional<String> getSearchTerm() {
        return Optional.ofNullable(searchTerm);
    }

    @Override
    public Optional<Resource> getTypeFilter() {
        return Optional.ofNullable(typeFilter);
    }

    @Override
    public Resource getSortBy() {
        return sortBy;
    }

    @Override
    public Optional<Boolean> getAscending() {
        return Optional.ofNullable(ascending);
    }

    @Override
    public int getLimit() {
        return limit;
    }

    @Override
    public int getOffset() {
        return offset;
    }

    public static class Builder implements PaginatedSearchParamsBuilder {
        private final int limit;
        private final int offset;
        private final Resource sortBy;

        private String searchTerm = null;
        private Resource typeFilter = null;
        private Boolean ascending = null;

        public Builder(int limit, int offset, Resource sortBy) {
            this.limit = limit;
            this.offset = offset;
            this.sortBy = sortBy;
        }

        public Builder searchTerm(String val) {
            this.searchTerm = val;
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

        public SimpleSearchParams build() {
            return new SimpleSearchParams(this);
        }
    }

    private SimpleSearchParams(Builder builder) {
        this.searchTerm = builder.searchTerm;
        this.typeFilter = builder.typeFilter;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.limit = builder.limit;
        this.offset = builder.offset;
    }
}
