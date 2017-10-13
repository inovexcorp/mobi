package com.mobi.dataset.pagination;

/*-
 * #%L
 * com.mobi.dataset.api
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

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

public class DatasetPaginatedSearchParams {
    private PaginatedSearchParams.Builder builder;

    public DatasetPaginatedSearchParams(ValueFactory valueFactory) {
        builder = new PaginatedSearchParams.Builder().typeFilter(valueFactory.createIRI(DatasetRecord.TYPE));
    }

    public DatasetPaginatedSearchParams setOffset(int offset) {
        builder.offset(offset);
        return this;
    }

    public DatasetPaginatedSearchParams setLimit(int limit) {
        builder.limit(limit);
        return this;
    }

    public DatasetPaginatedSearchParams setSortBy(Resource sortBy) {
        builder.sortBy(sortBy);
        return this;
    }

    public DatasetPaginatedSearchParams setSearchText(String searchText) {
        builder.searchText(searchText);
        return this;
    }

    public DatasetPaginatedSearchParams setAscending(boolean ascending) {
        builder.ascending(ascending);
        return this;
    }

    public PaginatedSearchParams build() {
        return builder.build();
    }
}
