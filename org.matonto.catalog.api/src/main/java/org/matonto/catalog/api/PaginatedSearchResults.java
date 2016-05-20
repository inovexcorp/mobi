package org.matonto.catalog.api;

import java.util.List;

public interface PaginatedSearchResults<T> {

    /**
     * Returns the results from the current page.
     *
     * @return the Set of results from the current page.
     */
    List<T> getPage();

    /**
     * Returns the total size of results for all pages.
     *
     * @return the total size of results for all pages.
     */
    int getTotalSize();

    /**
     * Returns the page size provided for the search.
     *
     * @return the page size provided for the search.
     */
    int getPageSize();

    /**
     * Returns the current page number for these results. Page numbers start at 1.
     *
     * @return the current page number for these results.
     */
    int getPageNumber();
}
