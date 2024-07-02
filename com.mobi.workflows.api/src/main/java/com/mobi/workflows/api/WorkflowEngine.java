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

import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import org.eclipse.rdf4j.model.IRI;
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
     * Creates a log file in the configured directory that holds the stacktrace of the exception that caused the
     * workflow to fail.
     *
     * @param activity The executing {@link WorkflowExecutionActivity} that has failed with an exception.
     * @param sha1WorkflowIRI A string representing the hashed value of the Workflows {@link IRI}.
     * @param error The String representation of the stacktrace of the exception that caused the execution to fail.
     * @return An {@link BinaryFile} that holds the stacktrace details and should be attached to the execution activity.
     */
     BinaryFile createErrorLog(WorkflowExecutionActivity activity, String sha1WorkflowIRI, String error);

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

    /**
     * Adds the metadata on a WorkflowExecutionActivity that signifies that the activity has ended and whether the
     * activity has failed or not.
     *
     * @param executionActivity The {@link WorkflowExecutionActivity} activity to be ended.
     * @param logs The {@link BinaryFile} containing the logs for the execution activity. Can be null.
     * @param succeeded Indicates whether the workflow execution succeeded or not.
     */
    void endExecutionActivity(WorkflowExecutionActivity executionActivity, BinaryFile logs, boolean succeeded);
}
