package com.mobi.shapes.api.record;

/*-
 * #%L
 * com.mobi.shapes.api
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
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.Semaphore;

public abstract class AbstractShapesGraphRecordService<T extends ShapesGraphRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    private static final String NODESHAPES_STATISTIC_QUERY;
    private static final String IMPORTS_STATISTIC_QUERY;
    private static final StatisticDefinition NODESHAPES_STATISTIC_DEFINITION;
    private static final StatisticDefinition IMPORTS_STATISTIC_DEFINITION;

    @Reference
    public ShapesGraphManager shapesGraphManager;

    /**
     * Semaphore for protecting shapes graph IRI uniqueness checks.
     */
    private final Semaphore semaphore = new Semaphore(1, true);

    public static final String DEFAULT_PREFIX = "http://mobi.com/ontologies/shapes-graph/";

    static {
        try {
            NODESHAPES_STATISTIC_QUERY = IOUtils.toString(Objects.requireNonNull(AbstractShapesGraphRecordService.class
                    .getResourceAsStream("/total-node-shapes.rq")), StandardCharsets.UTF_8);

            IMPORTS_STATISTIC_QUERY = IOUtils.toString(Objects.requireNonNull(AbstractShapesGraphRecordService.class
                    .getResourceAsStream("/total-source-ontologies.rq")), StandardCharsets.UTF_8);

            NODESHAPES_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalNodeShapes", "The total number of node shapes in the shapes graph.");
            IMPORTS_STATISTIC_DEFINITION = new StatisticDefinition(
                    "totalImports", "The total number of ontologies imported into the shapes graph.");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        MasterBranch masterBranch = createMasterBranch(record);
        InitialLoad initialLoad = null;
        File shaclFile = null;
        try {
            semaphore.acquire();
            shaclFile = createDataFile(config);
            IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("ShaclRecord must have a master Branch"));
            initialLoad = loadHeadGraph(masterBranch, user, shaclFile);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), initialLoad.ipc(), conn);

            setShapesGraphToRecord(record, masterBranch, conn);

            Resource initialCommitIRI = versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId,
                    user, "The initial commit.", conn);
            Commit initialCommit = commitManager.getCommit(initialCommitIRI, conn).orElseThrow(
                    () -> new IllegalStateException("Could not retrieve commit " + initialCommitIRI.stringValue()));
            initialCommit.setInitialRevision(initialLoad.initialRevision());
            initialCommit.getModel().addAll(initialLoad.initialRevision().getModel());
            thingManager.updateObject(initialCommit, conn);

            conn.commit();
            writePolicies(user, record);
            shaclFile.delete();
        } catch (Exception e) {
            Revision revision = null;
            if (initialLoad != null) {
                revision = initialLoad.initialRevision();
            }
            handleError(masterBranch, revision, shaclFile, e);
        } finally {
            semaphore.release();
        }
        return record;
    }

    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        return List.of(
          getStatistic(recordId, conn, NODESHAPES_STATISTIC_QUERY, NODESHAPES_STATISTIC_DEFINITION),
          getStatistic(recordId, conn, IMPORTS_STATISTIC_QUERY, IMPORTS_STATISTIC_DEFINITION)
        );
    }

    /**
     * Validates and sets the shapes graph IRI to the ShaclRecord.
     *
     * @param record       the ShaclRecord to set the shapes graph IRI
     * @param masterBranch inProgressCommit with the loaded file
     * @param conn         RepositoryConnection with the transaction
     */
    private void setShapesGraphToRecord(T record, MasterBranch masterBranch, RepositoryConnection conn) {
        IRI headGraph = branchManager.getHeadGraph(masterBranch);
        Model shaclModel = QueryResults.asModel(conn.getStatements(null, RDF.TYPE, OWL.ONTOLOGY, headGraph));
        Model ontologyDefinitions = mf.createEmptyModel();
        shaclModel.subjects().stream()
                .map(iri -> QueryResults.asModel(conn.getStatements(iri, null, null, headGraph)))
                .forEach(ontologyDefinitions::addAll);

        Resource ontologyIRI = OntologyModels.findFirstOntologyIRI(ontologyDefinitions)
                .orElse(vf.createIRI(DEFAULT_PREFIX + UUID.randomUUID()));

        conn.add(ontologyIRI,  RDF.TYPE, OWL.ONTOLOGY, headGraph);

        validateShapesGraph(ontologyIRI);
        record.setShapesGraphIRI(ontologyIRI);
        thingManager.updateObject(record, conn);
    }

    /**
     * Checks shapesGraphManager to ensure the new shapes graph ID doesn't already exist.
     *
     * @param shapesGraphId the shapes graph ID of the new SHACL Record
     */
    private void validateShapesGraph(Resource shapesGraphId) {
        if (shapesGraphManager.shapesGraphIriExists(shapesGraphId)) {
            throw new IllegalArgumentException("Shapes Graph ID:  " + shapesGraphId + " already exists.");
        }
    }
}
