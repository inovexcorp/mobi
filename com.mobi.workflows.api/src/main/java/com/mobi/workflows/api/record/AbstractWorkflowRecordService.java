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

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.Semaphore;

public abstract class AbstractWorkflowRecordService <T extends WorkflowRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    private static final String WORKFLOW_ACTIONS_STATISTICS_QUERY;
    private static final String WORKFLOW_EXECUTIONS_STATISTICS_QUERY;
    private static final StatisticDefinition WORKFLOW_ACTIONS_STATISTIC_DEFINITION;
    private static final StatisticDefinition WORKFLOW_EXECUTIONS_STATISTIC_DEFINITION;
    private final Semaphore semaphore = new Semaphore(1, true);

    @Reference
    public WorkflowManager workflowManager;

    @Reference(target = "(id=prov)")
    public OsgiRepository provRepo;

    static {
        try {
            WORKFLOW_ACTIONS_STATISTICS_QUERY = IOUtils.toString(Objects.requireNonNull(
                    AbstractWorkflowRecordService.class.getResourceAsStream("/number-of-actions.rq")),
                    StandardCharsets.UTF_8);

            WORKFLOW_EXECUTIONS_STATISTICS_QUERY = IOUtils.toString(Objects.requireNonNull(
                    AbstractWorkflowRecordService.class.getResourceAsStream("/number-of-executions.rq")),
                    StandardCharsets.UTF_8);

            WORKFLOW_ACTIONS_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalNumberOfActions", "The number of actions the associated workflow contains");

            WORKFLOW_EXECUTIONS_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalNumberOfExecutions", "The number of workflow executions");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        MasterBranch masterBranch = createMasterBranch(record);
        File workflowFile = null;
        InitialLoad initialLoad = null;
        try {
            semaphore.acquire();
            workflowFile = createDataFile(config);
            IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("WorkflowRecord must have a master Branch"));
            initialLoad = loadHeadGraph(masterBranch, user, workflowFile);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), initialLoad.ipc(), conn);

            IRI additionsGraph = revisionManager.getGeneratedRevision(initialLoad.ipc())
                    .getAdditions()
                    .orElseThrow(() -> new IllegalStateException("Commit is missing additions graph"));
            setWorkflowToRecord(record, masterBranch, conn);
            workflowManager.checkTriggerExists(additionsGraph, conn);

            Resource initialCommitIRI = versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId,
                    user, "The initial commit.", conn);
            Commit initialCommit = commitManager.getCommit(initialCommitIRI, conn).orElseThrow(
                    () -> new IllegalStateException("Could not retrieve commit " + initialCommitIRI.stringValue()));
            initialCommit.setInitialRevision(initialLoad.initialRevision());
            initialCommit.getModel().addAll(initialLoad.initialRevision().getModel());
            thingManager.updateObject(initialCommit, conn);
            conn.commit();
            writePolicies(user, record);
            workflowFile.delete();
        } catch (Exception e) {
            Revision revision = null;
            if (initialLoad != null) {
                revision = initialLoad.initialRevision();
            }
            handleError(masterBranch, revision, workflowFile, e);
        } finally {
            semaphore.release();
        }
        return record;
    }

    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        Statistic actionsStatistic = getStatistic(recordId, conn, WORKFLOW_ACTIONS_STATISTICS_QUERY,
                WORKFLOW_ACTIONS_STATISTIC_DEFINITION);

        Statistic executionsStatistic;
        try (RepositoryConnection provConn = provRepo.getConnection()) {
            executionsStatistic = getStatistic(recordId, provConn, WORKFLOW_EXECUTIONS_STATISTICS_QUERY,
                    WORKFLOW_EXECUTIONS_STATISTIC_DEFINITION);
        }
        return List.of(actionsStatistic, executionsStatistic);
    }

    /**
     * Validates and sets the Workflow Record IRI to the WorkflowRecord.
     *
     * @param record       the WorkflowRecord to set the Workflow IRI
     * @param masterBranch masterBranch with the loaded file
     * @param conn         RepositoryConnection with the transaction
     */
    private void setWorkflowToRecord(T record, MasterBranch masterBranch, RepositoryConnection conn) {
        IRI headGraph = branchManager.getHeadGraph(masterBranch);
        Model workflowModel = QueryResults.asModel(conn.getStatements(null, RDF.TYPE,
                vf.createIRI(Workflow.TYPE), headGraph));

        Resource workflowIRI = workflowModel
                .filter(null, RDF.TYPE, vf.createIRI(Workflow.TYPE)).stream()
                .findFirst()
                .flatMap(statement -> Optional.of(statement.getSubject()))
                .orElseThrow(() -> new IllegalArgumentException("Workflow Record must have associated Workflow"));

        conn.add(workflowIRI,  RDF.TYPE, vf.createIRI(Workflow.TYPE), headGraph);

        if (workflowManager.workflowRecordIriExists(workflowIRI)) {
            throw new IllegalArgumentException("Workflow ID:  " + workflowIRI + " already exists.");
        }

        record.setWorkflowIRI(workflowIRI);
        record.setActive(false);
        thingManager.updateObject(record, conn);
    }

}
