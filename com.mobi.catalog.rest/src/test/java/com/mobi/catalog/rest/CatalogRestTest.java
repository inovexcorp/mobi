package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getOrmFactoryRegistry;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static com.mobi.rest.util.RestUtils.arrayContains;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.DistributionManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.StringSortKey;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.KeywordCount;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.record.EntityMetadata;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.record.statistic.StatisticDefinition;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class CatalogRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private OrmFactory<Record> recordFactory;
    private OrmFactory<UnversionedRecord> unversionedRecordFactory;
    private OrmFactory<VersionedRecord> versionedRecordFactory;
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory;
    private OrmFactory<MappingRecord> mappingRecordFactory;
    private OrmFactory<Distribution> distributionFactory;
    private OrmFactory<Version> versionFactory;
    private OrmFactory<Tag> tagFactory;
    private OrmFactory<Branch> branchFactory;
    private OrmFactory<MasterBranch> masterBranchFactory;
    private OrmFactory<UserBranch> userBranchFactory;
    private Catalog localCatalog;
    private Catalog distributedCatalog;
    private Record testRecord;
    private UnversionedRecord testUnversionedRecord;
    private VersionedRecord testVersionedRecord;
    private VersionedRDFRecord testVersionedRDFRecord;
    private MappingRecord testMappingRecord;
    private Distribution testDistribution;
    private Version testVersion;
    private Tag testTag;
    private List<Commit> testCommits;
    private InProgressCommit testInProgressCommit;
    private Branch testBranch;
    private MasterBranch testMasterBranch;
    private UserBranch testUserBranch;
    private User user;
    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;
    private Model compiledResource;
    private Model compiledResourceWithChanges;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String ERROR_IRI = "http://mobi.com/error";
    private static final String LOCAL_IRI = "http://mobi.com/catalogs/local";
    private static final String DISTRIBUTED_IRI = "http://mobi.com/catalogs/distributed";
    private static final String RECORD_IRI = "http://mobi.com/records/test";
    private static final String DISTRIBUTION_IRI = "http://mobi.com/distributions/test";
    private static final String VERSION_IRI = "http://mobi.com/versions/test";
    private static final String[] COMMIT_IRIS = new String[]{
            "http://mobi.com/commits/0",
            "http://mobi.com/commits/1",
            "http://mobi.com/commits/2"
    };
    private static final String BRANCH_IRI = "http://mobi.com/branches/test";
    private static final String USER_IRI = "http://mobi.com/users/tester";
    private static final String ACTIVITY_IRI = "http://mobi.com/activity/test";
    private static final String CONFLICT_IRI = "http://mobi.com/conflicts/test";
    private static final String CATALOG_URL_LOCAL = "catalogs/" + encode(LOCAL_IRI);
    private static final String CATALOG_URL_DISTRIBUTED = "catalogs/" + encode(DISTRIBUTED_IRI);
    private static final String MASTER = "MASTER";

    // Mock services used in server
    private static CatalogRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static CatalogManager catalogManager;
    private static CatalogConfigProvider configProvider;
    private static RecordManager recordManager;
    private static DatasetManager datasetManager;
    private static BranchManager branchManager;
    private static CommitManager commitManager;
    private static DistributionManager distributionManager;
    private static VersionManager versionManager;
    private static DifferenceManager differenceManager;
    private static CompiledResourceManager compiledResourceManager;
    private static VersioningManager versioningManager;
    private static EngineManager engineManager;
    private static BNodeService bNodeService;
    private static CatalogProvUtils provUtils;

    @Mock
    private PaginatedSearchResults<Record> recordResults;

    @Mock
    PaginatedSearchResults<EntityMetadata> entityResults;

    @Mock
    private PaginatedSearchResults<KeywordCount> keywordResults;

    @Mock
    private Conflict conflict;

    @Mock
    private Difference difference;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection conn;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        catalogManager = mock(CatalogManager.class);
        datasetManager = mock(DatasetManager.class);
        configProvider = mock(CatalogConfigProvider.class);
        versioningManager = mock(VersioningManager.class);
        engineManager = mock(EngineManager.class);
        
        bNodeService = mock(BNodeService.class);
        provUtils = mock(CatalogProvUtils.class);
        recordManager = mock(RecordManager.class);
        branchManager = mock(BranchManager.class);
        commitManager = mock(CommitManager.class);
        distributionManager = mock(DistributionManager.class);
        versionManager = mock(VersionManager.class);
        differenceManager = mock(DifferenceManager.class);
        compiledResourceManager = mock(CompiledResourceManager.class);

        rest = new CatalogRest();
        injectOrmFactoryReferencesIntoService(rest);
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;
        rest.catalogManager = catalogManager;
        rest.datasetManager = datasetManager;
        rest.factoryRegistry = getOrmFactoryRegistry();
        rest.versioningManager = versioningManager;
        rest.bNodeService = bNodeService;
        rest.provUtils = provUtils;
        rest.recordManager = recordManager;
        rest.branchManager = branchManager;
        rest.commitManager = commitManager;
        rest.distributionManager = distributionManager;
        rest.versionManager = versionManager;
        rest.differenceManager = differenceManager;
        rest.compiledResourceManager = compiledResourceManager;
        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
        recordFactory = getRequiredOrmFactory(Record.class);
        unversionedRecordFactory = getRequiredOrmFactory(UnversionedRecord.class);
        versionedRecordFactory = getRequiredOrmFactory(VersionedRecord.class);
        versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
        mappingRecordFactory = getRequiredOrmFactory(MappingRecord.class);
        distributionFactory = getRequiredOrmFactory(Distribution.class);
        versionFactory = getRequiredOrmFactory(Version.class);
        tagFactory = getRequiredOrmFactory(Tag.class);
        branchFactory = getRequiredOrmFactory(Branch.class);
        masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
        userBranchFactory = getRequiredOrmFactory(UserBranch.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<CreateActivity> createActivityFactory = getRequiredOrmFactory(CreateActivity.class);
        OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);

        localCatalog = catalogFactory.createNew(vf.createIRI(LOCAL_IRI));
        distributedCatalog = catalogFactory.createNew(vf.createIRI(DISTRIBUTED_IRI));
        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toList());
        testInProgressCommit = inProgressCommitFactory.createNew(vf.createIRI(COMMIT_IRIS[0]));
        testBranch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        testBranch.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testBranch.setProperty(vf.createLiteral(USER_IRI), vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        testBranch.setHead(testCommits.get(0));
        testMasterBranch = masterBranchFactory.createNew(vf.createIRI(BRANCH_IRI));
        testMasterBranch.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testMasterBranch.setProperty(vf.createLiteral(USER_IRI), vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        testMasterBranch.setHead(testCommits.get(0));
        testUserBranch = userBranchFactory.createNew(vf.createIRI(BRANCH_IRI + "/user"));
        testUserBranch.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testUserBranch.setProperty(vf.createLiteral(USER_IRI), vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        testDistribution = distributionFactory.createNew(vf.createIRI(DISTRIBUTION_IRI));
        testDistribution.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        testVersion.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion.setVersionedDistribution(Collections.singleton(testDistribution));
        testTag = tagFactory.createNew(vf.createIRI(VERSION_IRI));
        testTag.setCommit(testCommits.get(0));
        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        testRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testUnversionedRecord = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testUnversionedRecord.setUnversionedDistribution(Collections.singleton(testDistribution));
        testVersionedRecord = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testVersionedRecord.setLatestVersion(testVersion);
        testVersionedRecord.setVersion(Collections.singleton(testVersion));
        testVersionedRDFRecord = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testVersionedRDFRecord.setMasterBranch(testMasterBranch);
        testVersionedRDFRecord.setBranch(Stream.of(testBranch, testUserBranch).collect(Collectors.toSet()));
        testMappingRecord = mappingRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        user = userFactory.createNew(vf.createIRI(USER_IRI));
        createActivity = createActivityFactory.createNew(vf.createIRI(ACTIVITY_IRI + "/create"));
        deleteActivity = deleteActivityFactory.createNew(vf.createIRI(ACTIVITY_IRI + "/delete"));
        compiledResource = mf.createEmptyModel();
        compiledResourceWithChanges = mf.createEmptyModel();
        compiledResourceWithChanges.addAll(compiledResource);
        compiledResourceWithChanges.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()),
                vf.createLiteral("Title"));

        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));
        when(configProvider.getLocalCatalogIRI()).thenReturn(vf.createIRI(LOCAL_IRI));
        when(configProvider.getDistributedCatalogIRI()).thenReturn(vf.createIRI(DISTRIBUTED_IRI));
        when(repo.getConnection()).thenReturn(conn);
        when(configProvider.getRepository()).thenReturn(repo);

        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));

        when(recordResults.getPage()).thenReturn(Collections.singletonList(testRecord));
        when(recordResults.getPageNumber()).thenReturn(0);
        when(recordResults.getPageSize()).thenReturn(10);
        when(recordResults.getTotalSize()).thenReturn(50);

        when(commitManager.commitInRecord(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(false);
        when(commitManager.commitInRecord(eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class))).thenReturn(true);

        when(catalogManager.getLocalCatalog(any(RepositoryConnection.class))).thenReturn(localCatalog);
        when(catalogManager.getDistributedCatalog(any(RepositoryConnection.class))).thenReturn(distributedCatalog);
        when(recordManager.getRecordIds(any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(testRecord.getResource()));
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(RepositoryConnection.class))).thenReturn(recordResults);
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class))).thenReturn(recordResults);
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), eq(recordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testRecord));
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testUnversionedRecord));
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), eq(versionedRecordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testVersionedRecord));
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), eq(versionedRDFRecordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testVersionedRDFRecord));
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), eq(mappingRecordFactory), any(RepositoryConnection.class)))
                .thenReturn(Optional.of(testMappingRecord));

        when(distributionManager.getUnversionedDistributions(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(testDistribution));
        when(distributionManager.createDistribution(any(DistributionConfig.class))).thenReturn(testDistribution);
        when(distributionManager.getUnversionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testDistribution);
        when(versionManager.getVersion(any(Resource.class), any(Resource.class), any(Resource.class), eq(versionFactory), any(RepositoryConnection.class))).thenReturn(testVersion);
        when(versionManager.getVersion(any(Resource.class), any(Resource.class), any(Resource.class), eq(tagFactory), any(RepositoryConnection.class))).thenReturn(testTag);
        when(versionManager.getVersions(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(testVersion));
        when(versionManager.getLatestVersion(any(Resource.class), any(Resource.class), eq(versionFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(testVersion));
        when(versionManager.createVersion(anyString(), any(), eq(versionFactory))).thenReturn(testVersion);
        when(versionManager.createVersion(anyString(), any(), eq(tagFactory))).thenReturn(testTag);
        when(commitManager.getTaggedCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits.get(0));
        when(distributionManager.getVersionedDistributions(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(testDistribution));
        when(distributionManager.getVersionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testDistribution);
        when(branchManager.getBranches(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Stream.of(testBranch, testUserBranch).collect(Collectors.toSet()));
        when(branchManager.getBranch(any(Resource.class), any(Resource.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(testBranch);
        when(branchManager.getBranch(any(Resource.class), any(Resource.class), eq(testUserBranch.getResource()), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(testUserBranch);
        when(branchManager.getBranch(any(Resource.class), any(Resource.class), any(Resource.class), eq(userBranchFactory), any(RepositoryConnection.class))).thenReturn(testUserBranch);
        when(branchManager.getMasterBranch(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testMasterBranch);
        when(branchManager.createBranch(anyString(), anyString(), eq(branchFactory))).thenReturn(testBranch);
        when(branchManager.createBranch(anyString(), anyString(), eq(userBranchFactory))).thenReturn(testUserBranch);
        when(commitManager.getCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgument(3, Resource.class);
            Commit found = null;
            for (Commit commit : testCommits) {
                if (iri.equals(commit.getResource())) {
                    found = commit;
                }
            }
            return Optional.ofNullable(found);
        });
        when(commitManager.getCommit(any(Resource.class), any(RepositoryConnection.class))).thenAnswer(i -> {
            Resource iri = i.getArgument(0, Resource.class);
            Commit found = null;
            for (Commit commit : testCommits) {
                if (iri.equals(commit.getResource())) {
                    found = commit;
                }
            }
            return Optional.ofNullable(found);
        });
        when(commitManager.getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.of(testInProgressCommit));
        when(differenceManager.getConflicts(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(Collections.singleton(conflict));
        when(commitManager.getCommitChain(any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits);
        when(commitManager.getCommitChain(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits);
        when(commitManager.getDifferenceChain(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits);
        when(commitManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class), anyBoolean())).thenReturn(testCommits.get(0));
        when(commitManager.getHeadCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(testCommits.get(0));
        when(compiledResourceManager.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(compiledResource);
        when(commitManager.getInProgressCommitOpt(any(Resource.class), any(Resource.class), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.of(testInProgressCommit));
        when(differenceManager.applyInProgressCommit(any(Resource.class), any(Model.class), any(RepositoryConnection.class))).thenReturn(compiledResourceWithChanges);
        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(testInProgressCommit);
        when(differenceManager.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(differenceManager.getDifference(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(recordManager.removeRecord(any(Resource.class), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(Class.class), any(RepositoryConnection.class))).thenReturn(testRecord);

        when(versioningManager.commit(any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), anyString(), any(RepositoryConnection.class))).thenReturn(vf.createIRI(COMMIT_IRIS[0]));
        when(versioningManager.merge(any(), any(), any(), any(), any(), any(), any(), any(), any(RepositoryConnection.class))).thenReturn(vf.createIRI(COMMIT_IRIS[0]));

        when(conflict.getIRI()).thenReturn(vf.createIRI(CONFLICT_IRI));
        when(conflict.getLeftDifference()).thenReturn(difference);
        when(conflict.getRightDifference()).thenReturn(difference);

        when(difference.getAdditions()).thenReturn(mf.createEmptyModel());
        when(difference.getDeletions()).thenReturn(mf.createEmptyModel());

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.of(user.getResource().stringValue()));

        when(provUtils.startCreateActivity(any(User.class))).thenReturn(createActivity);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(catalogManager, versioningManager, engineManager, conflict, difference, recordResults, bNodeService,
                provUtils, commitManager, branchManager, recordManager, distributionManager, versionManager,
                compiledResourceManager, differenceManager);
    }

    // GET catalogs

    @Test
    public void getCatalogsWithoutTypeTest() {
        Response response = target().path("catalogs").request().get();
        assertEquals(200, response.getStatus());
        verify(catalogManager).getLocalCatalog(any(RepositoryConnection.class));
        verify(catalogManager).getDistributedCatalog(any(RepositoryConnection.class));
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(2, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "local").request().get();
        assertEquals(200, response.getStatus());
        verify(catalogManager, atLeastOnce()).getLocalCatalog(any(RepositoryConnection.class));
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
            JsonNode catalog = result.get(0);
            assertTrue(catalog.has("@id"));
            assertEquals(LOCAL_IRI, catalog.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("catalogs").queryParam("type", "distributed").request().get();
        assertEquals(200, response.getStatus());
        verify(catalogManager, atLeastOnce()).getDistributedCatalog(any(RepositoryConnection.class));
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
            JsonNode catalog = result.get(0);
            assertTrue(catalog.has("@id"));
            assertEquals(DISTRIBUTED_IRI, catalog.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithBadTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "error").request().get();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(0, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(catalogManager).getLocalCatalog(any(RepositoryConnection.class));

        Response response = target().path("catalogs").request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(catalogManager).getLocalCatalog(any(RepositoryConnection.class));
        response = target().path("catalogs").request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}

    @Test
    public void getCatalogTest() {
        Response response = target().path(CATALOG_URL_LOCAL).request().get();
        assertEquals(200, response.getStatus());
        assertResponseIsObjectWithId(response, LOCAL_IRI);

        response = target().path(CATALOG_URL_DISTRIBUTED).request().get();
        assertEquals(200, response.getStatus());
        assertResponseIsObjectWithId(response, DISTRIBUTED_IRI);
    }

    @Test
    public void getCatalogThatDoesNotExistTest() {
        Response response = target().path("catalogs/" + encode(ERROR_IRI)).request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getCatalogWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(catalogManager).getLocalCatalog(any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL).request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(catalogManager).getLocalCatalog(any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL).request().get();
        assertEquals(500, response.getStatus());
    }


    // GET catalog/{catalogId}/entities

    private List<EntityMetadata> createEntities() {
        EntityMetadata metadata1 = new EntityMetadata(
                "http://example.com/entity/1",
                "EntityName",
                List.of("Type1", "Type2"),
                "Sample description",
                Map.of("source1", "value1", "source2", "value2"),
                List.of("keyword1", "keyword2"),
                List.of(
                        Map.of("key1", "value1"),
                        Map.of("key2", "value2"),
                        Map.of("key3", "value3"),
                        Map.of("key4", "value4"),
                        Map.of("key5", "value5"),
                        Map.of("key6", "value6")
                )
        );
        return List.of(metadata1);
    }

    @Test
    public void getEntitiesTest() {
        List<EntityMetadata> entities = createEntities();
        when(entityResults.getPage()).thenReturn(entities);
        when(entityResults.getPageNumber()).thenReturn(1);
        when(entityResults.getPageSize()).thenReturn(10);
        when(entityResults.getTotalSize()).thenReturn(1);

        when(recordManager.findEntities(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class)))
                .thenReturn(entityResults);

        Response response = target().path(CATALOG_URL_LOCAL + "/entities")
                .queryParam("offset", 1)
                .queryParam("limit", 11)
                .queryParam("sort", "entityName")
                .queryParam("asc", true)
                .queryParam("keywords", "keyword1")
                .queryParam("keywords", "keyword2")
                .queryParam("searchText", "test").request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .searchText("test")
                .keywords(List.of("keyword1", "keyword2"))
                .typeFilter(List.of(vf.createIRI(VersionedRDFRecord.TYPE)))
                .sortBy(new StringSortKey("entityName"))
                .ascending(true)
                .offset(1)
                .limit(11);

        verify(recordManager).findEntities(vf.createIRI(LOCAL_IRI), builder.build(), user, conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + entityResults.getTotalSize());
        assertEquals(1, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), entityResults.getPage().size());
            // Test iri field
            assertEquals("http://example.com/entity/1", result.get(0).get("iri").asText());
            // Test entityName field
            assertEquals("EntityName", result.get(0).get("entityName").asText());
            // Test types field
            assertTrue(result.get(0).get("types").isArray());
            assertEquals("Type1", result.get(0).get("types").get(0).asText());
            assertEquals("Type2", result.get(0).get("types").get(1).asText());
            // Test description field
            assertEquals("Sample description", result.get(0).get("description").asText());
            // Test record field
            JsonNode record = result.get(0).get("record");
            assertEquals("value1", record.get("source1").asText());
            assertEquals("value2", record.get("source2").asText());
            assertTrue(record.get("keywords").isArray());
            assertEquals("keyword1", record.get("keywords").get(0).asText());
            assertEquals("keyword2", record.get("keywords").get(1).asText());
            // Test matchingAnnotations field
            JsonNode annotations = result.get(0).get("matchingAnnotations");
            assertTrue(annotations.isArray());
            assertEquals("value1", annotations.get(0).get("key1").asText());
            assertEquals("value2", annotations.get(1).get("key2").asText());
            assertEquals("value3", annotations.get(2).get("key3").asText());
            assertEquals("value4", annotations.get(3).get("key4").asText());
            assertEquals("value5", annotations.get(4).get("key5").asText());
            // Test totalNumMatchingAnnotations field
            assertEquals(6, result.get(0).get("totalNumMatchingAnnotations").asInt());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getEntitiesWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/entities").queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getEntitiesWithNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/entities").queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getEntitiesWithOffsetThatIsTooLargeTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).findEntities(eq(vf.createIRI(LOCAL_IRI)),
                any(PaginatedSearchParams.class), eq(user), eq(conn));

        Response response = target().path(CATALOG_URL_LOCAL + "/entities").queryParam("offset", 9999).request().get();
        assertEquals(400, response.getStatus());
    }

    // GET catalogs/{catalogId}/records

    @Test
    public void getRecordsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("type", Record.TYPE)
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("searchText", "test").request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .searchText("test")
                .typeFilter(List.of(vf.createIRI("http://mobi.com/ontologies/catalog#Record")))
                .sortBy(vf.createIRI("http://purl.org/dc/terms/title"))
                .offset(0)
                .limit(10)
                .ascending(false);

        verify(recordManager).findRecord(vf.createIRI(LOCAL_IRI), builder.build(), user, conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + recordResults.getTotalSize());
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), recordResults.getPage().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithKeywordsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("type", Record.TYPE)
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("searchText", "test")
                .queryParam("keywords", "k1")
                .queryParam("keywords", "k2")
                .queryParam("keywords", "k3")
                .queryParam("keywords", "k4,5")
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .searchText("test")
                .typeFilter(List.of(vf.createIRI("http://mobi.com/ontologies/catalog#Record")))
                .keywords(Stream.of("k1", "k2", "k3", "k4,5").collect(Collectors.toList()))
                .sortBy(vf.createIRI("http://purl.org/dc/terms/title"))
                .offset(0)
                .limit(10)
                .ascending(false);

        verify(recordManager).findRecord(vf.createIRI(LOCAL_IRI), builder.build(), user, conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + recordResults.getTotalSize());
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), recordResults.getPage().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithCreatorsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("type", Record.TYPE)
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("searchText", "test")
                .queryParam("creators", USER_IRI)
                .queryParam("creators", "http://test.com/anotherUser")
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .searchText("test")
                .typeFilter(List.of(vf.createIRI("http://mobi.com/ontologies/catalog#Record")))
                .creators(Stream.of(vf.createIRI(USER_IRI), vf.createIRI("http://test.com/anotherUser")).collect(Collectors.toList()))
                .sortBy(vf.createIRI("http://purl.org/dc/terms/title"))
                .offset(0)
                .limit(10)
                .ascending(false);

        verify(recordManager).findRecord(vf.createIRI(LOCAL_IRI), builder.build(), user, conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("" + recordResults.getTotalSize(), headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(result.size(), recordResults.getPage().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithLinksTest() {
        // Setup:
        when(recordResults.getPageNumber()).thenReturn(1);

        Response response = target().path(CATALOG_URL_LOCAL + "/records")
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        verify(recordManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class), eq(user), eq(conn));
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getRecordsWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records").queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordsWithNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records").queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordsWithOffsetThatIsTooLargeTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).findRecord(eq(vf.createIRI(LOCAL_IRI)),
                any(PaginatedSearchParams.class), eq(user), eq(conn));

        Response response = target().path(CATALOG_URL_LOCAL + "/records").queryParam("offset", 9999).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordsWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).findRecord(eq(vf.createIRI(ERROR_IRI)),
                any(PaginatedSearchParams.class), eq(user), eq(conn));

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(recordManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class),
                eq(user), eq(conn));

        Response response = target().path(CATALOG_URL_LOCAL + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}

    @Test
    public void getRecordTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(recordManager).getRecordOpt(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory, conn);
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            JsonNode firstRecord = arr.get(0);
            assertTrue(firstRecord.has("@id"));
            assertEquals(RECORD_IRI, firstRecord.get("@id").textValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingRecordTest() {
        // Setup
        when(recordManager.getRecordOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getRecordWithMoreThanOneObjectTest() {
        // Setup:
        String newIRI = "http://test.com/record";
        Record recordWithAnotherObject = recordFactory.createNew(vf.createIRI(newIRI));
        recordWithAnotherObject.getModel().add(vf.createIRI("http://test.com/subject"), vf.createIRI("http://test.com/subject"), vf.createLiteral("test"));
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(recordWithAnotherObject));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(newIRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(recordManager).getRecordOpt(vf.createIRI(LOCAL_IRI), vf.createIRI(newIRI), recordFactory, conn);
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            JsonNode firstRecord = arr.get(0);
            assertTrue(firstRecord.has("@id"));
            assertEquals(firstRecord.get("@id").textValue(), newIRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).getRecordOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(OrmFactory.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(recordManager).getRecordOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(OrmFactory.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}

    @Test
    public void removeRecordTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
        IRI recordIri = vf.createIRI(RECORD_IRI);
        verify(recordManager).removeRecord(vf.createIRI(LOCAL_IRI), recordIri, user, Record.class, conn);
    }

    @Test
    public void removeRecordWithIncorrectPathTest() {
        // Setup:
        IRI recordIri = vf.createIRI(ERROR_IRI);
        doThrow(new IllegalArgumentException()).when(recordManager)
                .removeRecord(vf.createIRI(LOCAL_IRI), recordIri, user, Record.class, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeRecordWithErrorTest() {
        // Setup:
        IRI recordIri = vf.createIRI(RECORD_IRI);
        doThrow(new MobiException()).when(recordManager)
                .removeRecord(vf.createIRI(LOCAL_IRI), recordIri, user, Record.class, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}

    @Test
    public void updateRecordTest() {
        //Setup:
        ObjectNode record = mapper.createObjectNode().put("@id", RECORD_IRI)
                .set("@type", mapper.createArrayNode().add(Record.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(200, response.getStatus());
        verify(recordManager).updateRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateRecordWithInvalidJsonTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateRecordThatDoesNotMatchTest() {
        //Setup:
        ObjectNode record = mapper.createObjectNode().put("@id", ERROR_IRI)
                .set("@type", mapper.createArrayNode().add(Record.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateRecordWithIncorrectPathTest() {
        // Setup:
        ObjectNode record = mapper.createObjectNode().put("@id", RECORD_IRI)
                .set("@type", mapper.createArrayNode().add(Record.TYPE));
        doThrow(new IllegalArgumentException()).when(recordManager).updateRecord(eq(vf.createIRI(ERROR_IRI)), any(Record.class), any(RepositoryConnection.class));

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateRecordWithErrorTest() {
        // Setup:
        ObjectNode record = mapper.createObjectNode().put("@id", RECORD_IRI)
                .set("@type", mapper.createArrayNode().add(Record.TYPE));
        doThrow(new MobiException()).when(recordManager).updateRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/statistics

    @Test
    public void getRecordStatisticsTest() {
        RecordService rs = mock(RecordService.class);
        List<Statistic> statistics = new ArrayList<>();
        statistics.add(new Statistic(new StatisticDefinition("stat1", "stat1Desc"), 1));
        when(rs.getStatistics(any(), any())).thenReturn(statistics);
        when(recordManager.getRecordService(any(), any())).thenReturn(rs);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/statistics")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(recordManager).getRecordOpt(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory, conn);
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            assertEquals("[{\"name\":\"stat1\",\"description\":\"stat1Desc\",\"value\":1}]", arr.toString());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordStatisticsTest() {
        DatasetConnection dataConn = mock(DatasetConnection.class);
        RecordService rs = mock(RecordService.class);
        List<Statistic> statistics = new ArrayList<>();
        statistics.add(new Statistic(new StatisticDefinition("stat1", "stat1Desc"), 1));
        when(rs.getStatistics(any(), any())).thenReturn(statistics);
        when(recordManager.getRecordService(any(), any())).thenReturn(rs);
        when(rs.getType()).thenReturn(DatasetRecord.class);
        when(datasetManager.getConnection(any(Resource.class))).thenReturn(dataConn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/statistics")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(recordManager).getRecordOpt(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory, conn);
        verify(datasetManager).getConnection(any(Resource.class));
        try {
            ArrayNode arr = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            assertEquals("[{\"name\":\"stat1\",\"description\":\"stat1Desc\",\"value\":1}]", arr.toString());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordStatisticsNoStatsTest() {
        RecordService rs = mock(RecordService.class);
        when(rs.getStatistics(any(), any())).thenReturn(new ArrayList<Statistic>());
        when(recordManager.getRecordService(any(), any())).thenReturn(rs);
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/statistics")
                .request().get();
        assertEquals(204, response.getStatus());
        verify(recordManager).getRecordOpt(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory, conn);
    }

    @Test
    public void getRecordStatisticsMissingRecordTest() {
        when(recordManager.getRecordOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/statistics")
                .request().get();
        assertEquals(404, response.getStatus());
    }

    // GET catalogs/{catalogId}/keywords

    private void setupKeywords(String[] keywordsCount) {
        List<KeywordCount> keywordCounts = Arrays.stream(keywordsCount)
                .map(e -> e.split("\\."))
                .map(split -> new KeywordCount(vf.createLiteral(split[0]), Integer.parseInt(split[1])))
                .collect(Collectors.toList());

        when(keywordResults.getPage()).thenReturn(keywordCounts);
        when(keywordResults.getPageNumber()).thenReturn(0);
        when(keywordResults.getPageSize()).thenReturn(keywordCounts.size());
        when(keywordResults.getTotalSize()).thenReturn(50);

        when(recordManager.getKeywords(any(Resource.class), any(PaginatedSearchParams.class), any(RepositoryConnection.class))).thenReturn(keywordResults);
    }

    @Test
    public void getKeywordsTest() {
        String[] keywordsCount = {"1.4", "2.1"};
        setupKeywords(keywordsCount);

        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .offset(0)
                .limit(10);

        verify(recordManager).getKeywords(eq(vf.createIRI(LOCAL_IRI)), eq(builder.build()), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + keywordResults.getTotalSize());
        assertEquals(0, response.getLinks().size());
        try {
            String responseString = response.readEntity(String.class);
            ArrayNode result = mapper.readValue(responseString, ArrayNode.class);
            assertEquals(result.size(), keywordResults.getPage().size());

            String expected = "1.4,2.1";
            String actual = StreamSupport.stream(result.spliterator(), false)
                    .map(e -> e.get("http://mobi.com/ontologies/catalog#keyword").asText() + "." + e.get("count").asText() )
                    .collect(Collectors.joining(","));
            assertEquals(expected, actual);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getKeywordsSearchTest() {
        String[] keywordsCount = {"1.4", "2.1"};
        setupKeywords(keywordsCount);

        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("searchText", "search")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                .searchText("search")
                .offset(0)
                .limit(10);

        verify(recordManager).getKeywords(eq(vf.createIRI(LOCAL_IRI)), eq(builder.build()), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + keywordResults.getTotalSize());
        assertEquals(0, response.getLinks().size());
        try {
            String responseString = response.readEntity(String.class);
            ArrayNode result = mapper.readValue(responseString, ArrayNode.class);
            assertEquals(result.size(), keywordResults.getPage().size());

            String expected = "1.4,2.1";
            String actual = StreamSupport.stream(result.spliterator(), false)
                    .map(e -> e.get("http://mobi.com/ontologies/catalog#keyword").asText() + "." + e.get("count").asText() )
                    .collect(Collectors.joining(","));
            assertEquals(expected, actual);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getKeywordsNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("offset", -1)
                .queryParam("limit", 10)
                .request().get();

        assertEquals(400, response.getStatus());
        assertEquals("Bad Request", response.getStatusInfo().getReasonPhrase());
    }

    @Test
    public void getKeywordsNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("offset", 1)
                .queryParam("limit", -1)
                .request().get();

        assertEquals(400, response.getStatus());
        assertEquals("Bad Request", response.getStatusInfo().getReasonPhrase());
    }

    @Test
    public void getKeywordsIllegalArgumentExceptionTest() {
        doThrow(new IllegalArgumentException())
                .when(recordManager).getKeywords(any(Resource.class), any(PaginatedSearchParams.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("offset", 1)
                .queryParam("limit", 1)
                .request().get();

        assertEquals(400, response.getStatus());
        assertEquals("Bad Request", response.getStatusInfo().getReasonPhrase());
    }

    @Test
    public void getKeywordsMobiExceptionTest() {
        doThrow(new MobiException())
                .when(recordManager).getKeywords(any(Resource.class), any(PaginatedSearchParams.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/keywords")
                .queryParam("offset", 1)
                .queryParam("limit", 1)
                .request().get();

        assertEquals(500, response.getStatus());
        assertEquals("Internal Server Error", response.getStatusInfo().getReasonPhrase());
    }

    // GET catalogs/{catalogId}/records/{recordId}/distributions

    @Test
    public void getUnversionedDistributionsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(distributionManager).getUnversionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("1", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUnversionedDistributionsWithLinksTest() {
        // Setup:
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        distributions.forEach(distribution -> distribution.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue())));
        when(distributionManager.getUnversionedDistributions(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(distributions);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        verify(distributionManager).getUnversionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records/"
                    + encode(RECORD_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getUnversionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedRecordsWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedRecordsWithNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedRecordsWithOffsetThatIsTooLargeTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", 100).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedDistributionsWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).getUnversionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedDistributionsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).getUnversionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/distributions

    @Test
    public void createUnversionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertEquals(DISTRIBUTION_IRI, response.readEntity(String.class));
        verify(distributionManager).createDistribution(any(DistributionConfig.class));
        verify(distributionManager).addUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Distribution.class), any(RepositoryConnection.class));
    }

    @Test
    public void createUnversionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("description", "Description");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createUnversionedDistributionForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createUnversionedDistributionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).addUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Distribution.class), any(RepositoryConnection.class));
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createUnversionedDistributionWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");
        doThrow(new MobiException()).when(distributionManager).createDistribution(any(DistributionConfig.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void getUnversionedDistributionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(distributionManager).getUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));
        assertResponseIsObjectWithId(response, DISTRIBUTION_IRI);
    }

    @Test
    public void getMissingUnversionedDistributionTest() {
        // Setup:
        when(distributionManager.getUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedDistributionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).getUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getUnversionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).getUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(DISTRIBUTED_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTED_IRI)).request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void removeUnversionedDistributionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(distributionManager).removeUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));
    }

    @Test
    public void removeUnversionedDistributionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).removeUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(ERROR_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeUnversionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).removeUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/distributions/{distributionId}

    @Test
    public void updateUnversionedDistributionTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI)
                .set("@type", mapper.createArrayNode().add(Distribution.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(200, response.getStatus());
        verify(distributionManager).updateUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Distribution.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateUnversionedDistributionWithInvalidJsonTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUnversionedDistributionThatDoesNotMatchTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", ERROR_IRI);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUnversionedDistributionWithIncorrectPathTest() {
        // Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI);
        doThrow(new IllegalArgumentException()).when(distributionManager).updateUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateUnversionedDistributionWithErrorTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI);
        doThrow(new MobiException()).when(distributionManager).updateUnversionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/distributions/" + encode(DISTRIBUTION_IRI)).request().put(Entity.json(distribution.toString()));
        assertEquals(400, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions

    @Test
    public void getVersionsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(versionManager).getVersions(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("1", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionsWithLinksTest() {
        // Setup:
        Set<Version> versions = IntStream.range(1, 6)
                .mapToObj(i -> VERSION_IRI + i)
                .map(s -> versionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        versions.forEach(version -> version.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue())));
        when(versionManager.getVersions(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), conn)).thenReturn(versions);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        verify(versionManager).getVersions(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), conn);
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records/"
                    + encode(RECORD_IRI) + "/versions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionsWithInvalidSortIriTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionsWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionsWithNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionsWithOffsetThatIsTooLargeTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", 100).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionsFromRecordWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versionManager).getVersions(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versionManager).getVersions(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/versions

    @Test
    public void createVersionTest() {
        testCreateVersionByType(versionFactory);
    }

    @Test
    public void createVersionTagTest() {
        testCreateVersionByType(tagFactory);
    }

    @Test
    public void createVersionWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("type", Version.TYPE);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createVersionWithInvalidTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createVersionForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);
        fd.field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createVersionWithIncorrectPathTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);
        fd.field("title", "Title");
        doThrow(new IllegalArgumentException()).when(versionManager).addVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Version.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createVersionWithErrorTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);
        fd.field("title", "Title");
        doThrow(new MobiException()).when(versionManager).addVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Version.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/tags

    @Test
    public void createTagTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("iri", "urn:test");
        fd.field("commit", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertEquals("urn:test", response.readEntity(String.class));
        verify(versionManager).addVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Tag.class), any(RepositoryConnection.class));
    }

    @Test
    public void createTagWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("iri", "urn:test").field("commit", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createTagWithoutIriTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title").field("commit", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createTagWithoutCommitTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title").field("iri", "urn:test");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createTagForCommitNotInRecordTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("iri", "urn:test");
        fd.field("commit", COMMIT_IRIS[1]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createTagForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("iri", "urn:test");
        fd.field("commit", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createTagWithErrorTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("iri", "urn:test");
        fd.field("commit", COMMIT_IRIS[0]);
        doThrow(new MobiException()).when(versionManager).addVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Tag.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/tags")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/latest

    @Test
    public void getLatestVersionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(versionManager).getLatestVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(versionFactory), any(RepositoryConnection.class));
        assertResponseIsObjectWithId(response, VERSION_IRI);
    }

    @Test
    public void getMissingLatestVersionTest() {
        // Setup:
        when(versionManager.getLatestVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(versionFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getLatestVersionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versionManager).getLatestVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), eq(versionFactory), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/versions/latest")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getLatestVersionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versionManager).getLatestVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(versionFactory), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void getVersionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(versionManager).getVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), versionFactory, conn);
        assertResponseIsObjectWithId(response, VERSION_IRI);
    }

    @Test
    public void getMissingVersionTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versionManager).getVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), versionFactory, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versionManager).getVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), versionFactory, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versionManager).getVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), versionFactory, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void removeVersionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(versionManager).removeVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), conn);
    }

    @Test
    public void removeVersionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versionManager).removeVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeVersionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versionManager).removeVersion(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/versions/{versionId}

    @Test
    public void updateVersionTest() {
        //Setup:
        ObjectNode version = mapper.createObjectNode().put("@id", VERSION_IRI)
                .set("@type", mapper.createArrayNode().add(Version.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(200, response.getStatus());
        verify(versionManager).updateVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Version.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateVersionWithInvalidJsonTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionThatDoesNotMatchTest() {
        //Setup:
        ObjectNode version = mapper.createObjectNode().put("@id", ERROR_IRI);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionWithIncorrectPathTest() {
        //Setup:
        ObjectNode version = mapper.createObjectNode().put("@id", VERSION_IRI);
        doThrow(new IllegalArgumentException()).when(versionManager).updateVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Version.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionWithErrorTest() {
        //Setup:
        ObjectNode version = mapper.createObjectNode().put("@id", VERSION_IRI).set("@type", mapper.createArrayNode().add(Version.TYPE));
        doThrow(new MobiException()).when(versionManager).updateVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Version.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions

    @Test
    public void getVersionedDistributionsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(distributionManager).getVersionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("1", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionedDistributionsWithLinksTest() {
        // Setup:
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        distributions.forEach(distribution -> distribution.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue())));
        when(distributionManager.getVersionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(RepositoryConnection.class))).thenReturn(distributions);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        verify(distributionManager).getVersionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(RepositoryConnection.class));
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records/"
                    + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionsWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionsWithNonPositiveLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionsWithOffsetThatIsTooLargeTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", 100).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionsWithIncorrectPathExist() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).getVersionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).getVersionedDistributions(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions

    @Test
    public void createVersionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertEquals(DISTRIBUTION_IRI, response.readEntity(String.class));
        verify(distributionManager).createDistribution(any(DistributionConfig.class));
        verify(distributionManager).addVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(Distribution.class), any(RepositoryConnection.class));
    }

    @Test
    public void createVersionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("description", "Description");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createVersionedDistributionForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createVersionedDistributionWithIncorrectPathTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");
        doThrow(new IllegalArgumentException()).when(distributionManager).addVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createVersionedDistributionWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "Title");
        doThrow(new MobiException()).when(distributionManager).addVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void getVersionedDistributionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(distributionManager).getVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));
        assertResponseIsObjectWithId(response, DISTRIBUTION_IRI);
    }

    @Test
    public void getMissingVersionedDistributionTest() {
        // Setup:
        when(distributionManager.getVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).getVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).getVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void removeVersionedDistributionTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(distributionManager).removeVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));
    }

    @Test
    public void removeVersionedDistributionWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(distributionManager).removeVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(ERROR_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeVersionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(distributionManager).removeVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), eq(vf.createIRI(DISTRIBUTION_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}

    @Test
    public void updateVersionedDistributionTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI)
                .set("@type", mapper.createArrayNode().add(Distribution.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(200, response.getStatus());
        verify(distributionManager).updateVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(Distribution.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateVersionedDistributionWithInvalidJsonTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionedDistributionThatDoesNotMatchTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", ERROR_IRI);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionedDistributionWithIncorrectPathTest() {
        // Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI);
        doThrow(new IllegalArgumentException()).when(distributionManager).updateVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateVersionedDistributionWithErrorTest() {
        //Setup:
        ObjectNode distribution = mapper.createObjectNode().put("@id", DISTRIBUTION_IRI).set("@type", mapper.createArrayNode().add(Distribution.TYPE));
        doThrow(new MobiException()).when(distributionManager).updateVersionedDistribution(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(VERSION_IRI)), any(Distribution.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/versions/{versionId}/commit

    @Test
    public void getVersionCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getTaggedCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("commit"));
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            JsonNode commit = result.get("commit");
            assertTrue(commit.has("@id"));
            assertEquals(COMMIT_IRIS[0], commit.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getTaggedCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(ERROR_IRI) + "/commit")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getVersionCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getTaggedCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getTaggedCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(VERSION_IRI), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/versions/" + encode(VERSION_IRI) + "/commit")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches

    @Test
    public void getBranchesTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("2", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(2, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getBranchesWithUserFilterTest() {
        // Setup:
        testUserBranch.setProperty(vf.createLiteral(USER_IRI + "/0"), vf.createIRI(DCTERMS.PUBLISHER.stringValue()));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("applyUserFilter", true)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("1", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getBranchesWithLinksTest() {
        // Setup:
        Set<Branch> branches = IntStream.range(1, 6)
                .mapToObj(i -> BRANCH_IRI + i)
                .map(s -> branchFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        branches.forEach(branch -> branch.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue())));
        when(branchManager.getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class))).thenReturn(branches);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records/"
                    + encode(RECORD_IRI) + "/branches"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getBranchesWithoutSortTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals("2", headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(2, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getBranchesWithNegativeOffsetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchesWithNegativeLimitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("limit", -1).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchesWithOffsetThatIsTooLargeTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).queryParam("offset", 100).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchesWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchesWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(branchManager).getBranches(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches

    @Test
    public void createBranchTest() {
        testCreateBranchByType(branchFactory);
    }

    @Test
    public void createUserBranchTest() {
        testCreateBranchByType(userBranchFactory);
    }

    @Test
    public void createBranchWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("type", Branch.TYPE);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createBranchWithCommitNotInRecordTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);
        fd.field("title", "Title");
        fd.field("commitId", COMMIT_IRIS[1]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createBranchWithInvalidTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createBranchForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);
        fd.field("title", "Title");
        fd.field("commitId", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createBranchWithIncorrectPathTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);
        fd.field("title", "Title");
        doThrow(new IllegalArgumentException()).when(branchManager).addBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Branch.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createBranchWithErrorTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Branch.TYPE);
        fd.field("title", "Title");
        fd.field("commitId", COMMIT_IRIS[0]);
        doThrow(new MobiException()).when(branchManager).addBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Branch.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/master

    @Test
    public void getMasterBranchTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getMasterBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        assertResponseIsObjectWithId(response, BRANCH_IRI);
    }

    @Test
    public void getMasterBranchWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/branches/master")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getMasterBranchWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(branchManager).getMasterBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(branchManager).getMasterBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches/master")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void getBranchTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(branchManager).getBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), eq(branchFactory), any(RepositoryConnection.class));
        assertResponseIsObjectWithId(response, BRANCH_IRI);
    }

    @Test
    public void getMissingBranchTest() {
        // Setup:
        when(branchManager.getBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), eq(branchFactory), any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException(""));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).getBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), eq(branchFactory), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(branchManager).getBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), eq(branchFactory), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI)).request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void removeBranchTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(branchManager).removeBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(RepositoryConnection.class));
    }

    @Test
    public void removeBranchWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).removeBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeBranchWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(branchManager).removeBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/branches/{branchId}

    @Test
    public void updateBranchTest() {
        //Setup:
        ObjectNode branch = mapper.createObjectNode().put("@id", BRANCH_IRI)
                .set("@type", mapper.createArrayNode().add(Branch.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(200, response.getStatus());
        verify(branchManager).updateBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Branch.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateBranchMASTERTest() {
        //Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).updateBranch(any(Resource.class), any(Resource.class), any(), any(RepositoryConnection.class));
        ObjectNode branch = mapper.createObjectNode().put("@id", BRANCH_IRI)
                .set("@type", mapper.createArrayNode().add(Branch.TYPE));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                        + "/branches/" + encode(MASTER))
                .request().put(Entity.json(branch.toString()));
        assertEquals(400, response.getStatus());
        verify(branchManager).updateBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Branch.class), any(RepositoryConnection.class));
        verify(bNodeService).deskolemize(any(Model.class));
    }

    @Test
    public void updateBranchWithInvalidJsonTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateBranchThatDoesNotMatchTest() {
        //Setup:
        ObjectNode branch = mapper.createObjectNode().put("@id", ERROR_IRI);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateBranchWithIncorrectPathTest() {
        //Setup:
        ObjectNode branch = mapper.createObjectNode().put("@id", BRANCH_IRI);
        doThrow(new IllegalArgumentException()).when(branchManager).updateBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(Branch.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateBranchWithErrorTest() {
        //Setup:
        ObjectNode branch = mapper.createObjectNode().put("@id", BRANCH_IRI).set("@type", mapper.createArrayNode().add(Branch.TYPE));
        doThrow(new MobiException()).when(branchManager).updateBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Branch.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI))
                .request().put(Entity.json(branch.toString()));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits

    @Test
    public void getCommitChainTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(String.valueOf(COMMIT_IRIS.length),  headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(array.size(), COMMIT_IRIS.length);
            array.forEach(result -> {
                assertTrue(result.has("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(result.get("id").asText()));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitChainWithPaginationTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits").queryParam("offset", 0).queryParam("limit", 10)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(String.valueOf(COMMIT_IRIS.length), headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(array.size(), COMMIT_IRIS.length);
            array.forEach(result -> {
                assertTrue(result.has("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(result.get("id").asText()));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitChainWithPaginationAndLinksTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits").queryParam("offset", 1).queryParam("limit", 1)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), String.valueOf(COMMIT_IRIS.length));
        Set<Link> links = response.getLinks();
        assertEquals(2, links.size());
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(CATALOG_URL_LOCAL + "/records/"
                    + encode(RECORD_IRI) + "/branches/" + encode(BRANCH_IRI) + "/commits"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, array.size());
            JsonNode commitObj = array.get(0);
            assertTrue(commitObj.has("id"));
            assertEquals(COMMIT_IRIS[1], commitObj.get("id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitChainWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getCommitChainWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getCommitChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    @Test
    public void getCommitChainWithTargetIdTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("targetId", BRANCH_IRI)
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getDifferenceChain(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(BRANCH_IRI), conn);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(String.valueOf(COMMIT_IRIS.length), headers.get("X-Total-Count").get(0));
        assertEquals(0, response.getLinks().size());
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(COMMIT_IRIS.length, array.size());
            array.forEach(result -> {
                assertTrue(result.has("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(result.get("id").asText()));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits

    @Test
    public void createBranchCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(201, response.getStatus());
        assertEquals(COMMIT_IRIS[0], response.readEntity(String.class));
        verify(versioningManager).commit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(User.class), eq("Message"), any(RepositoryConnection.class));
    }

    @Test
    public void createBranchCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createBranchCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versioningManager).commit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(ERROR_IRI)), any(User.class), eq("Message"), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createBranchCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versioningManager).commit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(User.class), eq("Message"), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(versioningManager).commit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(User.class), eq("Message"), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits")
                .queryParam("message", "Message").request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/head

    @Test
    public void getHeadTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("commit"));
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            JsonNode commit = result.get("commit");
            assertTrue(commit.has("@id"));
            assertEquals(COMMIT_IRIS[0], commit.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getHeadWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/commits/head")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getHeadWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/head")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}

    @Test
    public void getBranchCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[1]), conn);
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("commit"));
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            JsonNode commit = result.get("commit");
            assertTrue(commit.has("@id"));
            assertEquals(COMMIT_IRIS[1], commit.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingBranchCommitTest() {
        // Setup:
        when(commitManager.getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(ERROR_IRI), conn)).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getBranchCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getBranchCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[1]), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[1]), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/difference

    @Test
    public void getDifferenceTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/difference")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager, times(2)).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        verify(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDifferenceWithoutTargetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/difference").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getDifferenceWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/difference")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getDifferenceWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/difference")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(differenceManager).getDifference(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/difference")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts

    @Test
    public void getConflictsTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager, times(2)).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), conn);
        verify(differenceManager).getConflicts(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(1, result.size());
            JsonNode outcome = result.get(0);
            assertTrue(outcome.has("left"));
            assertTrue(outcome.has("right"));
            JsonNode left = outcome.get("left");
            JsonNode right = outcome.get("right");
            assertTrue(left.has("additions"));
            assertTrue(left.has("deletions"));
            assertTrue(right.has("additions"));
            assertTrue(right.has("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getConflictsWithoutTargetTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts").request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getConflictsWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getConflictsWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(differenceManager).getConflicts(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(differenceManager).getConflicts(eq(vf.createIRI(COMMIT_IRIS[0])), eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts")
                .queryParam("targetId", BRANCH_IRI).request().get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts/resolution

    @Test
    public void mergeTest() {
        // Setup:
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        ArrayNode deletes = mapper.createArrayNode();
        deletes.add(mapper.createObjectNode().put("@id", "http://example.com/delete").set("@type", mapper.createArrayNode().add("http://example.com/Delete")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        fd.field("deletions", deletes.toString());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        assertEquals(response.readEntity(String.class), COMMIT_IRIS[0]);
        verify(versioningManager).merge(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), eq(vf.createIRI(BRANCH_IRI)), eq(vf.createIRI(BRANCH_IRI)), any(User.class), any(Model.class), any(Model.class), any(), any(RepositoryConnection.class));
    }

    @Test
    public void mergeWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(versioningManager).merge(any(), any(), any(), any(), any(), any(), any(), any(), any(RepositoryConnection.class));
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(ERROR_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void mergeForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void mergeWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(versioningManager).merge(any(), any(), any(), any(), any(), any(), any(), any(), any(RepositoryConnection.class));
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(versioningManager).merge(any(), any(), any(), any(), any(), any(), any(), any(), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/conflicts/resolution")
                .queryParam("targetId", BRANCH_IRI).request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource

    @Test
    public void getCompiledResourceAsJsonldTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "jsonld").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceAsTurtleTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "turtle").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceAsRdfxmlTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "rdf/xml").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceApplyInProgressCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(vf.createIRI(COMMIT_IRIS[0])), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void getCompiledResourceWithMissingInProgressCommitTest() {
        // Setup:
        when(commitManager.getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void getCompiledResourceForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().get();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void getCompiledResourceWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(ERROR_IRI) + "/resource")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getCompiledResourceWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // GET (download) catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource

    @Test
    public void downloadCompiledResourceAsJsonldTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "jsonld").queryParam("fileName", "fileName").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        assertTrue(response.getHeaderString("Content-Disposition").contains("fileName"));
        isJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceAsTurtleTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "turtle").queryParam("fileName", "fileName").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        assertTrue(response.getHeaderString("Content-Disposition").contains("fileName"));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceAsRdfxmlTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("format", "rdf/xml").queryParam("fileName", "fileName").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        assertTrue(response.getHeaderString("Content-Disposition").contains("fileName"));
        notJsonld(response.readEntity(String.class));
    }

    @Test
    public void downloadCompiledResourceApplyInProgressCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager).applyInProgressCommit(eq(vf.createIRI(COMMIT_IRIS[0])), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void downloadCompiledResourceWithMissingInProgressCommitTest() {
        // Setup:
        when(commitManager.getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(compiledResourceManager).getCompiledResource(vf.createIRI(COMMIT_IRIS[0]), conn);
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
    }

    @Test
    public void downloadCompiledResourceForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .queryParam("applyInProgressCommit", "true").request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void downloadCompiledResourceWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(ERROR_IRI), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(ERROR_IRI) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void downloadCompiledResourceWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), vf.createIRI(BRANCH_IRI), vf.createIRI(COMMIT_IRIS[0]), conn);
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI)
                + "/branches/" + encode(BRANCH_IRI) + "/commits/" + encode(COMMIT_IRIS[0]) + "/resource")
                .request().accept(MediaType.APPLICATION_OCTET_STREAM).get();
        assertEquals(500, response.getStatus());
    }

    // POST catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void createInProgressCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(200, response.getStatus());
        verify(commitManager).createInProgressCommit(any(User.class));
        verify(commitManager).addInProgressCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), testInProgressCommit, conn);
    }

    @Test
    public void createInProgressCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).addInProgressCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), testInProgressCommit, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void createInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).addInProgressCommit(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), testInProgressCommit, conn);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().post(Entity.json(""));
        assertEquals(500, response.getStatus());
    }

    // GET catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void getInProgressCommitInJsonldTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "jsonld").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager).getCommitDifference(eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            isJsonld(result.get("additions"));
            isJsonld(result.get("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getInProgressCommitInTurtleTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "turtle").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager).getCommitDifference(eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            notJsonld(result.get("additions"));
            notJsonld(result.get("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getInProgressCommitInRdfxmlTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .queryParam("format", "rdf/xml").request().get();
        assertEquals(200, response.getStatus());
        verify(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        verify(differenceManager).getCommitDifference(eq(vf.createIRI(COMMIT_IRIS[0])), any(RepositoryConnection.class));
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(result.has("additions"));
            assertTrue(result.has("deletions"));
            notJsonld(result.get("additions"));
            notJsonld(result.get("deletions"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingInProgressCommitTest() {
        // Setup:
        when(commitManager.getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(User.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(404, response.getStatus());
    }

    @Test
    public void getInProgressCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(User.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void getInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).getInProgressCommitOpt(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().get();
        assertEquals(500, response.getStatus());
    }

    // DELETE catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void removeInProgressCommitTest() {
        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(200, response.getStatus());
        verify(commitManager).removeInProgressCommit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
    }

    @Test
    public void removeInProgressCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).removeInProgressCommit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(ERROR_IRI)), any(User.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(401, response.getStatus());
    }

    @Test
    public void removeInProgressCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(commitManager).removeInProgressCommit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).removeInProgressCommit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().delete();
        assertEquals(500, response.getStatus());
    }

    // PUT catalogs/{catalogId}/records/{recordId}/in-progress-commit

    @Test
    public void updateInProgressCommitTest() {
        // Setup:
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        ArrayNode deletes = mapper.createArrayNode();
        deletes.add(mapper.createObjectNode().put("@id", "http://example.com/delete").set("@type", mapper.createArrayNode().add("http://example.com/Delete")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        fd.field("deletions", deletes.toString());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(200, response.getStatus());
        verify(bNodeService, atLeastOnce()).deskolemize(any(Model.class));
        verify(commitManager).updateInProgressCommit(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(User.class), any(Model.class), any(Model.class), any(RepositoryConnection.class));
    }

    @Test
    public void updateInProgressCommitWithIncorrectPathTest() {
        // Setup:
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        doThrow(new IllegalArgumentException()).when(commitManager).updateInProgressCommit(any(), any(), (User) any(), any(), any(), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(ERROR_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void updateInProgressCommitForUserThatDoesNotExistTest() {
        // Setup:
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(401, response.getStatus());
    }

    @Test
    public void updateInProgressCommitWithErrorTest() {
        // Setup:
        ArrayNode adds = mapper.createArrayNode();
        adds.add(mapper.createObjectNode().put("@id", "http://example.com/add").set("@type", mapper.createArrayNode().add("http://example.com/Add")));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("additions", adds.toString());
        doThrow(new MobiException()).when(commitManager).updateInProgressCommit(any(), any(), (User) any(), any(), any(), any(RepositoryConnection.class));

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());

        doThrow(new IllegalStateException()).when(commitManager).updateInProgressCommit(any(), any(), (User) any(), any(), any(), any(RepositoryConnection.class));
        response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/in-progress-commit")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(500, response.getStatus());
    }

    /* GET record-types */

    @Test
    public void getRecordTypesTest() {
        Response response = target().path("catalogs/record-types").request().get();
        assertEquals(200, response.getStatus());
        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(5, result.size());
            Stream.of(recordFactory, unversionedRecordFactory, versionedRecordFactory, versionedRDFRecordFactory, mappingRecordFactory).forEach(factory -> {
                String typeIRI = factory.getTypeIRI().stringValue();
                assertTrue(result.has(typeIRI));
                JsonNode val = result.get(typeIRI);
                assertTrue(val.isArray());
                assertEquals(factory.getParentTypeIRIs().stream().map(IRI::stringValue).collect(Collectors.toSet()), convertArrayNodeToSet((ArrayNode) val));
            });
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* GET sort-options */

    @Test
    public void getSortOptionsTest() {
        Response response = target().path("catalogs/sort-options").request().get();
        assertEquals(200, response.getStatus());
        try {
            ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(3, array.size());
            assertTrue(arrayContains(array, DCTERMS.TITLE.stringValue()));
            assertTrue(arrayContains(array, DCTERMS.MODIFIED.stringValue()));
            assertTrue(arrayContains(array, DCTERMS.ISSUED.stringValue()));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void testStatisticsToJson() {
        // Create a list of statistics
        List<Statistic> statistics = new ArrayList<>();
        statistics.add(new Statistic(new StatisticDefinition("statistic1", "desc1"), 10));
        statistics.add(new Statistic(new StatisticDefinition("statistic2", "desc2"), 20));
        // Convert statistics to JSON
        ArrayNode jsonArray = rest.statisticsToJson(statistics);
        // Assert that the JSON array has the correct number of elements
        assertEquals(2, jsonArray.size());
        // Assert that the first statistic is correctly represented in the JSON array
        ObjectNode jsonStatistic1 = (ObjectNode) jsonArray.get(0);
        assertEquals("statistic1", jsonStatistic1.get("name").asText());
        assertEquals("desc1", jsonStatistic1.get("description").asText());
        assertEquals(10, jsonStatistic1.get("value").asInt());
        // Assert that the second statistic is correctly represented in the JSON array
        ObjectNode jsonStatistic2 = (ObjectNode) jsonArray.get(1);
        assertEquals("statistic2", jsonStatistic2.get("name").asText());
        assertEquals("desc2", jsonStatistic2.get("description").asText());
        assertEquals(20, jsonStatistic2.get("value").asInt());
    }

    @Test
    public void testStatisticToJsonEmptyList() {
        // Convert an empty list of statistics to JSON
        ArrayNode jsonArray = rest.statisticsToJson(new ArrayList<>());
        // Assert that the JSON array is empty
        assertTrue(jsonArray.isEmpty());
    }

    private <T extends Version> void testCreateVersionByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("description", "Description");

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertEquals(VERSION_IRI, response.readEntity(String.class));
        verify(versionManager).createVersion(anyString(), anyString(), eq(ormFactory));
        verify(versionManager).addVersion(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), any(Version.class), any(RepositoryConnection.class));
    }

    private <T extends Branch> void testCreateBranchByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("commitId", COMMIT_IRIS[0]);

        Response response = target().path(CATALOG_URL_LOCAL + "/records/" + encode(RECORD_IRI) + "/branches")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(201, response.getStatus());
        assertTrue(response.readEntity(String.class).contains(BRANCH_IRI));
        verify(branchManager).createBranch(anyString(), anyString(), eq(ormFactory));
        ArgumentCaptor<Branch> branchArgumentCaptor = ArgumentCaptor.forClass(Branch.class);
        verify(branchManager).addBranch(eq(vf.createIRI(LOCAL_IRI)), eq(vf.createIRI(RECORD_IRI)), branchArgumentCaptor.capture(), any(RepositoryConnection.class));
        Branch branch = branchArgumentCaptor.getValue();
        Optional<Resource> optHead = branch.getHead_resource();
        assertTrue(optHead.isPresent());
        assertEquals(COMMIT_IRIS[0], optHead.get().stringValue());
    }

    private void isJsonld(JsonNode body) {
        if (body.isTextual()) {
            fail();
        }
    }

    private void isJsonld(String body) {
        try {
            JsonNode result = mapper.valueToTree(body);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private void notJsonld(JsonNode body) {
        if (!body.isTextual()) {
            fail();
        }
    }

    private void notJsonld(String body) {
        try {
            ArrayNode result = mapper.readValue(body, ArrayNode.class);
            fail();
        } catch (Exception e) {
            System.out.println("Format is not JSON-LD, as expected");
        }
    }

    private void assertResponseIsObjectWithId(Response response, String id) {
        try {
            ObjectNode record = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertTrue(record.has("@id"));
            assertEquals(id, record.get("@id").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    private Set<String> convertArrayNodeToSet(ArrayNode arrayNode) {
        Set<String> set = new HashSet<>();
        arrayNode.forEach(el -> {
            set.add(el.asText());
        });
        return set;
    }
}
