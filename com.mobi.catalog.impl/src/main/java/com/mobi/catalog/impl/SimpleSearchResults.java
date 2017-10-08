package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import com.mobi.catalog.api.PaginatedSearchResults;

import java.util.List;

public class SimpleSearchResults<T> implements PaginatedSearchResults<T> {

    private List<T> page;
    private int totalSize;
    private int pageSize;
    private int pageNumber;

    public SimpleSearchResults(List<T> page, int totalSize, int pageSize, int pageNumber) {
        this.page = page;
        this.totalSize = totalSize;
        this.pageSize = pageSize;
        this.pageNumber = pageNumber;
    }

    @Override
    public List<T> getPage() {
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
