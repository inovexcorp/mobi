package com.mobi.rest.security;

/*-
 * #%L
 * com.mobi.rest.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import static com.mobi.web.security.util.AuthenticationProps.ANON_USER;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.IRI;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.util.MobiWebException;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.web.security.util.AuthenticationProps;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.Form;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.UriInfo;
import javax.ws.rs.ext.MessageBodyReader;
import javax.ws.rs.ext.Providers;

public class XACMLRequestFilterTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private static final String QUERY_PARAM_KEY = "testQueryParamKey";
    private static final String QUERY_PARAM_TWO_KEY = "testQueryParamTwoKey";
    private static final String QUERY_PARAM_VALUE = "http://mobi.com/queryParamKey#queryParamValue";

    private static final String PATH_PARAM_KEY = "testPathParamKey";
    private static final String PATH_PARAM_TWO_KEY = "testPathParamTwoKey";
    private static final String PATH_PARAM_VALUE = "http://mobi.com/pathParamKey#pathParamValue";

    private static final String FORM_DATA_FIELD = "testFormDataField";
    private static final String FORM_DATA_TWO_FIELD = "testFormDataTwoField";
    private static final String FORM_DATA_VALUE = "http://mobi.com/formDataField#formDataValue";

    private static final String URL_ENCODED_FORM_FIELD = "testFormField";
    private static final String URL_ENCODED_FORM_TWO_FIELD = "testFormTwoField";
    private static final String URL_ENCODED_FORM_VALUE = "http://mobi.com/formField#formValue";

    private static final String DEFAULT_RESOURCE_ID_IRI = "http://mobi.com/test-default";

    private static final String MOBI_USER_IRI = "urn:mobiUser";

    private XACMLRequestFilter filter;

    private User user;
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    @Rule
    public ExpectedException exceptionRule = ExpectedException.none();

    @Mock
    private ContainerRequestContext context;

    @Mock
    private ResourceInfo resourceInfo;

    @Mock
    private UriInfo uriInfo;

    @Mock
    private PDP pdp;

    @Mock
    private EngineManager engineManager;

    @Mock
    private Response response;

    @Mock
    private Request request;

    @Mock
    private Providers providers;

    @Mock
    private MessageBodyReader<Form> reader;

    @Before
    public void setUp() {
        closeable = MockitoAnnotations.openMocks(this);

        filter = new XACMLRequestFilter();
        filter.pdp = pdp;
        filter.engineManager = engineManager;
        filter.uriInfo = uriInfo;
        filter.resourceInfo = resourceInfo;
        filter.providers = providers;

        when(context.getMethod()).thenReturn("GET");
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any(), any(IRI.class))).thenReturn(response);
        when(response.getDecision()).thenReturn(Decision.PERMIT);
        when(providers.getMessageBodyReader(eq(Form.class), any(), any(), any())).thenReturn(reader);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test(expected = MobiWebException.class)
    public void invalidIri() throws Exception {
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockInvalidResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));
        filter.filter(context);
    }

    @Test
    public void decisionIsPermitTest() throws Exception {
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));
        filter.filter(context);
        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI("http://mobi.com/test#action");
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void decisionIsDenyTest() throws Exception {
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));
        when(response.getDecision()).thenReturn(Decision.DENY);
        try {
            filter.filter(context);
            fail("Expected MobiWebException to have been thrown");
        } catch (MobiWebException e) {
            assertEquals("You do not have permission to perform this action", e.getMessage());
            assertEquals(401, e.getResponse().getStatus());
        }
    }

    @Test
    public void decisionIsIndeterminateTest() throws Exception {
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));
        when(response.getDecision()).thenReturn(Decision.INDETERMINATE);
        try {
            filter.filter(context);
            fail("Expected MobiWebException to have been thrown");
        } catch (MobiWebException e) {
            assertEquals("Request indeterminate", e.getMessage());
            assertEquals(500, e.getResponse().getStatus());
        }
    }

    @Test
    public void decisionIsNotApplicableTest() throws Exception {
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));
        when(response.getDecision()).thenReturn(Decision.NOT_APPLICABLE);
        filter.filter(context);
        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI("http://mobi.com/test#action");
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void userIsNotAnonymousTest() throws Exception {
        user = userFactory.createNew(VALUE_FACTORY.createIRI(MOBI_USER_IRI));
        when(context.getProperty(AuthenticationProps.USERNAME)).thenReturn("tester");
        when(engineManager.retrieveUser("tester")).thenReturn(Optional.of(user));

        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdStringClass.class.getDeclaredMethod("resourceIdString"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI("http://mobi.com/test#action");
        IRI subjectId = VALUE_FACTORY.createIRI(MOBI_USER_IRI);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void noResourceIdAnnotationTest() throws Exception {
        when(resourceInfo.getResourceMethod()).thenReturn(MockNoResourceIdClass.class.getDeclaredMethod("noResourceId"));
        filter.filter(context);
        Mockito.verify(pdp, never()).createRequest(any(), any(), any(), any(), any(), any());
    }

    @Test
    public void resourceIdQueryParamExistsNoDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        queryParameters.putSingle(QUERY_PARAM_KEY, QUERY_PARAM_VALUE);
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamNoDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(QUERY_PARAM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdQueryParamExistsWithDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        queryParameters.putSingle(QUERY_PARAM_KEY, QUERY_PARAM_VALUE);
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(QUERY_PARAM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdMissingQueryParamNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Query parameters do not contain testQueryParamKey");

        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingQueryParamWithDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(DEFAULT_RESOURCE_ID_IRI);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdMissingQueryParamWithDefaultNotExistsTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Query parameters do not contain testQueryParamTwoKey");

        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdPathParamExistsNoDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        pathParameters.putSingle(PATH_PARAM_KEY, PATH_PARAM_VALUE);
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamNoDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(PATH_PARAM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdPathParamExistsWithDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        pathParameters.putSingle(PATH_PARAM_KEY, PATH_PARAM_VALUE);
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(PATH_PARAM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdMissingPathParamNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Path does not contain parameter testPathParamKey");

        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingPathParamWithDefaultTest() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(DEFAULT_RESOURCE_ID_IRI);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdMissingPathParamWithDefaultNotExistsTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Path does not contain parameter testPathParamTwoKey");

        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdFormExistsNoDefaultTest() throws Exception {
        Form form = new Form();
        form.param(URL_ENCODED_FORM_FIELD, URL_ENCODED_FORM_VALUE);
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formNoDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(URL_ENCODED_FORM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdFormExistsWithDefaultTest() throws Exception {
        Form form = new Form();
        form.param(URL_ENCODED_FORM_FIELD, URL_ENCODED_FORM_VALUE);
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(URL_ENCODED_FORM_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormField");
        Form form = new Form();
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdEmptyFormWithDefaultTest() throws Exception {
        Form form = new Form();
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(DEFAULT_RESOURCE_ID_IRI);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);

        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormWithDefaultNotExistsTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormTwoField");

        Form form = new Form();
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingFormNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Expected Request to have form data");

        Form form = new Form();
        when(reader.readFrom(any(), any(), any(), any(), any(), any())).thenReturn(form);
        when(context.hasEntity()).thenReturn(false);
        when(context.getMediaType()).thenReturn(MediaType.APPLICATION_FORM_URLENCODED_TYPE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(Entity.form(form).toString().getBytes()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdURLEncodedFormClass.class.getDeclaredMethod("formNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdFormDataExistsNoDefaultTest() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        formPart.field(FORM_DATA_FIELD, FORM_DATA_VALUE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(formPart.toString().getBytes(StandardCharsets.UTF_8)));
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(FORM_DATA_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdFormDataExistsWithDefaultTest() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        formPart.field(FORM_DATA_FIELD, FORM_DATA_VALUE);
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(formPart.toString().getBytes(StandardCharsets.UTF_8)));
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(FORM_DATA_VALUE);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormDataNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormDataField");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(formPart.toString().getBytes(StandardCharsets.UTF_8)));
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdEmptyFormDataWithDefaultTest() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(formPart.toString().getBytes(StandardCharsets.UTF_8)));
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefault"));

        IRI actionId = VALUE_FACTORY.createIRI(Read.TYPE);
        IRI resourceId = VALUE_FACTORY.createIRI(DEFAULT_RESOURCE_ID_IRI);
        IRI subjectId = VALUE_FACTORY.createIRI(ANON_USER);

        filter.filter(context);

        Mockito.verify(pdp).createRequest(Arrays.asList(subjectId), new HashMap<>(), Arrays.asList(resourceId), new HashMap<>(), Arrays.asList(actionId), new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormDataWithDefaultNotExistsTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormDataTwoField");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.getEntityStream()).thenReturn(new ByteArrayInputStream(formPart.toString().getBytes(StandardCharsets.UTF_8)));
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingFormDataNoDefaultTest() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Expected Request to have form data");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.hasEntity()).thenReturn(false);
        when(context.getMediaType()).thenReturn(new MediaType("multipart", "form-data", formPart.getContentTypeParamMap()));
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        filter.filter(context);
    }


    private static class MockResourceIdQueryParamClass {
        @ResourceId(type = ValueType.QUERY, value = QUERY_PARAM_KEY, defaultValue = @DefaultResourceId(DEFAULT_RESOURCE_ID_IRI))
        public void queryParamWithDefault() {}

        @ResourceId(type = ValueType.QUERY, value = QUERY_PARAM_KEY)
        public void queryParamNoDefault() {}

        @ResourceId(type = ValueType.QUERY, value = QUERY_PARAM_KEY, defaultValue = @DefaultResourceId(type = ValueType.QUERY, value = QUERY_PARAM_TWO_KEY))
        public void queryParamWithDefaultNotExists() {}
    }

    private static class MockResourceIdPathParamClass {
        @ResourceId(type = ValueType.PATH, value = PATH_PARAM_KEY, defaultValue = @DefaultResourceId(DEFAULT_RESOURCE_ID_IRI))
        public void pathParamWithDefault() {}

        @ResourceId(type = ValueType.PATH, value = PATH_PARAM_KEY)
        public void pathParamNoDefault() {}

        @ResourceId(type = ValueType.PATH, value = PATH_PARAM_KEY, defaultValue = @DefaultResourceId(type = ValueType.PATH, value = PATH_PARAM_TWO_KEY))
        public void pathParamWithDefaultNotExists() {}
    }

    private static class MockResourceIdFormDataClass {
        @ResourceId(type = ValueType.BODY, value = FORM_DATA_FIELD, defaultValue = @DefaultResourceId(DEFAULT_RESOURCE_ID_IRI))
        public void formDataWithDefault() {}

        @ResourceId(type = ValueType.BODY, value = FORM_DATA_FIELD)
        public void formDataNoDefault() {}

        @ResourceId(type = ValueType.BODY, value = FORM_DATA_FIELD, defaultValue = @DefaultResourceId(type = ValueType.BODY, value = FORM_DATA_TWO_FIELD))
        public void formDataWithDefaultNotExists() {}
    }


    private static class MockResourceIdURLEncodedFormClass {
        @ResourceId(type = ValueType.BODY, value = URL_ENCODED_FORM_FIELD, defaultValue = @DefaultResourceId(DEFAULT_RESOURCE_ID_IRI))
        public void formWithDefault() {}

        @ResourceId(type = ValueType.BODY, value = URL_ENCODED_FORM_FIELD)
        public void formNoDefault() {}

        @ResourceId(type = ValueType.BODY, value = URL_ENCODED_FORM_FIELD, defaultValue = @DefaultResourceId(type = ValueType.BODY, value = URL_ENCODED_FORM_TWO_FIELD))
        public void formWithDefaultNotExists() {}
    }

    private static class MockResourceIdStringClass {
        @ResourceId(value = "http://mobi.com/test#action")
        public void resourceIdString() {}
    }

    private static class MockInvalidResourceIdStringClass {
        @ResourceId(value = "notAnIri")
        public void resourceIdString() {}
    }

    private static class MockNoResourceIdClass {
        public void noResourceId() {}
    }
}
