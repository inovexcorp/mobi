package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static com.mobi.ontologies.rdfs.Resource.type_IRI;
import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rest.util.RestUtils.createIRI;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.RecordCount;
import com.mobi.catalog.api.builder.UserCount;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.ClosedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class MergeRequestRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private MergeRequest request1;
    private MergeRequest request2;
    private Comment comment1;
    private Comment comment2;
    private Comment comment3;
    private List<List<Comment>> commentChains;
    private UserCount userCount;

    private User user;

    private VersionedRDFRecord record;
    private RecordCount recordCount;

    private final String CATALOG_IRI = "http://test.org/catalog";
    private final String RECORD_ID = "http://mobi.com/records#record";
    private final String SOURCE_BRANCH_ID = "http://mobi.com/branches#sourceBranch";
    private final String TARGET_BRANCH_ID = "http://mobi.com/branches#targetBranch";

    private final String doesNotExist = "urn:doesNotExist";
    private final String invalidIRIString = "invalidIRI";
    private final String commentText = "This is a comment";
    private final String updateCommentText = "updated comment";
    private final String largeComment = StringUtils.repeat("*", 2000000);

    // Mock services used in server
    private static MergeRequestRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;

    private static MergeRequestFactory mergeRequestFactory;
    private static CommentFactory commentFactory;
    private static BranchFactory branchFactory;
    private static UserFactory userFactory;
    private static VersionedRDFRecordFactory versionedRDFRecordFactory;
    private static ValueConverterRegistry vcr;
    private MemoryRepositoryWrapper repo;

    private static MergeRequestManager requestManager;
    private static EngineManager engineManager;
    private static CatalogConfigProvider configProvider;
    private static PDP pdp;

    @Mock
    private PaginatedSearchResults<UserCount> userCountResults;

    @Mock
    private PaginatedSearchResults<RecordCount> recordCountResults;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();
        vcr = new DefaultValueConverterRegistry();

        mergeRequestFactory = new MergeRequestFactory();
        mergeRequestFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(mergeRequestFactory);

        commentFactory = new CommentFactory();
        commentFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(commentFactory);

        userFactory = new UserFactory();
        userFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(userFactory);

        versionedRDFRecordFactory = new VersionedRDFRecordFactory();
        versionedRDFRecordFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(versionedRDFRecordFactory);

        branchFactory = new BranchFactory();
        branchFactory.valueConverterRegistry = vcr;
        vcr.registerValueConverter(branchFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        requestManager = Mockito.mock(MergeRequestManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        pdp = Mockito.mock(PDP.class);

        rest = Mockito.spy(new MergeRequestRest());
        rest.setManager(requestManager);
        rest.setEngineManager(engineManager);
        rest.setMergeRequestFactory(mergeRequestFactory);
        rest.setCommentFactory(commentFactory);
        rest.setConfigProvider(configProvider);
        rest.setPdp(pdp);

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        when(configProvider.getLocalCatalogIRI()).thenReturn(vf.createIRI(CATALOG_IRI));

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        when(configProvider.getRepository()).thenReturn(repo);

        request1 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/merge-requests#1"));
        Model contextModel1 = mf.createEmptyModel();
        request1.getModel().forEach(statement -> contextModel1.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), request1.getResource()));
        request1 = mergeRequestFactory.getExisting(request1.getResource(), contextModel1).get();
        request1.setSourceBranch(branchFactory.createNew(createIRI(SOURCE_BRANCH_ID, vf)));
        request1.setTargetBranch(branchFactory.createNew(createIRI(TARGET_BRANCH_ID, vf)));

        request2 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/merge-requests#2"));
        Model contextModel2 = mf.createEmptyModel();
        request2.getModel().forEach(statement -> contextModel2.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), request1.getResource()));
        request2 = mergeRequestFactory.getExisting(request2.getResource(), contextModel2).get();
        user = userFactory.createNew(vf.createIRI("http://test.org/" + UsernameTestFilter.USERNAME));
        record = versionedRDFRecordFactory.createNew(vf.createIRI("http://test.org/record"));
        record.setProperty(vf.createLiteral("record2"), vf.createIRI("http://purl.org/dc/terms/title"));

        comment1 = commentFactory.createNew(vf.createIRI("http://mobi.com/test/comments#1"));
        comment1.setOnMergeRequest(request1);
        comment1.setProperty(vf.createLiteral("2018-11-05T13:40:55.257-07:00"), vf.createIRI(_Thing.issued_IRI));
        comment1.setProperty(vf.createLiteral("2018-11-05T13:40:55.257-07:00"), vf.createIRI(_Thing.modified_IRI));
        comment1.setProperty(user.getResource(), vf.createIRI(_Thing.creator_IRI));
        comment1.setProperty(vf.createLiteral("Comment1"), vf.createIRI(_Thing.description_IRI));
        comment2 = commentFactory.createNew(vf.createIRI("http://mobi.com/test/comments#2"));
        comment2.setOnMergeRequest(request1);
        comment3 = commentFactory.createNew(vf.createIRI("http://mobi.com/test/comments#3"));
        comment3.setOnMergeRequest(request1);
        comment1.setReplyComment(comment2);

        commentChains = Arrays.asList(Arrays.asList(comment1, comment2), Collections.singletonList(comment3));

        userCount = new UserCount(user.getResource(), com.mobi.rest.util.UsernameTestFilter.USERNAME, 10);

        when(userCountResults.getPage()).thenReturn(Collections.singletonList(userCount));
        when(userCountResults.getPageNumber()).thenReturn(0);
        when(userCountResults.getPageSize()).thenReturn(10);
        when(userCountResults.getTotalSize()).thenReturn(1);

        when(requestManager.getMergeRequests(any(MergeRequestFilterParams.class))).thenReturn(Collections.singletonList(request1));
        when(requestManager.createMergeRequest(any(MergeRequestConfig.class), any(Resource.class))).thenReturn(request1);
        when(requestManager.getMergeRequest(any(Resource.class))).thenReturn(Optional.empty());
        when(requestManager.getMergeRequest(eq(request1.getResource()))).thenReturn(Optional.of(request1));
        doNothing().when(requestManager).acceptMergeRequest(any(Resource.class), any(User.class), any(RepositoryConnection.class));

        when(requestManager.getComments(eq(request1.getResource()))).thenReturn(commentChains);
        when(requestManager.createComment(eq(request1.getResource()), any(User.class), anyString())).thenReturn(comment1);
        when(requestManager.createComment(eq(request1.getResource()), any(User.class), anyString(), eq(comment1.getResource()))).thenReturn(comment2);
        when(requestManager.getComment(any(Resource.class))).thenReturn(Optional.empty());
        when(requestManager.getComment(comment1.getResource())).thenReturn(Optional.of(comment1));

        when(requestManager.getCreators(any(PaginatedSearchParams.class), any(Resource.class))).thenReturn(userCountResults);
        when(requestManager.getAssignees(any(PaginatedSearchParams.class), any(Resource.class))).thenReturn(userCountResults);

        doThrow(new IllegalArgumentException()).when(requestManager).deleteMergeRequest(vf.createIRI(doesNotExist));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(UsernameTestFilter.USERNAME)).thenReturn(Optional.of(user));

        recordCount = new RecordCount(record.getResource(), "record", 10);

        when(recordCountResults.getPage()).thenReturn(Collections.singletonList(recordCount));
        when(recordCountResults.getPageNumber()).thenReturn(0);
        when(recordCountResults.getPageSize()).thenReturn(10);
        when(recordCountResults.getTotalSize()).thenReturn(1);

        when(requestManager.getRecords(any(PaginatedSearchParams.class), any(Resource.class))).thenReturn(recordCountResults);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(requestManager, engineManager, configProvider, pdp, rest);
    }

    /* GET merge-requests */

    @Test
    public void getMergeRequestsTest() {
        Response response = target().path("merge-requests").request().get();
        assertEquals(response.getStatus(), 200);
        verify(requestManager).getMergeRequests(any(MergeRequestFilterParams.class));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertFalse(requestObj.containsKey("@graph"));
            assertTrue(requestObj.containsKey("@id"));
            assertEquals(requestObj.getString("@id"), request1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMergeRequestsWithMissingRepoTest() {
        // Setup
        doThrow(new IllegalStateException()).when(requestManager).getMergeRequests(any(MergeRequestFilterParams.class));

        Response response = target().path("merge-requests").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getMergeRequests(any(MergeRequestFilterParams.class));
    }

    @Test
    public void getMergeRequestsWithErrorTest() {
        // Setup
        doThrow(new MobiException()).when(requestManager).getMergeRequests(any(MergeRequestFilterParams.class));

        Response response = target().path("merge-requests").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getMergeRequests(any(MergeRequestFilterParams.class));
    }

    @Test
    public void getMergeRequestsWithInvalidSortTest() {
        Response response = target().path("merge-requests").queryParam("sort", invalidIRIString).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getMergeRequestsWithSearch() {
        Response response = target().path("merge-requests").queryParam("searchText", "test").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<MergeRequestFilterParams> captor = ArgumentCaptor.forClass(MergeRequestFilterParams.class);
        verify(requestManager).getMergeRequests(captor.capture());
        MergeRequestFilterParams params = captor.getValue();
        Optional<String> searchText = params.getSearchText();
        assertTrue(searchText.isPresent());
        assertEquals("test", searchText.get());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertFalse(requestObj.containsKey("@graph"));
            assertTrue(requestObj.containsKey("@id"));
            assertEquals(requestObj.getString("@id"), request1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMergeRequestsWithCreators() {
        Response response = target().path("merge-requests").queryParam("creators", user.getResource()).request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<MergeRequestFilterParams> captor = ArgumentCaptor.forClass(MergeRequestFilterParams.class);
        verify(requestManager).getMergeRequests(captor.capture());
        MergeRequestFilterParams params = captor.getValue();
        Optional<List<Resource>> creators = params.getCreators();
        assertTrue(creators.isPresent());
        assertEquals(1, creators.get().size());
        assertEquals(user.getResource(), creators.get().get(0));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertFalse(requestObj.containsKey("@graph"));
            assertTrue(requestObj.containsKey("@id"));
            assertEquals(requestObj.getString("@id"), request1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMergeRequestsWithAssignees() {
        Response response = target().path("merge-requests").queryParam("assignees", user.getResource()).request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<MergeRequestFilterParams> captor = ArgumentCaptor.forClass(MergeRequestFilterParams.class);
        verify(requestManager).getMergeRequests(captor.capture());
        MergeRequestFilterParams params = captor.getValue();
        Optional<List<Resource>> assignees = params.getAssignees();
        assertTrue(assignees.isPresent());
        assertEquals(1, assignees.get().size());
        assertEquals(user.getResource(), assignees.get().get(0));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertFalse(requestObj.containsKey("@graph"));
            assertTrue(requestObj.containsKey("@id"));
            assertEquals(requestObj.getString("@id"), request1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* GET merge-requests/creators */

    @Test
    public void getCreatorsTest() {
        Response response = target().path("merge-requests/creators").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getCreators(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCreatorsWithPagingTest() {
        Response response = target().path("merge-requests/creators").queryParam("offset", 1).queryParam("limit", 10).request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getCreators(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(1, params.getOffset());
        assertTrue(params.getLimit().isPresent());
        assertEquals(10, params.getLimit().get().intValue());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCreatorsWithBadPagingTest() {
        Response response = target().path("merge-requests/creators").queryParam("offset", -1).queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager, times(0)).getCreators(any(PaginatedSearchParams.class), any(Resource.class));
        assertEquals("", response.readEntity(String.class));
    }

    @Test
    public void getCreatorsWithSearchText() {
        Response response = target().path("merge-requests/creators").queryParam("searchText", "test").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getCreators(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isPresent());
        assertEquals("test", params.getSearchText().get());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCreatorsIllegalArgumentTest() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(requestManager).getCreators(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/creators").request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager).getCreators(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalArgumentException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCreatorsIllegalStateTest() {
        Mockito.doThrow(new IllegalStateException("I'm an exception!")).when(requestManager).getCreators(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/creators").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getCreators(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalStateException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* GET merge-requests/assignees */

    @Test
    public void getAssigneesTest() {
        Response response = target().path("merge-requests/assignees").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getAssignees(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAssigneesWithPagingTest() {
        Response response = target().path("merge-requests/assignees").queryParam("offset", 1).queryParam("limit", 10).request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getAssignees(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(1, params.getOffset());
        assertTrue(params.getLimit().isPresent());
        assertEquals(10, params.getLimit().get().intValue());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAssigneesWithBadPagingTest() {
        Response response = target().path("merge-requests/assignees").queryParam("offset", -1).queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager, times(0)).getAssignees(any(PaginatedSearchParams.class), any(Resource.class));
        assertEquals("", response.readEntity(String.class));
    }

    @Test
    public void getAssigneesWithSearchText() {
        Response response = target().path("merge-requests/assignees").queryParam("searchText", "test").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getAssignees(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isPresent());
        assertEquals("test", params.getSearchText().get());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("user"));
            assertEquals(userCount.getUser().stringValue(), requestObj.getString("user"));
            assertTrue(requestObj.containsKey("name"));
            assertEquals(userCount.getName(), requestObj.getString("name"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(userCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAssigneesIllegalArgumentTest() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(requestManager).getAssignees(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/assignees").request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager).getAssignees(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalArgumentException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAssigneesIllegalStateTest() {
        Mockito.doThrow(new IllegalStateException("I'm an exception!")).when(requestManager).getAssignees(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/assignees").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getAssignees(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalStateException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* POST merge-requests */

    @Test
    public void createMergeRequestTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);
        fd.field("assignees", UsernameTestFilter.USERNAME);
        fd.field("removeSource", "true");

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager).addMergeRequest(any(MergeRequest.class));
        assertEquals(request1.getResource().stringValue(), response.readEntity(String.class));
    }

    @Test
    public void createMergeRequestTestWithSameBranch() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", SOURCE_BRANCH_ID);
        fd.field("assignees", UsernameTestFilter.USERNAME);
        fd.field("removeSource", "true");

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
    }

    @Test
    public void createMergeRequestWithInvalidAssigneeTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);
        fd.field("assignees", "error");

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager, times(0)).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, times(0)).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager, times(0)).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithoutRecordTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, times(0)).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager, times(0)).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithoutSourceTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, times(0)).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager, times(0)).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithoutTargetTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, times(0)).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager, times(0)).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithInvalidPathTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);
        doThrow(new IllegalArgumentException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithInvalidSourceTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", invalidIRIString);
        fd.field("targetBranchId", TARGET_BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createMergeRequestWithInvalidTargetTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", invalidIRIString);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createMergeRequestWithMissingRepoTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);
        doThrow(new IllegalStateException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    @Test
    public void createMergeRequestWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", SOURCE_BRANCH_ID);
        fd.field("targetBranchId", TARGET_BRANCH_ID);
        doThrow(new MobiException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager, times(0)).addMergeRequest(any(MergeRequest.class));
    }

    /* GET merge-requests/{requestId} */

    @Test
    public void getMergeRequestTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(requestManager).getMergeRequest(request1.getResource());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertFalse(result.containsKey("@graph"));
            assertTrue(result.containsKey("@id"));
            assertEquals(result.getString("@id"), request1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingMergeRequestTest() {
        Response response = target().path("merge-requests/" + encode("http://mobi.com/error")).request().get();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getMergeRequest(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void getMergeRequestWithMissingRepoTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(requestManager).getMergeRequest(request1.getResource());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getMergeRequest(request1.getResource());
    }

    @Test
    public void getMergeRequestWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(requestManager).getMergeRequest(request1.getResource());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getMergeRequest(request1.getResource());
    }

    @Test
    public void getMergeRequestWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(invalidIRIString)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    /* POST merge-requests/{requestId} */

    @Test
    public void updateMergeRequestTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void updateMergeRequestEmptyJsonTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.json("[]"));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestWithInvalidJsonTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.json("['test': true]"));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestThatDoesNotMatchTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request2.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestWithErrorTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        doThrow(new MobiException()).when(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateMergeRequestWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(invalidIRIString)).request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
    }

    /* GET merge-requests/{requestId}/status */
    @Test
    public void updateMergeRequestPermissionDeniedTest() {
        Mockito.doReturn(true).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 401);
    }

    /* POST merge-requests/{requestId} */

    @Test
    public void retrieveMergeRequestStatusClosedTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getResource(), vf.createIRI(type_IRI), vf.createIRI(ClosedMergeRequest.TYPE));
        }
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .request().get();
        assertEquals(response.getStatus(), 200);
        String responseStatus = response.readEntity(String.class);
        assertEquals(responseStatus, "closed");
    }

    @Test
    public void retrieveMergeRequestStatusAcceptedTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getResource(), vf.createIRI(type_IRI), vf.createIRI(AcceptedMergeRequest.TYPE));
        }
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .request().get();
        assertEquals(response.getStatus(), 200);
        String responseStatus = response.readEntity(String.class);
        assertEquals(responseStatus, "accepted");
    }

    @Test
    public void retrieveMergeRequestStatusOpenTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getResource(), vf.createIRI(type_IRI), vf.createIRI(MergeRequest.TYPE));
        }
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .request().get();
        assertEquals(response.getStatus(), 200);
        String responseStatus = response.readEntity(String.class);
        assertEquals(responseStatus, "open");
    }

    @Test
    public void retrieveMergeRequestStatusNoAssociatedState() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(request1.getResource(), vf.createIRI(type_IRI), vf.createIRI("urn:invalid"));
        }
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void retrieveMergeRequestStatusNotFound() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .request().get();
        assertEquals(response.getStatus(), 404);
    }

    /* POST merge-requests/{requestId}/status */
    @Test
    public void updateMergeRequestStatusAcceptTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "accept")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));

        assertEquals(response.getStatus(), 200);
        verify(requestManager).acceptMergeRequest(request1.getResource(), user);
    }

    @Test
    public void updateMergeRequestStatusAcceptWithBadArgumentsTest() {
        // Setup:
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        doThrow(new IllegalArgumentException()).when(requestManager).acceptMergeRequest(any(Resource.class), any(User.class));

        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "accept")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestStatusAcceptWithErrorTest() {
        // Setup:
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        doThrow(new IllegalStateException()).when(requestManager).acceptMergeRequest(any(Resource.class), any(User.class));

        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "accept")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateMergeRequestStatusCloseTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "close")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 200);
        verify(requestManager).closeMergeRequest(request1.getResource(), user);
    }

    @Test
    public void updateMergeRequestStatusOpenTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "open")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 200);
        verify(requestManager).reopenMergeRequest(request1.getResource(), user);
    }

    @Test
    public void updateMergeRequestStatusInvalidActionTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path(String.format("merge-requests/%s/status", encode(request1.getResource().stringValue())))
                .queryParam("action", "invalid")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), BAD_REQUEST.getStatusCode());
    }

    /* DELETE merge-requests/{requestId} */

    @Test
    public void deleteMergeRequestTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).deleteMergeRequest(request1.getResource());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void deleteMergeRequestWithIRIDoesNotExistTest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(doesNotExist))
                .request().delete();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void deleteMergeRequestWithInvalidIRITest() {
        Mockito.doReturn(false).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(invalidIRIString))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteMergeRequestPermissionDeniedTest() {
        Mockito.doReturn(true).when(rest).checkMergeRequestManagePermissions(any(), any());
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().delete();
        verify(requestManager, never()).deleteMergeRequest(request1.getResource());
        assertEquals(response.getStatus(), 401);
    }

    /* GET merge-requests/{requestId}/comments */

    @Test
    public void getCommentsTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments").request().get();
        assertEquals(response.getStatus(), 200);
        verify(requestManager).getComments(eq(request1.getResource()));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 2);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommentsWithErrorTest() {
        // Setup
        doThrow(new MobiException()).when(requestManager).getComments(any(Resource.class));

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getComments(eq(request1.getResource()));
    }

    /* POST merge-requests/{requestId}/comments */

    @Test
    public void createCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.text(commentText));
        assertEquals(response.getStatus(), 201);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());
        assertEquals(comment1.getResource().stringValue(), response.readEntity(String.class));
    }

    @Test
    public void createCommentRequestDoesNotExistTest() {
        doThrow(new MobiException()).when(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.text(commentText));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());
    }

    @Test
    public void createCommentEmptyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.text(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createReplyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment1.getResource().stringValue())
                .request().post(Entity.text(commentText));
        assertEquals(response.getStatus(), 201);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString(), eq(comment1.getResource()));
        assertEquals(comment2.getResource().stringValue(), response.readEntity(String.class));
    }

    @Test
    public void createReplyCommentRequestDoesNotExistTest() {
        doThrow(new MobiException()).when(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString(), eq(comment1.getResource()));

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment1.getResource().stringValue())
                .request().post(Entity.text(commentText));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString(), eq(comment1.getResource()));
    }

    @Test
    public void createReplyCommentEmptyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment2.getResource().stringValue())
                .request().post(Entity.text(""));
        assertEquals(response.getStatus(), 400);
    }

    /* GET merge-requests/{requestId}/comments/{commentId} */

    @Test
    public void getCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).getComment(comment1.getResource());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(result.getString("@id"), comment1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCommentMissingTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode("http://mobi.com/error")).request().get();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).getComment(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void getCommentMissingRequestTest() {
        Response response = target().path("merge-requests/" + encode("http://mobi.com/error") + "/comments/"
                + encode(comment1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getMergeRequest(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void getCommentWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(requestManager).getComment(comment1.getResource());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).getComment(comment1.getResource());
    }

    @Test
    public void getCommentWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(invalidIRIString)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    /* POST merge-requests/{requestId}/comments/{commentId} */

    @Test
    public void updateCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.text(updateCommentText));
        ArgumentCaptor<Comment> commentArgumentCaptor = ArgumentCaptor.forClass(Comment.class);
        verify(requestManager).updateComment(eq(comment1.getResource()), commentArgumentCaptor.capture());
        Comment comment = commentArgumentCaptor.getValue();
        assertNotEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)), Optional.empty());
        assertEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)).get().stringValue(), updateCommentText);
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void updateCommentEmptyStringTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.text(""));
        verify(requestManager, never()).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateCommentWithInvalidCommentSizeTest() {
        doThrow(new IllegalArgumentException()).when(requestManager).updateComment(any(Resource.class), any(Comment.class));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.text(largeComment));
        ArgumentCaptor<Comment> commentArgumentCaptor = ArgumentCaptor.forClass(Comment.class);
        verify(requestManager).updateComment(eq(comment1.getResource()), commentArgumentCaptor.capture());
        Comment comment = commentArgumentCaptor.getValue();
        assertNotEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)), Optional.empty());
        assertEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)).get().stringValue(), largeComment);
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateCommentWithErrorTest() {
        doThrow(new MobiException()).when(requestManager).updateComment(eq(comment1.getResource()), any(Comment.class));
        Response response = target().path("merge-requests/"+ encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.text(updateCommentText));
        ArgumentCaptor<Comment> commentArgumentCaptor = ArgumentCaptor.forClass(Comment.class);
        verify(requestManager).updateComment(eq(comment1.getResource()), commentArgumentCaptor.capture());
        Comment comment = commentArgumentCaptor.getValue();
        assertNotEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)), Optional.empty());
        assertEquals(comment.getProperty(vf.createIRI(_Thing.description_IRI)).get().stringValue(), updateCommentText);
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateCommentWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(invalidIRIString))
                .request()
                .put(Entity.text(updateCommentText));
        assertEquals(response.getStatus(), 400);
    }

    /* DELETE merge-requests/{requestId}/comments/{commentId} */

    @Test
    public void deleteComment() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).deleteComment(comment1.getResource());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void deleteCommentWithIllegalArgumentException() {
        doThrow(new IllegalArgumentException()).when(requestManager).deleteComment(eq(comment1.getResource()));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).deleteComment(comment1.getResource());
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteCommentWithIllegalStateException() {
        doThrow(new IllegalStateException()).when(requestManager).deleteComment(eq(comment1.getResource()));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).deleteComment(comment1.getResource());
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void deleteCommentWithMobiException() {
        doThrow(new MobiException()).when(requestManager).deleteComment(eq(comment1.getResource()));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).deleteComment(comment1.getResource());
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void deleteCommentRequestDoesNotExist() {
        Response response = target().path("merge-requests/" + encode("http://mobi.com/error") + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getMergeRequest(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void deleteCommentCommentDoesNotExist() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode("http://mobi.com/error"))
                .request().delete();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).getComment(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void deleteCommentUserDoesNotMatch() {
        User user2 = userFactory.createNew(vf.createIRI("urn:user2"));
        when(engineManager.retrieveUser(UsernameTestFilter.USERNAME)).thenReturn(Optional.of(user2));

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request().delete();
        assertEquals(response.getStatus(), 401);
        verify(requestManager).getMergeRequest(request1.getResource());
        verify(requestManager).getComment(comment1.getResource());
    }

    @Test
    public void getRecordsTest() {
        Response response = target().path("merge-requests/records").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getRecords(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("record"));
            assertEquals(recordCount.getRecord().stringValue(), requestObj.getString("record"));
            assertTrue(requestObj.containsKey("title"));
            assertEquals(recordCount.getTitle(), requestObj.getString("title"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(recordCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithPagingTest() {
        Response response = target().path("merge-requests/records").queryParam("offset", 1).queryParam("limit", 10).request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getRecords(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(1, params.getOffset());
        assertTrue(params.getLimit().isPresent());
        assertEquals(10, params.getLimit().get().intValue());
        assertTrue(params.getSearchText().isEmpty());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("record"));
            assertEquals(recordCount.getRecord().stringValue(), requestObj.getString("record"));
            assertTrue(requestObj.containsKey("title"));
            assertEquals(recordCount.getTitle(), requestObj.getString("title"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(recordCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithBadPagingTest() {
        Response response = target().path("merge-requests/records").queryParam("offset", -1).queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager, times(0)).getRecords(any(PaginatedSearchParams.class), any(Resource.class));
        assertEquals("", response.readEntity(String.class));
    }

    @Test
    public void getRecordsWithSearchText() {
        Response response = target().path("merge-requests/records").queryParam("searchText", "test").request().get();
        assertEquals(response.getStatus(), 200);
        ArgumentCaptor<PaginatedSearchParams> captor = ArgumentCaptor.forClass(PaginatedSearchParams.class);
        verify(requestManager).getRecords(captor.capture(), eq(user.getResource()));
        PaginatedSearchParams params = captor.getValue();
        assertEquals(0, params.getOffset());
        assertTrue(params.getLimit().isEmpty());
        assertTrue(params.getSearchText().isPresent());
        assertEquals("test", params.getSearchText().get());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject requestObj = result.getJSONObject(0);
            assertTrue(requestObj.containsKey("record"));
            assertEquals(recordCount.getRecord().stringValue(), requestObj.getString("record"));
            assertTrue(requestObj.containsKey("title"));
            assertEquals(recordCount.getTitle(), requestObj.getString("title"));
            assertTrue(requestObj.containsKey("count"));
            assertEquals(recordCount.getCount().intValue(), requestObj.getInt("count"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsIllegalArgumentTest() {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(requestManager).getRecords(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/records").request().get();
        assertEquals(response.getStatus(), 400);
        verify(requestManager).getRecords(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalArgumentException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsIllegalStateTest() {
        Mockito.doThrow(new IllegalStateException("I'm an exception!")).when(requestManager).getRecords(any(PaginatedSearchParams.class), any(Resource.class));

        Response response = target().path("merge-requests/records").request().get();
        assertEquals(response.getStatus(), 500);
        verify(requestManager).getRecords(any(PaginatedSearchParams.class), any(Resource.class));

        try {
            JSONObject responseObject = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(responseObject.get("error"), "IllegalStateException");
            assertEquals(responseObject.get("errorMessage"), "I'm an exception!");
            assertNotEquals(responseObject.get("errorDetails"), null);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void checkMergeRequestPermissionsNotFoundTest() {
        try {
            rest.checkMergeRequestManagePermissions(vf.createIRI("http://non-exist.com"), Mockito.mock(User.class));
            fail("Expected exception was not thrown");
        } catch (Exception e) {
            assertNotNull(e);
        }
    }

    @Test
    public void checkMergeRequestPermissionsCreatorTest() {
        MergeRequest mergeRequest = Mockito.mock(MergeRequest.class);
        when(mergeRequest.getProperty(vf.createIRI(_Thing.creator_IRI))).thenReturn(Optional.of(vf.createIRI("urn:user1")));

        when(requestManager.getMergeRequest(any())).thenReturn(Optional.of(mergeRequest));

        User user = Mockito.mock(User.class);
        when(user.getResource()).thenReturn(vf.createIRI("urn:user1"));

        boolean accessDenied = rest.checkMergeRequestManagePermissions(vf.createIRI("http://non-exist.com"), user);
        assertFalse(accessDenied);
    }

    @Test
    public void checkMergeRequestPermissionsCreatorAccessDeniedTest() {
        MergeRequest mergeRequest = Mockito.mock(MergeRequest.class);
        when(mergeRequest.getProperty(vf.createIRI(_Thing.creator_IRI))).thenReturn(Optional.of(vf.createIRI("urn:user1")));

        when(requestManager.getMergeRequest(any())).thenReturn(Optional.of(mergeRequest));

        User user = Mockito.mock(User.class);
        when(user.getResource()).thenReturn(vf.createIRI("urn:user2"));

        boolean accessDenied = rest.checkMergeRequestManagePermissions(vf.createIRI("http://non-exist.com"), user);
        assertTrue(accessDenied);
    }

    @Test
    public void checkMergeRequestPermissionsPepAccessDeniedFalseTest() {
        MergeRequest mergeRequest = Mockito.mock(MergeRequest.class);
        when(mergeRequest.getProperty(vf.createIRI(_Thing.creator_IRI))).thenReturn(Optional.of(vf.createIRI("urn:user1")));
        when(mergeRequest.getOnRecord_resource()).thenReturn(Optional.of(vf.createIRI("urn:onRecord")));

        when(requestManager.getMergeRequest(any())).thenReturn(Optional.of(mergeRequest));

        Request request = Mockito.mock(Request.class);
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);

        com.mobi.security.policy.api.Response response = Mockito.mock(com.mobi.security.policy.api.Response.class);
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(pdp.evaluate(any(), any())).thenReturn(response);

        User user = Mockito.mock(User.class);
        when(user.getResource()).thenReturn(vf.createIRI("urn:user2"));

        boolean accessDenied = rest.checkMergeRequestManagePermissions(vf.createIRI("http://non-exist.com"), user);
        assertFalse(accessDenied);
        verify(pdp).createRequest(any(), any(), any(), any(), any(), any());
    }

    @Test
    public void checkMergeRequestPermissionsPepAccessDeniedTrueTest() {
        MergeRequest mergeRequest = Mockito.mock(MergeRequest.class);
        when(mergeRequest.getProperty(vf.createIRI(_Thing.creator_IRI))).thenReturn(Optional.of(vf.createIRI("urn:user1")));
        when(mergeRequest.getOnRecord_resource()).thenReturn(Optional.of(vf.createIRI("urn:onRecord")));

        when(requestManager.getMergeRequest(any())).thenReturn(Optional.of(mergeRequest));

        Request request = Mockito.mock(Request.class);
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);

        com.mobi.security.policy.api.Response response = Mockito.mock(com.mobi.security.policy.api.Response.class);
        when(response.getDecision()).thenReturn(Decision.DENY);
        when(pdp.evaluate(any(), any())).thenReturn(response);

        User user = Mockito.mock(User.class);
        when(user.getResource()).thenReturn(vf.createIRI("urn:user2"));

        boolean accessDenied = rest.checkMergeRequestManagePermissions(vf.createIRI("http://non-exist.com"), user);
        assertTrue(accessDenied);
        verify(pdp).createRequest(any(), any(), any(), any(), any(), any());
    }

}
