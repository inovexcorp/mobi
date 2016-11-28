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

import aQute.bnd.annotation.component.*;
import aQute.bnd.annotation.metatype.Configurable;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.log4j.Logger;
import org.matonto.catalog.api.*;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.catalog.config.CatalogConfig;
import org.matonto.catalog.util.SearchResults;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontologies.provo.Activity;
import org.matonto.ontologies.provo.Entity;
import org.matonto.persistence.utils.Bindings;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.Binding;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.TupleQuery;
import org.matonto.rdf.api.*;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

import javax.annotation.Nonnull;
import java.io.IOException;
import java.security.InvalidParameterException;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(
        configurationPolicy = ConfigurationPolicy.require,
        designateFactory = CatalogConfig.class,
        name = SimpleCatalogManager.COMPONENT_NAME
)
public class SimpleCatalogManager implements CatalogManager {

    static final String COMPONENT_NAME = "org.matonto.catalog.api.CatalogManager";
    private static final Logger log = Logger.getLogger(SimpleCatalogManager.class);
    private Repository repository;
    private ValueFactory vf;
    private ModelFactory mf;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private DistributionFactory distributionFactory;
    private BranchFactory branchFactory;
    private UserFactory userFactory;
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

    public SimpleCatalogManager() {}

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
    protected void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
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

    private static final String RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

    private static final String DC_TERMS = "http://purl.org/dc/terms/";
    private static final String DC_TITLE = DC_TERMS + "title";
    private static final String DC_DESCRIPTION = DC_TERMS + "description";
    private static final String DC_ISSUED = DC_TERMS + "issued";
    private static final String DC_MODIFIED = DC_TERMS + "modified";
    private static final String DC_IDENTIFIER = DC_TERMS + "identifier";

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
    public Catalog getDistributedCatalog() throws MatOntoException {
        return getCatalog(distributedCatalogIRI);
    }

    @Override
    public Catalog getLocalCatalog() throws MatOntoException {
        return getCatalog(localCatalogIRI);
    }

    @Override
    public PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams) throws
            MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            Optional<Resource> typeParam = searchParams.getTypeFilter();

            // Get Total Count
            TupleQuery countQuery = conn.prepareTupleQuery(COUNT_RECORDS_QUERY);
            countQuery.setBinding(CATALOG_BINDING, catalogId);
            if (typeParam.isPresent()) {
                countQuery.setBinding(TYPE_FILTER_BINDING, typeParam.get());
            }

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
            int limit = searchParams.getLimit();
            int offset = searchParams.getOffset();

            String sortBinding;
            Resource sortByParam = searchParams.getSortBy();
            if (sortingOptions.get(sortByParam) != null) {
                sortBinding = sortingOptions.get(sortByParam);
            } else {
                log.warn("sortBy parameter must be in the allowed list. Sorting by modified date instead.");
                sortBinding = "modified";
            }

            String querySuffix;
            Optional<Boolean> ascendingParam = searchParams.getAscending();
            if (ascendingParam.isPresent() && ascendingParam.get()) {
                querySuffix = String.format("\nORDER BY ?%s\nLIMIT %d\nOFFSET %d", sortBinding, limit, offset);
            } else {
                querySuffix = String.format("\nORDER BY DESC(?%s)\nLIMIT %d\nOFFSET %d", sortBinding, limit, offset);
            }

            String queryString = FIND_RECORDS_QUERY + querySuffix;
            TupleQuery query = conn.prepareTupleQuery(queryString);
            query.setBinding(CATALOG_BINDING, catalogId);
            if (typeParam.isPresent()) {
                query.setBinding(TYPE_FILTER_BINDING, typeParam.get());
            }

            log.debug("Query String:\n" + queryString);
            log.debug("Query Plan:\n" + query);

            // Get Results
            TupleQueryResult result = query.evaluate();

            List<Record> records = new ArrayList<>();
            BindingSet resultsBindingSet;
            while (result.hasNext() && (resultsBindingSet = result.next()).getBindingNames().contains(RECORD_BINDING)) {
                Resource resource = vf.createIRI(Bindings.requiredResource(resultsBindingSet, RECORD_BINDING)
                        .stringValue());
                Record record = processRecordBindingSet(resultsBindingSet, resource);
                records.add(record);
            }

            result.close();
            conn.close();

            log.debug("Result set size: " + records.size());

            int pageNumber = (offset / limit) + 1;

            if (records.size() > 0) {
                return new SimpleSearchResults<>(records, totalCount, limit, pageNumber);
            } else {
                return SearchResults.emptyResults();
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    @Override
    public Set<Resource> getRecordIds(Resource catalogId) throws MatOntoException {
        if (resourceExists(catalogId, Catalog.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Set<Resource> results = new HashSet<>();
                RepositoryResult<Statement> statements = conn.getStatements(null, vf.createIRI(Record.catalog_IRI),
                        catalogId);
                statements.forEach(statement -> results.add(statement.getSubject()));
                return results;
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection.", e);
            }
        }
        return Collections.emptySet();
    }

    @Override
    public <T extends Record> T createRecord(RecordConfig config, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();
        return addPropertiesToRecord(factory.createNew(vf.createIRI(RECORD_NAMESPACE + UUID.randomUUID())), config, now,
                now);
    }

    @Override
    public <T extends Record> void addRecord(Resource catalogId, T record) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI identifierIRI = vf.createIRI(DC_IDENTIFIER);
            Value identifier = record.getProperty(identifierIRI).orElseThrow(() ->
                    new MatOntoException("The Record must have an identifier."));
            if (resourceExists(catalogId, Catalog.TYPE) && !resourceExists(record.getResource()) &&
                    !conn.getStatements(null, identifierIRI, identifier).hasNext()) {
                record.setCatalog(getCatalog(catalogId));
                conn.add(record.getModel(), record.getResource());
            } else {
                throw new MatOntoException("The Record could not be added.");
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public <T extends Record> void updateRecord(Resource catalogId, T newRecord) throws MatOntoException {
        if (resourceExists(catalogId, Catalog.TYPE) && resourceExists(newRecord.getResource(), T.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                if (conn.getStatements(newRecord.getResource(), vf.createIRI(Record.catalog_IRI), catalogId)
                        .hasNext()) {
                    update(newRecord.getResource(), newRecord.getModel());
                }
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The Record could not be updated.");
        }
    }

    @Override
    public void removeRecord(Resource catalogId, Resource recordId) throws MatOntoException {
        Optional<Record> optionalRecord = getRecord(catalogId, recordId, recordFactory);
        if (optionalRecord.isPresent()) {
            Record record = optionalRecord.get();
            if (record.getModel().contains(null, null, vf.createIRI(UnversionedRecord.TYPE))) {
                removeUnversionedRecord(record);
            } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRDFRecord.TYPE))) {
                removeVersionedRDFRecord(record);
            } else if (record.getModel().contains(null, null, vf.createIRI(VersionedRecord.TYPE))) {
                removeVersionedRecord(record);
            } else {
                remove(recordId);
            }
        } else {
            throw new MatOntoException("The Record could not be removed.");
        }
    }

    @Override
    public <T extends Record> Optional<T> getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory)
            throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            boolean condition = resourceExists(recordId, T.TYPE) && conn.getStatements(recordId,
                    vf.createIRI(Record.catalog_IRI), catalogId).hasNext();
            return getObject(condition, recordId, factory);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    @Override
    public <T extends Record> Optional<T> getRecord(String identifier, OrmFactory<T> factory) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(null, vf.createIRI(DC_IDENTIFIER),
                    vf.createLiteral(identifier));
            if (statements.hasNext()) {
                return getObject(true, statements.next().getSubject(), factory);
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
        return Optional.empty();
    }

    @Override
    public Distribution createDistribution(DistributionConfig config) {
        OffsetDateTime now = OffsetDateTime.now();

        Distribution distribution = distributionFactory.createNew(vf.createIRI(DISTRIBUTION_NAMESPACE
                + UUID.randomUUID()));
        distribution.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(DC_TITLE));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(DC_ISSUED));
        distribution.setProperty(vf.createLiteral(now), vf.createIRI(DC_MODIFIED));
        if (config.getDescription() != null) {
            distribution.setProperty(vf.createLiteral(config.getDescription()), vf.createIRI(DC_DESCRIPTION));
        }
        if (config.getFormat() != null) {
            distribution.setProperty(vf.createLiteral(config.getFormat()), vf.createIRI(DC_TERMS + "format"));
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
    public void addDistributionToUnversionedRecord(Distribution distribution, Resource unversionedRecordId) throws
            MatOntoException {
        if (!addDistribution(distribution, unversionedRecordId, UnversionedRecord.unversionedDistribution_IRI)) {
            throw new MatOntoException("The Distribution could not be added.");
        }
    }

    @Override
    public void addDistributionToVersion(Distribution distribution, Resource versionId) throws MatOntoException {
        if (!addDistribution(distribution, versionId, Version.versionedDistribution_IRI)) {
            throw new MatOntoException("The Distribution could not be added.");
        }
    }

    @Override
    public void updateDistribution(Distribution newDistribution) throws MatOntoException {
        if (resourceExists(newDistribution.getResource(), Distribution.TYPE)) {
            update(newDistribution.getResource(), newDistribution.getModel());
        } else {
            throw new MatOntoException("The Distribution could not be updated.");
        }
    }

    @Override
    public void removeDistributionFromUnversionedRecord(Resource distributionId, Resource unversionedRecordId) throws
            MatOntoException {
        if (!(resourceExists(unversionedRecordId, UnversionedRecord.TYPE) && resourceExists(distributionId,
                Distribution.TYPE) && removeObjectWithRelationship(distributionId, unversionedRecordId,
                UnversionedRecord.unversionedDistribution_IRI))) {
            throw new MatOntoException("The Distribution could not be removed.");
        }
    }

    @Override
    public void removeDistributionFromVersion(Resource distributionId, Resource versionId) throws MatOntoException {
        if (!(resourceExists(versionId, Version.TYPE) && resourceExists(distributionId, Distribution.TYPE)
                && removeObjectWithRelationship(distributionId, versionId, Version.versionedDistribution_IRI))) {
            throw new MatOntoException("The Distribution could not be removed.");
        }
    }

    @Override
    public Optional<Distribution> getDistribution(Resource distributionId) throws MatOntoException {
        return getObject(resourceExists(distributionId, Distribution.TYPE), distributionId, distributionFactory);
    }

    @Override
    public <T extends Version> T createVersion(@Nonnull String title, String description, OrmFactory<T> factory) {
        OffsetDateTime now = OffsetDateTime.now();

        T version = factory.createNew(vf.createIRI(VERSION_NAMESPACE + UUID.randomUUID()));
        version.setProperty(vf.createLiteral(title), vf.createIRI(DC_TITLE));
        if (description != null) {
            version.setProperty(vf.createLiteral(description), vf.createIRI(DC_DESCRIPTION));
        }
        version.setProperty(vf.createLiteral(now), vf.createIRI(DC_ISSUED));
        version.setProperty(vf.createLiteral(now), vf.createIRI(DC_MODIFIED));

        return version;
    }

    @Override
    public <T extends Version> void addVersion(T version, Resource versionedRecordId) throws MatOntoException {
        if (!resourceExists(version.getResource()) && resourceExists(versionedRecordId, VersionedRecord.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                IRI latestVersionResource = vf.createIRI(VersionedRecord.latestVersion_IRI);
                conn.begin();
                conn.remove(versionedRecordId, latestVersionResource, null, versionedRecordId);
                conn.add(versionedRecordId, latestVersionResource, version.getResource(), versionedRecordId);
                conn.add(version.getModel(), version.getResource());
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("Version could not be added.");
        }
    }

    @Override
    public <T extends Version> void updateVersion(T newVersion) throws MatOntoException {
        if (resourceExists(newVersion.getResource(), T.TYPE)) {
            update(newVersion.getResource(), newVersion.getModel());
        } else {
            throw new MatOntoException("The Version could not be updated.");
        }
    }

    @Override
    public void removeVersion(Resource versionId, Resource versionedRecordId) throws MatOntoException {
        Optional<Version> optionalVersion = getVersion(versionId, versionFactory);
        if (optionalVersion.isPresent() && resourceExists(versionedRecordId, VersionedRecord.TYPE)
                && removeObjectWithRelationship(versionId, versionedRecordId, VersionedRecord.version_IRI)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                IRI latestVersionIRI = vf.createIRI(VersionedRecord.latestVersion_IRI);
                if (conn.getStatements(versionedRecordId, latestVersionIRI, versionId, versionedRecordId).hasNext()) {
                    conn.begin();
                    conn.remove(versionedRecordId, latestVersionIRI, versionId, versionedRecordId);
                    TupleQuery query = conn.prepareTupleQuery(GET_NEW_LATEST_VERSION);
                    query.setBinding(RECORD_BINDING, versionedRecordId);
                    TupleQueryResult result = query.evaluate();

                    Optional<Binding> binding;
                    if (result.hasNext() && (binding = result.next().getBinding("version")).isPresent()) {
                        conn.add(versionedRecordId, latestVersionIRI, binding.get().getValue(), versionedRecordId);
                    }
                    conn.commit();
                }
                Version version = optionalVersion.get();
                version.getVersionedDistribution().forEach(distribution -> remove(distribution.getResource()));
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The Version could not be removed.");
        }
    }

    @Override
    public <T extends Version> Optional<T> getVersion(Resource versionId, OrmFactory<T> factory) throws
            MatOntoException {
        return getObject(resourceExists(versionId, T.TYPE), versionId, factory);
    }

    @Override
    public Branch createBranch(@Nonnull String title, String description) {
        OffsetDateTime now = OffsetDateTime.now();

        Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_NAMESPACE + UUID.randomUUID()));
        branch.setProperty(vf.createLiteral(title), vf.createIRI(DC_TITLE));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(DC_ISSUED));
        branch.setProperty(vf.createLiteral(now), vf.createIRI(DC_MODIFIED));
        if (description != null) {
            branch.setProperty(vf.createLiteral(description), vf.createIRI(DC_DESCRIPTION));
        }

        return branch;
    }

    @Override
    public void addBranch(Branch branch, Resource versionedRDFRecordId) throws MatOntoException {
        if (!resourceExists(branch.getResource()) && resourceExists(versionedRDFRecordId, VersionedRDFRecord.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.begin();
                conn.add(versionedRDFRecordId, vf.createIRI(VersionedRDFRecord.branch_IRI), branch.getResource(),
                        versionedRDFRecordId);
                conn.add(branch.getModel(), branch.getResource());
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The Branch could not be added.");
        }
    }

    @Override
    public void addMasterBranch(Resource versionedRDFRecordId) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            if (conn.getStatements(versionedRDFRecordId, masterBranchIRI, null, versionedRDFRecordId).hasNext()) {
                throw new MatOntoException("The Record already has a master Branch.");
            } else if (resourceExists(versionedRDFRecordId, VersionedRDFRecord.TYPE)) {
                Branch branch = branchFactory.createNew(vf.createIRI(BRANCH_NAMESPACE + UUID.randomUUID()));
                branch.setProperty(vf.createLiteral("MASTER"), vf.createIRI(DC_TITLE));
                branch.setProperty(vf.createLiteral("The master branch."), vf.createIRI(DC_DESCRIPTION));
                conn.begin();
                conn.add(versionedRDFRecordId, vf.createIRI(VersionedRDFRecord.branch_IRI), branch.getResource(),
                        versionedRDFRecordId);
                conn.add(versionedRDFRecordId, masterBranchIRI, branch.getResource(), versionedRDFRecordId);
                conn.add(branch.getModel(), branch.getResource());
                conn.commit();
            } else {
                throw new MatOntoException("The master Branch could not be added.");
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public void updateBranch(Branch newBranch) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            if (resourceExists(newBranch.getResource(), Branch.TYPE)
                    && !conn.getStatements(null, masterBranchIRI, newBranch.getResource()).hasNext()) {
                update(newBranch.getResource(), newBranch.getModel());
            } else {
                throw new MatOntoException("The Branch could not be updated.");
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public void removeBranch(Resource branchId, Resource versionedRDFRecordId) throws MatOntoException {
        Optional<Branch> optionalBranch = getBranch(branchId);
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI masterBranchIRI = vf.createIRI(VersionedRDFRecord.masterBranch_IRI);
            if (conn.getStatements(versionedRDFRecordId, masterBranchIRI, branchId, versionedRDFRecordId).hasNext()) {
                throw new MatOntoException("The master Branch cannot be removed.");
            } else if (optionalBranch.isPresent() && resourceExists(versionedRDFRecordId, VersionedRDFRecord.TYPE)
                    && removeObjectWithRelationship(branchId, versionedRDFRecordId, VersionedRDFRecord.branch_IRI)) {
                Branch branch = optionalBranch.get();
                Commit headCommit = branch.getHead().orElseThrow(() ->
                        new MatOntoException("The head Commit was not set on the Branch."));
                List<Resource> chain = getCommitChain(headCommit.getResource());
                IRI headCommitIRI = vf.createIRI(Branch.head_IRI);
                IRI wasInformedByIRI = vf.createIRI(Activity.wasInformedBy_IRI);
                IRI commitIRI = vf.createIRI(Tag.commit_IRI);
                conn.begin();
                for (int i = chain.size() - 1; i >= 0; i--) {
                    Resource commitId = chain.get(i);
                    if (resourceExists(commitId, Commit.TYPE)) {
                        if (!conn.getStatements(null, headCommitIRI, commitId).hasNext()
                                || !conn.getStatements(null, wasInformedByIRI, commitId).hasNext()) {
                            conn.remove((Resource) null, null, null, commitId);
                            conn.remove((Resource) null, commitIRI, commitId);
                        } else {
                            break;
                        }
                    }
                }
                conn.commit();
            } else {
                throw new MatOntoException("The Branch could not be removed.");
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public Optional<Branch> getBranch(Resource branchId) throws MatOntoException {
        return getObject(resourceExists(branchId, Branch.TYPE), branchId, branchFactory);
    }

    @Override
    public Commit createCommit(@Nonnull InProgressCommit inProgressCommit, Set<Commit> parents,
                               @Nonnull String message) {
        IRI associatedWith = vf.createIRI(Activity.wasAssociatedWith_IRI);
        IRI informedBy = vf.createIRI(Activity.wasInformedBy_IRI);
        OffsetDateTime now = OffsetDateTime.now();
        Value user = inProgressCommit.getProperty(associatedWith).get();
        String metadata = now.toString() + user.stringValue();
        IRI generatedIRI = vf.createIRI(Activity.generated_IRI);

        if (parents != null) {
            metadata += parents.stream()
                    .sorted((commit1, commit2) -> commit1.getResource().stringValue().compareTo(commit2.getResource()
                            .stringValue()))
                    .map(commit -> commit.getResource().stringValue()).collect(Collectors.joining(""));
        }

        Commit commit = commitFactory.createNew(vf.createIRI(COMMIT_NAMESPACE + DigestUtils.shaHex(metadata)));
        commit.setProperty(inProgressCommit.getProperty(generatedIRI).get(), generatedIRI);
        commit.setProperty(vf.createLiteral(now), vf.createIRI(PROV_AT_TIME));
        commit.setProperty(vf.createLiteral(message), vf.createIRI(DC_TITLE));
        commit.setProperty(user, associatedWith);

        Model revisionModel = mf.createModel(inProgressCommit.getModel());
        revisionModel.remove(inProgressCommit.getResource(), null, null);
        Revision revision = revisionFactory.getExisting((Resource)inProgressCommit.getProperty(generatedIRI).get(),
                revisionModel);

        if (parents != null) {
            revision.setProperties(parents.stream()
                    .map(parent -> parent.getProperty(generatedIRI).get())
                    .collect(Collectors.toSet()), vf.createIRI(Entity.wasDerivedFrom_IRI));
            commit.setProperties(parents.stream()
                    .map(Commit::getResource)
                    .collect(Collectors.toSet()), informedBy);
        }

        commit.getModel().addAll(revisionModel);
        return commit;
    }

    @Override
    public InProgressCommit createInProgressCommit(User user, Resource recordId) throws
            InvalidParameterException {
        if (!resourceExists(recordId, VersionedRDFRecord.TYPE)) {
            throw new InvalidParameterException("The provided Resource does not identify a Record entity.");
        } else if (userHasInProgressCommit(user, recordId)) {
            throw new MatOntoException("The user already has an InProgressCommit for the identified Record.");
        } else {
            UUID uuid = UUID.randomUUID();

            Revision revision = revisionFactory.createNew(vf.createIRI(REVISION_NAMESPACE + uuid));
            revision.setAdditions(vf.createIRI(ADDITIONS_NAMESPACE + uuid));
            revision.setDeletions(vf.createIRI(DELETIONS_NAMESPACE + uuid));

            InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(
                    IN_PROGRESS_COMMIT_NAMESPACE + uuid));
            inProgressCommit.setOnVersionedRDFRecord(versionedRDFRecordFactory.createNew(recordId));
            inProgressCommit.setProperty(user.getResource(), vf.createIRI(Activity.wasAssociatedWith_IRI));
            inProgressCommit.setProperty(revision.getResource(), vf.createIRI(Activity.generated_IRI));
            inProgressCommit.getModel().addAll(revision.getModel());

            return inProgressCommit;
        }
    }

    @Override
    public void addAdditions(Model statements, Resource commitId) throws MatOntoException {
        if (resourceExists(commitId, InProgressCommit.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Resource additions = getAdditionsResource(commitId, conn);
                Resource deletions = getDeletionsResource(commitId, conn);
                conn.begin();
                for (Statement statement : statements) {
                    if (!conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                            deletions).hasNext()) {
                        conn.add(statement, additions);
                    } else {
                        conn.remove(statement, deletions);
                    }
                }
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The additions could not be added.");
        }
    }

    @Override
    public void addDeletions(Model statements, Resource commitId) throws MatOntoException {
        if (resourceExists(commitId, InProgressCommit.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Resource additions = getAdditionsResource(commitId, conn);
                Resource deletions = getDeletionsResource(commitId, conn);
                conn.begin();
                for (Statement statement : statements) {
                    if (!conn.getStatements(statement.getSubject(), statement.getPredicate(), statement.getObject(),
                            additions).hasNext()) {
                        conn.add(statement, deletions);
                    } else {
                        conn.remove(statement, additions);
                    }
                }
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The deletions could not be added.");
        }
    }

    @Override
    public void addCommitToBranch(Commit commit, Resource branchId) throws MatOntoException {
        if (!resourceExists(commit.getResource()) && resourceExists(branchId, Branch.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                IRI headIRI = vf.createIRI(Branch.head_IRI);
                conn.begin();
                conn.remove(branchId, headIRI, null, branchId);
                conn.add(branchId, headIRI, commit.getResource(), branchId);
                conn.add(commit.getModel(), commit.getResource());
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The Commit could not be added.");
        }
    }

    @Override
    public void addInProgressCommit(InProgressCommit inProgressCommit) throws MatOntoException {
        if (!resourceExists(inProgressCommit.getResource())) {
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.add(inProgressCommit.getModel(), inProgressCommit.getResource());
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        } else {
            throw new MatOntoException("The InProgressCommit could not be added.");
        }
    }

    @Override
    public <T extends Commit> Optional<T> getCommit(Resource commitId, OrmFactory<T> factory) throws MatOntoException {
        return getObject(resourceExists(commitId, T.TYPE), commitId, factory);
    }

    @Override
    public void removeInProgressCommit(Resource inProgressCommitId) throws MatOntoException {
        if (resourceExists(inProgressCommitId, InProgressCommit.TYPE)) {
            remove(inProgressCommitId);
        } else {
            throw new MatOntoException("The InProgressCommit could not be removed.");
        }
    }

    @Override
    public Model applyInProgressCommit(Resource inProgressCommitId, Model entity) throws MatOntoException {
        InProgressCommit inProgressCommit = this.getCommit(inProgressCommitId, inProgressCommitFactory)
                .orElseThrow(() -> new MatOntoException("The InProgressCommit could not be retrieved."));
        try (RepositoryConnection conn = repository.getConnection()) {
            Resource revisionIRI = (Resource)inProgressCommit.getProperty(vf.createIRI(Activity.generated_IRI)).get();
            Revision revision = revisionFactory.getExisting(revisionIRI, inProgressCommit.getModel());
            Resource additionsIRI = (Resource)revision.getAdditions().orElseThrow(() ->
                    new MatOntoException("The additions could not be found."));
            Resource deletionsIRI = (Resource)revision.getDeletions().orElseThrow(() ->
                    new MatOntoException("The deletions could not be found."));
            Model result = mf.createModel(entity);
            conn.getStatements(null, null, null, additionsIRI).forEach(statement -> result.add(statement.getSubject(),
                    statement.getPredicate(), statement.getObject()));
            conn.getStatements(null, null, null, deletionsIRI).forEach(statement -> result.remove(statement
                    .getSubject(), statement.getPredicate(), statement.getObject()));
            return result;
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    @Override
    public List<Resource> getCommitChain(Resource commitId) throws MatOntoException {
        List<Resource> results = new ArrayList<>();
        if (resourceExists(commitId, Commit.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Iterator<Value> commits = getCommitChainIterator(commitId, conn);
                commits.forEachRemaining(commit -> results.add((Resource) commit));
                results.add(commitId);
                return results;
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        }
        return results;
    }

    @Override
    public Optional<Model> getCompiledResource(Resource commitId) throws MatOntoException {
        if (resourceExists(commitId, Commit.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Iterator<Value> iterator = getCommitChainIterator(commitId, conn);
                Model model = createModelFromIterator(iterator, commitId, conn);
                model.remove(null, null, null, vf.createIRI(DELETION_CONTEXT));
                return Optional.of(model);
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        }
        return Optional.empty();
    }

    @Override
    public Set<Conflict> getConflicts(Resource leftId, Resource rightId) throws MatOntoException {
        if (resourceExists(leftId, Commit.TYPE) && resourceExists(rightId, Commit.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Iterator<Value> leftIterator = getCommitChainIterator(leftId, conn);
                Iterator<Value> rightIterator = getCommitChainIterator(rightId, conn);

                Value originalEnd = null;
                while (leftIterator.hasNext() && rightIterator.hasNext()) {
                    Value currentId = leftIterator.next();
                    if (!currentId.equals(rightIterator.next())) {
                        break;
                    } else {
                        originalEnd = currentId;
                    }
                }
                if (originalEnd == null) {
                    throw new MatOntoException("There is no common parent between the provided Commits.");
                }

                Model left = createModelFromIterator(leftIterator, leftId, conn);
                Model right = createModelFromIterator(rightIterator, rightId, conn);

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

                Model original = getCompiledResource((Resource)originalEnd).get();
                IRI rdfType = vf.createIRI(RDF_TYPE);

                leftDeletions.forEach(statement -> {
                    Resource subject = statement.getSubject();
                    IRI predicate = statement.getPredicate();
                    if (predicate.equals(rdfType) || right.contains(subject, predicate, null)) {
                        result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                                rightDeletions));
                        Stream.of(left, leftDeletions, right, rightDeletions).forEach(item ->
                                item.remove(subject, predicate, null));
                    }
                });

                rightDeletions.forEach(statement -> {
                    Resource subject = statement.getSubject();
                    IRI predicate = statement.getPredicate();
                    if (predicate.equals(rdfType) || left.contains(subject, predicate, null)) {
                        result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                                rightDeletions));
                        Stream.of(left, leftDeletions, right, rightDeletions).forEach(item ->
                                item.remove(subject, predicate, null));
                    }
                });

                left.forEach(statement -> {
                    Resource subject = statement.getSubject();
                    IRI predicate = statement.getPredicate();
                    if (right.contains(subject, predicate, null)) {
                        result.add(createConflict(subject, predicate, original, left, leftDeletions, right,
                                rightDeletions));
                        Stream.of(left, leftDeletions, right, rightDeletions).forEach(item ->
                                item.remove(subject, predicate, null));
                    }
                });

                return result;
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection.", e);
            }
        }
        throw new MatOntoException("One or both of the commit IRIs could not be found in the Repository.");
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
     * Checks if a User has an InProgressCommit for the VersionedRDFRecord identified by the provided Resource.
     *
     * @param user The User that is being checked.
     * @param recordId The Resource identifying the VersionedRDFRecord.
     * @return True if the User has an InProgressCommit on the VersionedRDFRecord; otherwise, false.
     */
    private boolean userHasInProgressCommit(User user, Resource recordId) {
        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(GET_IN_PROGRESS_COMMIT);
            query.setBinding(USER_BINDING, user.getResource());
            query.setBinding(RECORD_BINDING, recordId);
            return query.evaluate().hasNext();
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    /**
     * Creates a conflict using the provided parameters as the data to construct it.
     *
     * @param subject The Resource identifying the conflicted statement's subject.
     * @param predicate The IRI identifying the conflicted statement's predicate.
     * @param original The Model of the original item.
     * @param left The Model of the left item being compared.
     * @param leftDeletions The Model of the deleted statements from the left Model.
     * @param right The Model of the right item being compared.
     * @param rightDeletions The Model of the deleted statements from the right Model.
     * @return A Conflict created using all of the provided data.
     */
    private Conflict createConflict(Resource subject, IRI predicate, Model original, Model left, Model leftDeletions,
                                    Model right, Model rightDeletions) {
        Difference leftDifference = new SimpleDifference.Builder()
                .additions(mf.createModel(left.filter(subject, predicate, null)))
                .deletions(mf.createModel(leftDeletions.filter(subject, predicate, null)))
                .build();

        Difference rightDifference = new SimpleDifference.Builder()
                .additions(mf.createModel(right.filter(subject, predicate, null)))
                .deletions(mf.createModel(rightDeletions.filter(subject, predicate, null)))
                .build();

        return new SimpleConflict.Builder(mf.createModel(original.filter(subject, predicate, null)))
                .leftDifference(leftDifference)
                .rightDifference(rightDifference)
                .build();
    }

    /**
     * Gets the Object identified by the provided factory if it is available and satisfies the provided condition.
     *
     * @param condition The boolean identifying if the resource is correct.
     * @param id The Resource identifying which Object you are trying to get.
     * @param factory The OrmFactory which will create the desired Object.
     * @return An Optional containing the Object identified, if available.
     */
    private <T extends Thing> Optional<T> getObject(boolean condition, Resource id, OrmFactory<T> factory) throws
            MatOntoException {
        if (condition) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Model model = mf.createModel();
                RepositoryResult<Statement> statements = conn.getStatements(null, null, null, id);
                statements.forEach(model::add);
                if (model.size() != 0) {
                    return Optional.of(factory.getExisting(id, model));
                }
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection.", e);
            }
        }
        return Optional.empty();
    }

    /**
     * Adds the model for a Catalog to the repository which contains the provided metadata using the provided Resource
     * as the context.
     *
     * @param catalogId The Resource identifying the Catalog you wish you create.
     * @param title The title text.
     * @param description The description text.
     */
    private void addCatalogToRepo(Resource catalogId, String title, String description) {
        try (RepositoryConnection conn = repository.getConnection()) {
            OffsetDateTime now = OffsetDateTime.now();

            Catalog catalog = catalogFactory.createNew(catalogId);
            catalog.setProperty(vf.createLiteral(title), vf.createIRI(DC_TITLE));
            catalog.setProperty(vf.createLiteral(description), vf.createIRI(DC_DESCRIPTION));
            catalog.setProperty(vf.createLiteral(now), vf.createIRI(DC_ISSUED));
            catalog.setProperty(vf.createLiteral(now), vf.createIRI(DC_MODIFIED));

            conn.add(catalog.getModel(), catalogId);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    /**
     * Gets the pre-existing catalog using the provided IRI.
     *
     * @param catalogId The Resource identifying the Catalog that the user wishes to get back.
     * @return The Catalog identified by the provided IRI.
     * @throws MatOntoException if RepositoryConnection has a problem or the catalog could not be found.
     */
    private Catalog getCatalog(Resource catalogId) throws MatOntoException {
        if (resourceExists(catalogId, Catalog.TYPE)) {
            try (RepositoryConnection conn = repository.getConnection()) {
                Model catalogModel = mf.createModel();
                RepositoryResult<Statement> statements = conn.getStatements(catalogId, null, null, catalogId);
                statements.forEach(catalogModel::add);
                return catalogFactory.getExisting(catalogId, catalogModel);
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
        }
        throw new MatOntoException("The catalog could not be retrieved.");
    }

    /**
     * Checks to see if the provided Resource exists in the Repository.
     *
     * @param resourceIRI The Resource to look for in the Repository
     * @return True if the Resource is in the Repository; otherwise, false.
     */
    private boolean resourceExists(Resource resourceIRI) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            return conn.getStatements(null, null, null, resourceIRI).hasNext();
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    /**
     * Checks to see if the provided Resource exists in the Repository and is of the provided type.
     *
     * @param resourceIRI The Resource to look for in the Repository
     * @param type The String of the IRI identifying the type of entity in the Repository.
     * @return True if the Resource is in the Repository; otherwise, false.
     */
    private boolean resourceExists(Resource resourceIRI, String type) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            return conn.getStatements(null, vf.createIRI(RDF_TYPE), vf.createIRI(type), resourceIRI).hasNext();
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection.", e);
        }
    }

    /**
     * Creates the base for the sorting options Object.
     */
    private void createSortingOptions() {
        sortingOptions.put(vf.createIRI(DC_MODIFIED), "modified");
        sortingOptions.put(vf.createIRI(DC_ISSUED), "issued");
        sortingOptions.put(vf.createIRI(DC_TITLE), "title");
    }

    /**
     * Adds the properties provided by the parameters to the provided Record.
     *
     * @param record The Record to add the properties to.
     * @param config The RecordConfig which contains the properties to set.
     * @param issued The OffsetDateTime of when the Record was issued.
     * @param modified The OffsetDateTime of when the Record was modified.
     * @param <T> An Object which extends the Record class.
     * @return T which contains all of the properties provided by the parameters.
     */
    private <T extends Record> T addPropertiesToRecord(T record, RecordConfig config, OffsetDateTime issued,
                                                       OffsetDateTime modified) {
        record.setProperty(vf.createLiteral(config.getTitle()), vf.createIRI(DC_TITLE));
        record.setProperty(vf.createLiteral(issued), vf.createIRI(DC_ISSUED));
        record.setProperty(vf.createLiteral(modified), vf.createIRI(DC_MODIFIED));
        record.setProperties(config.getPublishers().stream().map(User::getResource).collect(Collectors.toSet()),
                vf.createIRI(DC_TERMS + "publisher"));
        record.setProperty(vf.createLiteral(config.getIdentifier()), vf.createIRI(DC_TERMS + "identifier"));
        if (config.getDescription() != null) {
            record.setProperty(vf.createLiteral(config.getDescription()), vf.createIRI(DC_DESCRIPTION));
        }
        if (config.getKeywords() != null) {
            record.setKeyword(config.getKeywords().stream().map(vf::createLiteral).collect(Collectors.toSet()));
        }
        return record;
    }

    /**
     * Creates a Record from the data provided in the BindingSet and Resource getting additional information from the
     * RepositoryConnection if necessary.
     *
     * @param bindingSet The BindingSet which contains the information about the Record.
     * @param resource The Resource which identifies the created Record.
     * @return A Record created from the provided information.
     */
    private Record processRecordBindingSet(BindingSet bindingSet, Resource resource) {
        String title = Bindings.requiredLiteral(bindingSet, "title").stringValue();
        String identifier = Bindings.requiredLiteral(bindingSet, "identifier").stringValue();

        Set<User> publishers = new HashSet<>();
        bindingSet.getBinding("publisher").ifPresent(binding -> {
            String[] values = StringUtils.split(binding.getValue().stringValue(), ",");

            for (String value : values) {
                publishers.add(userFactory.createNew(vf.createIRI(value)));
            }
        });

        RecordConfig.Builder builder = new RecordConfig.Builder(title, identifier, publishers);

        bindingSet.getBinding("description").ifPresent(binding ->
                builder.description(binding.getValue().stringValue()));

        bindingSet.getBinding("keyword").ifPresent(binding ->
                builder.keywords(new HashSet<>(Arrays.asList(StringUtils.split(binding.getValue().stringValue(),
                        ",")))));

        OffsetDateTime issued = Bindings.requiredLiteral(bindingSet, "issued").dateTimeValue();
        OffsetDateTime modified = Bindings.requiredLiteral(bindingSet, "modified").dateTimeValue();

        return addPropertiesToRecord(recordFactory.createNew(resource), builder.build(), issued, modified);
    }

    /**
     * Adds the provided Distribution to the identified Resource adding a triple based on the provided predicate.
     *
     * @param distribution The Distribution to add to the Repository.
     * @param resourceId The Resource identified to get the Distribution added to it.
     * @param predicate The String containing the predicate for the new statement.
     * @return True if the Distribution was successfully added; otherwise, false.
     */
    private boolean addDistribution(Distribution distribution, Resource resourceId, String predicate) throws
            MatOntoException {
        if (!resourceExists(distribution.getResource(), Distribution.TYPE) && (resourceExists(resourceId, Version.TYPE)
                || resourceExists(resourceId, UnversionedRecord.TYPE))) {
            try (RepositoryConnection conn = repository.getConnection()) {
                conn.begin();
                conn.add(resourceId, vf.createIRI(predicate), distribution.getResource(), resourceId);
                conn.add(distribution.getModel(), distribution.getResource());
                conn.commit();
            } catch (RepositoryException e) {
                throw new MatOntoException("Error in repository connection", e);
            }
            return true;
        }
        return false;
    }

    /**
     * Removes the Object identified by the Resource from the Resource identified to be removed from and removes
     * the Object statement using the provided String predicate.
     *
     * @param objectId The Resource identifying the Object to remove.
     * @param removeFromId The Resource identifying which Object to remove the Distribution from.
     * @param predicate The String identifying the predicate for the statement that needs to be removed.
     * @return True if the Distribution was successfully removed; otherwise, false.
     */
    private boolean removeObjectWithRelationship(Resource objectId, Resource removeFromId, String predicate) throws
            MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            IRI relationshipIRI = vf.createIRI(predicate);
            boolean hasRelationship = conn.getStatements(removeFromId, relationshipIRI, objectId, removeFromId)
                    .hasNext();
            if (resourceExists(objectId) && resourceExists(removeFromId) && hasRelationship) {
                conn.begin();
                conn.clear(objectId);
                conn.remove(removeFromId, relationshipIRI, objectId, removeFromId);
                conn.commit();
                return true;
            } else {
                return false;
            }
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    /**
     * Updates the Resource which is identified using the provided Model.
     *
     * @param resourceId The Resource identifying the Object that you wish to update.
     * @param model The Model containing the underlying information about the Object you are updating.
     */
    private void update(Resource resourceId, Model model) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            conn.clear(resourceId);
            conn.add(model, resourceId);
            conn.commit();
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    /**
     * Removes the Resource which is identified.
     *
     * @param resourceId The Resource identifying the element to be removed.
     * @throws MatOntoException if RepositoryConnection has a problem.
     */
    private void remove(Resource resourceId) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.clear(resourceId);
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    /**
     * Removes the UnversionedRecord created from the provided Record along with all associated Distributions.
     *
     * @param record The Record to remove.
     * @throws MatOntoException if RepositoryConnection has a problem.
     */
    private void removeUnversionedRecord(Record record) throws MatOntoException {
        UnversionedRecord unversionedRecord = unversionedRecordFactory.getExisting(record.getResource(),
                record.getModel());
        unversionedRecord.getUnversionedDistribution().forEach(distribution -> remove(distribution.getResource()));
        remove(unversionedRecord.getResource());
    }

    /**
     * Removes the VersionedRecord created from the provided Record along with all associated Versions and all the
     * Distributions associated with those Versions.
     *
     * @param record The Record to remove.
     * @throws MatOntoException if RepositoryConnection has a problem.
     */
    private void removeVersionedRecord(Record record) throws MatOntoException {
        VersionedRecord versionedRecord = versionedRecordFactory.getExisting(record.getResource(), record.getModel());
        versionedRecord.getVersion().forEach(version -> removeVersion(version.getResource(),
                versionedRecord.getResource()));
        remove(versionedRecord.getResource());
    }

    /**
     * Removes the VersionedRDFRecord created from the provided Record along with all associated Versions, all the
     * Distributions associated with those Versions, all associated Branches, and all the Commits associated with those
     * Branches.
     *
     * @param record The Record to remove.
     * @throws MatOntoException if RepositoryConnection has a problem.
     */
    private void removeVersionedRDFRecord(Record record) throws MatOntoException {
        try (RepositoryConnection conn = repository.getConnection()) {
            VersionedRDFRecord versionedRDFRecord = versionedRDFRecordFactory.getExisting(record.getResource(),
                    record.getModel());
            versionedRDFRecord.getVersion().forEach(version -> removeVersion(version.getResource(),
                    versionedRDFRecord.getResource()));
            conn.remove(versionedRDFRecord.getResource(), vf.createIRI(VersionedRDFRecord.masterBranch_IRI), null,
                    versionedRDFRecord.getResource());
            versionedRDFRecord.getBranch().forEach(branch -> removeBranch(branch.getResource(),
                    versionedRDFRecord.getResource()));
            remove(versionedRDFRecord.getResource());
        } catch (RepositoryException e) {
            throw new MatOntoException("Error in repository connection", e);
        }
    }

    /**
     * Gets the Resource identifying the graph that contain the additions statements.
     *
     * @param commitId The Resource identifying the Commit that have the additions.
     * @param conn The RepositoryConnection to be used to get the Resource from.
     * @return The Resource for the additions graph.
     */
    private Resource getAdditionsResource(Resource commitId, RepositoryConnection conn) {
        return (Resource)conn.getStatements(null, vf.createIRI(Revision.additions_IRI), null, commitId).next()
                .getObject();
    }

    /**
     * Gets the Resource identifying the graph that contain the deletions statements.
     *
     * @param commitId The Resource identifying the Commit that have the deletions.
     * @param conn The RepositoryConnection to be used to get the Resource from.
     * @return The Resource for the deletions graph.
     */
    private Resource getDeletionsResource(Resource commitId, RepositoryConnection conn) {
        return (Resource)conn.getStatements(null, vf.createIRI(Revision.deletions_IRI), null, commitId).next()
                .getObject();
    }

    /**
     * Adds the statements from the Revision associated with the Commit identified by the provided Resource to the
     * provided Model using the RepositoryConnection to get the statements from the repository.
     *
     * @param model The Model to update.
     * @param commitId The Resource identifying the Commit.
     * @param conn The RepositoryConnection to query the repository.
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
     * Gets an iterator which contains all of the Resources (commits) leading up to the provided Resource identifying a
     * commit. NOTE: this iterator does not contain the commit which you started at.
     *
     * @param commitId The Resource identifying the commit that you want to get the chain for.
     * @param conn The RepositoryConnection which will be queried for the Commits.
     * @return Iterator of Values containing the requested commits.
     */
    private Iterator<Value> getCommitChainIterator(Resource commitId, RepositoryConnection conn) {
        TupleQuery query = conn.prepareTupleQuery(GET_COMMIT_CHAIN);
        query.setBinding(COMMIT_BINDING, commitId);
        TupleQueryResult result = query.evaluate();
        LinkedList<Value> commits = new LinkedList<>();
        result.forEach(bindingSet -> bindingSet.getBinding(PARENT_BINDING).ifPresent(binding ->
                commits.add(binding.getValue())));
        return commits.descendingIterator();
    }

    /**
     * Builds the Model based on the provided Iterator and Resource.
     *
     * @param iterator The Iterator of commits which are supposed to be contained in the Model.
     * @param commitId The Resource identifying the Commit which you started with.
     * @param conn The RepositoryConnection which contains the requested Commits.
     * @return The Model containing the summation of all the Commits statements.
     */
    private Model createModelFromIterator(Iterator<Value> iterator, Resource commitId, RepositoryConnection conn) {
        Model model = mf.createModel();
        iterator.forEachRemaining(value -> addRevisionStatementsToModel(model, (Resource)value, conn));
        return addRevisionStatementsToModel(model, commitId, conn);
    }
}
