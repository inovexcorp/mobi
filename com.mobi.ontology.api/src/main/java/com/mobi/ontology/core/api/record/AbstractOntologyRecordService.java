package com.mobi.ontology.core.api.record;

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.record.AbstractVersionedRDFRecordService;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
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
        addVersionedRDFRecord(catalogId, record, conn);
        return record;
    }

    /**
     * Adds created versionedRDFRecord based on (catalogId, record, conn) from the repository.
     *
     * @param catalogId The resource of the created record
     * @param record The VersionedRDFRecord to delete
     * @param conn A RepositoryConnection to use for lookup
     */
    protected void addVersionedRDFRecord(Resource catalogId, T record, RepositoryConnection conn) {
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
     * @param record The VersionedRDFRecord to add to a MasterBranch
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

        T branch = factory.createNew(valueFactory.createIRI(Catalog.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(valueFactory.createLiteral(title), valueFactory.createIRI(_Thing.title_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.issued_IRI));
        branch.setProperty(valueFactory.createLiteral(now), valueFactory.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(valueFactory.createLiteral(description), valueFactory.createIRI(_Thing.description_IRI));
        }
        return branch;
    }


}
