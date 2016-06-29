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

import org.matonto.catalog.api.Ontology;
import org.matonto.catalog.api.OntologyBuilder;
import org.matonto.rdf.api.Resource;

public class SimpleOntologyBuilder extends AbstractPublishedResourceBuilder<OntologyBuilder, Ontology>
        implements OntologyBuilder {

    public SimpleOntologyBuilder(Resource resource, String title) {
        this.resource = resource;
        this.title = title;
    }

    @Override
    protected OntologyBuilder getThis() {
        return this;
    }

    @Override
    public Ontology build() {
        setModified();
        return new SimpleOntology(this);
    }
}
