package org.matonto.etl.api.workflows;

/*-
 * #%L
 * org.matonto.etl.api
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

import org.matonto.etl.api.ontologies.etl.Processor;
import org.matonto.rdf.api.Resource;

public interface ProcessorRouteFactory<T extends Processor> {

    /**
     * The Resource IRI of the type of Processor this ProcessorRouteFactory supports.
     *
     * @return An IRI Resource of a Processor type
     */
    Resource getTypeIRI();

    /**
     * The class of the type of Processor this ProcessorRouteFactory supports.
     *
     * @return A Processor type
     */
    Class<T> getType();

    /**
     * A Camel Processor that represents the configuration within the provided Processor RDF.
     *
     * @param processor An ORM Processor with configurations
     * @return A Camel Processor configured by the provided Processor
     */
    org.apache.camel.Processor getProcessor(T processor);
}
