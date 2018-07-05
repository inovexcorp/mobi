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

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.RepositoryConnection;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;

public abstract class AbstractOntologyRecordService<T extends OntologyRecord>
        extends AbstractVersionedRDFRecordService<T> implements RecordService<T> {

    protected OntologyRecordFactory recordFactory;
    protected CatalogFactory catalogFactory;
    protected CommitFactory commitFactory;
    protected BranchFactory branchFactory;
    protected MergeRequestManager mergeRequestManager;
    protected CatalogUtilsService utilsService;

    @Override
    public T createRecord(T record, RecordOperationConfig config, OffsetDateTime issued,
                          OffsetDateTime modified, RepositoryConnection conn){
        record.setProperty(valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_TITLE)),
                valueFactory.createIRI(_Thing.title_IRI));
        record.setProperty(valueFactory.createLiteral(issued), valueFactory.createIRI(_Thing.issued_IRI));
        record.setProperty(valueFactory.createLiteral(modified), valueFactory.createIRI(_Thing.modified_IRI));
        record.setProperties(config.get(RecordCreateSettings.RECORD_PUBLISHERS).stream().map(User::getResource).
                        collect(Collectors.toSet()),
                valueFactory.createIRI(_Thing.publisher_IRI));
        if (config.get(RecordCreateSettings.RECORD_DESCRIPTION) != null) {
            record.setProperty(valueFactory.createLiteral(config.get(RecordCreateSettings.RECORD_DESCRIPTION)),
                    valueFactory.createIRI(_Thing.description_IRI));
        }
        if (config.get(RecordCreateSettings.RECORD_KEYWORDS) != null) {
            record.setKeyword(config.get(RecordCreateSettings.RECORD_KEYWORDS).stream().map(valueFactory::createLiteral).
                    collect(Collectors.toSet()));
        }
        conn.begin();
        utilsService.addObject(record, conn);
        conn.commit();
        Resource catalogId = record.getResource();
        addOntologyRecord(catalogId, record, conn);
        return record;
    }

    /**
     * Adds created OntologyRecord based on (catalogId, record, conn) from the repository.
     *
     * @param catalogId The resource of the created record
     * @param record The OntologyRecord to delete
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void addOntologyRecord(Resource catalogId, T record, RepositoryConnection conn) {
        if (conn.containsContext(record.getResource())) {
            throw utilsService.throwAlreadyExists(record.getResource(), recordFactory);
        }
        record.setCatalog(utilsService.getObject(catalogId, catalogFactory, conn));
        if(!conn.isActive()){
            conn.begin();
        }
        if (record.getModel().contains(null, valueFactory.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                recordFactory.getTypeIRI())) {
            addMasterBranch(record, conn);
        } else {
            utilsService.addObject(record, conn);
        }
        conn.commit();
    }

    /**
     * Creates a MasterBranch to be initialized based on (record, conn) from the repository.
     *
     * @param record The OntologyRecord to add to a MasterBranch
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void addMasterBranch(OntologyRecord record, RepositoryConnection conn) {
        if (record.getMasterBranch_resource().isPresent()) {
            throw new IllegalStateException("Record " + record.getResource() + " already has a master Branch.");
        }
        Branch branch = createBranch("MASTER", "The master branch.", branchFactory);
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        utilsService.updateObject(record, conn);
        utilsService.addObject(branch, conn);
    }

    /**
     * Creates a branch specific to (title, desription, factory).
     *
     * @param title Name of desired branch
     * @param description Short description of the title branch
     * @param factory Which factory to apply the created branch
     */
    protected  <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T branch = factory.createNew(valueFactory.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(valueFactory.createLiteral(title), valueFactory.createIRI(_Thing.title_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.issued_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(valueFactory.createLiteral(description), valueFactory.createIRI(_Thing.description_IRI));
        }
        return branch;
    }


}
