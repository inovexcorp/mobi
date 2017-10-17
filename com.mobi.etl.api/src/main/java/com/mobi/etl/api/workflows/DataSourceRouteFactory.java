package com.mobi.etl.api.workflows;

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

import org.apache.camel.Endpoint;
import com.mobi.etl.api.ontologies.etl.DataSource;
import com.mobi.rdf.api.Resource;

public interface DataSourceRouteFactory<T extends DataSource> {

    /**
     * The Resource IRI of the type of DataSource this DataSourceRouteFactory supports.
     *
     * @return An IRI Resource of a DataSource type
     */
    Resource getTypeIRI();

    /**
     * The class of the type of DataSource this DataSourceRouteFactory supports.
     *
     * @return A DataSource type
     */
    Class<T> getType();

    /**
     * A Camel Endpoint that represents the configuration within the provided DataSource RDF. Endpoint will need
     * the CamelContext and Component set. Endpoint should produce MobiMessages with RDF.
     *
     * @param dataSource An ORM DataSource with configurations
     * @return A Camel Endpoint configured by the provided DataSource
     */
    Endpoint getEndpoint(T dataSource);
}
