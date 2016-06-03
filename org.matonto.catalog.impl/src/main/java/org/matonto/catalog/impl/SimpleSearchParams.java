package org.matonto.catalog.impl;

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
