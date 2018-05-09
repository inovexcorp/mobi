package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static com.mobi.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class CommitRestImplTest extends MobiRestTestNg {
    private CommitRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private OrmFactory<Record> recordFactory;
    private OrmFactory<UnversionedRecord> unversionedRecordFactory;
    private OrmFactory<VersionedRecord> versionedRecordFactory;
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory;
    private OrmFactory<MappingRecord> mappingRecordFactory;
    private OrmFactory<Distribution> distributionFactory;
    private OrmFactory<Version> versionFactory;
    private OrmFactory<Tag> tagFactory;
    private OrmFactory<Branch> branchFactory;
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
    private UserBranch testUserBranch;
    private User user;
    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;
    private Model compiledResource;
    private Model compiledResourceWithChanges;
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

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private VersioningManager versioningManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private PaginatedSearchResults<Record> results;

    @Mock
    private Conflict conflict;

    @Mock
    private Difference difference;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private CatalogProvUtils provUtils;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();

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
        testVersionedRDFRecord.setMasterBranch(testBranch);
        testVersionedRDFRecord.setBranch(Stream.of(testBranch, testUserBranch).collect(Collectors.toSet()));
        testMappingRecord = mappingRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        user = userFactory.createNew(vf.createIRI(USER_IRI));
        createActivity = createActivityFactory.createNew(vf.createIRI(ACTIVITY_IRI + "/create"));
        deleteActivity = deleteActivityFactory.createNew(vf.createIRI(ACTIVITY_IRI + "/delete"));
        compiledResource = mf.createModel();
        compiledResourceWithChanges = mf.createModel(compiledResource);
        compiledResourceWithChanges.add(vf.createIRI("http://example.com"), vf.createIRI(DCTERMS.TITLE.stringValue()),
                vf.createLiteral("Title"));

        MockitoAnnotations.initMocks(this);
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgumentAt(0, Model.class));

        rest = new CommitRestImpl();
        injectOrmFactoryReferencesIntoService(rest);
        rest.setVf(vf);
        rest.setEngineManager(engineManager);
        rest.setTransformer(transformer);
        rest.setCatalogManager(catalogManager);
        rest.setbNodeService(bNodeService);

        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgumentAt(0, Statement.class));
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgumentAt(0, Model.class));

        when(results.getPage()).thenReturn(Collections.singletonList(testRecord));
        when(results.getPageNumber()).thenReturn(0);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(50);

        when(catalogManager.getLocalCatalog()).thenReturn(localCatalog);
        when(catalogManager.getDistributedCatalog()).thenReturn(distributedCatalog);
        when(catalogManager.getLocalCatalogIRI()).thenReturn(vf.createIRI(LOCAL_IRI));
        when(catalogManager.getDistributedCatalogIRI()).thenReturn(vf.createIRI(DISTRIBUTED_IRI));
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(testRecord.getResource()));
        when(catalogManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory)))
                .thenReturn(Optional.of(testRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory)))
                .thenReturn(Optional.of(testUnversionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRecordFactory)))
                .thenReturn(Optional.of(testVersionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRDFRecordFactory)))
                .thenReturn(Optional.of(testVersionedRDFRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(mappingRecordFactory)))
                .thenReturn(Optional.of(testMappingRecord));
        when(catalogManager.createRecord(any(RecordConfig.class), eq(recordFactory))).thenReturn(testRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(unversionedRecordFactory)))
                .thenReturn(testUnversionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRecordFactory)))
                .thenReturn(testVersionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRDFRecordFactory)))
                .thenReturn(testVersionedRDFRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(mappingRecordFactory)))
                .thenReturn(testMappingRecord);
        when(catalogManager.getUnversionedDistributions(any(Resource.class), any(Resource.class))).thenReturn(Collections.singleton(testDistribution));
        when(catalogManager.createDistribution(any(DistributionConfig.class))).thenReturn(testDistribution);
        when(catalogManager.getUnversionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(testDistribution));
        when(catalogManager.getVersions(any(Resource.class), any(Resource.class))).thenReturn(Collections.singleton(testVersion));
        when(catalogManager.getVersion(any(Resource.class), any(Resource.class), any(Resource.class), eq(versionFactory))).thenReturn(Optional.of(testVersion));
        when(catalogManager.getVersion(any(Resource.class), any(Resource.class), any(Resource.class), eq(tagFactory))).thenReturn(Optional.of(testTag));
        when(catalogManager.getLatestVersion(any(Resource.class), any(Resource.class), eq(versionFactory))).thenReturn(Optional.of(testVersion));
        when(catalogManager.createVersion(anyString(), anyString(), eq(versionFactory))).thenReturn(testVersion);
        when(catalogManager.createVersion(anyString(), anyString(), eq(tagFactory))).thenReturn(testTag);
        when(catalogManager.getTaggedCommit(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(testCommits.get(0));
        when(catalogManager.getVersionedDistributions(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Collections.singleton(testDistribution));
        when(catalogManager.getVersionedDistribution(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(testDistribution));
        when(catalogManager.getBranches(any(Resource.class), any(Resource.class))).thenReturn(Stream.of(testBranch, testUserBranch).collect(Collectors.toSet()));
        when(catalogManager.getBranch(any(Resource.class), any(Resource.class), any(Resource.class), eq(branchFactory))).thenReturn(Optional.of(testBranch));
        when(catalogManager.getBranch(any(Resource.class), any(Resource.class), eq(testUserBranch.getResource()), eq(branchFactory))).thenReturn(Optional.of(testUserBranch));
        when(catalogManager.getBranch(any(Resource.class), any(Resource.class), any(Resource.class), eq(userBranchFactory))).thenReturn(Optional.of(testUserBranch));
        when(catalogManager.getMasterBranch(any(Resource.class), any(Resource.class))).thenReturn(testBranch);
        when(catalogManager.createBranch(anyString(), anyString(), eq(branchFactory))).thenReturn(testBranch);
        when(catalogManager.createBranch(anyString(), anyString(), eq(userBranchFactory))).thenReturn(testUserBranch);
        when(catalogManager.getCommit(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class))).thenAnswer(i -> {
            Resource iri = i.getArgumentAt(3, Resource.class);
            Commit found = null;
            for (Commit commit : testCommits) {
                if (iri.equals(commit.getResource())) {
                    found = commit;
                }
            }
            return Optional.ofNullable(found);
        });
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(testInProgressCommit));
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class))).thenReturn(Optional.of(testInProgressCommit));
        when(catalogManager.getConflicts(any(Resource.class), any(Resource.class))).thenReturn(Collections.singleton(conflict));
        when(catalogManager.getCommitChain(any(Resource.class))).thenReturn(testCommits);
        when(catalogManager.getCommitChain(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(testCommits);
        when(catalogManager.getCommitChain(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(testCommits);
        when(catalogManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(testCommits.get(0));
        when(catalogManager.getHeadCommit(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(testCommits.get(0));
        when(catalogManager.getCompiledResource(any(Resource.class))).thenReturn(compiledResource);
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(User.class))).thenReturn(Optional.of(testInProgressCommit));
        when(catalogManager.applyInProgressCommit(any(Resource.class), any(Model.class))).thenReturn(compiledResourceWithChanges);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(testInProgressCommit);
        when(catalogManager.getCommitDifference(any(Resource.class))).thenReturn(difference);
        when(catalogManager.getDifference(any(Resource.class), any(Resource.class))).thenReturn(difference);
        when(catalogManager.removeRecord(any(Resource.class), eq(vf.createIRI(RECORD_IRI)), any(OrmFactory.class))).thenReturn(testRecord);

        when(versioningManager.commit(any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), anyString())).thenReturn(vf.createIRI(COMMIT_IRIS[0]));
        when(versioningManager.merge(any(Resource.class), any(Resource.class), any(Resource.class), any(Resource.class), any(User.class), any(Model.class), any(Model.class))).thenReturn(vf.createIRI(COMMIT_IRIS[0]));

        when(conflict.getIRI()).thenReturn(vf.createIRI(CONFLICT_IRI));
        when(conflict.getLeftDifference()).thenReturn(difference);
        when(conflict.getRightDifference()).thenReturn(difference);

        when(difference.getAdditions()).thenReturn(mf.createModel());
        when(difference.getDeletions()).thenReturn(mf.createModel());

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(engineManager.getUsername(any(Resource.class))).thenReturn(Optional.of(user.getResource().stringValue()));

        when(provUtils.startCreateActivity(any(User.class))).thenReturn(createActivity);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
    }

    @AfterMethod
    public void resetMocks() {
        reset(catalogManager, versioningManager, engineManager, transformer, conflict, difference, results, bNodeService, provUtils);
    }

    // GET commits/{commitId}
    @Test
    public void getCommitTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertTrue(result.containsKey("commit"));
            assertTrue(result.containsKey("additions"));
            assertTrue(result.containsKey("deletions"));
            JSONObject commit = result.getJSONObject("commit");
            assertTrue(commit.containsKey("@id"));
            assertEquals(commit.getString("@id"), COMMIT_IRIS[1]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingCommitTest() {
        // Setup:
        when(catalogManager.getCommitChain(vf.createIRI(ERROR_IRI))).thenReturn(Collections.EMPTY_LIST);

        Response response = target().path("commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void getCommitWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommitChain(vf.createIRI(ERROR_IRI));

        Response response = target().path("commits/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));

        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 500);

        doThrow(new IllegalStateException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]))
                .request().get();
        assertEquals(response.getStatus(), 500);
    }

    // GET commits/{commitId}/history
    @Test
    public void getCommitHistoryTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), COMMIT_IRIS.length);
            for (Object aResult : result) {
                JSONObject commitObj = JSONObject.fromObject(aResult);
                assertTrue(commitObj.containsKey("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(commitObj.getString("id")));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), COMMIT_IRIS.length);
            for (Object aResult : result) {
                JSONObject commitObj = JSONObject.fromObject(aResult);
                assertTrue(commitObj.containsKey("id"));
                assertTrue(Arrays.asList(COMMIT_IRIS).contains(commitObj.getString("id")));
            }
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithPaginationAndLinksTest() {
        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .queryParam("offset", 1)
                .queryParam("limit", 1)
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + COMMIT_IRIS.length);
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("commits/" + encode(COMMIT_IRIS[1]) + "/history"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject commitObj = result.getJSONObject(0);
            assertTrue(commitObj.containsKey("id"));
            assertEquals(commitObj.getString("id"), COMMIT_IRIS[1]);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommitHistoryWithIncorrectPathTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommitChain(vf.createIRI(ERROR_IRI));

        Response response = target().path("commits/" + encode(ERROR_IRI) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getCommitHistoryWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));

        Response response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 500);

        doThrow(new IllegalStateException()).when(catalogManager).getCommitChain(vf.createIRI(COMMIT_IRIS[1]));
        response = target().path("commits/" + encode(COMMIT_IRIS[1]) + "/history")
                .request().get();
        assertEquals(response.getStatus(), 500);
    }
}
