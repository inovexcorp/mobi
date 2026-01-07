package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
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

import org.eclipse.rdf4j.model.Resource;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Enforcing sorting with the required sortBy and
 * optional ascending parameters.
 */
public class PaginatedSearchParams {
    private final String searchText;
    private final List<Resource> typeFilter;
    private final List<Resource> creators;
    private final List<String> keywords;
    private final SortKey sortBy;
    private final Boolean ascending;
    private final Integer limit;
    private final int offset;

    private PaginatedSearchParams(Builder builder) {
        this.searchText = builder.searchText;
        this.typeFilter = builder.typeFilter;
        this.keywords = builder.keywords;
        this.creators = builder.creators;
        this.sortBy = builder.sortBy;
        this.ascending = builder.ascending;
        this.limit = builder.limit;
        this.offset = builder.offset;
    }

    public Optional<String> getSearchText() {
        return Optional.ofNullable(searchText);
    }

    public Optional<List<Resource>> getTypeFilter() {
        return Optional.ofNullable(typeFilter);
    }

    public Optional<List<String>> getKeywords() {
        return Optional.ofNullable(keywords);
    }

    public Optional<List<Resource>> getCreators() {
        return Optional.ofNullable(creators);
    }

    public Optional<SortKey> getSortBy() {
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
        private SortKey sortBy = null;
        private String searchText = null;
        private List<Resource> typeFilter = null;
        private List<String> keywords = null;
        private List<Resource> creators = null;
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

        public Builder sortBy(SortKey sortBy) {
            this.sortBy = sortBy;
            return this;
        }

        public Builder sortBy(Resource resource) {
            this.sortBy = new ResourceSortKey(resource);
            return this;
        }

        public Builder sortBy(String key) {
            this.sortBy = new StringSortKey(key);
            return this;
        }

        public Builder searchText(String val) {
            this.searchText = val;
            return this;
        }

        public Builder typeFilter(List<Resource> types) {
            this.typeFilter = types;
            return this;
        }

        public Builder keywords(List<String> keywords) {
            this.keywords = keywords;
            return this;
        }

        public Builder creators(List<Resource> creators) {
            this.creators = creators;
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

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (other == null || getClass() != other.getClass()) {
            return false;
        }
        PaginatedSearchParams otherObject = (PaginatedSearchParams) other;
        return offset == otherObject.offset && Objects.equals(searchText, otherObject.searchText)
                && Objects.equals(typeFilter, otherObject.typeFilter) && Objects.equals(keywords, otherObject.keywords)
                && Objects.equals(creators, otherObject.creators) && Objects.equals(sortBy, otherObject.sortBy)
                && Objects.equals(ascending, otherObject.ascending) && Objects.equals(limit, otherObject.limit);
    }

    @Override
    public int hashCode() {
        return Objects.hash(searchText, typeFilter, keywords, creators, sortBy, ascending, limit, offset);
    }

    @Override
    public String toString() {
        return "PaginatedSearchParams{"
                + "searchText='" + searchText + '\''
                + ", typeFilter=" + typeFilter
                + ", keywords=" + keywords
                + ", creators=" + creators
                + ", sortBy=" + getSortBy().map(SortKey::key).orElse("null")
                + ", ascending=" + ascending
                + ", limit=" + limit
                + ", offset=" + offset
                + '}';
    }
}
