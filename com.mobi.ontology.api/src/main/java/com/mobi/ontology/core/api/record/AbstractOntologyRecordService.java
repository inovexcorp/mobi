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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.io.File;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.concurrent.Semaphore;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    @Reference
    public OntologyManager ontologyManager;

    /**
     * Semaphore for protecting ontology IRI uniqueness checks.
     */
    private Semaphore semaphore = new Semaphore(1, true);

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
        record.setOntologyIRI(ontologyIRI);
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
