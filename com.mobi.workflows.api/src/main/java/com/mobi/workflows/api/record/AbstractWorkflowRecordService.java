package com.mobi.workflows.api.record;

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

import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.concurrent.Semaphore;

public abstract class AbstractWorkflowRecordService <T extends WorkflowRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    @Reference
    public WorkflowManager workflowManager;

    private final Semaphore semaphore = new Semaphore(1, true);

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        Branch masterBranch = createMasterBranch(record);
        InProgressCommit commit = null;
        File workflowFile = null;
        try {
            semaphore.acquire();
            workflowFile = createDataFile(config);
            IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("WorkflowRecord must have a master Branch"));
            commit = loadInProgressCommit(user, workflowFile);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), commit, conn);

            setWorkflowToRecord(record, commit, conn);

            versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId, user,
                    "The initial commit.", conn);
            conn.commit();
            writePolicies(user, record);
            workflowFile.delete();
        } catch (InterruptedException e) {
            throw new MobiException(e);
        } catch (Exception e) {
            handleError(commit, workflowFile, e);
        } finally {
            semaphore.release();
        }
        return record;
    }

    /**
     * Validates and sets the Workflow Record IRI to the WorkflowRecord.
     *
     * @param record the WorkflowRecord to set the Workflow IRI
     * @param inProgressCommit inProgressCommit with the loaded file
     * @param conn RepositoryConnection with the transaction
     */
    private void setWorkflowToRecord(T record, InProgressCommit inProgressCommit, RepositoryConnection conn) {
        IRI additionsGraph = getRevisionGraph(inProgressCommit, true);
        Model workflowModel = QueryResults.asModel(conn.getStatements(null, RDF.TYPE,
                valueFactory.createIRI(Workflow.TYPE), additionsGraph));

        Resource workflowIRI = workflowModel
                .filter(null, RDF.TYPE, valueFactory.createIRI(Workflow.TYPE)).stream()
                .findFirst()
                .flatMap(statement -> Optional.of(statement.getSubject()))
                .orElseThrow(() -> new IllegalArgumentException("Workflow Record must have associated Workflow"));

        conn.add(workflowIRI,  RDF.TYPE, valueFactory.createIRI(Workflow.TYPE), additionsGraph);

        if (workflowManager.workflowRecordIriExists(workflowIRI)) {
            throw new IllegalArgumentException("Workflow ID:  " + workflowIRI + " already exists.");
        }

        record.setWorkflowIRI(workflowIRI);
        record.setActive(false);
        thingManager.updateObject(record, conn);
    }

}
