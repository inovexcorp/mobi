package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.catalog.api.CatalogFactory;
import org.matonto.catalog.api.OntologyBuilder;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchParamsBuilder;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;

@Component
public class SimpleCatalogFactory implements CatalogFactory {

    private Resource ontologyType;
    private ValueFactory valueFactory;

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Activate
    protected void start() {
        ontologyType = valueFactory.createIRI("http://matonto.org/ontologies/catalog#Ontology");
    }

    @Override
    public OntologyBuilder createOntologyBuilder(Resource resource, String title) {
        return new SimpleOntologyBuilder(resource, title);
    }

    @Override
    public PaginatedSearchParamsBuilder createSearchParamsBuilder(int limit, int offset, Resource sortBy) {
        return new SimpleSearchParams.Builder(limit, offset, sortBy);
    }
}
