package com.mobi.ontology.impl.core.record;

/*-
 * #%L
 * com.mobi.ontology.impl.core
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

import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.ontology.core.api.record.AbstractOntologyRecordService;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.ontologies.platformconfig.StateFactory;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Objects;
import java.util.Set;

@Component(
        immediate = true,
        service = { RecordService.class, SimpleOntologyRecordService.class }
)
public class SimpleOntologyRecordService extends AbstractOntologyRecordService<OntologyRecord> {
    private final Logger log = LoggerFactory.getLogger(SimpleOntologyRecordService.class);
    private static final ModelFactory mf = new DynamicModelFactory();
    private static final String FIND_PLATFORM_STATES_FOR_ONTOLOGY_RECORD;

    static {
        try {
            FIND_PLATFORM_STATES_FOR_ONTOLOGY_RECORD = IOUtils.toString(
                    Objects.requireNonNull(SimpleOntologyRecordService.class
                            .getResourceAsStream("/find-platform-states-for-ontology-record.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public OntologyCache ontologyCache;

    @Reference
    public OntologyRecordFactory ontologyRecordFactory;

    @Reference
    StateFactory stateFactory;

    @Activate
    public void activate() {
        this.recordFactory = ontologyRecordFactory;
        checkForMissingPolicies();
    }

    @Override
    public Class<OntologyRecord> getType() {
        return OntologyRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return OntologyRecord.TYPE;
    }

    @Override
    protected void deleteRecord(OntologyRecord record, RepositoryConnection conn) {
        final long start = getStartTime();
        deleteVersionedRDFData(record, conn);
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
        clearOntologyCache(record);
        deleteOntologyState(record, conn);
        logTrace("deleteOntology(recordId)", start);
    }

    /**
     * Delete Ontology State.  When an OntologyRecord is deleted, all State data associated with that
     * Record is deleted from the application for all users.
     */
    protected void deleteOntologyState(OntologyRecord record, RepositoryConnection conn){
        long start = getStartTime();
        List<Model> states = getAllStateModelsForRecord(record, conn);
        List<Statement> statementsToRemove = new ArrayList<>();
        for (Model stateModel: states) {
            statementsToRemove.addAll(stateModel);
        }
        conn.remove(statementsToRemove);
        logTrace("deleteOntologyState(OntologyRecord, RepositoryConnection)", start);
    }

    @Override
    public Optional<List<Resource>> deleteBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                                RepositoryConnection conn) {
        long start = getStartTime();
        Optional<List<Resource>> deletedCommits = super.deleteBranch(catalogId, versionedRDFRecordId, branchId, conn);
        deletedCommits.ifPresent(list -> list.forEach(resource ->
                ontologyCache.removeFromCache(versionedRDFRecordId.stringValue(), resource.stringValue())));
        logTrace("deleteBranch(catalogId, versionedRDFRecordId, branchId, RepositoryConnection)", start);
        return deletedCommits;
    }

    protected Set<Resource> getPlatformStateIds(OntologyRecord record, RepositoryConnection conn) {
        Set<Resource> statePlatformIds = new HashSet<>();
        String query = FIND_PLATFORM_STATES_FOR_ONTOLOGY_RECORD.replace("%RECORDIRI%",
                record.getResource().stringValue());
        TupleQuery stateQuery = conn.prepareTupleQuery(query);
        stateQuery.evaluate().forEach(bindings ->
                statePlatformIds.add((Bindings.requiredResource(bindings, "state"))));
        return statePlatformIds;
    }

    /**
     * Get ApplicationState and the ResourceModel of each ApplicationState as models
     * @param record OntologyRecord
     * @param conn RepositoryConnection
     * @return List<Model> all state models
     */
    protected List<Model> getAllStateModelsForRecord(OntologyRecord record, RepositoryConnection conn) {
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

    /**
     * Clears cached ontologies related to the provided {@link OntologyRecord} and clears other cached ontologies that
     * import the {@link OntologyRecord}.
     *
     * @param record The {@link OntologyRecord} to remove from the OntologyCache
     */
    protected void clearOntologyCache(OntologyRecord record) {
        ontologyCache.clearCache(record.getResource());
        record.getOntologyIRI().ifPresent(ontologyCache::clearCacheImports);
    }

    private long getStartTime() {
        return log.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (log.isTraceEnabled()) {
            log.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}
