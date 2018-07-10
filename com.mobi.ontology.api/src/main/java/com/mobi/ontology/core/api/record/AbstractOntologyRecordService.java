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
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    private Ontology ontology;

    protected ModelFactory modelFactory;
    protected OntologyManager ontologyManager;
    protected VersioningManager versioningManager;

    @Override
    public T createRecord(User user, RecordOperationConfig config, OffsetDateTime issued, OffsetDateTime modified,
                          RepositoryConnection conn) {
        T record = createRecordObject(config, issued, modified, conn);
        Branch masterBranch = createMasterBranch(record);
        Ontology ontology = setOntologyToRecord(record, config);
        conn.begin();
        addRecord(record, masterBranch, conn);
        IRI catalogIdIRI = valueFactory.createIRI(config.get(RecordCreateSettings.CATALOG_ID));
        Resource masterBranchId = masterBranch.getResource();
        Model model = ontology.asModel(modelFactory);
        versioningManager.commit(catalogIdIRI, record.getResource(),
                masterBranchId, user, "The initial commit.", model, null);
        conn.commit();
        return record;
    }

    /**
     * Creates an ontology and sets that new ontology to the record
     *
     * @param record Created record
     * @param config A {@link RepositoryConnection} to use for lookup
     * @return created ontology
     */
    protected Ontology setOntologyToRecord(T record, RecordOperationConfig config) {
        ontology = ontologyManager.createOntology(config.get(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA));
        record.getOntologyIRI().ifPresent(this::validateOntology);
        record.setOntologyIRI(ontology.getOntologyId().getOntologyIdentifier());
        return ontology;
    }

    private void validateOntology(Resource newOntologyId) {
        if (ontologyManager.ontologyIriExists(newOntologyId)) {
            throw new IllegalArgumentException("Ontology IRI:  " + newOntologyId + " already exists.");
        }
    }
}