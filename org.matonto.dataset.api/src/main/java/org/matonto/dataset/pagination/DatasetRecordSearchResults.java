package org.matonto.dataset.pagination;

/*-
 * #%L
 * org.matonto.dataset.api
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

import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;

import java.util.List;
import java.util.stream.Collectors;

public class DatasetRecordSearchResults implements PaginatedSearchResults<DatasetRecord> {

    private PaginatedSearchResults<Record> results;
    private DatasetRecordFactory factory;

    public DatasetRecordSearchResults(PaginatedSearchResults<Record> results, DatasetRecordFactory factory) {
        this.results = results;
        this.factory = factory;
    }

    @Override
    public List<DatasetRecord> getPage() {
        return results.getPage().stream()
                .map(record -> factory.getExisting(record.getResource(), record.getModel()))
                .collect(Collectors.toList());
    }

    @Override
    public int getTotalSize() {
        return results.getTotalSize();
    }

    @Override
    public int getPageSize() {
        return results.getPageSize();
    }

    @Override
    public int getPageNumber() {
        return results.getPageNumber();
    }
}
