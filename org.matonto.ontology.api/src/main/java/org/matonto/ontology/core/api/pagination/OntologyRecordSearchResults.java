package org.matonto.ontology.core.api.pagination;

/*-
 * #%L
 * org.matonto.ontology.api
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
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;

import java.util.List;
import java.util.stream.Collectors;

public class OntologyRecordSearchResults implements PaginatedSearchResults<OntologyRecord> {
    private List<OntologyRecord> page;
    private int pageSize;
    private int totalSize;
    private int pageNumber;

    public OntologyRecordSearchResults(PaginatedSearchResults<Record> results, OntologyRecordFactory factory) {
        this.pageSize = results.getPageSize();
        this.totalSize = results.getTotalSize();
        this.pageNumber = results.getPageNumber();
        this.page = results.getPage().stream()
                .map(record -> factory.getExisting(record.getResource(), record.getModel()).orElseThrow(() ->
                        new IllegalArgumentException("Provided results object did not contain an Ontology Record")))
                .collect(Collectors.toList());
    }

    @Override
    public List<OntologyRecord> getPage() {
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
