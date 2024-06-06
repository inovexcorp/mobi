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

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.Map;
import java.util.Optional;
import java.util.Set;

public interface WorkflowManager {

    /**
     * Searches for Workflow records that match the provided {@link PaginatedWorkflowSearchParams}.
     * Only Workflow records that the provided user has Read permission for are returned.
     *
     * @param searchParams Search parameters.
     * @param requestUser The user to check record read permissions for
     * @return PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<ObjectNode> findWorkflowRecords(PaginatedWorkflowSearchParams searchParams,
                                                           User requestUser);

    /**
     * Verifies if any there are any previously existing {@link Trigger} in the additions graph associated with the
     * passed commit {@link IRI}.
     *
     * @param commitGraphId The {@link IRI} of the in progress commit of which to query for Trigger IRIs.
     * @param conn An existing {@link RepositoryConnection} to query.
     * @throws IllegalArgumentException If any of the associated triggers already exist within the system.
     */
    void checkTriggerExists(IRI commitGraphId, RepositoryConnection conn);

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
     * @param conn A RepositoryConnection to use for look up
     */
    void updateTriggerService(WorkflowRecord workflowRecord, Workflow oldWorkflow, RepositoryConnection conn);

    /**
     * Retrieves the workflow entity denoted by the passed iri.
     *
     * @param workflowId The {@link IRI} of the workflow to be retrieved
     * @return An optional of the {@link Workflow} entity if one exists
     */
    Optional<Workflow> getWorkflow(Resource workflowId);

    /**
     * Searches for WorkflowExecutionActivities that match the provided
     * {@link com.mobi.workflows.api.PaginatedWorkflowSearchParams}.
     *
     * @param workflowRecordIri Workflow Record IRI.
     * @param searchParams Search parameters.
     * @param requestUser The user to check record read permissions for.
     * @return PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<ObjectNode> findWorkflowExecutionActivities(Resource workflowRecordIri,
                                                                       PaginatedWorkflowSearchParams searchParams,
                                                                       User requestUser);

    /**
     * Retrieves the Workflow Execution Activity denoted by the passed IRI.
     *
     * @param executionId The {@link IRI} of the WorkflowExecutionActivity to be retrieved
     * @return An optional of the {@link WorkflowExecutionActivity} if one exists
     */
    Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId);

    /**
     * Returns the Action Executions related to the Workflow Execution Activity denoted by the passed IRI.
     *
     * @param executionId The {@link IRI} of the Workflow Execution Activity with Action Executions
     * @return A set of {@link ActionExecution} instances related to the Workflow Execution Activity
     */
    Set<ActionExecution> getActionExecutions(Resource executionId);

    /**
     * Retrieves the BinaryFile object identified by the provided IRI.
     *
     * @param logId the {@link IRI} of the log BinaryFile to be retrieved
     * @return A {@link BinaryFile} representing the identified log file
     * @throws IllegalArgumentException If the log file cannot be found
     */
    BinaryFile getLogFile(Resource logId);

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

    /**
     * Returns a {@link Map} of {@link com.mobi.workflows.api.ontologies.workflows.Trigger} subclass IRIs to the RDF
     * model of all the SHACL definitions for them.
     */
    Map<Resource, Model> getTriggerShaclDefinitions();

    /**
     * Returns a {@link Map} of {@link com.mobi.workflows.api.ontologies.workflows.Action} subclass IRIs to the RDF
     * model of all the SHACL definitions for them.
     */
    Map<Resource, Model> getActionShaclDefinitions();
}
