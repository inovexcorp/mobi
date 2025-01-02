package com.mobi.workflows.impl.core;

/*-
 * #%L
 * com.mobi.workflows.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.PaginatedSearchResults;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * An implementation of PaginatedSearchResults specifically for WorkflowRecords represented as JSON objects.
 */
public class WorkflowSearchResults implements PaginatedSearchResults<ObjectNode> {

    private final List<ObjectNode> page;
    private final int totalSize;
    private final int pageSize;
    private final int pageNumber;

    /**
     * Constructs an instance of WorkflowSearchResults.
     *
     * @param page The current page of results
     * @param totalSize The total number of results of all pages
     * @param pageSize The size of each page of results
     * @param pageNumber The current page number of the results
     */
    public WorkflowSearchResults(List<ObjectNode> page, int totalSize, int pageSize, int pageNumber) {
        this.page = page;
        this.totalSize = totalSize;
        this.pageSize = pageSize;
        this.pageNumber = pageNumber;
    }

    public static final PaginatedSearchResults<ObjectNode> EMPTY_RESULTS = new WorkflowSearchResults.EmptyResults();

    public static PaginatedSearchResults<ObjectNode> emptyResults() {
        return EMPTY_RESULTS;
    }

    /**
     * Returns the results from the current page.
     *
     * @return the List of results from the current page.
     */
    @Override
    public List<ObjectNode> getPage() {
        return this.page;
    }

    /**
     * Returns the total size of results for all pages.
     *
     * @return the total size of results for all pages.
     */
    @Override
    public int getTotalSize() {
        return this.totalSize;
    }

    /**
     * Returns the page size provided for the search.
     *
     * @return the page size provided for the search.
     */
    @Override
    public int getPageSize() {
        return this.pageSize;
    }

    /**
     * Returns the current page number for these results. Page numbers start at 1.
     *
     * @return the current page number for these results.
     */
    @Override
    public int getPageNumber() {
        return this.pageNumber;
    }


    private static class EmptyResults implements PaginatedSearchResults<ObjectNode>, Serializable {
        @Serial
        private static final long serialVersionUID = 2994432257552675130L;

        @Override
        public List<ObjectNode> getPage() {
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
        @Serial
        private Object readResolve() {
            return EMPTY_RESULTS;
        }
    }
}
