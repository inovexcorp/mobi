package com.mobi.catalog.rest.impl;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
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
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
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
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class MergeRequestRestImplTest extends MobiRestTestNg {
    private MergeRequestRestImpl rest;
    private MergeRequestFactory mergeRequestFactory;
    private CommentFactory commentFactory;
    private UserFactory userFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private MergeRequest request1;
    private MergeRequest request2;
    private Comment comment1;
    private Comment comment2;
    private Comment comment3;
    private List<List<Comment>> commentChains;
    private JSONObject commentJson;


    private User user;

    private final String CATALOG_IRI = "http://test.org/catalog";
    private final String RECORD_ID = "http://mobi.com/records#record";
    private final String BRANCH_ID = "http://mobi.com/branches#branch";

    private final String doesNotExist = "urn:doesNotExist";
    private final String invalidIRIString = "invalidIRI";

    @Mock
    private MergeRequestManager requestManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private CatalogConfigProvider configProvider;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();

        mergeRequestFactory = new MergeRequestFactory();
        mergeRequestFactory.setModelFactory(mf);
        mergeRequestFactory.setValueFactory(vf);
        mergeRequestFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(mergeRequestFactory);

        commentFactory = new CommentFactory();
        commentFactory.setModelFactory(mf);
        commentFactory.setValueFactory(vf);
        commentFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(commentFactory);

        userFactory = new UserFactory();
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        MockitoAnnotations.initMocks(this);
        when(configProvider.getLocalCatalogIRI()).thenReturn(vf.createIRI(CATALOG_IRI));

        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class)))
                .thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));

        request1 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/merge-requests#1"));
        Model contextModel1 = mf.createModel();
        request1.getModel().forEach(statement -> contextModel1.add(statement.getSubject(), statement.getPredicate(), statement.getObject(), request1.getResource()));
        request1 = mergeRequestFactory.getExisting(request1.getResource(), contextModel1).get();

        request2 = mergeRequestFactory.createNew(vf.createIRI("http://mobi.com/merge-requests#2"));
        Model contextModel2 = mf.createModel();
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
        commentJson = JSONObject.fromObject("{'comment': 'This is a comment.'}");

        rest = new MergeRequestRestImpl();
        rest.setManager(requestManager);
        rest.setEngineManager(engineManager);
        rest.setTransformer(transformer);
        rest.setVf(vf);
        rest.setMergeRequestFactory(mergeRequestFactory);
        rest.setCommentFactory(commentFactory);
        rest.setConfigProvider(configProvider);

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
    public void setUpMocks() throws Exception {
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

    @AfterMethod
    public void resetMocks() {
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

    /* POST merge-requests */

    @Test
    public void createMergeRequestTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);
        fd.field("assignees", UsernameTestFilter.USERNAME);
        fd.field("removeSource", "true");

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));
        verify(requestManager).addMergeRequest(any(MergeRequest.class));
        assertEquals(request1.getResource().stringValue(), response.readEntity(String.class));
    }

    @Test
    public void createMergeRequestWithInvalidAssigneeTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);
        fd.field("assignees", "error");

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("targetBranchId", BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("sourceBranchId", BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);
        doThrow(new IllegalArgumentException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("targetBranchId", BRANCH_ID);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createMergeRequestWithInvalidTargetTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", invalidIRIString);

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createMergeRequestWithMissingRepoTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("recordId", RECORD_ID);
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);
        doThrow(new IllegalStateException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
        fd.field("sourceBranchId", BRANCH_ID);
        fd.field("targetBranchId", BRANCH_ID);
        doThrow(new MobiException()).when(requestManager).createMergeRequest(any(MergeRequestConfig.class), any(Resource.class));

        Response response = target().path("merge-requests").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
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
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
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
                .put(Entity.entity(groupedModelToString(request2.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager, never()).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateMergeRequestWithErrorTest() {
        doThrow(new MobiException()).when(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateMergeRequest(eq(request1.getResource()), any(MergeRequest.class));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateMergeRequestWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(invalidIRIString)).request()
                .put(Entity.entity(groupedModelToString(request1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
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
                .request().post(Entity.json(commentJson));
        assertEquals(response.getStatus(), 201);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());
        assertEquals(comment1.getResource().stringValue(), response.readEntity(String.class));
    }

    @Test
    public void createCommentRequestDoesNotExistTest() {
        doThrow(new MobiException()).when(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.json(commentJson));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString());
    }

    @Test
    public void createCommentNoJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createCommentEmptyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .request().post(Entity.json("{'comment':''}"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createReplyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment1.getResource().stringValue())
                .request().post(Entity.json(commentJson));
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
                .request().post(Entity.json(commentJson));
        assertEquals(response.getStatus(), 500);
        verify(engineManager, atLeastOnce()).retrieveUser(UsernameTestFilter.USERNAME);
        verify(requestManager).createComment(eq(request1.getResource()), any(User.class), anyString(), eq(comment1.getResource()));
    }

    @Test
    public void createReplyCommentNoJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment2.getResource().stringValue())
                .request().post(Entity.json(""));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createReplyCommentEmptyCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments")
                .queryParam("commentId", comment2.getResource().stringValue())
                .request().post(Entity.json("{'comment':''}"));
        assertEquals(response.getStatus(), 400);
    }

    /* GET merge-requests/{requestId}/comments/{commentId} */

    @Test
    public void getCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(requestManager).getComment(comment1.getResource());
        try {
            JSONObject result = JSONObject.fromObject(response.readEntity(String.class));
            assertEquals(result.getString("@id"), comment1.getResource().stringValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMissingCommentTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode("http://mobi.com/error")).request().get();
        assertEquals(response.getStatus(), 404);
        verify(requestManager).getComment(vf.createIRI("http://mobi.com/error"));
    }

    @Test
    public void getCommentWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(requestManager).getComment(comment1.getResource());

        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
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
                .put(Entity.entity(groupedModelToString(comment1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void updateCommentEmptyJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.json("[]"));
        verify(requestManager, never()).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateCommentWithInvalidJsonTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.json("['test': true]"));
        verify(requestManager, never()).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateCommentThatDoesNotMatchTest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(comment2.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager, never()).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateCommentWithErrorTest() {
        doThrow(new MobiException()).when(requestManager).updateComment(eq(comment1.getResource()), any(Comment.class));
        Response response = target().path("merge-requests/"+ encode(request1.getResource().stringValue()) + "/comments/"
                + encode(comment1.getResource().stringValue()))
                .request()
                .put(Entity.entity(groupedModelToString(comment1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        verify(requestManager).updateComment(eq(comment1.getResource()), any(Comment.class));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateCommentWithInvalidIRITest() {
        Response response = target().path("merge-requests/" + encode(request1.getResource().stringValue()) + "/comments/"
                + encode(invalidIRIString))
                .request()
                .put(Entity.entity(groupedModelToString(comment1.getModel(), getRDFFormat("jsonld"), transformer), MediaType.APPLICATION_JSON_TYPE));
        assertEquals(response.getStatus(), 400);
    }
}
