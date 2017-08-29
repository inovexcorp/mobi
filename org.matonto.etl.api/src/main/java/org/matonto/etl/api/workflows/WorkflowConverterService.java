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

import org.apache.camel.builder.RouteBuilder;
import org.matonto.etl.api.ontologies.etl.Workflow;

public interface WorkflowConverterService {
    /**
     * Converts the Workflow RDF configuration into Routes within a RouteBuilder for the purpose of adding them to a
     * CamelContext. Should include all referenced DataSources, Processors, and Destinations along with rdf:Lists
     * describing the Routes to be created.
     *
     * @param workflow a Workflow containing route definitions of DataSources, Processors, and Destinations
     * @return A RouteBuilder containing Routes configured by the Workflow RDF
     */
    RouteBuilder convert(Workflow workflow);
}
