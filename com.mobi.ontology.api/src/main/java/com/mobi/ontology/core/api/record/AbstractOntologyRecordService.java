package com.mobi.ontology.core.api.record;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Reference;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.concurrent.Semaphore;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    public final ModelFactory modelFactory = new DynamicModelFactory();

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
        try {
            semaphore.acquire();
            Model ontologyModel = createModel(config);
            setOntologyToRecord(record, ontologyModel);
            conn.begin();
            addRecord(record, masterBranch, conn);

            IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            versioningManager.commit(catalogIdIRI, record.getResource(),
                    masterBranchId, user, "The initial commit.", ontologyModel, null, conn);
            conn.commit();
            writePolicies(user, record);
        } catch (InterruptedException e) {
            throw new MobiException(e);
        } finally {
            semaphore.release();
        }
        return record;
    }

    /**
     * Validates and sets the ontology to the record.
     *
     * @param record created record
     * @param ontology created ontology
     */
    private void setOntologyToRecord(T record, Model ontology) {
        IRI typeIri = valueFactory.createIRI(RDF.TYPE.stringValue());
        IRI ontologyType = valueFactory.createIRI(OWL.ONTOLOGY.stringValue());
        OntologyId id = ontologyManager.createOntologyId(ontology);
        IRI ontologyIRI = id.getOntologyIRI().orElse((IRI) id.getOntologyIdentifier());

        if (!id.getOntologyIRI().isPresent()) {
            Optional<Resource> firstOntologyResource = ontology
                    .filter(null, typeIri, ontologyType).stream()
                    .findFirst()
                    .flatMap(statement -> Optional.of(statement.getSubject()));
            if (firstOntologyResource.isPresent()) {
                // Handle Blank Node Ontology Resource
                ontology.filter(firstOntologyResource.get(), null, null).forEach(statement ->
                        ontology.add(ontologyIRI, statement.getPredicate(), statement.getObject()));
                ontology.remove(firstOntologyResource.get(), null, null);
            } else {
                // Handle missing Ontology Resource
                ontology.add(ontologyIRI, typeIri, ontologyType);
            }
        }

        validateOntology(ontologyIRI);
        record.setOntologyIRI(ontologyIRI);
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
