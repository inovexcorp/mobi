package org.matonto.catalog.impl;

import org.matonto.catalog.api.PaginatedSearchResults;

import java.util.Set;

public class SimpleSearchResults<T> implements PaginatedSearchResults<T> {

    private Set<T> page;
    private int totalSize;
    private int pageSize;
    private int pageNumber;

    public SimpleSearchResults(Set<T> page, int totalSize, int pageSize, int pageNumber) {
        this.page = page;
        this.totalSize = totalSize;
        this.pageSize = pageSize;
        this.pageNumber = pageNumber;
    }

    @Override
    public Set<T> getPage() {
        return page;
    }

    @Override
    public int getTotalSize() {
        return totalSize;
    }

    @Override
    public int getPageSize() {
        return pageSize;
    }

    @Override
    public int getPageNumber() {
        return pageNumber;
    }
}
