package com.mobi.workflows.impl.core.versioning;

/*-
 * #%L
 * com.mobi.workflows.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.BaseVersioningService;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.EventAdmin;

import java.util.Map;
import java.util.Optional;
import javax.annotation.Nullable;

@Component(
        immediate = true,
        service = { VersioningService.class, WorkflowRecordVersioningService.class }
)
public class WorkflowRecordVersioningService extends BaseVersioningService<WorkflowRecord> {
    @Reference
    protected WorkflowRecordFactory workflowRecordFactory;

    @Reference
    protected WorkflowFactory workflowFactory;

    @Reference
    protected WorkflowManager workflowManager;

    @Reference
    RecordManager recordManager;

    @Activate
    void start(BundleContext context) {
        final ServiceReference<EventAdmin> ref = context.getServiceReference(EventAdmin.class);
        if (ref != null) {
            this.eventAdmin = context.getService(ref);
        }
    }

    @Override
    public String getTypeIRI() {
        return WorkflowRecord.TYPE;
    }

    @Override
    public Resource addMasterCommit(VersionedRDFRecord record, MasterBranch branch, User user, String message,
                                    RepositoryConnection conn) {
        WorkflowRecord workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(),
                record.getResource(), workflowRecordFactory, conn);

        // Fetching this before commit is made to avoid transaction conflict when adding new data affects the head graph
        Workflow workflow = getCurrentWorkflow(convertRecord(record), branch, conn);

        Resource commitIRI = super.addMasterCommit(workflowRecord, branch, user, message, conn);
        validateAndUpdateTrigger(workflowRecord, workflow, commitIRI, conn);
        return commitIRI;
    }

    @Override
    public Resource mergeIntoMaster(VersionedRDFRecord record, Branch sourceBranch, MasterBranch targetBranch,
                                    User user, Model additions, Model deletions, Map<Resource, Conflict> conflictMap,
                                    RepositoryConnection conn) {
        WorkflowRecord workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(),
                record.getResource(), workflowRecordFactory, conn);

        // Fetching this before commit is made to avoid transaction conflict when adding new data affects the head graph
        Workflow workflow = getCurrentWorkflow(convertRecord(record), targetBranch, conn);

        Resource commitIRI = super.mergeIntoMaster(workflowRecord, sourceBranch, targetBranch, user, additions,
                deletions, conflictMap, conn);
        validateAndUpdateTrigger(workflowRecord, workflow, commitIRI, conn);
        return commitIRI;
    }

    protected void validateAndUpdateTrigger(WorkflowRecord workflowRecord, @Nullable Workflow oldWorkflow,
                                                Resource commitIRI, RepositoryConnection conn) {
        workflowManager.validateWorkflow(compiledResourceManager.getCompiledResource(commitIRI, conn));
        if (oldWorkflow != null) {
            workflowManager.updateTriggerService(workflowRecord, oldWorkflow, conn);
        }
    }

    @Override
    protected void updateMasterRecordIRI(VersionedRDFRecord record, Commit commit, RepositoryConnection conn) {
        Resource headGraph = branchManager.getHeadGraph(
                branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(), record.getResource(), conn));
        Model currentIRIs = QueryResults.asModel(
                conn.getStatements(null, RDF.TYPE, vf.createIRI(Workflow.TYPE), headGraph));
        if (currentIRIs.isEmpty()) {
            throw new IllegalStateException("Workflow does not contain a workflow definition");
        }
        // Done so the model of the passed object to updated for further processing
        WorkflowRecord workflowRecord = convertRecord(record);
        Resource existingWorkflowIRI = workflowRecord.getWorkflowIRI()
                .orElseThrow(() -> new IllegalStateException("WorkflowRecord " + workflowRecord.getResource()
                        + " does not have an ontologyIRI"));
        Resource currentWorkflowIRI = currentIRIs.stream().findFirst().get().getSubject();

        if (!currentWorkflowIRI.equals(existingWorkflowIRI)) {
            assertWorkflowUniqueness(currentWorkflowIRI);
            workflowRecord.setWorkflowIRI(currentWorkflowIRI);
            thingManager.updateObject(record, conn);
        }
    }

    private void assertWorkflowUniqueness(Resource workflowId) {
        if (workflowManager.workflowRecordIriExists(workflowId)) {
            throw new IllegalArgumentException("Workflow ID: " + workflowId + " already exists.");
        }
    }

    private Workflow getCurrentWorkflow(WorkflowRecord record, MasterBranch branch, RepositoryConnection conn) {
        Workflow workflow = null;
        Optional<Resource> headCommit = branch.getHead_resource();
        if (headCommit.isPresent()) {
            Resource workflowIRI = record.getWorkflowIRI().orElseThrow(() ->
                    new IllegalArgumentException("Workflow Records must have linked workflow"));
            Model workflowModel = compiledResourceManager.getCompiledResource(headCommit.get(), conn);
            workflow = workflowFactory.getExisting(workflowIRI, workflowModel).orElseThrow(() ->
                    new IllegalArgumentException("Workflow " + workflowIRI + " does not exist"));
        }
        return workflow;
    }

    private WorkflowRecord convertRecord(VersionedRDFRecord record) {
        return workflowRecordFactory.getExisting(record.getResource(), record.getModel())
                .orElseThrow(() -> new IllegalStateException("Record expected to be of type WorkflowRecord"));
    }
}
