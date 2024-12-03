package com.mobi.ontology.core.api.record;

/*-
 * #%L
 * com.mobi.ontology.api
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
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
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
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
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
import java.util.Optional;
import java.util.concurrent.Semaphore;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    /**
     * Semaphore for protecting ontology IRI uniqueness checks.
     */
    private final Semaphore semaphore = new Semaphore(1, true);

    private static final String STATISTIC_ANNOTATION_PROPERTIES;
    private static final String STATISTIC_CLASSES;
    private static final String STATISTIC_DATATYPE_PROPERTIES;
    private static final String STATISTIC_INDIVIDUAL_PROPERTIES;
    private static final String STATISTIC_NUMBER_OF_USAGES;
    private static final String STATISTIC_OBJECT_PROPERTIES;
    private static final String STATISTIC_ONTOLOGY_IMPORT;
    private static final StatisticDefinition DEFINITION_ANNOTATION_PROPERTIES;
    private static final StatisticDefinition DEFINITION_CLASSES;
    private static final StatisticDefinition DEFINITION_DATATYPE_PROPERTIES;
    private static final StatisticDefinition DEFINITION_INDIVIDUAL_PROPERTIES;
    private static final StatisticDefinition DEFINITION_NUMBER_OF_USAGES;
    private static final StatisticDefinition DEFINITION_OBJECT_PROPERTIES;
    private static final StatisticDefinition DEFINITION_ONTOLOGY_IMPORTS;

    static {
        try {
            STATISTIC_ANNOTATION_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/annotation-properties.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_ANNOTATION_PROPERTIES = new StatisticDefinition(
                    "totalAnnotationProperties",
                    "The number of unique annotation properties (e.g., comments, labels) defined in the ontology."
            );
            STATISTIC_CLASSES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/classes.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_CLASSES = new StatisticDefinition(
                    "totalClasses",
                    "The number of unique classes defined in the ontology."
            );
            STATISTIC_DATATYPE_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/datatype-properties.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_DATATYPE_PROPERTIES = new StatisticDefinition(
                    "totalDatatypeProperties",
                    "The number of unique datatype properties (e.g., strings, integers) defined in the ontology."
            );
            STATISTIC_INDIVIDUAL_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/individual-properties.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_INDIVIDUAL_PROPERTIES = new StatisticDefinition(
                    "totalIndividuals",
                    "The number of unique individuals (e.g., instances of classes) defined in the ontology."
            );
            STATISTIC_NUMBER_OF_USAGES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/number-of-usages.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_NUMBER_OF_USAGES = new StatisticDefinition(
                    "numberOfUsages",
                    "The number of other ontologies that import the current ontology."
            );
            STATISTIC_OBJECT_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/object-properties.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_OBJECT_PROPERTIES = new StatisticDefinition(
                    "totalObjectProperties",
                    "The number of unique object properties (e.g., relationships between classes) defined in the ontology."
            );
            STATISTIC_ONTOLOGY_IMPORT = IOUtils.toString(
                    Objects.requireNonNull(AbstractOntologyRecordService.class
                            .getResourceAsStream("/statistic/ontology-import.rq")),
                    StandardCharsets.UTF_8
            );
            DEFINITION_ONTOLOGY_IMPORTS = new StatisticDefinition(
                    "ontologyImports",
                    "The number of unique ontologies that are imported by the current ontology."
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    public OntologyManager ontologyManager;

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified);
        MasterBranch masterBranch = createMasterBranch(record);
        File ontologyFile = null;
        InitialLoad initialLoad = null;
        try {
            semaphore.acquire();
            ontologyFile = createDataFile(config);
            IRI catalogIdIRI = vf.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            initialLoad = loadHeadGraph(masterBranch, user, ontologyFile);

            conn.begin();
            addRecord(record, masterBranch, conn);
            commitManager.addInProgressCommit(catalogIdIRI, record.getResource(), initialLoad.ipc(), conn);

            setOntologyToRecord(record, masterBranch, initialLoad.initialRevision(), conn);

            Resource initialCommitIRI = versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId, user,
                    "The initial commit.", conn);
            Commit initialCommit = commitManager.getCommit(initialCommitIRI, conn).orElseThrow(
                    () -> new IllegalStateException("Could not retrieve commit " + initialCommitIRI.stringValue()));
            initialCommit.setInitialRevision(initialLoad.initialRevision());
            initialCommit.getModel().addAll(initialLoad.initialRevision().getModel());
            thingManager.updateObject(initialCommit, conn);

            conn.commit();
            writePolicies(user, record);
            ontologyFile.delete();
        } catch (Exception e) {
            Revision revision = null;
            if (initialLoad != null) {
                revision = initialLoad.initialRevision();
            }
            handleError(masterBranch, revision, ontologyFile, e);
        } finally {
            semaphore.release();
        }
        return record;
    }
    
    @Override
    public List<Statistic> getStatistics(Resource recordId, RepositoryConnection conn) {
        return List.of(
            getStatistic(recordId, conn, STATISTIC_CLASSES, DEFINITION_CLASSES),
            getStatistic(recordId, conn, STATISTIC_ANNOTATION_PROPERTIES, DEFINITION_ANNOTATION_PROPERTIES),
            getStatistic(recordId, conn, STATISTIC_DATATYPE_PROPERTIES, DEFINITION_DATATYPE_PROPERTIES),
            getStatistic(recordId, conn, STATISTIC_OBJECT_PROPERTIES, DEFINITION_OBJECT_PROPERTIES),
            getStatistic(recordId, conn, STATISTIC_INDIVIDUAL_PROPERTIES, DEFINITION_INDIVIDUAL_PROPERTIES),
            getStatistic(recordId, conn, STATISTIC_ONTOLOGY_IMPORT, DEFINITION_ONTOLOGY_IMPORTS),
            getStatistic(recordId, conn, STATISTIC_NUMBER_OF_USAGES, DEFINITION_NUMBER_OF_USAGES)
        );
    }

    /**
     * Validates and sets the ontology to the record.
     *
     * @param record       created record
     * @param masterBranch the {@link InProgressCommit} to query for the ontologyIRI
     * @param initialRevision the initial {@link Revision}
     * @param conn         The {@link RepositoryConnection} with the transaction for creating the record
     */
    private void setOntologyToRecord(T record, MasterBranch masterBranch, Revision initialRevision,
                                     RepositoryConnection conn) {
        IRI headGraph = branchManager.getHeadGraph(masterBranch);
        Model ontology = QueryResults.asModel(conn.getStatements(null, RDF.TYPE, OWL.ONTOLOGY, headGraph));
        Model ontologyDefinitions = mf.createEmptyModel();
        ontology.subjects().stream()
                .map(iri -> QueryResults.asModel(conn.getStatements(iri, null, null, headGraph)))
                .forEach(ontologyDefinitions::addAll);

        OntologyId id = ontologyManager.createOntologyId(ontologyDefinitions);
        IRI ontologyIRI = id.getOntologyIRI().orElse((IRI) id.getOntologyIdentifier());

        if (id.getOntologyIRI().isEmpty()) {
            Optional<Resource> firstOntologyResource = ontology.stream()
                    .findFirst()
                    .flatMap(statement -> Optional.of(statement.getSubject()));
            if (firstOntologyResource.isPresent()) {
                // Handle Blank Node Ontology Resource
                ontology.filter(firstOntologyResource.get(), null, null).forEach(statement ->
                        conn.add(ontologyIRI, statement.getPredicate(), statement.getObject(), headGraph));
                conn.remove(firstOntologyResource.get(), null, null, headGraph);
                IRI initRevAddGraph = initialRevision.getAdditions().orElseThrow(
                        () -> new IllegalStateException("Initial revision missing additions graph"));
                conn.remove(firstOntologyResource.get(), null, null, initRevAddGraph);
            } else {
                // Handle missing Ontology Resource
                conn.add(ontologyIRI, RDF.TYPE, OWL.ONTOLOGY, headGraph);
            }
        }
        validateOntology(ontologyIRI);
        record.setTrackedIdentifier(ontologyIRI);
        thingManager.updateObject(record, conn);
    }

    /**
     * Checks ontologyManager to ensure the new OntologyId doesn't already exist.
     *
     * @param newOntologyId newly created ontology to set to record
     */
    private void validateOntology(Resource newOntologyId) {
        if (ontologyManager.ontologyIriExists(newOntologyId)) {
            throw new IllegalArgumentException("Ontology IRI:  " + newOntologyId + " already exists.");
        }
    }
}
