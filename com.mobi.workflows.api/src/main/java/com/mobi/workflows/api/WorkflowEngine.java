package com.mobi.workflows.api;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import org.eclipse.rdf4j.model.Resource;

import java.util.List;

public interface WorkflowEngine {
    /**
     * Retrieves the engine's list of currently executing workflows.
     *
     * @return An array of {@link Resource} that represent the workflow id of the executing workflows
     */
    List<Resource> getExecutingWorkflows();

    /**
     * Checks whether the limit of concurrently running workflows has been hit.
     *
     * @return A boolean with a true value if the limit has been hit, and false otherwise.
     */
    boolean availableToRun();

    /**
     * Executes the provided {@link Workflow} entity, updating the provided {@link WorkflowExecutionActivity}.
     *
     * @param workflow A java pojo of the rdf representation of the workflow
     * @param activity A java pojo of the rdf representation of the execution activity to update
     */
    void startWorkflow(Workflow workflow, WorkflowExecutionActivity activity);
}
