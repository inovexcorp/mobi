package com.mobi.workflows.impl.core.record;

/*-
 * #%L
 * com.mobi.workflows.impl.core
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.record.RecordService;
import com.mobi.exception.MobiException;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.ontologies.platformconfig.StateFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import com.mobi.workflows.api.record.AbstractWorkflowRecordService;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleWorkflowRecordService.class }
)
public class SimpleWorkflowRecordService extends AbstractWorkflowRecordService<WorkflowRecord> {
    private static final String FIND_PLATFORM_STATES_FOR_WORKFLOW_RECORD;
    ModelFactory mf = new DynamicModelFactory();

    static {
        try {
            FIND_PLATFORM_STATES_FOR_WORKFLOW_RECORD = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowRecordService.class
                            .getResourceAsStream("/find-platform-states-for-workflow-record.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public WorkflowRecordFactory workflowRecordFactory;

    @Reference
    StateFactory stateFactory;

    @Activate
    public void activate() {
        this.recordFactory = workflowRecordFactory;
    }

    @Override
    public Class<WorkflowRecord> getType() {
        return WorkflowRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return WorkflowRecord.TYPE;
    }

    @Override
    protected void deleteRecord(WorkflowRecord record, RepositoryConnection conn) {
        workflowManager.deleteTriggerService(record);
        deleteVersionedRDFData(record, conn);
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
        deleteWorkflowState(record, conn);
    }

    /**
     * Delete WorkflowRecord State.  Finds all state triples associated with a WorkflowRecord and removes them
     * from the repository.
     * @param record WorkflowRecord
     * @param conn RepositoryConnection
     */
    protected void deleteWorkflowState(WorkflowRecord record, RepositoryConnection conn) {
        List<Model> states = getAllStateModelsForRecord(record, conn);
        List<Statement> statementsToRemove = new ArrayList<>();
        for (Model stateModel: states) {
            statementsToRemove.addAll(stateModel);
        }
        conn.remove(statementsToRemove);
    }

    protected Set<Resource> getPlatformStateIds(WorkflowRecord record, RepositoryConnection conn) {
        Set<Resource> statePlatformIds = new HashSet<>();
        String query = FIND_PLATFORM_STATES_FOR_WORKFLOW_RECORD.replace("%RECORDIRI%",
                record.getResource().stringValue());
        TupleQuery stateQuery = conn.prepareTupleQuery(query);
        try (TupleQueryResult result = stateQuery.evaluate()) {
            result.forEach(bindings ->
                    statePlatformIds.add((Bindings.requiredResource(bindings, "state"))));
        }
        return statePlatformIds;
    }

    /**
     * Get ApplicationState and the ResourceModel of each ApplicationState as models.
     *
     * @param record WorkflowRecord
     * @param conn RepositoryConnection
     * @return List of all state models
     */
    protected List<Model> getAllStateModelsForRecord(WorkflowRecord record, RepositoryConnection conn) {
        Set<Resource> platformStateIds = getPlatformStateIds(record, conn);
        List<Model> states = new ArrayList<>();
        List<Model> stateResourceModels = new ArrayList<>();

        for (Resource recordId: platformStateIds) {
            Model model = QueryResults.asModel(conn.getStatements(recordId, null, null), mf);
            states.add(model);

            State state = stateFactory.getExisting(recordId, model).orElseThrow(()
                    -> new IllegalArgumentException("Record " + recordId + " does not exist"));
            for (Resource stateResourceId: state.getStateResource()) {
                Model stateResourceModel = QueryResults.asModel(conn.getStatements(stateResourceId, null, null), mf);
                stateResourceModels.add(stateResourceModel);
            }
        }
        states.addAll(stateResourceModels);
        return states;
    }
}
