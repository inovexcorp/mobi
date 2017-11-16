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

import org.apache.camel.CamelContext;
import org.apache.camel.Endpoint;
import com.mobi.etl.api.ontologies.etl.Destination;
import com.mobi.rdf.api.Resource;

public interface DestinationRouteFactory<T extends Destination> {

    /**
     * The Resource IRI of the type of Destination this DestinationRouteFactory supports.
     *
     * @return An IRI Resource of a Destination type
     */
    Resource getTypeIRI();

    /**
     * The class of the type of Destination this DestinationRouteFactory supports.
     *
     * @return A Destination type
     */
    Class<T> getType();

    /**
     * Returns a Camel Endpoint that represents the configuration within the provided Destination RDF. Endpoint will be
     * added to the provided CamelContext and will need a Component set.
     *
     * @param context A CamelContext to add the Destination Endpoint to
     * @param destination An ORM Destination with configurations
     * @return A Camel Endpoint configured by the provided Destination
     */
    Endpoint getEndpoint(CamelContext context, T destination);
}
