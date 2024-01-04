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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import javax.ws.rs.core.StreamingOutput;

public interface WorkflowManager {

    /**
     * Creates a trigger service for the workflow linked to the passed in {@link WorkflowRecord}.
     *
     * @param workflowRecord the {@link WorkflowRecord} Object linked to the workflow of which to create a trigger
     *                       service.
     */
    void createTriggerService(WorkflowRecord workflowRecord);

    /**
     * Deletes a previously created trigger service for the workflow linked to the passed in {@link WorkflowRecord}.
     *
     * @param workflowRecord the {@link WorkflowRecord} Object linked to the workflow of which to delete a trigger
     *                       service.
     */
    void deleteTriggerService(WorkflowRecord workflowRecord);

    /**
     * Updates the trigger services linked to a workflow and performs cleanup actions.
     *
     * @param workflowRecord the {@link Workflow} for which trigger services need updating
     */
    void updateTriggerService(WorkflowRecord workflowRecord, Workflow oldWorkflow);

    /**
     * Retrieves the workflow entity denoted by the passed iri.
     *
     * @param workflowId The {@link IRI} of the workflow to be retrieved
     * @return An optional of the {@link Workflow} entity if one exists
     */
    Optional<Workflow> getWorkflow(Resource workflowId);

    /**
     * Retrieves the workflow execution activity denoted by the passed iri.
     *
     * @param executionId The {@link IRI} of the execution activity to be retrieved
     * @return An optional of the {@link WorkflowExecutionActivity} if one exists
     */
    Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId);

    /**
     * Retrieves the contents of a log file as an output stream.
     *
     * @param logId the {@link IRI} of the log BinaryFile to be retrieved
     * @return An {@link java.io.OutputStream} of the content of the log file if one exists
     * @throws IllegalArgumentException If the log file cannot be found
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    StreamingOutput getLogFile(Resource logId) throws VirtualFilesystemException;

    /**
     * Retrieves the contents of a log file as an output stream.
     *
     * @param binaryFile The java pojo representing the log file of whose contents will be retrieved
     * @return An {@link java.io.OutputStream} of the content of the log file if one exists
     * @throws VirtualFilesystemException If there is an issue resolving the virtual file abstraction
     */
    StreamingOutput getLogFile(BinaryFile binaryFile) throws VirtualFilesystemException;

    /**
     * Executes the workflow and subsequent actions attached to the {@link WorkflowRecord}.
     *
     * @param user The user that the {@link WorkflowExecutionActivity} should be linked to
     * @param workflowRecord The {@link WorkflowRecord} of which the workflow to be started is linked
     * @return The {@link IRI} of the created workflow execution activity
     */
    Resource startWorkflow(User user, WorkflowRecord workflowRecord);

    /**
     * Checks to ensure the {@link IRI} of the workflow is not already linked to a {@link WorkflowRecord}.
     *
     * @param workflowId the {@link IRI} of the workflow JSON-LD to be validated against
     */
    boolean workflowRecordIriExists(Resource workflowId);

    /**
     * Validates the passed workflow model for SHACL validity.
     *
     * @param workflowModel The workflow model to be validated
     */
    void validateWorkflow(Model workflowModel);
}
