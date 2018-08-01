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
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.record.config.OntologyRecordCreateSettings;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.concurrent.Semaphore;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    protected ModelFactory modelFactory;
    protected OntologyManager ontologyManager;
    protected VersioningManager versioningManager;

    /**
     * Semaphore for protecting ontology IRI uniqueness checks.
     */
    private Semaphore semaphore = new Semaphore(1, true);


    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = null;
        try {
            semaphore.acquire();
            record = createRecordObject(config, issued, modified);
            Branch masterBranch = createMasterBranch(record);
            Ontology ontology = setOntologyToRecord(record, config);
            conn.begin();
            addRecord(record, masterBranch, conn);
            conn.commit();
            IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
            Resource masterBranchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("OntologyRecord must have a master Branch"));
            Model model = ontology.asModel(modelFactory);
            versioningManager.commit(catalogIdIRI, record.getResource(),
                    masterBranchId, user, "The initial commit.", model, null);
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            semaphore.release();
        }
        return record;
    }

    /**
     * Creates an ontology and sets that new ontology to the record.
     *
     * @param record Created record
     * @param config A {@link RepositoryConnection} to use for lookup
     * @return created ontology
     */
    private Ontology setOntologyToRecord(T record, RecordOperationConfig config) {
        Ontology ontology;
        if (config.get(OntologyRecordCreateSettings.INPUT_STREAM) != null) {
            ontology = ontologyManager.createOntology(config.get(OntologyRecordCreateSettings.INPUT_STREAM), false);
        } else {
            ontology = ontologyManager.createOntology(config.get(VersionedRDFRecordCreateSettings
                    .INITIAL_COMMIT_DATA));
        }
        record.getOntologyIRI().ifPresent(this::validateOntology);
        record.setOntologyIRI(ontology.getOntologyId().getOntologyIdentifier());
        return ontology;
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