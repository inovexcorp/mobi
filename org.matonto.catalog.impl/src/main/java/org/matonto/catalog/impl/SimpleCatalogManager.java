package org.matonto.catalog.impl;

/*-
 * #%L
 * org.matonto.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.ConfigurationPolicy;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.Conflict;
import org.matonto.catalog.api.Difference;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Revision;
import org.matonto.catalog.api.ontologies.mcat.RevisionFactory;
import org.matonto.catalog.api.ontologies.mcat.Tag;
import org.matonto.catalog.api.ontologies.mcat.TagFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.catalog.util.SearchResults;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.Entity;
import org.matonto.persistence.utils.Bindings;
import org.matonto.persistence.utils.RepositoryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.model.vocabulary.RDF;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = SimpleCatalogManager.COMPONENT_NAME
)
public class SimpleCatalogManager implements CatalogManager {

    static final String COMPONENT_NAME = "org.matonto.catalog.api.CatalogManager";
    private static final Logger log = LoggerFactory.getLogger(SimpleCatalogManager.class);
    private Repository repository;
    private ValueFactory vf;
    private ModelFactory mf;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private DistributionFactory distributionFactory;
    private BranchFactory branchFactory;
    private InProgressCommitFactory inProgressCommitFactory;
    private CommitFactory commitFactory;
    private RevisionFactory revisionFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionFactory versionFactory;
    private TagFactory tagFactory;
    private Resource distributedCatalogIRI;
    private Resource localCatalogIRI;
    private Map<Resource, String> sortingOptions = new HashMap<>();

    public SimpleCatalogManager() {
    }

    @Reference(name = "repository")
    protected void setRepository(Repository repository) {
        this.repository = repository;
    }

    @Reference
    protected void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    protected void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    @Reference
    protected void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    protected void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    protected void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    protected void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    protected void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    protected void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    protected void setRevisionFactory(RevisionFactory revisionFactory) {
        this.revisionFactory = revisionFactory;
    }

    @Reference
    protected void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    protected void setVersionedRecordFactory(VersionedRecordFactory versionedRecordFactory) {
        this.versionedRecordFactory = versionedRecordFactory;
    }

    @Reference
    protected void setUnversionedRecordFactory(UnversionedRecordFactory unversionedRecordFactory) {
        this.unversionedRecordFactory = unversionedRecordFactory;
    }

    @Reference
    protected void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    protected void setTagFactory(TagFactory tagFactory) {
        this.tagFactory = tagFactory;
    }

    private static final String PROV_AT_TIME = "http://www.w3.org/ns/prov#atTime";

    private static final String RECORD_NAMESPACE = "https://matonto.org/records#";
    private static final String DISTRIBUTION_NAMESPACE = "https://matonto.org/distributions#";
    private static final String VERSION_NAMESPACE = "https://matonto.org/versions#";
    private static final String BRANCH_NAMESPACE = "https://matonto.org/branches#";
    private static final String IN_PROGRESS_COMMIT_NAMESPACE = "https://matonto.org/in-progress-commits#";
    private static final String COMMIT_NAMESPACE = "https://matonto.org/commits#";
    private static final String REVISION_NAMESPACE = "https://matonto.org/revisions#";
    private static final String ADDITIONS_NAMESPACE = "https://matonto.org/additions#";
    private static final String DELETIONS_NAMESPACE = "https://matonto.org/deletions#";
    private static final String DELETION_CONTEXT = "https://matonto.org/is-a-deletion#";

    private static final String FIND_RECORDS_QUERY;
    private static final String COUNT_RECORDS_QUERY;
    private static final String GET_NEW_LATEST_VERSION;
    private static final String GET_COMMIT_CHAIN;
    private static final String GET_IN_PROGRESS_COMMIT;
    private static final String COMMIT_BINDING = "commit";
    private static final String PARENT_BINDING = "parent";
    private static final String RECORD_BINDING = "record";
    private static final String CATALOG_BINDING = "catalog";
    private static final String RECORD_COUNT_BINDING = "record_count";
    private static final String TYPE_FILTER_BINDING = "type_filter";
    private static final String SEARCH_BINDING = "search_text";
    private static final String USER_BINDING = "user";

    static {
        try {
            FIND_RECORDS_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/find-records.rq"),
                    "UTF-8"
            );
            COUNT_RECORDS_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/count-records.rq"),
                    "UTF-8"
            );
            GET_NEW_LATEST_VERSION = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-new-latest-version.rq"),
                    "UTF-8"
            );
            GET_COMMIT_CHAIN = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-commit-chain.rq"),
                    "UTF-8"
            );
            GET_IN_PROGRESS_COMMIT = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/get-in-progress-commit.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MatOntoException(e);
        }
    }

    @Activate
    protected void start(Map<String, Object> props) {
        CatalogConfig config = Configurable.createConfigurable(CatalogConfig.class, props);
        distributedCatalogIRI = vf.createIRI(config.iri() + "-distributed");
        localCatalogIRI = vf.createIRI(config.iri() + "-local");
        createSortingOptions();

        if (!resourceExists(distributedCatalogIRI, Catalog.TYPE)) {
            log.debug("Initializing the distributed MatOnto Catalog.");
            addCatalogToRepo(distributedCatalogIRI, config.title() + " (Distributed)", config.description());
        }

        if (!resourceExists(localCatalogIRI, Catalog.TYPE)) {
            log.debug("Initializing the local MatOnto Catalog.");
            addCatalogToRepo(localCatalogIRI, config.title() + " (Local)", config.description());
        }
    }

    @Modified
    protected void modified(Map<String, Object> props) {
        start(props);
    }

    @Override
    public IRI getDistributedCatalogIRI() {
        return (IRI) distributedCatalogIRI;
    }

    @Override
    public IRI getLocalCatalogIRI() {
        return (IRI) localCatalogIRI;
    }

    @Override
    public Catalog getDistributedCatalog() {
        return optCatalog(distributedCatalogIRI).orElseThrow(() ->
                new IllegalStateException("The catalog " + distributedCatalogIRI.stringValue()
                        + " could not be retrieved."));
    }

    @Override
    public Catalog getLocalCatalog() {
        return optCatalog(localCatalogIRI).orElseThrow(() ->
                new IllegalStateException("The catalog " + localCatalogIRI.stringValue() + " could not be retrieved."));
    }

    @Override
    public PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> typeParam = searchParams.getTypeFilter();
            Optional<String> searchTextParam = searchParams.getSearchText();

            // Get Total Count
            TupleQuery countQuery = conn.prepareTupleQuery(COUNT_RECORDS_QUERY);
            countQuery.setBinding(CATALOG_BINDING, catalogId);
            typeParam.ifPresent(resource -> countQuery.setBinding(TYPE_FILTER_BINDING, resource));
            searchTextParam.ifPresent(s -> countQuery.setBinding(SEARCH_BINDING, vf.createLiteral(s)));

            TupleQueryResult countResults = countQuery.evaluate();

            int totalCount;
            BindingSet countBindingSet;
            if (countResults.hasNext()
                    && (countBindingSet = countResults.next()).getBindingNames().contains(RECORD_COUNT_BINDING)) {
                totalCount = Bindings.requiredLiteral(countBindingSet, RECORD_COUNT_BINDING).intValue();
                countResults.close();
            } else {
                countResults.close();
                conn.close();
                return SearchResults.emptyResults();
            }

            log.debug("Record count: " + totalCount);

            // Prepare Query
            int offset = searchParams.getOffset();
            int limit = searchParams.getLimit().orElse(totalCount);
            if (offset > totalCount) {
                throw new IllegalArgumentException("Offset exceeds total size");
            }

            StringBuilder querySuffix = new StringBuilder("\nORDER BY ");
            Resource sortByParam = searchParams.getSortBy().orElse(vf.createIRI(DCTERMS.MODIFIED.stringValue()));
            Optional<Boolean> ascendingParam = searchParams.getAscending();
            if (ascendingParam.isPresent() && ascendingParam.get()) {
                querySuffix.append("?").append(sortingOptions.getOrDefault(sortByParam, "modified"));
            } else {
                querySuffix.append("DESC(?").append(sortingOptions.getOrDefault(sortByParam, "modified")).append(")");
            }
            querySuffix.append("\nLIMIT ").append(limit).append("\nOFFSET ").append(offset);

            String queryString = FIND_RECORDS_QUERY + querySuffix.toString();
            TupleQuery query = conn.prepareTupleQuery(queryString);
            query.setBinding(CATALOG_BINDING, catalogId);
            typeParam.ifPresent(resource -> query.setBinding(TYPE_FILTER_BINDING, resource));
            searchTextParam.ifPresent(searchText -> query.setBinding(SEARCH_BINDING, vf.createLiteral(searchText)));

            log.debug("Query String:\n" + queryString);
            log.debug("Query Plan:\n" + query);

            // Get Results
            TupleQueryResult result = query.evaluate();

            List<Record> records = new ArrayList<>();
            result.forEach(bindings -> {
                Resource resource = vf.createIRI(Bindings.requiredResource(bindings, RECORD_BINDING)
                        .stringValue());
                records.add(getRecord(catalogId, resource, recordFactory, conn));
            });

            result.close();

            log.debug("Result set size: " + records.size());

            int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;

            return records.size() > 0 ? new SimpleSearchResults<>(records, totalCount, limit, pageNumber) :
                    SearchResults.emptyResults();
        }
    }

    @Override
    public Set<Resource> getRecordIds(Resource catalogId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testObjectId(catalogId, vf.createIRI(Catalog.TYPE), conn);
            Set<Resource> results = new HashSet<>();
            RepositoryResult<Statement> statements = conn.getStatements(null, vf.createIRI(Record.catalog_IRI),
                    catalogId);
            statements.forEach(statement -> results.add(statement.getSubject()));
            return results;
        }
    }

    @Override
    public <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();
        return addPropertiesToRecord(factory.createNew(vf.createIRI(RECORD_NAMESPACE + UUID.randomUUID())), config, now,
                now);
    }

    @Override
    public <T extends Record> void addRecord(Resource catalogId, T record) {
        try (RepositoryConnection conn = repository.getConnection()) {
            if (!resourceExists(record.getResource(), conn)) {
                record.setCatalog(getCatalog(catalogId));
                conn.begin();
                if (record.getModel().contains(null, vf.createIRI(RDF.TYPE.stringValue()),
                        versionedRDFRecordFactory.getTypeIRI())) {
                    addMasterBranch((VersionedRDFRecord) record, conn);
                } else {
                    addObject(record, conn);
                }
                conn.commit();
            } else {
                throw throwAlreadyExists(record.getResource(), recordFactory);
            }
        }
    }

    @Override
    public <T extends Record> void updateRecord(Resource catalogId, T newRecord) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testRecordPath(catalogId, newRecord.getResource(), conn);
            conn.begin();
            updateObject(newRecord, conn);
            conn.commit();
        }
    }

    @Override
    public void removeRecord(Resource catalogId, Resource recordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Record record = getRecord(catalogId, recordId, recordFactory, conn);
            conn.begin();
            if (record.getModel().contains(null, null, vf.createIRI(UnversionedRecord.TYPE))) {
                removeUnversionedRecord(record, conn);
            } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRDFRecord.TYPE))) {
                removeVersionedRDFRecord(record, conn);
            } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRecord.TYPE))) {
                removeVersionedRecord(record, conn);
            } else {
                removeObject(record, conn);
            }
            conn.commit();
        }
    }

    @Override
    public <T extends Record> Optional<T> getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testObjectId(catalogId, catalogFactory.getTypeIRI(), conn);
            return optObject(recordId, factory, conn).flatMap(record -> {
                Resource catalog = record.getCatalog_resource().orElseThrow(() ->
                        new IllegalStateException("Record " + recordId.stringValue() + " does not have a Catalog set"));
                return !catalog.equals(catalogId) ? Optional.empty() : Optional.of(record);
            });
        }
    }

    private <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                           RepositoryConnection conn) {
        testRecordPath(catalogId, recordId, factory.getTypeIRI(), conn);
        return getObject(recordId, factory, conn);
    }

    @Override
    public Set<Distribution> getUnversionedDistributions(Resource catalogId, Resource unversionedRecordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            UnversionedRecord record = getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            return record.getUnversionedDistribution_resource().stream()
                    .map(resource -> getObject(resource, distributionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Distribution createDistribution(DistributionConfig config) {
        OffsetDateTime now = OffsetDateTime.now();

        Distribution distribution = distributionFactory.createNew(vf.createIRI(DISTRIBUTION_NAMESPACE
                + UUID.randomUUID()));
        distribution.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(DCTERMS.TITLE.stringValue()));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.ISSUED.stringValue()));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.MODIFIED.stringValue()));
        if (config.getDescription() != null) {
            distribution.setProperty(vf.createLiteral(config.getDescription()),
                    vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        if (config.getFormat() != null) {
            distribution.setProperty(vf.createLiteral(config.getFormat()), vf.createIRI(DCTERMS.FORMAT.stringValue()));
        }
        if (config.getAccessURL() != null) {
            distribution.setAccessURL(config.getAccessURL());
        }
        if (config.getDownloadURL() != null) {
            distribution.setDownloadURL(config.getDownloadURL());
        }

        return distribution;
    }

    @Override
    public void addUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                           Distribution distribution) {
        try (RepositoryConnection conn = repository.getConnection()) {
            UnversionedRecord record = getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            if (!resourceExists(distribution.getResource(), conn)) {
                Set<Distribution> distributions = record.getUnversionedDistribution_resource().stream()
                        .map(distributionFactory::createNew)
                        .collect(Collectors.toSet());
                distributions.add(distribution);
                record.setUnversionedDistribution(distributions);
                conn.begin();
                removeObject(record, conn);
                addObject(record, conn);
                addObject(distribution, conn);
                conn.commit();
            } else {
                throw throwAlreadyExists(distribution.getResource(), distributionFactory);
            }
        }
    }

    @Override
    public void updateUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Distribution newDistribution) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testUnversionedDistributionPath(catalogId, unversionedRecordId, newDistribution.getResource(), conn);
            conn.begin();
            updateObject(newDistribution, conn);
            conn.commit();
        }
    }

    @Override
    public void removeUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Resource distributionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Distribution distribution = getUnversionedDistribution(catalogId, unversionedRecordId, distributionId,
                    conn);
            conn.begin();
            removeObjectWithRelationship(distribution.getResource(), unversionedRecordId,
                    UnversionedRecord.unversionedDistribution_IRI, conn);
            conn.commit();
        }
    }

    @Override
    public Optional<Distribution> getUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                                             Resource distributionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            UnversionedRecord record = getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            if (!record.getUnversionedDistribution_resource().contains(distributionId)) {
                return Optional.empty();
            }
            return Optional.of(optObject(distributionId, distributionFactory, conn).orElseThrow(() ->
                    throwThingNotFound(distributionId, distributionFactory)));
        }
    }

    private Distribution getUnversionedDistribution(Resource catalogId, Resource recordId, Resource distributionId,
                                                    RepositoryConnection conn) {
        testUnversionedDistributionPath(catalogId, recordId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public Set<Version> getVersions(Resource catalogId, Resource versionedRecordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRecord record = getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            return record.getVersion_resource().stream()
                    .map(resource -> getObject(resource, versionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T version = factory.createNew(vf.createIRI(VERSION_NAMESPACE + UUID.randomUUID()));
        version.setProperty(vf.createLiteral(title), vf.createIRI(DCTERMS.TITLE.stringValue()));
        if (description != null) {
            version.setProperty(vf.createLiteral(description), vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        version.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.ISSUED.stringValue()));
        version.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.MODIFIED.stringValue()));

        return version;
    }

    @Override
    public <T extends Version> void addVersion(Resource catalogId, Resource versionedRecordId, T version) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRecord record = getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            if (!resourceExists(version.getResource(), conn)) {
                record.setLatestVersion(version);
                Set<Version> versions = record.getVersion_resource().stream()
                        .map(versionFactory::createNew)
                        .collect(Collectors.toSet());
                versions.add(version);
                record.setVersion(versions);
                conn.begin();
                removeObject(record, conn);
                addObject(record, conn);
                addObject(version, conn);
                conn.commit();
            } else {
                throw throwAlreadyExists(version.getResource(), versionFactory);
            }
        }
    }

    @Override
    public <T extends Version> void updateVersion(Resource catalogId, Resource versionedRecordId, T newVersion) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testVersionPath(catalogId, versionedRecordId, newVersion.getResource(), conn);
            conn.begin();
            updateObject(newVersion, conn);
            conn.commit();
        }
    }

    @Override
    public void removeVersion(Resource catalogId, Resource versionedRecordId, Resource versionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Version version = getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            conn.begin();
            removeVersion(versionedRecordId, version, conn);
            conn.commit();
        }
    }

    private void removeVersion(Resource recordId, Version version, RepositoryConnection conn) {
        removeObjectWithRelationship(version.getResource(), recordId, VersionedRecord.version_IRI, conn);
        IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
        if (conn.getStatements(recordId, latestVersionIRI, version.getResource(), recordId).hasNext()) {
            conn.remove(recordId, latestVersionIRI, version.getResource(), recordId);
            TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
            query.setBinding(RECORD_BINDING, recordId);
            TupleQueryResult result = query.evaluate();

            Optional<Binding> binding;
            if (result.hasNext() && (binding = result.next().getBinding("version")).isPresent()) {
                conn.add(recordId, latestVersionIRI, binding.get().getValue(), recordId);
            }
        }
        version.getVersionedDistribution_resource().forEach(conn::clear);
    }

    private void removeVersion(Resource recordId, Resource versionId, RepositoryConnection conn) {
        Version version = getObject(versionId, versionFactory, conn);
        removeVersion(recordId, version, conn);
    }

    @Override
    public <T extends Version> Optional<T> getVersion(Resource catalogId, Resource versionedRecordId,
                                                      Resource versionId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRecord record = getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            if (!record.getVersion_resource().contains(versionId)) {
                return Optional.empty();
            }
            return Optional.of(optObject(versionId, factory, conn).orElseThrow(() ->
                    throwThingNotFound(versionId, factory)));
        }
    }

    private <T extends Version> T getVersion(Resource catalogId, Resource recordId, Resource versionId,
                                             OrmFactory<T> factory, RepositoryConnection conn) {
        testVersionPath(catalogId, recordId, versionId, conn);
        return getObject(versionId, factory, conn);
    }

    private Version getVersion(Resource catalogId, Resource recordId, Resource versionId, RepositoryConnection conn) {
        testVersionPath(catalogId, recordId, versionId, conn);
        return optObject(versionId, versionFactory, conn).orElseThrow(() ->
                throwThingNotFound(versionId, versionFactory));
    }

    @Override
    public <T extends Version> Optional<T> getLatestVersion(Resource catalogId, Resource versionedRecordId,
                                                            OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRecord record = getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            return record.getLatestVersion_resource().flatMap(resource -> Optional.of(optObject(resource, factory, conn)
                    .orElseThrow(() -> throwThingNotFound(resource, factory))));
        }
    }

    @Override
    public Commit getTaggedCommit(Resource catalogId, Resource versionedRecordId, Resource versionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testVersionPath(catalogId, versionedRecordId, versionId, conn);
            Tag tag = optObject(versionId, tagFactory, conn).orElseThrow(() ->
                    throwThingNotFound(versionId, tagFactory));
            Resource commitId = tag.getCommit_resource().orElseThrow(() ->
                    new IllegalStateException("Tag " + versionId.stringValue() + " does not have a Commit set"));
            return optObject(commitId, commitFactory, conn).orElseThrow(() ->
                    throwThingNotFound(commitId, commitFactory));
        }
    }

    @Override
    public Set<Distribution> getVersionedDistributions(Resource catalogId, Resource versionedRecordId,
                                                       Resource versionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Version version = getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            return version.getVersionedDistribution_resource().stream()
                    .map(resource -> getObject(resource, distributionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public void removeVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Resource distributionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Distribution distribution = getVersionedDistribution(catalogId, versionedRecordId, versionId,
                    distributionId, conn);
            conn.begin();
            removeObjectWithRelationship(distribution.getResource(), versionId, Version.versionedDistribution_IRI,
                    conn);
            conn.commit();
        }
    }


    @Override
    public Optional<Distribution> getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                           Resource distributionId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Version version = getVersion(catalogId, recordId, versionId, conn);
            if (!version.getVersionedDistribution_resource().contains(distributionId)) {
                return Optional.empty();
            }
            return Optional.of(optObject(distributionId, distributionFactory, conn).orElseThrow(() ->
                    throwThingNotFound(distributionId, distributionFactory)));
        }
    }

    private Distribution getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                  Resource distributionId, RepositoryConnection conn) {
        testVersionedDistributionPath(catalogId, recordId, versionId, distributionId, conn);
        return getObject(distributionId, distributionFactory, conn);
    }

    @Override
    public void addVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                         Distribution distribution) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Version version = getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            if (!resourceExists(distribution.getResource(), conn)) {
                Set<Distribution> distributions = version.getVersionedDistribution_resource().stream()
                        .map(distributionFactory::createNew)
                        .collect(Collectors.toSet());
                distributions.add(distribution);
                version.setVersionedDistribution(distributions);
                conn.begin();
                removeObject(version, conn);
                addObject(version, conn);
                addObject(distribution, conn);
                conn.commit();
            } else {
                throw throwAlreadyExists(distribution.getResource(), distributionFactory);
            }
        }
    }

    @Override
    public void updateVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Distribution newDistribution) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testVersionedDistributionPath(catalogId, versionedRecordId, versionId, newDistribution.getResource(), conn);
            conn.begin();
            updateObject(newDistribution, conn);
            conn.commit();
        }
    }

    @Override
    public Set<Branch> getBranches(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            return record.getBranch_resource().stream()
                    .map(resource -> getObject(resource, branchFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T branch = factory.createNew(vf.createIRI(BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(vf.createLiteral(title), vf.createIRI(DCTERMS.TITLE.stringValue()));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.ISSUED.stringValue()));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.MODIFIED.stringValue()));
        if (description != null) {
            branch.setProperty(vf.createLiteral(description), vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }

        return branch;
    }

    @Override
    public <T extends Branch> void addBranch(Resource catalogId, Resource versionedRDFRecordId, T branch) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            if (!resourceExists(branch.getResource(), conn)) {
                Set<Branch> branches = record.getBranch_resource().stream()
                        .map(branchFactory::createNew)
                        .collect(Collectors.toSet());
                branches.add(branch);
                record.setBranch(branches);
                conn.begin();
                removeObject(record, conn);
                addObject(record, conn);
                addObject(branch, conn);
                conn.commit();
            } else {
                throw throwAlreadyExists(branch.getResource(), branchFactory);
            }
        }
    }

    @Override
    public void addMasterBranch(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            conn.begin();
            addMasterBranch(record, conn);
            conn.commit();
        }
    }

    private void addMasterBranch(VersionedRDFRecord record, RepositoryConnection conn) {
        if (record.getMasterBranch_resource().isPresent()) {
            throw new IllegalStateException("Record " + record.getResource().stringValue()
                    + " already has a master Branch.");
        }
        Branch branch = createBranch("MASTER", "The master branch.", branchFactory);
        record.setMasterBranch(branch);
        Set<Branch> branches = record.getBranch_resource().stream()
                .map(branchFactory::createNew)
                .collect(Collectors.toSet());
        branches.add(branch);
        record.setBranch(branches);
        removeObject(record, conn);
        addObject(record, conn);
        addObject(branch, conn);
    }

    @Override
    public <T extends Branch> void updateBranch(Resource catalogId, Resource versionedRDFRecordId, T newBranch) {
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            testBranchPath(catalogId, versionedRDFRecordId, newBranch.getResource(), conn);
            if (conn.getStatements(null, masterBranchIRI, newBranch.getResource()).hasNext()) {
                throw new IllegalArgumentException("Branch " + newBranch.getResource().stringValue()
                        + "is the master Branch and cannot be updated.");
            }
            conn.begin();
            updateObject(newBranch, conn);
            conn.commit();
        }
    }

    @Override
    public void updateHead(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Resource commitId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch branch = getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            conn.begin();
            testObjectId(commitId, commitFactory.getTypeIRI(), conn);
            branch.setHead(commitFactory.createNew(commitId));
            removeObject(branch, conn);
            addObject(branch, conn);
            conn.commit();
        }
    }

    @Override
    public void removeBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch branch = getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            if (conn.getStatements(versionedRDFRecordId, masterBranchIRI, branchId, versionedRDFRecordId).hasNext()) {
                throw new IllegalStateException("Branch is the master Branch and cannot be removed.");
            }
            conn.begin();
            removeBranch(versionedRDFRecordId, branch, conn);
            conn.commit();
        }
    }

    private void removeBranch(Resource recordId, Branch branch, RepositoryConnection conn) {
        removeObjectWithRelationship(branch.getResource(), recordId, VersionedRDFRecord.branch_IRI, conn);
        Optional<Resource> headCommit = branch.getHead_resource();
        if (headCommit.isPresent()) {
            List<Resource> chain = getCommitChain(headCommit.get(), conn);
            IRI commitIRI = vf.createIRI(Tag.commit_IRI);
            Set<Resource> deltaIRIs = new HashSet<>();
            for (Resource commitId : chain) {
                if (!commitIsReferenced(commitId, conn)) {
                    deltaIRIs.add(getAdditionsResource(commitId, conn));
                    deltaIRIs.add(getDeletionsResource(commitId, conn));
                    remove(commitId, conn);
                    RepositoryResults.asModel(conn.getStatements(null, commitIRI, commitId), mf).subjects()
                            .forEach(tagId -> removeObjectWithRelationship(tagId, recordId, VersionedRecord.version_IRI,
                                    conn));
                } else {
                    break;
                }
            }
            deltaIRIs.forEach(conn::clear);
        } else {
            log.warn("The HEAD Commit was not set on the Branch.");
        }
    }

    private void removeBranch(Resource recordId, Resource branchId, RepositoryConnection conn) {
        Branch branch = getObject(branchId, branchFactory, conn);
        removeBranch(recordId, branch, conn);
    }

    @Override
    public <T extends Branch> Optional<T> getBranch(Resource catalogId, Resource versionedRDFRecordId,
                                                    Resource branchId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            if (!record.getBranch_resource().contains(branchId)) {
                return Optional.empty();
            }
            return Optional.of(optObject(branchId, factory, conn).orElseThrow(() ->
                    throwThingNotFound(branchId, factory)));
        }
    }

    private <T extends Branch> T getBranch(Resource catalogId, Resource recordId, Resource branchId,
                                           OrmFactory<T> factory, RepositoryConnection conn) {
        testBranchPath(catalogId, recordId, branchId, conn);
        return getObject(branchId, factory, conn);
    }

    @Override
    public Branch getMasterBranch(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            Resource branchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("Record " + versionedRDFRecordId.stringValue()
                            + " does not have a master Branch set."));
            return optObject(branchId, branchFactory, conn).orElseThrow(() ->
                    throwThingNotFound(branchId, branchFactory));
        }
    }

    @Override
    public Commit createCommit(@Nonnull InProgressCommit inProgressCommit, @Nonnull String message, Commit
            baseCommit,
                               Commit auxCommit) {
        if (auxCommit != null && baseCommit == null) {
            throw new IllegalArgumentException("Commit must have a base commit in order to have an auxiliary commit");
        }
        IRI associatedWith = vf.createIRI(Activity.wasAssociatedWith_IRI);
        IRI generatedIRI = vf.createIRI(Activity.generated_IRI);
        OffsetDateTime now = OffsetDateTime.now();
        Resource revisionIRI = (Resource) inProgressCommit.getProperty(generatedIRI).get();
        Value user = inProgressCommit.getProperty(associatedWith).get();
        StringBuilder metadata = new StringBuilder(now.toString() + user.stringValue());

        Set<Value> generatedParents = new HashSet<>();
        if (baseCommit != null) {
            metadata.append(baseCommit.getResource().stringValue());
            generatedParents.add(baseCommit.getProperty(generatedIRI).get());
        }
        if (auxCommit != null) {
            metadata.append(auxCommit.getResource().stringValue());
            generatedParents.add(auxCommit.getProperty(generatedIRI).get());
        }
        Commit commit = commitFactory.createNew(vf.createIRI(COMMIT_NAMESPACE
                + DigestUtils.sha1Hex(metadata.toString())));
        commit.setProperty(revisionIRI, generatedIRI);
        commit.setProperty(vf.createLiteral(now), vf.createIRI(PROV_AT_TIME));
        commit.setProperty(vf.createLiteral(message), vf.createIRI(DCTERMS.TITLE.stringValue()));
        commit.setProperty(user, associatedWith);

        if (baseCommit != null) {
            commit.setBaseCommit(baseCommit);
        }
        if (auxCommit != null) {
            commit.setAuxiliaryCommit(auxCommit);
        }

        Model revisionModel = mf.createModel(inProgressCommit.getModel());
        revisionModel.remove(inProgressCommit.getResource(), null, null);
        revisionFactory.getExisting(revisionIRI, revisionModel).ifPresent(revision -> {
            if (generatedParents.size() > 0) {
                revision.setProperties(generatedParents, vf.createIRI(Entity.wasDerivedFrom_IRI));
            }
        });

        commit.getModel().addAll(revisionModel);
        return commit;
    }

    @Override
    public InProgressCommit createInProgressCommit(User user) {
        UUID uuid = UUID.randomUUID();

        Revision revision = revisionFactory.createNew(vf.createIRI(REVISION_NAMESPACE + uuid));
        revision.setAdditions(vf.createIRI(ADDITIONS_NAMESPACE + uuid));
        revision.setDeletions(vf.createIRI(DELETIONS_NAMESPACE + uuid));

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(
                IN_PROGRESS_COMMIT_NAMESPACE + uuid));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));
        inProgressCommit.setProperty(revision.getResource(), vf.createIRI(Activity.generated_IRI));
        inProgressCommit.getModel().addAll(revision.getModel());

        return inProgressCommit;
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource commitId,
                                       @Nullable Model additions, @Nullable Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testInProgressCommitPath(catalogId, versionedRDFRecordId, commitId, conn);
            Resource additionsResource = getAdditionsResource(commitId, conn);
            Resource deletionsResource = getDeletionsResource(commitId, conn);
            conn.begin();
            addChanges(additionsResource, deletionsResource, additions, conn);
            addChanges(deletionsResource, additionsResource, deletions, conn);
            conn.commit();
        }
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                       @Nullable Model additions, @Nullable Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            InProgressCommit commit = getInProgressCommit(versionedRDFRecordId, user.getResource(), conn);
            testInProgressCommitPath(catalogId, versionedRDFRecordId, commit.getResource(), conn);
            Resource additionsResource = getAdditionsResource(commit);
            Resource deletionsResource = getDeletionsResource(commit);
            conn.begin();
            addChanges(additionsResource, deletionsResource, additions, conn);
            addChanges(deletionsResource, additionsResource, deletions, conn);
            conn.commit();
        }
    }

    @Override
    public void addCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Commit commit) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch branch = getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            conn.begin();
            addCommit(branch, commit, conn);
            conn.commit();
        }
    }

    @Override
    public Resource addCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, User user,
                              String message) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch branch = getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            Commit baseCommit = branch.getHead_resource().map(resource -> getObject(resource, commitFactory, conn))
                    .orElse(null);
            InProgressCommit inProgressCommit = getInProgressCommit(versionedRDFRecordId, user.getResource(), conn);
            Commit newCommit = createCommit(inProgressCommit, message, baseCommit, null);
            conn.begin();
            addCommit(branch, newCommit, conn);
            removeObject(inProgressCommit, conn);
            conn.commit();
            return newCommit.getResource();
        }
    }

    @Override
    public Resource addCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, User user,
                              String message, Model additions, Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch branch = getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            Commit baseCommit = branch.getHead_resource().map(resource -> getObject(resource, commitFactory, conn))
                    .orElse(null);
            conn.begin();
            Resource commitId = addCommit(branch, user, message, additions, deletions, baseCommit, null, conn);
            conn.commit();
            return commitId;
        }
    }

    private Resource addCommit(Branch branch, User user, String message, Model additions, Model deletions,
                           Commit baseCommit, Commit auxCommit, RepositoryConnection conn) {
        InProgressCommit inProgressCommit = createInProgressCommit(user);
        Resource additionsResource = getAdditionsResource(inProgressCommit);
        Resource deletionsResource = getDeletionsResource(inProgressCommit);
        addChanges(additionsResource, deletionsResource, additions, conn);
        addChanges(deletionsResource, additionsResource, deletions, conn);
        Commit newCommit = createCommit(inProgressCommit, message, baseCommit, auxCommit);
        addCommit(branch, newCommit, conn);
        return newCommit.getResource();
    }

    private void addCommit(Branch branch, Commit commit, RepositoryConnection conn) {
        if (!resourceExists(commit.getResource(), conn)) {
            branch.setHead(commit);
            removeObject(branch, conn);
            addObject(branch, conn);
            addObject(commit, conn);
        } else {
            throw throwAlreadyExists(commit.getResource(), commitFactory);
        }
    }

    @Override
    public void addInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                    InProgressCommit inProgressCommit) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Resource userIRI = (Resource) inProgressCommit.getProperty(vf.createIRI(Activity.wasAssociatedWith_IRI))
                    .orElseThrow(() -> new IllegalArgumentException("User not set on InProgressCommit "
                            + inProgressCommit.getResource().stringValue()));
            if (getInProgressCommitIRI(versionedRDFRecordId, userIRI, conn).isPresent()) {
                throw new IllegalStateException("User " + userIRI.stringValue()
                        + " already has an InProgressCommit for Record " + versionedRDFRecordId.stringValue());
            }
            VersionedRDFRecord record = getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory, conn);
            if (!resourceExists(inProgressCommit.getResource(), conn)) {
                inProgressCommit.setOnVersionedRDFRecord(record);
                addObject(inProgressCommit, conn);
            } else {
                throw throwAlreadyExists(inProgressCommit.getResource(), inProgressCommitFactory);
            }
        }
    }

    @Override
    public Optional<Commit> getCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                      Resource commitId) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = repository.getConnection()) {
            testBranchPath(catalogId, versionedRDFRecordId, branchId, conn);
            Branch branch = optObject(branchId, branchFactory, conn).orElseThrow(() ->
                    throwThingNotFound(branchId, branchFactory));
            Resource head = getHeadCommitIRI(branch);
            if (head.equals(commitId) || getCommitChain(head, conn).contains(commitId)) {
                return Optional.of(optObject(commitId, commitFactory, conn).orElseThrow(() ->
                        throwThingNotFound(commitId, commitFactory)));
            } else {
                return Optional.empty();
            }
        } finally {
            log.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Commit getHeadCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testBranchPath(catalogId, versionedRDFRecordId, branchId, conn);
            Branch branch = optObject(branchId, branchFactory, conn).orElseThrow(() ->
                    throwThingNotFound(branchId, branchFactory));
            Resource head = getHeadCommitIRI(branch);
            return optObject(head, commitFactory, conn).orElseThrow(() -> throwThingNotFound(head, commitFactory));
        }
    }

    @Override
    public Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                                          User user) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testRecordPath(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            return getInProgressCommitIRI(versionedRDFRecordId, user.getResource(), conn).flatMap(resource ->
                    Optional.of(optObject(resource, inProgressCommitFactory, conn).orElseThrow(() ->
                            throwThingNotFound(resource, inProgressCommitFactory))));
        }
    }

    private InProgressCommit getInProgressCommit(Resource recordId, Resource userId, RepositoryConnection conn) {
        Resource commitId = getInProgressCommitIRI(recordId, userId, conn).orElseThrow(() ->
                new IllegalArgumentException("InProgressCommit not found"));
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                                          Resource inProgressCommitId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testRecordPath(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            return optObject(inProgressCommitId, inProgressCommitFactory, conn).flatMap(inProgressCommit -> {
                Resource onRecord = inProgressCommit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                        new IllegalStateException("InProgressCommit " + inProgressCommitId.stringValue()
                                + " has no Record set."));
                return !onRecord.equals(versionedRDFRecordId) ? Optional.empty() : Optional.of(inProgressCommit);
            });
        }
    }

    private InProgressCommit getInProgressCommit(Resource catalogId, Resource recordId, Resource commitId,
                                                 RepositoryConnection conn) {
        testInProgressCommitPath(catalogId, recordId, commitId, conn);
        return getObject(commitId, inProgressCommitFactory, conn);
    }

    @Override
    public Difference getCommitDifference(Resource commitId) {
        return getCommitDifference(commitId, commitFactory);
    }

    private <T extends Commit> Difference getCommitDifference(Resource commitId, OrmFactory<T> factory) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = repository.getConnection()) {
            testObjectId(commitId, factory.getTypeIRI(), conn);
            Resource additionsIRI = getAdditionsResource(commitId, conn);
            Resource deletionsIRI = getDeletionsResource(commitId, conn);
            Model addModel = mf.createModel();
            Model deleteModel = mf.createModel();
            conn.getStatements(null, null, null, additionsIRI).forEach(statement ->
                    addModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            conn.getStatements(null, null, null, deletionsIRI).forEach(statement ->
                    deleteModel.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            return new SimpleDifference.Builder()
                    .additions(addModel)
                    .deletions(deleteModel)
                    .build();
        } finally {
            log.trace("getCommitDifference took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource
            inProgressCommitId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            InProgressCommit commit = getInProgressCommit(catalogId, versionedRDFRecordId, inProgressCommitId, conn);
            removeObject(commit, conn);
        }
    }

    @Override
    public void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testRecordPath(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            InProgressCommit commit = getInProgressCommit(versionedRDFRecordId, user.getResource(), conn);
            removeObject(commit, conn);
        }
    }

    @Override
    public Model applyInProgressCommit(Resource inProgressCommitId, Model entity) {
        Difference diff = getCommitDifference(inProgressCommitId, inProgressCommitFactory);
        Model result = mf.createModel(entity);
        result.addAll(diff.getAdditions());
        diff.getDeletions().forEach(statement -> result.remove(statement.getSubject(), statement.getPredicate(),
                statement.getObject()));
        return result;
    }

    @Override
    public List<Commit> getCommitChain(Resource commitId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testObjectId(commitId, commitFactory.getTypeIRI(), conn);
            return getCommitChain(commitId, conn).stream()
                    .map(resource -> getObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    private List<Resource> getCommitChain(Resource commitId, RepositoryConnection conn) {
        List<Resource> results = new ArrayList<>();
        Iterator<Value> commits = getCommitChainIterator(commitId, conn, false);
        commits.forEachRemaining(commit -> results.add((Resource) commit));
        return results;
    }

    @Override
    public List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Resource head = getHeadCommitIRI(catalogId, versionedRDFRecordId, branchId, conn);
            return getCommitChain(head, conn).stream()
                    .map(resource -> getObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public Model getCompiledResource(Resource commitId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return getCompiledResource(commitId, conn);
        }
    }

    private Model getCompiledResource(Resource commitId, RepositoryConnection conn) {
        testObjectId(commitId, commitFactory.getTypeIRI(), conn);
        Iterator<Value> iterator = getCommitChainIterator(commitId, conn, true);
        Model model = createModelFromIterator(iterator, conn);
        model.remove(null, null, null, vf.createIRI(DELETION_CONTEXT));
        return model;
    }

    @Override
    public Set<Conflict> getConflicts(Resource leftId, Resource rightId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            testObjectId(leftId, commitFactory.getTypeIRI(), conn);
            testObjectId(rightId, commitFactory.getTypeIRI(), conn);
            LinkedList<Value> leftList = new LinkedList<>();
            LinkedList<Value> rightList = new LinkedList<>();

            getCommitChainIterator(leftId, conn, true).forEachRemaining(leftList::add);
            getCommitChainIterator(rightId, conn, true).forEachRemaining(rightList::add);

            ListIterator<Value> leftIterator = leftList.listIterator();
            ListIterator<Value> rightIterator = rightList.listIterator();

            Value originalEnd = null;
            while (leftIterator.hasNext() && rightIterator.hasNext()) {
                Value currentId = leftIterator.next();
                if (!currentId.equals(rightIterator.next())) {
                    leftIterator.previous();
                    rightIterator.previous();
                    break;
                } else {
                    originalEnd = currentId;
                }
            }
            if (originalEnd == null) {
                throw new IllegalArgumentException("No common parent between Commit " + leftId.stringValue()
                        + " and " + rightId.stringValue());
            }

            Model left = createModelFromIterator(leftIterator, conn);
            Model right = createModelFromIterator(rightIterator, conn);

            Model duplicates = mf.createModel(left);
            duplicates.retainAll(right);

            left.removeAll(duplicates);
            right.removeAll(duplicates);

            Resource deletionContext = vf.createIRI(DELETION_CONTEXT);

            Model leftDeletions = mf.createModel(left.filter(null, null, null, deletionContext));
            Model rightDeletions = mf.createModel(right.filter(null, null, null, deletionContext));

            left.removeAll(leftDeletions);
            right.removeAll(rightDeletions);

            Set<Conflict> result = new HashSet<>();

            Model original = getCompiledResource((Resource) originalEnd, conn);
            IRI rdfType = vf.createIRI(RDF.TYPE.stringValue());

            leftDeletions.forEach(statement -> {
                Resource subject = statement.getSubject();
                IRI predicate = statement.getPredicate();
                if (predicate.equals(rdfType) || right.contains(subject, predicate, null)) {
                    result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                            rightDeletions));
                    Stream.of(left, right, rightDeletions).forEach(item ->
                            item.remove(subject, predicate, null));
                }
            });

            rightDeletions.forEach(statement -> {
                Resource subject = statement.getSubject();
                IRI predicate = statement.getPredicate();
                if (predicate.equals(rdfType) || left.contains(subject, predicate, null)) {
                    result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                            rightDeletions));
                    Stream.of(left, leftDeletions, right).forEach(item ->
                            item.remove(subject, predicate, null));
                }
            });

            left.forEach(statement -> {
                Resource subject = statement.getSubject();
                IRI predicate = statement.getPredicate();
                if (right.contains(subject, predicate, null)) {
                    result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                            rightDeletions));
                    Stream.of(leftDeletions, right, rightDeletions).forEach(item ->
                            item.remove(subject, predicate, null));
                }
            });

            return result;
        }
    }

    @Override
    public Resource mergeBranches(Resource catalogId, Resource versionedRDFRecordId, Resource sourceBranchId,
                                  Resource targetBranchId, User user, Model additions, Model deletions) {
        try (RepositoryConnection conn = repository.getConnection()) {
            Branch sourceBranch = getBranch(catalogId, versionedRDFRecordId, sourceBranchId, branchFactory, conn);
            Branch targetBranch = getBranch(catalogId, versionedRDFRecordId, targetBranchId, branchFactory, conn);
            conn.begin();
            Resource commitId = addCommit(targetBranch, user, getMergeMessage(sourceBranch, targetBranch), additions,
                    deletions, getObject(getHeadCommitIRI(targetBranch), commitFactory, conn),
                    getObject(getHeadCommitIRI(sourceBranch), commitFactory, conn), conn);
            conn.commit();
            return commitId;
        }
    }

    @Override
    public Difference getDiff(Model original, Model changed) {
        Model originalCopy = mf.createModel(original);
        Model changedCopy = mf.createModel(changed);
        original.forEach(statement -> {
            Resource subject = statement.getSubject();
            IRI predicate = statement.getPredicate();
            Value object = statement.getObject();
            if (changedCopy.contains(subject, predicate, object)) {
                originalCopy.remove(subject, predicate, object);
                changedCopy.remove(subject, predicate, object);
            }
        });

        return new SimpleDifference.Builder()
                .additions(changedCopy)
                .deletions(originalCopy)
                .build();
    }

    /**
     * Creates a conflict using the provided parameters as the data to construct it.
     *
     * @param subject        The Resource identifying the conflicted statement's subject.
     * @param predicate      The IRI identifying the conflicted statement's predicate.
     * @param original       The Model of the original item.
     * @param left           The Model of the left item being compared.
     * @param leftDeletions  The Model of the deleted statements from the left Model.
     * @param right          The Model of the right item being compared.
     * @param rightDeletions The Model of the deleted statements from the right Model.
     * @return A Conflict created using all of the provided data.
     */
    private Conflict createConflict(Resource subject, IRI predicate, Model original, Model left, Model
            leftDeletions,
                                    Model right, Model rightDeletions) {
        Difference leftDifference = new SimpleDifference.Builder()
                .additions(mf.createModel(left).filter(subject, predicate, null))
                .deletions(mf.createModel(leftDeletions).filter(subject, predicate, null))
                .build();

        Difference rightDifference = new SimpleDifference.Builder()
                .additions(mf.createModel(right).filter(subject, predicate, null))
                .deletions(mf.createModel(rightDeletions).filter(subject, predicate, null))
                .build();

        return new SimpleConflict.Builder(mf.createModel(original).filter(subject, predicate, null),
                vf.createIRI(subject.stringValue()))
                .leftDifference(leftDifference)
                .rightDifference(rightDifference)
                .build();
    }

    private <T extends Thing> T getObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        return optObject(id, factory, conn).orElseThrow(() ->
                new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                        + " could not be found"));
    }

    private <T extends Thing> Optional<T> optObject(Resource
                                                            id, OrmFactory<T> factory, RepositoryConnection conn) {
        Model model = mf.createModel();
        RepositoryResult<Statement> statements = conn.getStatements(null, null, null, id);
        statements.forEach(model::add);
        return factory.getExisting(id, model);
    }

    /**
     * Adds the model for a Catalog to the repository which contains the provided metadata using the provided Resource
     * as the context.
     *
     * @param catalogId   The Resource identifying the Catalog you wish you create.
     * @param title       The title text.
     * @param description The description text.
     */

    private void addCatalogToRepo(Resource catalogId, String title, String description) {
        try (RepositoryConnection conn = repository.getConnection()) {
            OffsetDateTime now = OffsetDateTime.now();

            Catalog catalog = catalogFactory.createNew(catalogId);
            catalog.setProperty(vf.createLiteral(title), vf.createIRI(DCTERMS.TITLE.stringValue()));
            catalog.setProperty(vf.createLiteral(description), vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
            catalog.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.ISSUED.stringValue()));
            catalog.setProperty(vf.createLiteral(now), vf.createIRI(DCTERMS.MODIFIED.stringValue()));

            conn.add(catalog.getModel(), catalogId);
        }
    }

    /**
     * Gets the pre-existing catalog using the provided IRI.
     *
     * @param catalogId The Resource identifying the Catalog that the user wishes to get back.
     * @return The Catalog identified by the provided IRI.
     * @throws MatOntoException if RepositoryConnection has a problem or the catalog could not be found.
     */
    private Optional<Catalog> optCatalog(Resource catalogId) {
        if (resourceExists(catalogId, Catalog.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Model catalogModel = mf.createModel();
                RepositoryResult<Statement> statements = conn.getStatements(catalogId, null, null, catalogId);
                statements.forEach(catalogModel::add);
                return catalogFactory.getExisting(catalogId, catalogModel);
            }
        }
        return Optional.empty();
    }

    private Catalog getCatalog(Resource catalogId) {
        return optCatalog(catalogId).orElseThrow(() -> new IllegalArgumentException("Catalog " + catalogId.stringValue()
                + " could not be found."));
    }

    /**
     * Checks to see if the provided Resource exists as a context in the Repository.
     *
     * @param resourceIRI The Resource context to look for in the Repository.
     * @param conn        The RepositoryConnection to use for lookup.
     * @return True if the Resource is in the Repository as a context for statements; otherwise, false.
     */
    private boolean resourceExists(Resource resourceIRI, RepositoryConnection conn) {
        return conn.getStatements(null, null, null, resourceIRI).hasNext();
    }

    /**
     * Checks to see if the provided Resource exists in the Repository and is of the provided type.
     *
     * @param resourceIRI The Resource to look for in the Repository
     * @param type        The String of the IRI identifying the type of entity in the Repository.
     * @return True if the Resource is in the Repository; otherwise, false.
     */
    private boolean resourceExists(Resource resourceIRI, String type) {
        try (RepositoryConnection conn = repository.getConnection()) {
            return resourceExists(resourceIRI, type, conn);
        }
    }

    /**
     * Checks to see if the provided Resource exists in the Repository and is of the provided type.
     *
     * @param resourceIRI The Resource to look for in the Repository.
     * @param type        The String of the IRI identifying the type of entity in the Repository.
     * @param conn        The RepositoryConnection to use for lookup.
     * @return True if the Resource is in the Repository; otherwise, false.
     */
    private boolean resourceExists(Resource resourceIRI, String type, RepositoryConnection conn) {
        return conn.getStatements(null, vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(type), resourceIRI)
                .hasNext();
    }

    /**
     * Creates the base for the sorting options Object.
     */
    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(DCTERMS.MODIFIED.stringValue()), "modified");
        sortingOptions.put(vf.createIRI(DCTERMS.ISSUED.stringValue()), "issued");
        sortingOptions.put(vf.createIRI(DCTERMS.TITLE.stringValue()), "title");
    }

    /**
     * Adds the properties provided by the parameters to the provided Record.
     *
     * @param record   The Record to add the properties to.
     * @param config   The RecordConfig which contains the properties to set.
     * @param issued   The OffsetDateTime of when the Record was issued.
     * @param modified The OffsetDateTime of when the Record was modified.
     * @param <T>      An Object which extends the Record class.
     * @return T which contains all of the properties provided by the parameters.
     */
    private <T extends Record> T addPropertiesToRecord(T record, RecordConfig config, OffsetDateTime issued,
                                                       OffsetDateTime modified) {
        record.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record.setProperty(vf.createLiteral(issued), vf.createIRI(DCTERMS.ISSUED.stringValue()));
        record.setProperty(vf.createLiteral(modified), vf.createIRI(DCTERMS.MODIFIED.stringValue()));
        record.setProperties(config.getPublishers().stream().map(User::getResource).collect(Collectors.toSet()),
                vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        if (config.getIdentifier() != null) {
            record.setProperty(vf.createLiteral(config.getIdentifier()),
                    vf.createIRI(DCTERMS.IDENTIFIER.stringValue()));
        }
        if (config.getDescription() != null) {
            record.setProperty(vf.createLiteral(config.getDescription()),
                    vf.createIRI(DCTERMS.DESCRIPTION.stringValue()));
        }
        if (config.getKeywords() != null) {
            record.setKeyword(config.getKeywords().stream().map(vf::createLiteral).collect(Collectors.toSet()));
        }
        return record;
    }

    private void removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate,
                                              RepositoryConnection conn) {
        remove(objectId, conn);
        conn.remove(removeFromId, vf.createIRI(predicate), objectId, removeFromId);
    }

    private <T extends Thing> void updateObject(T object, RepositoryConnection conn) {
        removeObject(object, conn);
        conn.add(object.getModel(), object.getResource());
    }

    /**
     * Removes the Resource which is identified.
     *
     * @param resourceId The Resource identifying the element to be removed.
     * @param conn       A connection to the Repository.
     */
    private void remove(Resource resourceId, RepositoryConnection conn) {
        conn.remove((Resource) null, null, null, resourceId);
    }

    /**
     * Removes the provided Object.
     *
     * @param object The Object in the Repository to remove.
     * @param conn   A connection to the Repository.
     */
    private <T extends Thing> void removeObject(T object, RepositoryConnection conn) {
        remove(object.getResource(), conn);
    }

    /**
     * Removes the UnversionedRecord created from the provided Record along with all associated Distributions.
     *
     * @param record The Record to remove.
     */
    private void removeUnversionedRecord(Record record, RepositoryConnection conn) {
        unversionedRecordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(unversionedRecord -> {
                    unversionedRecord.getUnversionedDistribution_resource().forEach(conn::clear);
                    removeObject(unversionedRecord, conn);
                });
    }

    /**
     * Removes the VersionedRecord created from the provided Record along with all associated Versions and all the
     * Distributions associated with those Versions.
     *
     * @param record The Record to remove.
     */
    private void removeVersionedRecord(Record record, RepositoryConnection conn) {
        versionedRecordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRecord -> {
                    versionedRecord.getVersion_resource()
                            .forEach(resource -> removeVersion(versionedRecord.getResource(), resource, conn));
                    removeObject(versionedRecord, conn);
                });
    }

    /**
     * Removes the VersionedRDFRecord created from the provided Record along with all associated Versions, all the
     * Distributions associated with those Versions, all associated Branches, and all the Commits associated with those
     * Branches.
     *
     * @param record The Record to remove.
     */
    private void removeVersionedRDFRecord(Record record, RepositoryConnection conn) {
        versionedRDFRecordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(versionedRDFRecord -> {
                    versionedRDFRecord.getVersion_resource()
                            .forEach(resource -> removeVersion(versionedRDFRecord.getResource(), resource, conn));
                    conn.remove(versionedRDFRecord.getResource(), vf.createIRI(VersionedRDFRecord.masterBranch_IRI),
                            null, versionedRDFRecord.getResource());
                    versionedRDFRecord.getBranch_resource()
                            .forEach(resource -> removeBranch(versionedRDFRecord.getResource(), resource, conn));
                    removeObject(versionedRDFRecord, conn);
                });
    }

    /**
     * Gets the Resource identifying the graph that contain the additions statements.
     *
     * @param commitId The Resource identifying the Commit that have the additions.
     * @param conn     The RepositoryConnection to be used to get the Resource from.
     * @return The Resource for the additions graph.
     */
    private Resource getAdditionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.additions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Additions not set on Commit " + commitId.stringValue());
        }
        return (Resource) results.next().getObject();
    }

    private Resource getAdditionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.additions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Additions not set on Commit " + commit.getResource().stringValue());
        }
        return (Resource) new ArrayList<>(values).get(0);
    }

    /**
     * Gets the Resource identifying the graph that contain the deletions statements.
     *
     * @param commitId The Resource identifying the Commit that have the deletions.
     * @param conn     The RepositoryConnection to be used to get the Resource from.
     * @return The Resource for the deletions graph.
     */
    private Resource getDeletionsResource(Resource commitId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(Revision.deletions_IRI), null,
                commitId);
        if (!results.hasNext()) {
            throw new IllegalStateException("Deletions not set on Commit " + commitId.stringValue());
        }
        return (Resource) results.next().getObject();
    }

    private Resource getDeletionsResource(Commit commit) {
        Set<Value> values = mf.createModel(commit.getModel()).filter(null, vf.createIRI(Revision.deletions_IRI), null)
                .objects();
        if (values.isEmpty()) {
            throw new IllegalStateException("Deletions not set on Commit " + commit.getResource().stringValue());
        }
        return (Resource) new ArrayList<>(values).get(0);
    }

    /**
     * Adds the statements from the Revision associated with the Commit identified by the provided Resource to the
     * provided Model using the RepositoryConnection to get the statements from the repository.
     *
     * @param model    The Model to update.
     * @param commitId The Resource identifying the Commit.
     * @param conn     The RepositoryConnection to query the repository.
     * @return A Model with the proper statements added.
     */
    private Model addRevisionStatementsToModel(Model model, Resource commitId, RepositoryConnection conn) {
        Resource additionsId = getAdditionsResource(commitId, conn);
        Resource deletionsId = getDeletionsResource(commitId, conn);
        conn.getStatements(null, null, null, additionsId).forEach(statement -> {
            Resource subject = statement.getSubject();
            IRI predicate = statement.getPredicate();
            Value object = statement.getObject();
            if (!model.contains(subject, predicate, object)) {
                model.add(subject, predicate, object);
            }
        });
        conn.getStatements(null, null, null, deletionsId).forEach(statement -> {
            Resource subject = statement.getSubject();
            IRI predicate = statement.getPredicate();
            Value object = statement.getObject();
            if (model.contains(subject, predicate, object)) {
                model.remove(subject, predicate, object);
            } else {
                model.add(subject, predicate, object, vf.createIRI(DELETION_CONTEXT));
            }
        });
        return model;
    }

    /**
     * Gets an iterator which contains all of the Resources (commits) is the specified direction, either ascending or
     * descending by date. If descending, the provided Resource identifying a commit will be first.
     *
     * @param commitId The Resource identifying the commit that you want to get the chain for.
     * @param conn     The RepositoryConnection which will be queried for the Commits.
     * @param asc      Whether or not the iterator should be ascending by date
     * @return Iterator of Values containing the requested commits.
     */
    private Iterator<Value> getCommitChainIterator(Resource commitId, RepositoryConnection conn, boolean asc) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        TupleQueryResult result = query.evaluate();
        LinkedList<Value> commits = new LinkedList<>();
        result.forEach(bindingSet -> bindingSet.getBinding(PARENT_BINDING).ifPresent(binding ->
                commits.add(binding.getValue())));
        commits.addFirst(commitId);
        return asc ? commits.descendingIterator() : commits.iterator();
    }

    /**
     * Builds the Model based on the provided Iterator and Resource.
     *
     * @param iterator The Iterator of commits which are supposed to be contained in the Model in ascending order.
     * @param conn     The RepositoryConnection which contains the requested Commits.
     * @return The Model containing the summation of all the Commits statements.
     */
    private Model createModelFromIterator(Iterator<Value> iterator, RepositoryConnection conn) {
        Model model = mf.createModel();
        iterator.forEachRemaining(value -> addRevisionStatementsToModel(model, (Resource) value, conn));
        return model;
    }

    private boolean commitIsReferenced(Resource commitId, RepositoryConnection conn) {
        IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
        IRI baseCommitIRI = vf.createIRI(Commit.baseCommit_IRI);
        IRI auxiliaryCommitIRI = vf.createIRI(Commit.auxiliaryCommit_IRI);
        return Stream.of(headCommitIRI, baseCommitIRI, auxiliaryCommitIRI)
                .map(iri -> conn.getStatements(null, iri, commitId).hasNext())
                .reduce(false, (iri1, iri2) -> iri1 || iri2);
    }

    /**
     * Gets the IRI of the InProgressCommit for the User identified by the provided Resource for the VersionedRDFRecord
     * identified by the provided Resource.
     *
     * @param recordId The IRI of the Record the InProgressCommit should be associated with.
     * @param userId   The IRI of the User whose InProgressCommit you want to get.
     * @return The Resource of the InProgressCommit if it exists.
     */
    private Optional<Resource> getInProgressCommitIRI(Resource recordId, Resource userId, RepositoryConnection
            conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_IN_PROGRESS_COMMIT);
        query.setBinding(USER_BINDING, userId);
        query.setBinding(RECORD_BINDING, recordId);
        TupleQueryResult queryResult = query.evaluate();
        if (queryResult.hasNext()) {
            return Optional.of(Bindings.requiredResource(queryResult.next(), COMMIT_BINDING));
        } else {
            return Optional.empty();
        }
    }

    /**
     * Adds the provided statements to the provided Commit as changes in the target named graph. If a statement in the
     * changes exists in the opposite named graph, they are removed from that named graph and not added to the target.
     *
     * @param targetNamedGraph   A Resource identifying the target named graph for the changes. Assumed to be the
     *                           additions or deletions named graph of a Commit.
     * @param oppositeNamedGraph A Resource identifying the opposite named graph from the target. For example, the
     *                           opposite of a deletions named graph is the additions and vice versa.
     * @param changes            The statements which represent changes to the named graph.
     * @param conn               A connection to the Repository
     */
    private void addChanges(Resource targetNamedGraph, Resource oppositeNamedGraph, Model changes,
                            RepositoryConnection conn) {
        if (changes != null) {
            changes.forEach(statement -> {
                if (!conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                        oppositeNamedGraph).hasNext()) {
                    conn.add(statement, targetNamedGraph);
                } else {
                    conn.remove(statement, oppositeNamedGraph);
                }
            });
        }
    }

    private <T extends Thing> void addObject(T object, RepositoryConnection conn) {
        conn.add(object.getModel(), object.getResource());
    }

    private void testObjectId(Resource objectId, IRI classId, RepositoryConnection conn) {
        if (!resourceExists(objectId, classId.stringValue(), conn)) {
            throw new IllegalArgumentException(classId.getLocalName() + " " + objectId.stringValue()
                    + " could not be found.");
        }
    }

    private void testRecordPath(Resource catalogId, Resource recordId, RepositoryConnection conn) {
        testRecordPath(catalogId, recordId, vf.createIRI(Record.TYPE), conn);
    }

    private void testRecordPath(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection
            conn) {
        testObjectId(catalogId, vf.createIRI(Catalog.TYPE), conn);
        testObjectId(recordId, recordType, conn);
        if (!conn.getStatements(recordId, vf.createIRI(Record.catalog_IRI), catalogId).hasNext()) {
            throw throwDoesNotBelong(recordId, recordFactory, catalogId, catalogFactory);
        }
    }

    private void testUnversionedDistributionPath(Resource catalogId, Resource recordId, Resource
            distributionId,
                                                 RepositoryConnection conn) {
        UnversionedRecord record = getRecord(catalogId, recordId, unversionedRecordFactory, conn);
        Set<Resource> distributionIRIs = record.getUnversionedDistribution_resource();
        if (!distributionIRIs.contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, recordId, recordFactory);
        }
    }

    private void testVersionPath(Resource catalogId, Resource recordId, Resource
            versionId, RepositoryConnection conn) {
        VersionedRecord record = getRecord(catalogId, recordId, versionedRecordFactory, conn);
        Set<Resource> versionIRIs = record.getVersion_resource();
        if (!versionIRIs.contains(versionId)) {
            throw throwDoesNotBelong(versionId, versionFactory, recordId, recordFactory);
        }
    }

    private void testVersionedDistributionPath(Resource catalogId, Resource recordId, Resource versionId,
                                               Resource distributionId, RepositoryConnection conn) {
        Version version = getVersion(catalogId, recordId, versionId, versionFactory, conn);
        if (!version.getVersionedDistribution_resource().contains(distributionId)) {
            throw throwDoesNotBelong(distributionId, distributionFactory, versionId, versionFactory);
        }
    }

    private void testBranchPath(Resource catalogId, Resource recordId, Resource branchId, RepositoryConnection
            conn) {
        VersionedRDFRecord record = getRecord(catalogId, recordId, versionedRDFRecordFactory, conn);
        Set<Resource> branchIRIs = record.getBranch_resource();
        if (!branchIRIs.contains(branchId)) {
            throw throwDoesNotBelong(branchId, branchFactory, recordId, recordFactory);
        }
    }

    private void testInProgressCommitPath(Resource catalogId, Resource recordId, Resource commitId,
                                          RepositoryConnection conn) {
        testRecordPath(catalogId, recordId, versionedRDFRecordFactory.getTypeIRI(), conn);
        InProgressCommit commit = getObject(commitId, inProgressCommitFactory, conn);
        Resource onRecord = commit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                new IllegalStateException("Record was not set on InProgressCommit " + commitId.stringValue()));
        if (!onRecord.equals(recordId)) {
            throw throwDoesNotBelong(commitId, commitFactory, recordId, recordFactory);
        }
    }

    private Resource getHeadCommitIRI(Resource catalogId, Resource recordId, Resource branchId,
                                      RepositoryConnection conn) {
        return getHeadCommitIRI(getBranch(catalogId, recordId, branchId, branchFactory, conn));
    }

    private Resource getHeadCommitIRI(Branch branch) {
        return branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch "
                + branch.getResource().stringValue() + " does not have a head Commit set."));
    }

    /**
     * Creates a message for the Commit that occurs as a result of a merge between the provided Branches.
     *
     * @param sourceBranch The source Branch of the merge.
     * @param targetBranch The target Branch of the merge.
     * @return A string message to use for the merge Commit.
     */
    private String getMergeMessage(Branch sourceBranch, Branch targetBranch) {
        IRI titleIRI = vf.createIRI(DCTERMS.TITLE.stringValue());
        String sourceName = sourceBranch.getProperty(titleIRI).orElse(sourceBranch.getResource()).stringValue();
        String targetName = targetBranch.getProperty(titleIRI).orElse(targetBranch.getResource()).stringValue();
        return "Merge of " + sourceName + " into " + targetName;
    }

    private <T extends Thing> IllegalArgumentException throwAlreadyExists(Resource id, OrmFactory<T> factory) {
        return new IllegalArgumentException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                + " already exists");
    }

    private <T extends Thing> IllegalStateException throwThingNotFound(Resource id, OrmFactory<T> factory) {
        return new IllegalStateException(factory.getTypeIRI().getLocalName() + " " + id.stringValue()
                + " could not be found");
    }

    private <T extends Thing, S extends Thing> IllegalArgumentException
            throwDoesNotBelong(Resource child, OrmFactory<T> childFactory, Resource parent,
                               OrmFactory<S> parentFactory) {
        return new IllegalArgumentException(childFactory.getTypeIRI().getLocalName() + " " + child.stringValue()
                + " does not belong to " + parentFactory.getTypeIRI().getLocalName() + " " + parent.stringValue());
    }
}
