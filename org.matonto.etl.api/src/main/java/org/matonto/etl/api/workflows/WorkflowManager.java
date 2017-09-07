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

import org.matonto.etl.api.ontologies.etl.Workflow;
import org.matonto.rdf.api.Resource;

import java.util.Optional;
import java.util.Set;

public interface WorkflowManager {

    /**
     * Returns the name of the CamelContext that runs Workflow Routes. This can be used to pull statistics
     * about the CamelContext and its Routes using a CamelController.
     *
     * @return the name of the Workflow CamelContext
     */
    String getContextName();

    /**
     * Returns a Set of Workflow that have been deployed.
     *
     * @return A Set of deployed Workflows
     */
    Set<Workflow> getWorkflows();

    /**
     * Creates Routes based on the configuration in the Workflow RDF. Should include all referenced DataSources,
     * Processors, and Destinations along with rdf:Lists describing the Routes to be created.
     *
     * @param workflow a Workflow containing route definitions of DataSources, Processors, and Destinations
     */
    void addWorkflow(Workflow workflow);

    Optional<Workflow> getWorkflow(Resource workflowIRI);

    /**
     * Starts all Routes associated with the Workflow identified by the provided Resource IRI.
     *
     * @param workflowIRI A Resource IRI identifying a Workflow
     * @throws IllegalArgumentException if the provided Resource does not match a deployed Workflow
     */
    void startWorkflow(Resource workflowIRI);

    /**
     * Stops all Routes associated with the Workflow identified by the provided Resource IRI.
     *
     * @param workflowIRI A Resource IRI identifying a Workflow
     * @throws IllegalArgumentException if the provided Resource does not match a deployed Workflow
     */
    void stopWorkflow(Resource workflowIRI);
}
