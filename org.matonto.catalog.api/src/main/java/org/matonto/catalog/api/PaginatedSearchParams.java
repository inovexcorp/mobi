package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Optional;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Enforcing sorting with the required sortBy and
 * optional ascending parameters.
 */
public interface PaginatedSearchParams {

    Optional<String> getSearchTerm();

    Optional<Resource> getTypeFilter();

    Resource getSortBy();

    Optional<Boolean> getAscending();

    int getLimit();

    int getOffset();
}
