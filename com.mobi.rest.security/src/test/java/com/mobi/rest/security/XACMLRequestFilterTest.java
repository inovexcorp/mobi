package com.mobi.rest.security;

/*-
 * #%L
 * com.mobi.rest.security
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.MobiWebException;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.Response;
import com.mobi.security.policy.api.ontologies.policy.Read;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.server.ContainerRequest;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.HashMap;
import javax.ws.rs.container.ResourceInfo;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.UriInfo;

public class XACMLRequestFilterTest {
    private static final String queryParamKey = "testQueryParamKey";
    private static final String queryParamKey2 = "testQueryParamTwoKey";
    private static final String queryParamValue = "http://mobi.com/queryParamKey#queryParamValue";

    private static final String pathParamKey = "testPathParamKey";
    private static final String pathParamKey2 = "testPathParamTwoKey";
    private static final String pathParamValue = "http://mobi.com/pathParamKey#pathParamValue";

    private static final String formDataField = "testFormDataField";
    private static final String formDataField2 = "testFormDataTwoField";
    private static final String formDataValue = "http://mobi.com/formDataField#formDataValue";

    private static final String defaultResourceIdIri = "http://mobi.com/test-default";

    private static ValueFactory vf = SimpleValueFactory.getInstance();

    private XACMLRequestFilter filter;

    @Rule
    public ExpectedException exceptionRule = ExpectedException.none();

    @Mock
    private ContainerRequest context;

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

    @Before
    public void setUp() {
        MockitoAnnotations.initMocks(this);
        filter = new XACMLRequestFilter();
        filter.setPdp(pdp);
        filter.setVf(vf);
        filter.setEngineManager(engineManager);
        filter.uriInfo = uriInfo;
        filter.resourceInfo = resourceInfo;
        when(context.getMethod()).thenReturn("GET");
        when(pdp.createRequest(any(), any(), any(), any(), any(), any())).thenReturn(request);
        when(pdp.evaluate(any(), any(IRI.class))).thenReturn(response);
        when(response.getDecision()).thenReturn(Decision.PERMIT);
    }

    @Test
    public void resourceIdQueryParamExistsNoDefault() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        queryParameters.putSingle(queryParamKey, queryParamValue);
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamNoDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(queryParamValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdQueryParamExistsWithDefault() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        queryParameters.putSingle(queryParamKey, queryParamValue);
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(queryParamValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdMissingQueryParamNoDefault() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Query parameters do not contain testQueryParamKey");

        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingQueryParamWithDefault() throws Exception {
        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(defaultResourceIdIri);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdMissingQueryParamWithDefaultNotExists() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Query parameters do not contain testQueryParamTwoKey");

        MultivaluedHashMap<String, String> queryParameters = new MultivaluedHashMap<>();
        when(uriInfo.getQueryParameters()).thenReturn(queryParameters);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdQueryParamClass.class.getDeclaredMethod("queryParamWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdPathParamExistsNoDefault() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        pathParameters.putSingle(pathParamKey, pathParamValue);
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamNoDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(pathParamValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdPathParamExistsWithDefault() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        pathParameters.putSingle(pathParamKey, pathParamValue);
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(pathParamValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdMissingPathParamNoDefault() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Path does not contain parameter testPathParamKey");

        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingPathParamWithDefault() throws Exception {
        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(defaultResourceIdIri);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdMissingPathParamWithDefaultNotExists() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Path does not contain parameter testPathParamTwoKey");

        MultivaluedHashMap<String, String> pathParameters = new MultivaluedHashMap<>();
        when(uriInfo.getPathParameters()).thenReturn(pathParameters);
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdPathParamClass.class.getDeclaredMethod("pathParamWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdFormDataExistsNoDefault() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        formPart.field(formDataField, formDataValue);
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(formDataValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdFormDataExistsWithDefault() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        formPart.field(formDataField, formDataValue);
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(formDataValue);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);
        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormDataNoDefault() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormDataField");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        filter.filter(context);
    }

    @Test
    public void resourceIdEmptyFormDataWithDefault() throws Exception {
        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefault"));

        IRI actionId = vf.createIRI(Read.TYPE);
        IRI resourceId = vf.createIRI(defaultResourceIdIri);
        IRI subjectId = vf.createIRI(ANON_USER);

        filter.filter(context);

        Mockito.verify(pdp).createRequest(subjectId, new HashMap<>(), resourceId, new HashMap<>(), actionId, new HashMap<>());
    }

    @Test
    public void resourceIdEmptyFormDataWithDefaultNotExists() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Form parameters do not contain testFormDataTwoField");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(true);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataWithDefaultNotExists"));

        filter.filter(context);
    }

    @Test
    public void resourceIdMissingFormDataNoDefault() throws Exception {
        exceptionRule.expect(MobiWebException.class);
        exceptionRule.expectMessage("Expected Request to have form data");

        FormDataMultiPart formPart = new FormDataMultiPart();
        when(context.readEntity(FormDataMultiPart.class)).thenReturn(formPart);
        when(context.hasEntity()).thenReturn(false);
        when(context.getMediaType()).thenReturn(MediaType.MULTIPART_FORM_DATA_TYPE);
        when(uriInfo.getPathParameters()).thenReturn(new MultivaluedHashMap<>());
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<>());
        when(resourceInfo.getResourceMethod()).thenReturn(MockResourceIdFormDataClass.class.getDeclaredMethod("formDataNoDefault"));

        filter.filter(context);
    }

    private static class MockResourceIdQueryParamClass {
        @ResourceId(type = ValueType.QUERY, value = queryParamKey, defaultValue = @DefaultResourceId(defaultResourceIdIri))
        public void queryParamWithDefault() {}

        @ResourceId(type = ValueType.QUERY, value = queryParamKey)
        public void queryParamNoDefault() {}

        @ResourceId(type = ValueType.QUERY, value = queryParamKey, defaultValue = @DefaultResourceId(type = ValueType.QUERY, value = queryParamKey2))
        public void queryParamWithDefaultNotExists() {}
    }

    private static class MockResourceIdPathParamClass {
        @ResourceId(type = ValueType.PATH, value = pathParamKey, defaultValue = @DefaultResourceId(defaultResourceIdIri))
        public void pathParamWithDefault() {}

        @ResourceId(type = ValueType.PATH, value = pathParamKey)
        public void pathParamNoDefault() {}

        @ResourceId(type = ValueType.PATH, value = pathParamKey, defaultValue = @DefaultResourceId(type = ValueType.PATH, value = pathParamKey2))
        public void pathParamWithDefaultNotExists() {}
    }

    private static class MockResourceIdFormDataClass {
        @ResourceId(type = ValueType.BODY, value = formDataField, defaultValue = @DefaultResourceId(defaultResourceIdIri))
        public void formDataWithDefault() {}

        @ResourceId(type = ValueType.BODY, value = formDataField)
        public void formDataNoDefault() {}

        @ResourceId(type = ValueType.BODY, value = formDataField, defaultValue = @DefaultResourceId(type = ValueType.BODY, value = formDataField2))
        public void formDataWithDefaultNotExists() {}
    }
}