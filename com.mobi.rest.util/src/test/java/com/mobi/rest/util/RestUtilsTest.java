package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.junit.Before;
import org.junit.Test;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;
import com.mobi.web.security.util.AuthenticationProps;
import net.sf.json.JSONArray;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.net.URI;
import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

public class RestUtilsTest {

    private static ValueFactory vf = SimpleValueFactory.getInstance();
    private static ModelFactory mf = LinkedHashModelFactory.getInstance();
    private static IRI testPropIRI = vf.createIRI("http://example.com/test#prop");

    private String expectedJsonld;
    private String expectedTypedJsonld;
    private String expectedTurtle;
    private String expectedGroupedTurtle;
    private String expectedGroupedRdfxml;
    private String expectedRdfxml;
    private Model model = mf.createModel();
    private Model typedModel = mf.createModel();

    @Mock
    private ContainerRequestContext context;

    @Mock
    private EngineManager engineManager;

    @Mock
    private User user;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private BNodeService service;

    @Mock
    private UriInfo uriInfo;

    @Mock
    private Thing thing;

    @Before
    public void setUp() throws Exception {
        setUpModels();

        expectedJsonld = IOUtils.toString(getClass().getResourceAsStream("/test.json"));
        expectedTypedJsonld = IOUtils.toString(getClass().getResourceAsStream("/test-typed.json"));
        expectedTurtle = IOUtils.toString(getClass().getResourceAsStream("/test.ttl"));
        expectedGroupedTurtle = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.ttl"));
        expectedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/test.xml"));
        expectedGroupedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.xml"));

        MockitoAnnotations.initMocks(this);
        when(context.getProperty(AuthenticationProps.USERNAME)).thenReturn("tester");
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(transformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));
        when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenReturn(model);
        when(service.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgumentAt(0, Statement.class));
        when(service.deskolemize(model)).thenReturn(model);
        when(uriInfo.getPath(eq(false))).thenReturn("tests");
        when(uriInfo.getBaseUri()).thenReturn(URI.create("urn://test/rest/"));
        when(uriInfo.getAbsolutePath()).thenReturn(URI.create("urn://test/rest/tests"));
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<String, String>());
    }

    @Test
    public void encodeTest() throws Exception {
        String test = ":/#?=& +;\"{[}]@$%^\t";
        assertEquals("%3A%2F%23%3F%3D%26%20%2B%3B%22%7B%5B%7D%5D%40%24%25%5E%09", RestUtils.encode(test));
    }

    @Test
    public void decodeTest() throws Exception {
        String test = "%3A%2F%23%3F%3D%26%20%2B%3B%22%7B%5B%7D%5D%40%24%25%5E%09";
        assertEquals(":/#?=& +;\"{[}]@$%^\t", RestUtils.decode(test));
    }

    @Test
    public void getRDFFormatTest() throws Exception {
        assertEquals(RestUtils.getRDFFormat("jsonld"), RDFFormat.JSONLD);
        assertEquals(RestUtils.getRDFFormat("JSONLD"), RDFFormat.JSONLD);
        assertEquals(RestUtils.getRDFFormat("turtle"), RDFFormat.TURTLE);
        assertEquals(RestUtils.getRDFFormat("TURTLE"), RDFFormat.TURTLE);
        assertEquals(RestUtils.getRDFFormat("rdf/xml"), RDFFormat.RDFXML);
        assertEquals(RestUtils.getRDFFormat("RDF/XML"), RDFFormat.RDFXML);
        assertEquals(RestUtils.getRDFFormat("something else"), RDFFormat.JSONLD);
    }

    @Test
    public void getRDFFormatFileExtensionTest() throws Exception {
        assertEquals(RestUtils.getRDFFormatFileExtension("jsonld"), "jsonld");
        assertEquals(RestUtils.getRDFFormatFileExtension("JSONLD"), "jsonld");
        assertEquals(RestUtils.getRDFFormatFileExtension("turtle"), "ttl");
        assertEquals(RestUtils.getRDFFormatFileExtension("TURTLE"), "ttl");
        assertEquals(RestUtils.getRDFFormatFileExtension("rdf/xml"), "rdf");
        assertEquals(RestUtils.getRDFFormatFileExtension("RDF/XML"), "rdf");
        assertEquals(RestUtils.getRDFFormatFileExtension("owl/xml"), "owx");
        assertEquals(RestUtils.getRDFFormatFileExtension("OWL/XML"), "owx");
        assertEquals(RestUtils.getRDFFormatFileExtension("something else"), "jsonld");
    }

    @Test
    public void getRDFFormatMimeTypeTest() throws Exception {
        assertEquals(RestUtils.getRDFFormatMimeType("jsonld"), "application/ld+json");
        assertEquals(RestUtils.getRDFFormatMimeType("JSONLD"), "application/ld+json");
        assertEquals(RestUtils.getRDFFormatMimeType("turtle"), "text/turtle");
        assertEquals(RestUtils.getRDFFormatMimeType("TURTLE"), "text/turtle");
        assertEquals(RestUtils.getRDFFormatMimeType("rdf/xml"), "application/rdf+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("RDF/XML"), "application/rdf+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("owl/xml"), "application/owl+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("OWL/XML"), "application/owl+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("something else"), "application/ld+json");
    }

    @Test
    public void modelToStringWithRDFFormatTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.modelToString(model, RDFFormat.JSONLD, transformer));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, RDFFormat.TURTLE, transformer));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, RDFFormat.RDFXML, transformer)));
    }

    @Test
    public void modelToStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.modelToString(model, "jsonld", transformer));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, "turtle", transformer));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, "rdf/xml", transformer)));
        assertEquals(expectedJsonld, RestUtils.modelToString(model, "something", transformer));
    }

    @Test
    public void modelToSkolemizedStringWithRDFFormatTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.modelToSkolemizedString(model, RDFFormat.JSONLD, transformer, service));
        assertEquals(expectedTurtle, RestUtils.modelToSkolemizedString(model, RDFFormat.TURTLE, transformer, service));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToSkolemizedString(model, RDFFormat.RDFXML, transformer, service)));
    }

    @Test
    public void modelToSkolemizedStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.modelToSkolemizedString(model, "jsonld", transformer, service));
        assertEquals(expectedTurtle, RestUtils.modelToSkolemizedString(model, "turtle", transformer, service));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToSkolemizedString(model, "rdf/xml", transformer, service)));
        assertEquals(expectedJsonld, RestUtils.modelToSkolemizedString(model, "something", transformer, service));
    }

    @Test
    public void groupedModelToStringWithRDFFormatTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, RDFFormat.JSONLD, transformer));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, RDFFormat.TURTLE, transformer));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, RDFFormat.RDFXML, transformer)));
    }

    @Test
    public void groupedModelToStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, "jsonld", transformer));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, "turtle", transformer));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, "rdf/xml", transformer)));
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, "something", transformer));
    }

    @Test
    public void groupedModelToSkolemizedStringWithRDFFormatTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToSkolemizedString(model, RDFFormat.JSONLD, transformer, service));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToSkolemizedString(model, RDFFormat.TURTLE, transformer, service));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToSkolemizedString(model, RDFFormat.RDFXML, transformer, service)));
    }

    @Test
    public void groupedModelToSkolemizedStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToSkolemizedString(model, "jsonld", transformer, service));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToSkolemizedString(model, "turtle", transformer, service));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToSkolemizedString(model, "rdf/xml", transformer, service)));
        assertEquals(expectedJsonld, RestUtils.groupedModelToSkolemizedString(model, "something", transformer, service));
    }

    @Test
    public void jsonldToModelTest() throws Exception {
        Model result = RestUtils.jsonldToModel(expectedJsonld, transformer);
        assertEquals(model, result);
        verify(transformer).mobiModel(any(org.eclipse.rdf4j.model.Model.class));
    }

    @Test
    public void jsonldToDeskolemizedModelTest() throws Exception {
        Model result = RestUtils.jsonldToDeskolemizedModel(expectedJsonld, transformer, service);
        assertEquals(model, result);
        verify(transformer).mobiModel(any(org.eclipse.rdf4j.model.Model.class));
        verify(service).deskolemize(model);
    }

    @Test
    public void modelToSkolemizedJsonldTest() throws Exception {
        String result = RestUtils.modelToSkolemizedJsonld(model, transformer, service);
        assertEquals(expectedJsonld, result);
        verify(service, atLeastOnce()).skolemize(any(Statement.class));
    }

    @Test
    public void modelToJsonldTest() throws Exception {
        String result = RestUtils.modelToJsonld(model, transformer);
        assertEquals(expectedJsonld, result);
    }

    @Test
    public void getActiveUsernameTest() throws Exception {
        String result = RestUtils.getActiveUsername(context);
        assertEquals("tester", result);
    }

    @Test
    public void getActiveUsernameThatDoesNotExistTest() {
        // Setup:
        when(context.getProperty(AuthenticationProps.USERNAME)).thenReturn(null);
        try {
            RestUtils.getActiveUsername(context);
            fail("Expected MobiWebException to have been thrown");
        } catch (MobiWebException e) {
            assertEquals(401, e.getResponse().getStatus());
        }
    }

    @Test
    public void getActiveUserTest() throws Exception {
        User result = RestUtils.getActiveUser(context, engineManager);
        assertEquals(user, result);
    }

    @Test
    public void getActiveUserThatDoesNotExistTest() {
        // Setup:
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());
        try {
            RestUtils.getActiveUser(context, engineManager);
        } catch (MobiWebException e) {
            assertEquals(401, e.getResponse().getStatus());
        }
    }

    @Test
    public void checkStringParamTest() {
        String errorMessage = "Error";
        try {
            RestUtils.checkStringParam("", errorMessage);
        } catch (MobiWebException e) {
            assertEquals(400, e.getResponse().getStatus());
            assertEquals(errorMessage, e.getResponse().getStatusInfo().getReasonPhrase());
        }

        try {
            RestUtils.checkStringParam(null, errorMessage);
        } catch (MobiWebException e) {
            assertEquals(400, e.getResponse().getStatus());
            assertEquals(errorMessage, e.getResponse().getStatusInfo().getReasonPhrase());
        }

        RestUtils.checkStringParam("Test", errorMessage);
    }

    @Test
    public void getObjectFromJsonldNoContextTest() {
        JSONObject expected = JSONObject.fromObject("{'@id': 'test'}");
        String jsonld = "[" + expected.toString() + "]";
        assertEquals(expected, RestUtils.getObjectFromJsonld(jsonld));
    }

    @Test
    public void getObjectFromJsonldWithContextTest() {
        JSONObject expected = JSONObject.fromObject("{'@id': 'test'}");
        String jsonld = "[{'@graph':[" + expected.toString() + "]}]";
        assertEquals(expected, RestUtils.getObjectFromJsonld(jsonld));
    }

    @Test
    public void getObjectFromJsonldThatDoesNotExistTest() {
        assertEquals(new JSONObject(), RestUtils.getObjectFromJsonld("[]"));
        assertEquals(new JSONObject(), RestUtils.getObjectFromJsonld("[{'@graph': []}]"));
    }

    @Test
    public void getTypedObjectFromJsonldTest() {
        JSONObject expected = JSONArray.fromObject(expectedTypedJsonld).getJSONObject(0);
        String jsonld = "[{'@graph':[" + expected.toString() + "]}]";
        assertEquals(expected, RestUtils.getTypedObjectFromJsonld(jsonld, "urn:test"));
    }

    @Test
    public void createIRITest() {
        IRI validIRI = RestUtils.createIRI("urn:test", vf);
        assertEquals(vf.createIRI("urn:test"), validIRI);
    }

    @Test
    public void createIRIInvalidInputTest() {
        try {
            RestUtils.createIRI("invalidIRI", vf);
        } catch (MobiWebException ex) {
            assertEquals(400, ex.getResponse().getStatus());
        }
    }

    @Test
    public void createPaginatedResponseTest() {
        // Setup
        Set<Thing> set = getTestThings(Collections.singletonMap(testPropIRI, "VALUE"));

        // TEST ASC
        Response response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 0, 1, true, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        Object object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        JSONArray array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        JSONObject jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 1");
        assertEquals(response.getLinks().size(), 1);
        Link link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "next");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 1, 1, true, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 2");
        assertEquals(response.getLinks().size(), 2);
        assertTrue(response.getLinks().stream()
                .allMatch(lnk -> (lnk.getRel().equals("prev") || lnk.getRel().equals("next"))
                && lnk.getUri().getRawPath().equals("/rest/tests")));

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 2, 1, true, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 3");
        assertEquals(response.getLinks().size(), 1);
        link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "prev");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        // TEST DESC
        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 0, 1, false, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 3");
        assertEquals(response.getLinks().size(), 1);
        link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "next");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 1, 1, false, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 2");
        assertEquals(response.getLinks().size(), 2);
        assertTrue(response.getLinks().stream()
                .allMatch(lnk -> (lnk.getRel().equals("prev") || lnk.getRel().equals("next"))
                && lnk.getUri().getRawPath().equals("/rest/tests")));

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 2, 1, false, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 1");
        assertEquals(response.getLinks().size(), 1);
        link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "prev");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        // TEST NO PAGING REQUIRED
        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 0, 10, true, (Function<Thing, Boolean>) null, "http://example.com/test#TestThing", transformer);
        assertEquals(response.getLinks().size(), 0);
    }

    @Test
    public void createPaginatedResponseTestFiltered() {
        // Setup
        Set<Thing> set = getTestThings(Collections.singletonMap(testPropIRI, "VALUE"));
        Function<Thing, Boolean> f;
        f = new Function<Thing, Boolean>() {
            @Override
            public Boolean apply(Thing t) {
                return !t.getProperties(testPropIRI).contains(vf.createLiteral("VALUE 2"));
            }
        };

        Response response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 0, 1, true, f, "http://example.com/test#TestThing", transformer, service);
        Object object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        JSONArray array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        JSONObject jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 1");
        assertEquals(response.getLinks().size(), 1);
        Link link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "next");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, Collections.singleton(testPropIRI.stringValue()), 1, 1, true, f, "http://example.com/test#TestThing", transformer, service);
        object = response.getEntity();
        assertTrue(object instanceof JSONArray);
        array = (JSONArray) object;
        assertTrue(array.get(0) instanceof JSONObject);
        jsonObject = (JSONObject) array.get(0);
        assertEquals(jsonObject.getJSONArray(testPropIRI.stringValue()).getJSONObject(0).getString("@value"), "VALUE 3");
        assertEquals(response.getLinks().size(), 1);
        link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "prev");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));
    }

    @Test
    public void createPaginatedResponseWithJsonTest() {
        JSONArray array = JSONArray.fromObject("[{'@graph':[" + expectedTypedJsonld + "]}]");

        Response response = RestUtils.createPaginatedResponseWithJson(uriInfo, array, 3, 1, 0);
        assertEquals(response.getLinks().size(), 1);
        Link link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "next");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        response = RestUtils.createPaginatedResponseWithJson(uriInfo, array, 3, 1, 1);
        assertEquals(response.getLinks().size(), 2);
        assertTrue(response.getLinks().stream()
                .allMatch(lnk -> (lnk.getRel().equals("prev") || lnk.getRel().equals("next"))
                && lnk.getUri().getRawPath().equals("/rest/tests")));

        response = RestUtils.createPaginatedResponseWithJson(uriInfo, array, 3, 1, 2);
        assertEquals(response.getLinks().size(), 1);
        link = response.getLinks().iterator().next();
        assertEquals(link.getRel(), "prev");
        assertTrue(link.getUri().getRawPath().equals("/rest/tests"));

        response = RestUtils.createPaginatedResponseWithJson(uriInfo, array, 3, 3, 0);
        assertEquals(response.getLinks().size(), 0);
    }

    @Test
    public void thingToSkolemizedJsonObjectTest() {
        // Setup
        when(thing.getModel()).thenReturn(typedModel);

        JSONObject result = RestUtils.thingToSkolemizedJsonObject(thing, "urn:test", transformer, service);
        assertTrue(expectedTypedJsonld.startsWith(result.toString(), 1));
    }

    @Test
    public void validatePaginationParamsTest() {
        RestUtils.validatePaginationParams(Optional.empty(), Collections.EMPTY_SET, 10, 0);
        RestUtils.validatePaginationParams(Optional.of("urn:no-error"), Collections.singleton("urn:no-error"), 10, 0);
        assert (true);
    }

    @Test
    public void validatePaginationParamsInvalidSortResourceTest() {
        try {
            RestUtils.validatePaginationParams(Optional.of("urn:error"), Collections.singleton("urn:no-error"), 10, 0);
        } catch (MobiWebException ex) {
            assertEquals(400, ex.getResponse().getStatus());
        }

    }

    private void setUpModels() {
        model.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));
        model.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));
        model.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        model.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));

        typedModel.add(vf.createIRI("http://example.com/test/0"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("urn:test"));
        typedModel.add(vf.createIRI("http://example.com/test/0"), testPropIRI, vf.createLiteral("VALUE 1"));
        typedModel.add(vf.createIRI("http://example.com/test/1"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("urn:test"));
        typedModel.add(vf.createIRI("http://example.com/test/1"), testPropIRI, vf.createLiteral("VALUE 2"));
        typedModel.add(vf.createIRI("http://example.com/test/2"), vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI("urn:test"));
        typedModel.add(vf.createIRI("http://example.com/test/2"), testPropIRI, vf.createLiteral("VALUE 3"));
    }

    private boolean equalsIgnoreNewline(String s1, String s2) {
        return s1 != null && s2 != null && normalizeLineEnds(s1).equals(normalizeLineEnds(s2));
    }

    private String normalizeLineEnds(String s) {
        return s.replace("\r\n", "\n").replace('\r', '\n');
    }

    private Set<Thing> getTestThings(Map<IRI, String> predicateValues) {
        Set<Thing> set = new HashSet<>();

        predicateValues.forEach((key, value) -> {
            set.add(new TestThing("http://example.com/test/0", mf.createModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 1")));
            set.add(new TestThing("http://example.com/test/1", mf.createModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 2")));
            set.add(new TestThing("http://example.com/test/2", mf.createModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 3")));

        });

        return set;
    }

    private class TestThing extends ThingImpl {
        /**
         * The type IRI string for a {@link TestThing} instance.
         */
        public String TYPE = "http://example.com/test#TestThing";

        public TestThing(Resource resource, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
            super(resource, model, valueFactory, valueConverterRegistry);
            this.setProperty(vf.createIRI(TYPE), vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"));
        }

        public TestThing(String resourceString, Model model, ValueFactory valueFactory, ValueConverterRegistry valueConverterRegistry) {
            super(resourceString, model, valueFactory, valueConverterRegistry);
            this.setProperty(vf.createIRI(TYPE), vf.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"));
        }

        public TestThing addPropertyValue(IRI predicate, Value value) {
            this.setProperty(value, predicate);
            return this;
        }
    }
}
