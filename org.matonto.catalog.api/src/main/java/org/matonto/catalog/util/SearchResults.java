package org.matonto.catalog.util;

import org.matonto.catalog.api.PaginatedSearchResults;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;
import java.util.Set;

public class SearchResults {

    private SearchResults() {}

    @SuppressWarnings("unchecked")
    public static final PaginatedSearchResults EMPTY_RESULTS = new EmptyResults<>();

    @SuppressWarnings("unchecked")
    public static final <T> PaginatedSearchResults<T> emptyResults() {
        return (PaginatedSearchResults<T>) EMPTY_RESULTS;
    }

    private static class EmptyResults<E> implements PaginatedSearchResults<E>, Serializable {
        private static final long serialVersionUID = 2994432257552675130L;

        @Override
        public List<E> getPage() {
            return Collections.emptyList();
        }

        @Override
        public int getTotalSize() {
            return 0;
        }

        @Override
        public int getPageSize() {
            return 0;
        }

        @Override
        public int getPageNumber() {
            return 0;
        }

        // Preserves singleton property
        private Object readResolve() {
            return EMPTY_RESULTS;
        }
    }
}
