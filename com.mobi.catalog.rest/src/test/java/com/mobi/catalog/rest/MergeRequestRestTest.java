package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rest.util.RestUtils.createIRI;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
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

import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
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
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
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

    private User user;

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
    private static MergeRequestManager requestManager;
    private static EngineManager engineManager;
    private static CatalogConfigProvider configProvider;
    private static MergeRequestFactory mergeRequestFactory;
    private static CommentFactory commentFactory;
    private static BranchFactory branchFactory;
    private static UserFactory userFactory;
    private static ValueConverterRegistry vcr;

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

        rest = new MergeRequestRest();
        rest.setManager(requestManager);
        rest.setEngineManager(engineManager);
        rest.setMergeRequestFactory(mergeRequestFactory);
        rest.setCommentFactory(commentFactory);
        rest.setConfigProvider(configProvider);

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        when(configProvider.getLocalCatalogIRI()).thenReturn(vf.createIRI(CATALOG_IRI));

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

        commentChains = Arrays.asList(Arrays.asList(comment1, comment2), Arrays.asList(comment3));

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

        doThrow(new IllegalArgumentException()).when(requestManager).deleteMergeRequest(vf.createIRI(doesNotExist));
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        when(engineManager.retrieveUser(UsernameTestFilter.USERNAME)).thenReturn(Optional.of(user));
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        reset(requestManager, engineManager);
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
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void updateMergeRequestEmptyJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.json("[]"));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestWithInvalidJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.json("['test': true]"));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestThatDoesNotMatchTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request2.getModel(), getRDFFormat("jsonld")), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestWithErrorTest() {
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

    /* POST merge-requests/{requestId} */

    @Test
    public void acceptMergeRequestTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        verify(requestManager).acceptMergeRequest(request1.getResource(), user);
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void acceptMergeRequestWithBadArgumentsTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(requestManager).acceptMergeRequest(any(Resource.class), any(User.class));

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void acceptMergeRequestWithErrorTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(requestManager).acceptMergeRequest(any(Resource.class), any(User.class));

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));
        assertEquals(response.getStatus(), 500);
    }

    /* DELETE merge-requests/{requestId} */

    @Test
    public void deleteMergeRequestTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request().delete();
        verify(requestManager).deleteMergeRequest(request1.getResource());
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void deleteMergeRequestWithIRIDoesNotExistTest() {
        Response response = target().path("merge-requests/" + encode(doesNotExist))
                .request().delete();
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void deleteMergeRequestWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(invalidIRIString))
                .request().delete();
        assertEquals(response.getStatus(), 400);
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
}
