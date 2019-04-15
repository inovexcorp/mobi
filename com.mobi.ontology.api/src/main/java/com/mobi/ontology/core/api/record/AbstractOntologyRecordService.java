package com.mobi.ontology.core.api.record;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.record.config.OntologyRecordCreateSettings;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.concurrent.Semaphore;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    protected ModelFactory modelFactory;
    protected OntologyManager ontologyManager;
    protected VersioningManager versioningManager;
    protected SesameTransformer sesameTransformer;

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
            Model ontology = createOntologyModel(config);
            setOntologyToRecord(record, ontology);
            conn.begin();
            addRecord(record, masterBranch, conn);

            IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            versioningManager.commit(catalogIdIRI, record.getResource(),
                    masterBranchId, user, "The initial commit.", ontology, null, conn);
            conn.commit();
            writePolicies(user, record);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            semaphore.release();
        }
        return record;
    }

    /**
     * Creates an ontology Model based on a {@link RecordOperationConfig}.
     *
     * @param config A {@link RepositoryConnection} to use for lookup
     * @return created ontology
     */
    private Model createOntologyModel(RecordOperationConfig config) {
        Model ontologyModel;
        if (config.get(OntologyRecordCreateSettings.INPUT_STREAM) != null) {
            try {
                ontologyModel = Models.createModel(config.get(OntologyRecordCreateSettings.INPUT_STREAM),
                        sesameTransformer);
            } catch (IOException e) {
                throw new MobiOntologyException("Could not parse Ontology input stream.", e);
            }
        } else if (config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA) != null) {
            ontologyModel = config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA);
        } else {
            throw new IllegalArgumentException("Ontology config does not have initial data.");
        }
        return ontologyModel;
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
        Model ontologyIriModel = ontology.filter(null, typeIri, ontologyType);
        OntologyId id = ontologyManager.createOntologyId(ontology);
        IRI ontologyIRI = id.getOntologyIRI().orElseThrow(() -> new IllegalStateException("OntologyIRI must exist"));
        if (ontologyIriModel.size() == 0) {
            ontology.add(ontologyIRI, typeIri, ontologyType);
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