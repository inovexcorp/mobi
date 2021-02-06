package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.CatalogFactory;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.RecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.RevisionFactory;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.TagFactory;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecordFactory;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.catalog.util.SearchResults;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.Statements;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

@Component(
        name = SimpleCatalogManager.COMPONENT_NAME
)
public class SimpleCatalogManager implements CatalogManager {

    static final String COMPONENT_NAME = "com.mobi.catalog.api.CatalogManager";
    private static final Logger log = LoggerFactory.getLogger(SimpleCatalogManager.class);
    private ValueFactory vf;
    private ModelFactory mf;
    private CatalogConfigProvider configProvider;
    private CatalogUtilsService utils;
    private MergeRequestManager mergeRequestManager;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private DistributionFactory distributionFactory;
    private BranchFactory branchFactory;
    private InProgressCommitFactory inProgressCommitFactory;
    private CommitFactory commitFactory;
    private OrmFactoryRegistry factoryRegistry;
    private RevisionFactory revisionFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionFactory versionFactory;
    private TagFactory tagFactory;
    private Map<com.mobi.rdf.api.Resource, String> sortingOptions = new HashMap<>();

    /**
     * A map of the available RecordServices. The string is get typeIRI for the individual RecordService.
     */
    private Map<Class, RecordService> recordServices = new HashMap<>();

    private <T extends Record> RecordService<T> getRecordService(Class<T> clazz) {
        return recordServices.get(clazz);
    }

    public SimpleCatalogManager() {
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        vf = valueFactory;
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        mf = modelFactory;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setUtils(CatalogUtilsService utils) {
        this.utils = utils;
    }

    @Reference
    void setMergeRequestManager(MergeRequestManager mergeRequestManager) {
        this.mergeRequestManager = mergeRequestManager;
    }

    @Reference
    void setCatalogFactory(CatalogFactory catalogFactory) {
        this.catalogFactory = catalogFactory;
    }

    @Reference
    void setRecordFactory(RecordFactory recordFactory) {
        this.recordFactory = recordFactory;
    }

    @Reference
    void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    void setBranchFactory(BranchFactory branchFactory) {
        this.branchFactory = branchFactory;
    }

    @Reference
    void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setRevisionFactory(RevisionFactory revisionFactory) {
        this.revisionFactory = revisionFactory;
    }

    @Reference
    void setVersionedRDFRecordFactory(VersionedRDFRecordFactory versionedRDFRecordFactory) {
        this.versionedRDFRecordFactory = versionedRDFRecordFactory;
    }

    @Reference
    void setVersionedRecordFactory(VersionedRecordFactory versionedRecordFactory) {
        this.versionedRecordFactory = versionedRecordFactory;
    }

    @Reference
    void setUnversionedRecordFactory(UnversionedRecordFactory unversionedRecordFactory) {
        this.unversionedRecordFactory = unversionedRecordFactory;
    }

    @Reference
    void setVersionFactory(VersionFactory versionFactory) {
        this.versionFactory = versionFactory;
    }

    @Reference
    void setTagFactory(TagFactory tagFactory) {
        this.tagFactory = tagFactory;
    }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference(type = '*', dynamic = true)
    void addRecordService(RecordService<? extends Record> recordService) {
        recordServices.put(recordService.getType(), recordService);
    }

    void removeRecordService(RecordService<? extends Record> recordService) {
        recordServices.remove(recordService.getType());
    }

    private static final String PROV_AT_TIME = "http://www.w3.org/ns/prov#atTime";

    private static final String FIND_RECORDS_QUERY;
    private static final String COUNT_RECORDS_QUERY;
    private static final String RECORD_BINDING = "record";
    private static final String CATALOG_BINDING = "catalog";
    private static final String RECORD_COUNT_BINDING = "record_count";
    private static final String TYPE_FILTER_BINDING = "type_filter";
    private static final String SEARCH_BINDING = "search_text";

    static {
        try {
            FIND_RECORDS_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/find-records.rq"),
                    StandardCharsets.UTF_8
            );
            COUNT_RECORDS_QUERY = IOUtils.toString(
                    SimpleCatalogManager.class.getResourceAsStream("/count-records.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Activate
    protected void start() {
        createSortingOptions();
    }

    @Modified
    protected void modified() {
        start();
    }

    @Override
    public Catalog getDistributedCatalog() {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getExpectedObject(configProvider.getDistributedCatalogIRI(), catalogFactory, conn);
        }
    }

    @Override
    public Catalog getLocalCatalog() {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getExpectedObject(configProvider.getLocalCatalogIRI(), catalogFactory, conn);
        }
    }

    @Override
    public PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
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
            Resource sortByParam = searchParams.getSortBy().orElse(vf.createIRI(_Thing.modified_IRI));
            StringBuilder binding = new StringBuilder();
            if (sortByParam.equals(vf.createIRI(_Thing.title_IRI))) {
                binding.append("lcase(?").append(sortingOptions.getOrDefault(sortByParam, "modified")).append(")");
            } else {
                binding.append("?").append(sortingOptions.getOrDefault(sortByParam, "modified"));
            }
            Optional<Boolean> ascendingParam = searchParams.getAscending();
            if (ascendingParam.isPresent() && ascendingParam.get()) {
                querySuffix.append(binding);
            } else {
                querySuffix.append("DESC(").append(binding).append(")");
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
                records.add(utils.getRecord(catalogId, resource, recordFactory, conn));
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
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(catalogId, vf.createIRI(Catalog.TYPE), conn);
            Set<Resource> results = new HashSet<>();
            conn.getStatements(null, vf.createIRI(Record.catalog_IRI), catalogId)
                    .forEach(statement -> results.add(statement.getSubject()));
            return results;
        }
    }

    @Override
    public <T extends Record> T createRecord(User user, RecordOperationConfig config, Class<T> recordClass) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            RecordService<T> recordService = Optional.ofNullable(getRecordService(recordClass))
                    .orElseThrow(() -> new IllegalArgumentException("Service for factory " + recordClass.toString()
                            + " is unavailable or doesn't exist."));
            return recordService.create(user, config, conn);
        }
    }

    @Override
    public <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();
        return addPropertiesToRecord(factory.createNew(vf.createIRI(Catalogs.RECORD_NAMESPACE + UUID.randomUUID())),
                config, now,
                now);
    }

    @Override
    public <T extends Record> void addRecord(Resource catalogId, T record) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (conn.containsContext(record.getResource())) {
                throw utils.throwAlreadyExists(record.getResource(), recordFactory);
            }
            record.setCatalog(utils.getObject(catalogId, catalogFactory, conn));
            conn.begin();
            if (record.getModel().contains(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    versionedRDFRecordFactory.getTypeIRI())) {
                addMasterBranch((VersionedRDFRecord) record, conn);
            } else {
                utils.addObject(record, conn);
            }
            conn.commit();
        }
    }

    @Override
    public <T extends Record> void updateRecord(Resource catalogId, T newRecord) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateRecord(catalogId, newRecord.getResource(), recordFactory.getTypeIRI(), conn);
            conn.begin();
            utils.updateObject(newRecord, conn);
            conn.commit();
        }
    }

    @Override
    public <T extends Record> T removeRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory) {
        T record;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(catalogId, catalogFactory.getTypeIRI(), conn);

            record = utils.optObject(recordId, factory, conn).orElseThrow(()
                    -> new IllegalArgumentException("Record " + recordId + " does not exist"));

            Resource catalog = record.getCatalog_resource().orElseThrow(()
                    -> new IllegalStateException("Record " + recordId + " does not have a Catalog set"));

            if (catalog.equals(catalogId)) {
                conn.begin();
                if (record.getModel().contains(null, null, vf.createIRI(UnversionedRecord.TYPE))) {
                    removeUnversionedRecord(record, conn);
                } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRDFRecord.TYPE))) {
                    removeVersionedRDFRecord(record, conn);
                } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRecord.TYPE))) {
                    removeVersionedRecord(record, conn);
                } else {
                    utils.removeObject(record, conn);
                }
                conn.commit();
            } else {
                record = null;
            }
        }
        return record;
    }

    @Override
    public <T extends Record> T deleteRecord(User user, Resource recordId, Class<T> recordClass) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            OrmFactory<? extends Record> serviceType = getFactory(recordId, conn, true);
            if (!serviceType.getType().equals(recordClass)) {
                throw new IllegalArgumentException("Service for factory " + recordClass
                        + " is unavailable or doesn't exist.");
            }
            RecordService<T> service = getRecordService(recordClass);
            return service.delete(recordId, user, conn);
        }
    }

    @Override
    public <T extends Record> Optional<T> getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(catalogId, catalogFactory.getTypeIRI(), conn);
            return utils.optObject(recordId, factory, conn).flatMap(record -> {
                Resource catalog = record.getCatalog_resource().orElseThrow(() ->
                        new IllegalStateException("Record " + recordId + " does not have a Catalog set"));
                return !catalog.equals(catalogId) ? Optional.empty() : Optional.of(record);
            });
        }
    }

    @Override
    public Set<Distribution> getUnversionedDistributions(Resource catalogId, Resource unversionedRecordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            UnversionedRecord record = utils.getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            return record.getUnversionedDistribution_resource().stream()
                    .map(resource -> utils.getExpectedObject(resource, distributionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public Distribution createDistribution(DistributionConfig config) {
        OffsetDateTime now = OffsetDateTime.now();

        Distribution distribution = distributionFactory.createNew(vf.createIRI(Catalogs.DISTRIBUTION_NAMESPACE
                + UUID.randomUUID()));
        distribution.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        if (config.getDescription() != null) {
            distribution.setProperty(vf.createLiteral(config.getDescription()),
                    vf.createIRI(_Thing.description_IRI));
        }
        if (config.getFormat() != null) {
            distribution.setProperty(vf.createLiteral(config.getFormat()), vf.createIRI(_Thing.format_IRI));
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
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            UnversionedRecord record = utils.getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            if (conn.containsContext(distribution.getResource())) {
                throw utils.throwAlreadyExists(distribution.getResource(), distributionFactory);
            }
            Set<Distribution> distributions = record.getUnversionedDistribution_resource().stream()
                    .map(distributionFactory::createNew)
                    .collect(Collectors.toSet());
            distributions.add(distribution);
            record.setUnversionedDistribution(distributions);
            conn.begin();
            utils.updateObject(record, conn);
            utils.addObject(distribution, conn);
            conn.commit();
        }
    }

    @Override
    public void updateUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Distribution newDistribution) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateUnversionedDistribution(catalogId, unversionedRecordId, newDistribution.getResource(), conn);
            conn.begin();
            utils.updateObject(newDistribution, conn);
            conn.commit();
        }
    }

    @Override
    public void removeUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                              Resource distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution distribution = utils.getUnversionedDistribution(catalogId, unversionedRecordId, distributionId,
                    conn);
            conn.begin();
            utils.removeObjectWithRelationship(distribution.getResource(), unversionedRecordId,
                    UnversionedRecord.unversionedDistribution_IRI, conn);
            conn.commit();
        }
    }

    @Override
    public Optional<Distribution> getUnversionedDistribution(Resource catalogId, Resource unversionedRecordId,
                                                             Resource distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            UnversionedRecord record = utils.getRecord(catalogId, unversionedRecordId, unversionedRecordFactory, conn);
            if (!record.getUnversionedDistribution_resource().contains(distributionId)) {
                return Optional.empty();
            }
            return Optional.of(utils.getExpectedObject(distributionId, distributionFactory, conn));
        }
    }

    @Override
    public Set<Version> getVersions(Resource catalogId, Resource versionedRecordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRecord record = utils.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            return record.getVersion_resource().stream()
                    .map(resource -> utils.getExpectedObject(resource, versionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T version = factory.createNew(vf.createIRI(Catalogs.VERSION_NAMESPACE + UUID.randomUUID()));
        version.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        if (description != null) {
            version.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        }
        version.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        version.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));

        return version;
    }

    @Override
    public <T extends Version> void addVersion(Resource catalogId, Resource versionedRecordId, T version) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRecord record = utils.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            if (conn.containsContext(version.getResource())) {
                throw utils.throwAlreadyExists(version.getResource(), versionFactory);
            }
            record.setLatestVersion(version);
            Set<Version> versions = record.getVersion_resource().stream()
                    .map(versionFactory::createNew)
                    .collect(Collectors.toSet());
            versions.add(version);
            record.setVersion(versions);
            conn.begin();
            utils.updateObject(record, conn);
            utils.addObject(version, conn);
            conn.commit();
        }
    }

    @Override
    public <T extends Version> void updateVersion(Resource catalogId, Resource versionedRecordId, T newVersion) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateVersion(catalogId, versionedRecordId, newVersion.getResource(), conn);
            conn.begin();
            utils.updateObject(newVersion, conn);
            conn.commit();
        }
    }

    @Override
    public void removeVersion(Resource catalogId, Resource versionedRecordId, Resource versionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = utils.getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            conn.begin();
            utils.removeVersion(versionedRecordId, version, conn);
            conn.commit();
        }
    }

    @Override
    public <T extends Version> Optional<T> getVersion(Resource catalogId, Resource versionedRecordId,
                                                      Resource versionId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRecord record = utils.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            if (!record.getVersion_resource().contains(versionId)) {
                return Optional.empty();
            }
            return Optional.of(utils.getExpectedObject(versionId, factory, conn));
        }
    }

    @Override
    public <T extends Version> Optional<T> getLatestVersion(Resource catalogId, Resource versionedRecordId,
                                                            OrmFactory<T> factory) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRecord record = utils.getRecord(catalogId, versionedRecordId, versionedRecordFactory, conn);
            return record.getLatestVersion_resource().flatMap(resource ->
                    Optional.of(utils.getExpectedObject(resource, factory, conn)));
        }
    }

    @Override
    public Commit getTaggedCommit(Resource catalogId, Resource versionedRecordId, Resource versionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateVersion(catalogId, versionedRecordId, versionId, conn);
            Tag tag = utils.getExpectedObject(versionId, tagFactory, conn);
            Resource commitId = tag.getCommit_resource().orElseThrow(() ->
                    new IllegalStateException("Tag " + versionId + " does not have a Commit set"));
            return utils.getExpectedObject(commitId, commitFactory, conn);
        }
    }

    @Override
    public Set<Distribution> getVersionedDistributions(Resource catalogId, Resource versionedRecordId,
                                                       Resource versionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = utils.getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            return version.getVersionedDistribution_resource().stream()
                    .map(resource -> utils.getExpectedObject(resource, distributionFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public void addVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                         Distribution distribution) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = utils.getVersion(catalogId, versionedRecordId, versionId, versionFactory, conn);
            if (conn.containsContext(distribution.getResource())) {
                throw utils.throwAlreadyExists(distribution.getResource(), distributionFactory);
            }
            Set<Distribution> distributions = version.getVersionedDistribution_resource().stream()
                    .map(distributionFactory::createNew)
                    .collect(Collectors.toSet());
            distributions.add(distribution);
            version.setVersionedDistribution(distributions);
            conn.begin();
            utils.updateObject(version, conn);
            utils.addObject(distribution, conn);
            conn.commit();
        }
    }

    @Override
    public void updateVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Distribution newDistribution) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateVersionedDistribution(catalogId, versionedRecordId, versionId, newDistribution.getResource(),
                    conn);
            conn.begin();
            utils.updateObject(newDistribution, conn);
            conn.commit();
        }
    }

    @Override
    public void removeVersionedDistribution(Resource catalogId, Resource versionedRecordId, Resource versionId,
                                            Resource distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution distribution = utils.getVersionedDistribution(catalogId, versionedRecordId, versionId,
                    distributionId, conn);
            conn.begin();
            utils.removeObjectWithRelationship(distribution.getResource(), versionId, Version.versionedDistribution_IRI,
                    conn);
            conn.commit();
        }
    }

    @Override
    public Optional<Distribution> getVersionedDistribution(Resource catalogId, Resource recordId, Resource versionId,
                                                           Resource distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = utils.getVersion(catalogId, recordId, versionId, versionFactory, conn);
            if (!version.getVersionedDistribution_resource().contains(distributionId)) {
                return Optional.empty();
            }
            return Optional.of(utils.getExpectedObject(distributionId, distributionFactory, conn));
        }
    }

    @Override
    public Set<Branch> getBranches(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            return record.getBranch_resource().stream()
                    .map(resource -> utils.getExpectedObject(resource, branchFactory, conn))
                    .collect(Collectors.toSet());
        }
    }

    @Override
    public <T extends Branch> T createBranch(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T branch = factory.createNew(vf.createIRI(Catalogs.BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
        if (description != null) {
            branch.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
        }

        return branch;
    }

    @Override
    public <T extends Branch> void addBranch(Resource catalogId, Resource versionedRDFRecordId, T branch) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            if (conn.containsContext(branch.getResource())) {
                throw utils.throwAlreadyExists(branch.getResource(), branchFactory);
            }
            Set<Branch> branches = record.getBranch_resource().stream()
                    .map(branchFactory::createNew)
                    .collect(Collectors.toSet());
            branches.add(branch);
            record.setBranch(branches);
            conn.begin();
            utils.updateObject(record, conn);
            utils.addObject(branch, conn);
            conn.commit();
        }
    }

    @Override
    public void addMasterBranch(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            conn.begin();
            addMasterBranch(record, conn);
            conn.commit();
        }
    }

    private void addMasterBranch(VersionedRDFRecord record, RepositoryConnection conn) {
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
        utils.updateObject(record, conn);
        utils.addObject(branch, conn);
    }

    @Override
    public <T extends Branch> void updateBranch(Resource catalogId, Resource versionedRDFRecordId, T newBranch) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            utils.validateBranch(catalogId, versionedRDFRecordId, newBranch.getResource(), conn);
            if (conn.contains(null, masterBranchIRI, newBranch.getResource())) {
                throw new IllegalArgumentException("Branch " + newBranch.getResource()
                        + " is the master Branch and cannot be updated.");
            }
            conn.begin();
            utils.updateObject(newBranch, conn);
            conn.commit();
        }
    }

    @Override
    public void updateHead(Resource catalogId, Resource versionedRDFRecordId, Resource branchId, Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch branch = utils.getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            conn.begin();
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            branch.setHead(commitFactory.createNew(commitId));
            utils.updateObject(branch, conn);
            conn.commit();
        }
    }

    @Override
    public List<Resource> removeBranch(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch branch = utils.getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            if (conn.contains(versionedRDFRecordId, masterBranchIRI, branchId, versionedRDFRecordId)) {
                throw new IllegalStateException("Branch " + branchId + " is the master Branch and cannot be removed.");
            }
            conn.begin();
            List<Resource> deletedCommits = utils.removeBranch(versionedRDFRecordId, branch, conn);
            mergeRequestManager.cleanMergeRequests(versionedRDFRecordId, branchId, conn);
            conn.commit();
            return deletedCommits;
        }
    }

    @Override
    public <T extends Branch> Optional<T> getBranch(Resource catalogId, Resource versionedRDFRecordId,
                                                    Resource branchId, OrmFactory<T> factory) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            if (!record.getBranch_resource().contains(branchId)) {
                return Optional.empty();
            }
            return Optional.of(utils.getExpectedObject(branchId, factory, conn));
        }
    }

    @Override
    public Branch getMasterBranch(Resource catalogId, Resource versionedRDFRecordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            Resource branchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("Record " + versionedRDFRecordId
                            + " does not have a master Branch set."));
            return utils.getExpectedObject(branchId, branchFactory, conn);
        }
    }

    @Override
    public Commit createCommit(@Nonnull InProgressCommit inProgressCommit, @Nonnull String message, Commit baseCommit,
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
        Commit commit = commitFactory.createNew(vf.createIRI(Catalogs.COMMIT_NAMESPACE
                + DigestUtils.sha1Hex(metadata.toString())));
        commit.setProperty(revisionIRI, generatedIRI);
        commit.setProperty(vf.createLiteral(now), vf.createIRI(PROV_AT_TIME));
        commit.setProperty(vf.createLiteral(message), vf.createIRI(_Thing.title_IRI));
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

        Revision revision = revisionFactory.createNew(vf.createIRI(Catalogs.REVISION_NAMESPACE + uuid));
        revision.setAdditions(vf.createIRI(Catalogs.ADDITIONS_NAMESPACE + uuid));
        revision.setDeletions(vf.createIRI(Catalogs.DELETIONS_NAMESPACE + uuid));

        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(
                Catalogs.IN_PROGRESS_COMMIT_NAMESPACE + uuid));
        inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));
        inProgressCommit.setProperty(revision.getResource(), vf.createIRI(Activity.generated_IRI));
        inProgressCommit.getModel().addAll(revision.getModel());

        return inProgressCommit;
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, Resource commitId,
                                       @Nullable Model additions, @Nullable Model deletions) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateInProgressCommit(catalogId, versionedRDFRecordId, commitId, conn);
            conn.begin();
            utils.updateCommit(commitId, additions, deletions, conn);
            conn.commit();
        }
    }

    @Override
    public void updateInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                       @Nullable Model additions, @Nullable Model deletions) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            Optional<Resource> inProgressCommitIri = utils.getInProgressCommitIRI(versionedRDFRecordId,
                    user.getResource(), conn);
            if (inProgressCommitIri.isPresent()) {
                InProgressCommit commit = utils.getExpectedObject(inProgressCommitIri.get(), inProgressCommitFactory,
                        conn);
                conn.begin();
                utils.updateCommit(commit, additions, deletions, conn);
                conn.commit();
            } else {
                InProgressCommit commit = createInProgressCommit(user);
                commit.setOnVersionedRDFRecord(versionedRDFRecordFactory.createNew(versionedRDFRecordId));
                conn.begin();
                utils.addObject(commit, conn);
                utils.updateCommit(commit, additions, deletions, conn);
                conn.commit();
            }
        }
    }

    @Override
    public void addInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                    InProgressCommit inProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource userIRI = (Resource) inProgressCommit.getProperty(vf.createIRI(Activity.wasAssociatedWith_IRI))
                    .orElseThrow(() -> new IllegalArgumentException("User not set on InProgressCommit "
                            + inProgressCommit.getResource()));
            if (utils.getInProgressCommitIRI(versionedRDFRecordId, userIRI, conn).isPresent()) {
                throw new IllegalStateException("User " + userIRI + " already has an InProgressCommit for Record "
                        + versionedRDFRecordId);
            }
            VersionedRDFRecord record = utils.getRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory,
                    conn);
            if (conn.containsContext(inProgressCommit.getResource())) {
                throw utils.throwAlreadyExists(inProgressCommit.getResource(), inProgressCommitFactory);
            }
            inProgressCommit.setOnVersionedRDFRecord(record);
            utils.addObject(inProgressCommit, conn);
        }
    }

    @Override
    public Optional<Commit> getCommit(Resource commitId) {
        long start = System.currentTimeMillis();
        Optional<Commit> rtn;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            rtn = utils.optObject(commitId, commitFactory, conn);
        } finally {
            log.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
        return rtn;
    }

    @Override
    public Optional<Commit> getCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                      Resource commitId) {
        long start = System.currentTimeMillis();
        Optional<Commit> rtn = Optional.empty();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateBranch(catalogId, versionedRDFRecordId, branchId, conn);
            if (utils.commitInBranch(branchId, commitId, conn)) {
                rtn = Optional.of(utils.getExpectedObject(commitId, commitFactory, conn));
            }
        } finally {
            log.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
        return rtn;
    }

    @Override
    public Commit getHeadCommit(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateBranch(catalogId, versionedRDFRecordId, branchId, conn);
            Branch branch = utils.getExpectedObject(branchId, branchFactory, conn);
            Resource head = utils.getHeadCommitIRI(branch);
            return utils.getExpectedObject(head, commitFactory, conn);
        }
    }

    @Override
    public Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                                          User user) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            return utils.getInProgressCommitIRI(versionedRDFRecordId, user.getResource(), conn).flatMap(resource ->
                    Optional.of(utils.getExpectedObject(resource, inProgressCommitFactory, conn)));
        }
    }

    @Override
    public Optional<InProgressCommit> getInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                                          Resource inProgressCommitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            return utils.optObject(inProgressCommitId, inProgressCommitFactory, conn).flatMap(inProgressCommit -> {
                Resource onRecord = inProgressCommit.getOnVersionedRDFRecord_resource().orElseThrow(() ->
                        new IllegalStateException("InProgressCommit " + inProgressCommitId + " has no Record set."));
                return !onRecord.equals(versionedRDFRecordId) ? Optional.empty() : Optional.of(inProgressCommit);
            });
        }
    }

    @Override
    public Revision getRevision(Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getRevision(commitId, conn);
        }
    }

    @Override
    public Difference getRevisionChanges(Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getRevisionChanges(commitId, conn);
        }
    }

    @Override
    public Difference getCommitDifference(Resource commitId) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCommitDifference(commitId, conn);
        } finally {
            log.trace("getCommitDifference took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Difference getCommitDifferenceForSubject(Resource subjectId, Resource commitId) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCommitDifferenceForSubject(subjectId, commitId, conn);
        } finally {
            log.trace("getCommitDifference took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public PagedDifference getCommitDifferencePaged(Resource commitId, int limit, int offset) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCommitDifferencePaged(commitId, conn, limit, offset);
        } finally {
            log.trace("getCommitDifferencePaged took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId,
                                       Resource inProgressCommitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            InProgressCommit commit = utils.getInProgressCommit(catalogId, versionedRDFRecordId, inProgressCommitId,
                    conn);
            conn.begin();
            utils.removeInProgressCommit(commit, conn);
            conn.commit();
        }
    }

    @Override
    public void removeInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateRecord(catalogId, versionedRDFRecordId, versionedRDFRecordFactory.getTypeIRI(), conn);
            InProgressCommit commit = utils.getInProgressCommit(versionedRDFRecordId, user.getResource(), conn);
            conn.begin();
            utils.removeInProgressCommit(commit, conn);
            conn.commit();
        }
    }

    @Override
    public Model applyInProgressCommit(Resource inProgressCommitId, Model entity) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(inProgressCommitId, inProgressCommitFactory.getTypeIRI(), conn);
            return utils.applyDifference(entity, utils.getCommitDifference(inProgressCommitId, conn));
        } finally {
            log.trace("applyInProgressCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public List<Commit> getCommitChain(Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCommitChain(commitId, false, conn).stream()
                    .map(resource -> utils.getExpectedObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<Commit> getCommitChain(Resource commitId, Resource targetId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            utils.validateResource(targetId, commitFactory.getTypeIRI(), conn);
            return utils.getDifferenceChain(commitId, targetId, conn).stream()
                    .map(resource -> utils.getExpectedObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch branch = utils.getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            Resource head = utils.getHeadCommitIRI(branch);
            return utils.getCommitChain(head, false, conn).stream()
                    .map(resource -> utils.getExpectedObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<Commit> getCommitChain(Resource catalogId, Resource versionedRDFRecordId, Resource branchId,
                                       final Resource targetBranchId) {
        try (final RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Branch sourceBranch = utils.getBranch(catalogId, versionedRDFRecordId, branchId, branchFactory, conn);
            Resource sourceHead = utils.getHeadCommitIRI(sourceBranch);

            Branch targetBranch = utils.getBranch(catalogId, versionedRDFRecordId, targetBranchId, branchFactory, conn);
            Resource targetHead = utils.getHeadCommitIRI(targetBranch);

            return utils.getDifferenceChain(sourceHead, targetHead, conn).stream()
                    .map(res -> utils.getExpectedObject(res, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<Commit> getCommitEntityChain(Resource commitId, Resource entityId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCommitChain(commitId, entityId, false, conn).stream()
                    .map(resource -> utils.getExpectedObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public List<Commit> getCommitEntityChain(Resource commitId, Resource targetId, Resource entityId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            utils.validateResource(targetId, commitFactory.getTypeIRI(), conn);
            return utils.getDifferenceChain(commitId, targetId, entityId, conn).stream()
                    .map(resource -> utils.getExpectedObject(resource, commitFactory, conn))
                    .collect(Collectors.toList());
        }
    }

    @Override
    public Model getCompiledResource(Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateResource(commitId, commitFactory.getTypeIRI(), conn);
            return utils.getCompiledResource(commitId, conn);
        }
    }

    @Override
    public Model getCompiledResource(List<Commit> commitList) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getCompiledResource(commitList.stream().map(commit -> commit.getResource())
                    .collect(Collectors.toList()), conn);
        }
    }

    @Override
    public Model getCompiledResource(Resource versionedRDFRecordId, Resource branchId, Resource commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            utils.validateCommitPath(configProvider.getLocalCatalogIRI(), versionedRDFRecordId, branchId, commitId,
                    conn);
            return utils.getCompiledResource(commitId, conn);
        }
    }

    @Override
    public Difference getDifference(Resource sourceCommitId, Resource targetCommitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getCommitDifference(utils.getDifferenceChain(sourceCommitId, targetCommitId, conn, true),
                    conn);
        }
    }

    @Override
    public PagedDifference getDifferencePaged(Resource sourceCommitId, Resource targetCommitId, int limit, int offset) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getCommitDifferencePaged(utils.getDifferenceChain(sourceCommitId, targetCommitId, conn, true),
                    conn, limit, offset);
        }
    }

    @Override
    public Set<Conflict> getConflicts(Resource leftId, Resource rightId) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return utils.getConflicts(leftId, rightId, conn);
        } finally {
            log.trace("getConflicts took {}ms", System.currentTimeMillis() - start);
        }
    }

    @Override
    public Difference getDiff(Model original, Model changed) {
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

        original.forEach(statement -> {
            // TODO: Previously we only checked s,p,o and not the named graph. Why?
            if (!changed.contains(statement)) {
                deletions.add(statement);
            }
        });

        changed.forEach(statement -> {
            if(!original.contains(statement)) {
                additions.add(statement);
            }
        });

        return new Difference.Builder()
                .additions(additions)
                .deletions(deletions)
                .build();
    }

    @Override
    public void export(Resource recordIRI, RecordOperationConfig config) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            OrmFactory<? extends Record> factory = getFactory(recordIRI, conn, false);
            RecordService<? extends Record> service = getRecordService(factory.getType());
            service.export(recordIRI, config, conn);
        }
    }

    @Override
    public void export(List<Resource> recordIRIs, RecordOperationConfig config) {
        recordIRIs.forEach(iri -> export(iri, config));
    }

    /**
     * Takes a recordId and returns the factory for that record. If a factory for that particular record is not
     * registered, it returns the most specific factory available if the flag is set to false.
     *
     * @param recordId The record IRI
     * @param exactOnly A flag to indicate whether to do an exact match with the record type. If false, will allow
     *                  closest match to be returned
     * @return the record factory of a given recordId
     */
    private OrmFactory<? extends Record> getFactory(Resource recordId, RepositoryConnection conn, boolean exactOnly) {
        List<Resource> types = RepositoryResults.asList(
                conn.getStatements(recordId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null))
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());

        List<OrmFactory<? extends Record>> classType = factoryRegistry.getSortedFactoriesOfType(Record.class).stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());

        if (exactOnly && classType.size() > 0) {
            if (recordServices.keySet().contains(classType.get(0).getType())) {
                return classType.get(0);
            }
        } else {
            for (OrmFactory<? extends Record> factory : classType) {
                if (recordServices.keySet().contains(factory.getType())) {
                    return factory;
                }
            }
        }
        throw new IllegalArgumentException("No known record services for this record type.");
    }

    /**
     * Creates the base for the sorting options Object.
     */
    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(_Thing.modified_IRI), "modified");
        sortingOptions.put(vf.createIRI(_Thing.issued_IRI), "issued");
        sortingOptions.put(vf.createIRI(_Thing.title_IRI), "title");
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
        record.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(_Thing.title_IRI));
        record.setProperty(vf.createLiteral(issued), vf.createIRI(_Thing.issued_IRI));
        record.setProperty(vf.createLiteral(modified), vf.createIRI(_Thing.modified_IRI));
        record.setProperties(config.getPublishers().stream().map(User::getResource).collect(Collectors.toSet()),
                vf.createIRI(_Thing.publisher_IRI));
        if (config.getIdentifier() != null) {
            record.setProperty(vf.createLiteral(config.getIdentifier()), vf.createIRI(_Thing.identifier_IRI));
        }
        if (config.getDescription() != null) {
            record.setProperty(vf.createLiteral(config.getDescription()), vf.createIRI(_Thing.description_IRI));
        }
        if (config.getMarkdown() != null) {
            record.setProperty(vf.createLiteral(config.getMarkdown()), vf.createIRI(DCTERMS.ABSTRACT.stringValue()));
        }
        if (config.getKeywords() != null) {
            record.setKeyword(config.getKeywords().stream().map(vf::createLiteral).collect(Collectors.toSet()));
        }
        return record;
    }

    /**
     * Removes the UnversionedRecord created from the provided Record along with all associated Distributions.
     *
     * @param record The Record to remove.
     */
    private void removeUnversionedRecord(Record record, RepositoryConnection conn) {
        unversionedRecordFactory.getExisting(record.getResource(), record.getModel())
                .ifPresent(unversionedRecord -> {
                    unversionedRecord.getUnversionedDistribution_resource().forEach(resource ->
                            utils.remove(resource, conn));
                    utils.removeObject(unversionedRecord, conn);
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
                            .forEach(resource -> utils.removeVersion(versionedRecord.getResource(), resource, conn));
                    utils.removeObject(versionedRecord, conn);
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
                    mergeRequestManager.deleteMergeRequestsWithRecordId(versionedRDFRecord.getResource(), conn);
                    versionedRDFRecord.getVersion_resource()
                            .forEach(resource -> utils.removeVersion(versionedRDFRecord.getResource(), resource, conn));
                    conn.remove(versionedRDFRecord.getResource(), vf.createIRI(VersionedRDFRecord.masterBranch_IRI),
                            null, versionedRDFRecord.getResource());
                    List<Resource> deletedCommits = new ArrayList<>();
                    versionedRDFRecord.getBranch_resource()
                            .forEach(resource -> utils.removeBranch(versionedRDFRecord.getResource(), resource,
                                    deletedCommits, conn));
                    utils.removeObject(versionedRDFRecord, conn);
                });
    }
}
