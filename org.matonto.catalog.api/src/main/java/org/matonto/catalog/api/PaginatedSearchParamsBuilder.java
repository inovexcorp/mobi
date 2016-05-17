package org.matonto.catalog.api;

import org.matonto.rdf.api.Resource;

public interface PaginatedSearchParamsBuilder {

    PaginatedSearchParamsBuilder searchTerm(String val);

    PaginatedSearchParamsBuilder typeFilter(Resource val);

    PaginatedSearchParamsBuilder ascending(boolean val);

    PaginatedSearchParams build();
}
