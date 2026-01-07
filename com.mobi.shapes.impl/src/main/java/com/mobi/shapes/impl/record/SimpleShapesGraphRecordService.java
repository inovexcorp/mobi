package com.mobi.shapes.impl.record;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import com.mobi.catalog.api.record.RecordService;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.platform.config.api.ontologies.platformconfig.State;
import com.mobi.platform.config.api.ontologies.platformconfig.StateFactory;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecordFactory;
import com.mobi.shapes.api.record.AbstractShapesGraphRecordService;
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

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;


@Component(
        immediate = true,
        service = { RecordService.class, SimpleShapesGraphRecordService.class }
)
public class SimpleShapesGraphRecordService extends AbstractShapesGraphRecordService<ShapesGraphRecord> {

    private static final String FIND_PLATFORM_STATES_FOR_SHAPE_GRAPH_RECORD;
    ModelFactory mf = new DynamicModelFactory();

    static {
        try {
            FIND_PLATFORM_STATES_FOR_SHAPE_GRAPH_RECORD = IOUtils.toString(
                    Objects.requireNonNull(SimpleShapesGraphRecordService.class
                            .getResourceAsStream("/find-platform-states-for-shape-record.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public ShapesGraphRecordFactory shapesGraphRecordFactory;

    @Reference
    StateFactory stateFactory;

    @Activate
    public void activate() {
        this.recordFactory = shapesGraphRecordFactory;
    }

    @Override
    public Class<ShapesGraphRecord> getType() {
        return ShapesGraphRecord.class;
    }

    @Override
    public String getTypeIRI() {
        return ShapesGraphRecord.TYPE;
    }

    @Override
    protected void deleteRecord(ShapesGraphRecord record, RepositoryConnection conn) {
        deleteVersionedRDFData(record, conn);
        deleteRecordObject(record, conn);
        deletePolicies(record, conn);
        deleteShapeGraphState(record, conn);
    }

    /**
     * Delete Ontology State.  When an OntologyRecord is deleted, all State data associated with that
     * Record is deleted from the application for all users.
     */
    protected void deleteShapeGraphState(ShapesGraphRecord record, RepositoryConnection conn) {
        List<Model> states = getAllStateModelsForRecord(record, conn);
        List<Statement> statementsToRemove = new ArrayList<>();
        for (Model stateModel: states) {
            statementsToRemove.addAll(stateModel);
        }
        conn.remove(statementsToRemove);
    }

    protected Set<Resource> getPlatformStateIds(ShapesGraphRecord record, RepositoryConnection conn) {
        Set<Resource> statePlatformIds = new HashSet<>();
        String query = FIND_PLATFORM_STATES_FOR_SHAPE_GRAPH_RECORD.replace("%RECORDIRI%",
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
    protected List<Model> getAllStateModelsForRecord(ShapesGraphRecord record, RepositoryConnection conn) {
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
