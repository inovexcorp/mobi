package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

import java.util.Optional;

/**
 * Search parameters. Allows paging with the limit and offset parameters. Allows sorting with the sortBy and ascending
 * parameters. Sorts by modified date descending if an inappropriate resource is passed in.
 */
public interface PaginatedSearchParams {

    Optional<String> getSearchTerm();

    Optional<Resource> getTypeFilter();

    Optional<Resource> getSortBy();

    Optional<Boolean> getAscending();

    int getLimit();

    int getOffset();
}
