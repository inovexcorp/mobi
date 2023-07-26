package com.mobi.ontology.core.api.record;

/*-
 * #%L
 * com.mobi.ontology.api
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

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.exception.MobiException;
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
        Branch masterBranch = createMasterBranch(record);
        InProgressCommit commit = null;
        File ontologyFile = null;
        try {
            semaphore.acquire();
            ontologyFile = createDataFile(config);
            IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            commit = loadInProgressCommit(user, ontologyFile);

            conn.begin();
            addRecord(record, masterBranch, conn);
            catalogManager.addInProgressCommit(catalogIdIRI, record.getResource(), commit, conn);

            setOntologyToRecord(record, commit, conn);

            versioningManager.commit(catalogIdIRI, record.getResource(), masterBranchId, user,
                    "The initial commit.", conn);
            conn.commit();
            writePolicies(user, record);
            ontologyFile.delete();
        } catch (InterruptedException e) {
            throw new MobiException(e);
        } catch (Exception e) {
            handleError(commit, ontologyFile, e);
        } finally {
            semaphore.release();
        }
        return record;
    }

    /**
     * Validates and sets the ontology to the record.
     *
     * @param record created record
     * @param inProgressCommit the {@link InProgressCommit} to query for the ontologyIRI
     * @param conn The {@link RepositoryConnection} with the transaction for creating the record
     */
    private void setOntologyToRecord(T record, InProgressCommit inProgressCommit, RepositoryConnection conn) {
        IRI additionsGraph = getRevisionGraph(inProgressCommit, true);
        Model ontology = QueryResults.asModel(conn.getStatements(null, RDF.TYPE, OWL.ONTOLOGY, additionsGraph));

        OntologyId id = ontologyManager.createOntologyId(ontology);
        IRI ontologyIRI = id.getOntologyIRI().orElse((IRI) id.getOntologyIdentifier());

        if (id.getOntologyIRI().isEmpty()) {
            Optional<Resource> firstOntologyResource = ontology.stream()
                    .findFirst()
                    .flatMap(statement -> Optional.of(statement.getSubject()));
            if (firstOntologyResource.isPresent()) {
                // Handle Blank Node Ontology Resource
                ontology.filter(firstOntologyResource.get(), null, null).forEach(statement ->
                        conn.add(ontologyIRI, statement.getPredicate(), statement.getObject(), additionsGraph));
                conn.remove(firstOntologyResource.get(), null, null, additionsGraph);
            } else {
                // Handle missing Ontology Resource
                conn.add(ontologyIRI, RDF.TYPE, OWL.ONTOLOGY, additionsGraph);
            }
        }
        validateOntology(ontologyIRI);
        record.setOntologyIRI(ontologyIRI);
        utilsService.updateObject(record, conn);
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