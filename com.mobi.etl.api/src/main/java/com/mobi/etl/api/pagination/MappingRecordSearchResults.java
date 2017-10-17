package com.mobi.etl.api.pagination;

/*-
 * #%L
 * com.mobi.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.ontologies.delimited.MappingRecordFactory;

import java.util.List;
import java.util.stream.Collectors;

public class MappingRecordSearchResults implements PaginatedSearchResults<MappingRecord> {
    private List<MappingRecord> page;
    private int pageSize;
    private int totalSize;
    private int pageNumber;

    public MappingRecordSearchResults(PaginatedSearchResults<Record> results, MappingRecordFactory factory) {
        this.pageSize = results.getPageSize();
        this.totalSize = results.getTotalSize();
        this.pageNumber = results.getPageNumber();
        this.page = results.getPage().stream()
                .map(record -> factory.getExisting(record.getResource(), record.getModel()).orElseThrow(() ->
                        new IllegalArgumentException("Provided results object did not contain a Mapping Record")))
                .collect(Collectors.toList());
    }

    @Override
    public List<MappingRecord> getPage() {
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
