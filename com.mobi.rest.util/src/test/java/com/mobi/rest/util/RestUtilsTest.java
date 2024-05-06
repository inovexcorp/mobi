package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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

import static junit.framework.TestCase.assertNotNull;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;

import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.impl.ThingImpl;
import com.mobi.web.security.util.AuthenticationProps;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
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
    private AutoCloseable closeable;
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static ModelFactory mf = new DynamicModelFactory();
    private static IRI testPropIRI = vf.createIRI("http://example.com/test#prop");

    private String bNodeJsonld;
    private String expectedJsonld;
    private String expectedTypedJsonld;
    private String expectedTurtle;
    private String expectedGroupedTurtle;
    private String expectedGroupedRdfxml;
    private String expectedRdfxml;
    private String expectedTrig;
    private Model model = mf.createEmptyModel();
    private Model typedModel = mf.createEmptyModel();

    @Mock
    private ContainerRequestContext context;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private RepositoryConnection conn;

    @Mock
    private CommitManager commitManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private User user;

    @Mock
    private BNodeService service;

    @Mock
    private UriInfo uriInfo;

    @Mock
    private Thing thing;

    @Mock
    CompiledResourceManager compiledResourceManager;

    @Mock
    BNodeService bNodeService;

    @Before
    public void setUp() throws Exception {
        setUpModels();

        bNodeJsonld = IOUtils.toString(getClass().getResourceAsStream("/test-bnode.json"), StandardCharsets.UTF_8);
        expectedJsonld = IOUtils.toString(getClass().getResourceAsStream("/test.json"), StandardCharsets.UTF_8);
        expectedTypedJsonld = IOUtils.toString(getClass().getResourceAsStream("/test-typed.json"),
                StandardCharsets.UTF_8);
        expectedTurtle = IOUtils.toString(getClass().getResourceAsStream("/test.ttl"), StandardCharsets.UTF_8);
        expectedGroupedTurtle = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.ttl"),
                StandardCharsets.UTF_8);
        expectedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/test.xml"), StandardCharsets.UTF_8);
        expectedGroupedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.xml"),
                StandardCharsets.UTF_8);
        expectedTrig= IOUtils.toString(getClass().getResourceAsStream("/test.trig"), StandardCharsets.UTF_8);

        closeable = MockitoAnnotations.openMocks(this);
        when(context.getProperty(AuthenticationProps.USERNAME)).thenReturn("tester");
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(service.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));
        when(service.deskolemize(model)).thenReturn(model);
        when(uriInfo.getPath(eq(false))).thenReturn("tests");
        when(uriInfo.getBaseUri()).thenReturn(URI.create("urn://test/rest/"));
        when(uriInfo.getAbsolutePath()).thenReturn(URI.create("urn://test/rest/tests"));
        when(uriInfo.getQueryParameters()).thenReturn(new MultivaluedHashMap<String, String>());
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getRDFFormatTest() throws Exception {
        assertEquals(RestUtils.getRDFFormat("jsonld"), RDFFormat.JSONLD);
        assertEquals(RestUtils.getRDFFormat("JSONLD"), RDFFormat.JSONLD);
        assertEquals(RestUtils.getRDFFormat("turtle"), RDFFormat.TURTLE);
        assertEquals(RestUtils.getRDFFormat("TURTLE"), RDFFormat.TURTLE);
        assertEquals(RestUtils.getRDFFormat("trig"), RDFFormat.TRIG);
        assertEquals(RestUtils.getRDFFormat("TRiG"), RDFFormat.TRIG);
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
        assertEquals(RestUtils.getRDFFormatFileExtension("trig"), "trig");
        assertEquals(RestUtils.getRDFFormatFileExtension("TRiG"), "trig");
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
        assertEquals(RestUtils.getRDFFormatMimeType("trig"), "application/trig");
        assertEquals(RestUtils.getRDFFormatMimeType("TRiG"), "application/trig");
        assertEquals(RestUtils.getRDFFormatMimeType("rdf/xml"), "application/rdf+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("RDF/XML"), "application/rdf+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("owl/xml"), "application/owl+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("OWL/XML"), "application/owl+xml");
        assertEquals(RestUtils.getRDFFormatMimeType("something else"), "application/ld+json");
    }

    @Test
    public void getRDFFormatForConstructQueryTest() throws Exception {
        assertEquals(RDFFormat.JSONLD, RestUtils.getRDFFormatForConstructQuery("application/ld+json"));
        assertEquals(RDFFormat.TURTLE, RestUtils.getRDFFormatForConstructQuery("text/turtle"));
        assertEquals(RDFFormat.RDFXML, RestUtils.getRDFFormatForConstructQuery("application/rdf+xml"));
        assertEquals(RDFFormat.JSONLD, RestUtils.getRDFFormatForConstructQuery("something else"));
        assertEquals(RDFFormat.JSONLD, RestUtils.getRDFFormatForConstructQuery(null));
    }

    @Test
    public void modelToStringWithRDFFormatTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToString(model, RDFFormat.JSONLD)));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, RDFFormat.TURTLE));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, RDFFormat.RDFXML)));
    }

    @Test
    public void modelToStringTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToString(model, "jsonld")));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, "turtle"));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, "rdf/xml")));
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToString(model, "something")));
    }

    @Test
    public void modelToSkolemizedStringWithRDFFormatTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToSkolemizedString(model, RDFFormat.JSONLD, service)));
        assertEquals(expectedTurtle, RestUtils.modelToSkolemizedString(model, RDFFormat.TURTLE, service));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToSkolemizedString(model, RDFFormat.RDFXML, service)));
    }

    @Test
    public void modelToSkolemizedStringTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToSkolemizedString(model, "jsonld", service)));
        assertEquals(expectedTurtle, RestUtils.modelToSkolemizedString(model, "turtle", service));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToSkolemizedString(model, "rdf/xml", service)));
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.modelToSkolemizedString(model, "something", service)));
    }

    @Test
    public void groupedModelToOutputStreamTest() throws Exception {
        RDFFormat[] formatArray = new RDFFormat[] {RDFFormat.RDFXML, RDFFormat.JSONLD, RDFFormat.TURTLE};
        for (RDFFormat format : formatArray) {
            Path file = Files.createTempFile("test", format.getDefaultFileExtension());
            OutputStream os = new ByteArrayOutputStream();

            RestUtils.groupedModelToOutputStream(model, format, os);

            String result = os.toString();
            switch (format.getName()) {
                case "JSON-LD":
                    assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(result));
                    break;
                case "Turtle":
                    assertEquals(expectedGroupedTurtle, result);
                    break;
                case "RDF/XML":
                    assertEquals(expectedGroupedRdfxml, result);
                    break;
            }
            Files.deleteIfExists(file);
        }
    }

    @Test
    public void groupedModelToStringWithRDFFormatTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToString(model, RDFFormat.JSONLD)));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, RDFFormat.TURTLE));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, RDFFormat.RDFXML)));
    }

    @Test
    public void groupedModelToStringTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToString(model, "jsonld")));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, "turtle"));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, "rdf/xml")));
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToString(model, "something")));
    }

    @Test
    public void groupedModelToSkolemizedStringWithRDFFormatTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToSkolemizedString(model, RDFFormat.JSONLD, service)));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToSkolemizedString(model, RDFFormat.TURTLE, service));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToSkolemizedString(model, RDFFormat.RDFXML, service)));
    }

    @Test
    public void groupedModelToSkolemizedStringTest() throws Exception {
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToSkolemizedString(model, "jsonld", service)));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToSkolemizedString(model, "turtle", service));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToSkolemizedString(model, "rdf/xml", service)));
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(RestUtils.groupedModelToSkolemizedString(model, "something", service)));
    }

    @Test
    public void jsonldBnodeToModelTest() throws Exception {
        Model expectedModel = mf.createEmptyModel();
        expectedModel.add(vf.createBNode("genid-1024e515be3042e890725d6ebf42462058-EAB37436DD2C162351935B8308AC176D"),
                vf.createIRI("http://www.w3.org/2002/07/owl#someValuesFrom"),
                vf.createBNode("genid-1024e515be3042e890725d6ebf42462058-EAB37436DD2C162351935B8308ACJHGD"));
        expectedModel.add(vf.createBNode("genid-1024e515be3042e890725d6ebf42462058-EAB37436DD2C162351935B8308ACJHGD"),
                vf.createIRI("http://www.w3.org/2002/07/owl#someValuesFrom"),
                vf.createIRI("https://mobi.com/ontologies/BlankNodeRestrictionUpdate#RestrictionClassUpdatedIRI"));

        Model result = RestUtils.jsonldToModel(bNodeJsonld);
        result.forEach(statement -> {
            assertTrue(expectedModel.contains(statement.getSubject(), statement.getPredicate(), statement.getObject(), statement.getContext()));
        });
    }

    @Test
    public void jsonldToModelTest() throws Exception {
        Model result = RestUtils.jsonldToModel(expectedJsonld);
        assertEquals(model, result);
    }

    @Test
    public void jsonldToDeskolemizedModelTest() throws Exception {
        Model result = RestUtils.jsonldToDeskolemizedModel(expectedJsonld, service);
        assertEquals(model, result);
        verify(service).deskolemize(model);
    }

    @Test
    public void modelToSkolemizedJsonldTest() throws Exception {
        String result = RestUtils.modelToSkolemizedJsonld(model, service);
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(result));
        verify(service, atLeastOnce()).skolemize(any(Statement.class));
    }

    @Test
    public void modelToJsonldTest() throws Exception {
        String result = RestUtils.modelToJsonld(model);
        assertEquals(removeWhitespace(expectedJsonld), removeWhitespace(result));
    }

    @Test
    public void modelToTrigTest() throws Exception {
        String result = RestUtils.modelToTrig(model);
        assertEquals(expectedTrig, result);
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
        String errorMessage = "Bad Request";
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
        Response response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 0, 1,
                true, (Function<Thing, Boolean>) null,
                "http://example.com/test#TestThing", service);
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

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 1, 1, true,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 2, 1, true,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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
        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 0, 1, false,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 1, 1, false,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 2, 1, false,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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
        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 0, 10, true,
                (Function<Thing, Boolean>) null, "http://example.com/test#TestThing",
                service);
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

        Response response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 0, 1, true,
                f, "http://example.com/test#TestThing", service);
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

        response = RestUtils.createPaginatedThingResponse(uriInfo, set, testPropIRI, 1, 1, true,
                f, "http://example.com/test#TestThing", service);
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

        JSONObject result = RestUtils.thingToSkolemizedJsonObject(thing, "urn:test", service);
        assertTrue(expectedTypedJsonld.startsWith(result.toString(), 1));
    }

    @Test
    public void validatePaginationParamsTest() {
        RestUtils.validatePaginationParams("urn:no-error", Collections.singleton("urn:no-error"), 10, 0);
        assert (true);
    }

    @Test
    public void validatePaginationParamsInvalidSortResourceTest() {
        try {
            RestUtils.validatePaginationParams("urn:error", Collections.singleton("urn:no-error"), 10, 0);
        } catch (MobiWebException ex) {
            assertEquals(400, ex.getResponse().getStatus());
        }

    }

    @Test
    public void createJsonErrorObjectNoDelimiterTest() throws Exception {
        ObjectNode result = RestUtils.createJsonErrorObject(new IllegalStateException("Exception"));
        ObjectNode expected = new ObjectMapper().readValue("{\"error\": \"IllegalStateException\", \"errorMessage\" : \"Exception\", \"errorDetails\": []}", ObjectNode.class);
        assertEquals(expected, result);
    }

    @Test
    public void createJsonErrorObjectDelimitedTest() throws Exception {
        ObjectNode result = RestUtils.createJsonErrorObject(new IllegalStateException("Exception;;;detail1;;;detail2"), ";;;");
        ObjectNode expected = new ObjectMapper().readValue("{\"error\": \"IllegalStateException\", \"errorMessage\" : \"Exception\", \"errorDetails\": [\"detail1\", \"detail2\"]}", ObjectNode.class);
        assertEquals(expected, result);
    }

    @Test
    public void createJsonErrorObjectDelimitedWrongDelimiterTest() throws Exception {
        ObjectNode result = RestUtils.createJsonErrorObject(new IllegalStateException("Exception;;;detail1;;;detail2"), "~~~");
        ObjectNode expected = new ObjectMapper().readValue("{\"error\": \"IllegalStateException\", \"errorMessage\" : \"Exception;;;detail1;;;detail2\", \"errorDetails\": []}", ObjectNode.class);
        assertEquals(expected, result);
    }

    @Test
    public void getErrorObjBadRequestTest() {
        MobiWebException exception = RestUtils.getErrorObjBadRequest(new IllegalStateException("Exception"));
        assertEquals("Exception", exception.getMessage());
        assertEquals(400, exception.getResponse().getStatus());
    }

    @Test
    public void getErrorObjInternalServerErrorTest() {
        MobiWebException exception = RestUtils.getErrorObjInternalServerError(new IllegalStateException("Exception"));
        assertEquals("Exception", exception.getMessage());
        assertEquals(500, exception.getResponse().getStatus());
    }

    @Test
    public void getErrorObjInternalServerErrorTestOverride() {
        ObjectNode customErrorObject = JsonNodeFactory.instance.objectNode();
        customErrorObject.put("error", "Custom error message");

        MobiWebException exception = RestUtils.getErrorObjInternalServerError(new IllegalStateException("Exception"), customErrorObject);

        assertEquals("Exception", exception.getMessage());
        assertEquals(500, exception.getResponse().getStatus());

        assertEquals(customErrorObject.toString(), exception.getResponse().getEntity());
    }

    @Test
    public void testGetCurrentModel() {
        Resource recordId = mock(Resource.class);
        Resource branchId = mock(Resource.class);
        Resource commitId = mock(Resource.class);
        RepositoryConnection conn = mock(RepositoryConnection.class);
        Map<BNode, IRI> bNodesMap = new HashMap<>();
        Model compiledModel = mock(Model.class);
        
        when(compiledResourceManager.getCompiledResource(recordId, branchId, commitId, conn)).thenReturn(compiledModel);
        
        RestUtils.getCurrentModel(recordId, branchId, commitId, bNodesMap, conn, bNodeService, compiledResourceManager);
        
        // Verify that the deterministicSkolemize method of bNodeService was called with the correct arguments
        verify(bNodeService).deterministicSkolemize(eq(compiledModel), eq(bNodesMap));
    }

    @Test
    public void testGetUploadedModel() throws IOException {
        String rdfData = "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\">\n" +
                "  <rdf:Description rdf:about=\"http://example.org\">\n" +
                "    <rdf:type rdf:resource=\"http://www.w3.org/2002/07/owl#Ontology\"/>\n" +
                "  </rdf:Description>\n" +
                "</rdf:RDF>\n";
        InputStream inputStream = new ByteArrayInputStream(rdfData.getBytes());
        String fileExtension = "rdf";
        Map<BNode, IRI> bNodesMap = new HashMap<>();

        RestUtils.getUploadedModel(inputStream, fileExtension, bNodesMap, mf, bNodeService);

        verify(bNodeService).deterministicSkolemize(mf.createEmptyModel(), bNodesMap);
    }

    @Test
    public void getInProgressCommitIRI_WhenInProgressCommitExists_ReturnsExistingInProgressCommitResource() {
        User user = mock(User.class);
        Resource recordId = mock(Resource.class);
        RepositoryConnection conn = mock(RepositoryConnection.class);
        CommitManager commitManager = mock(CommitManager.class);
        CatalogConfigProvider configProvider = mock(CatalogConfigProvider.class);

        // Create an in-progress commit
        InProgressCommit inProgressCommit = mock(InProgressCommit.class);
        Resource expectedResource = mock(Resource.class);

        // Mock behavior to return a non-null IRI when configProvider.getLocalCatalogIRI() is called
        IRI localCatalogIRI = mock(IRI.class);
        when(configProvider.getLocalCatalogIRI()).thenReturn(localCatalogIRI);

        // Set up mock to return the existing in-progress commit
        when(commitManager.getInProgressCommitOpt(any(), any(), any(), any()))
                .thenReturn(Optional.of(inProgressCommit));

        // Mock behavior to return expectedResource when getResource is called on the inProgressCommit
        when(inProgressCommit.getResource()).thenReturn(expectedResource);

        // Call the method under test
        Resource result = RestUtils.getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);

        // Assert the result
        assertEquals(expectedResource, result);
    }

    @Test
    public void getInProgressCommitIRI_WhenInProgressCommitDoesNotExist_CreatesNewInProgressCommitAndReturnsResource() {
        User user = mock(User.class);
        Resource recordId = mock(Resource.class);
        InProgressCommit inProgressCommit = mock(InProgressCommit.class);
        Resource expectedResource = mock(Resource.class);

        // Mock behavior to return a non-null IRI when configProvider.getLocalCatalogIRI() is called
        IRI localCatalogIRI = mock(IRI.class);
        when(configProvider.getLocalCatalogIRI()).thenReturn(localCatalogIRI);

        // Set up mock to return empty optional, indicating that inProgressCommit does not exist
        when(commitManager.getInProgressCommitOpt(eq(localCatalogIRI), eq(recordId), eq(user), eq(conn)))
                .thenReturn(Optional.empty());

        // Mock behavior to return a valid inProgressCommit when createInProgressCommit is called
        when(commitManager.createInProgressCommit(user)).thenReturn(inProgressCommit);

        // Mock behavior to return expectedResource when getResource is called on the inProgressCommit
        when(inProgressCommit.getResource()).thenReturn(expectedResource);

        Resource result = RestUtils.getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);

        assertEquals(expectedResource, result);
        verify(commitManager).addInProgressCommit(eq(localCatalogIRI), eq(recordId), eq(inProgressCommit), eq(conn));
    }

    @Test
    public void testGetGarbageCollectionTime() {
        long totalCollectionTime = RestUtils.getGarbageCollectionTime();

        // Assert that a total collection time is returned
        assertNotNull(totalCollectionTime);
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

    private String removeWhitespace(String s) {
        return s.replaceAll("\\s+", "");
    }

    private Set<Thing> getTestThings(Map<IRI, String> predicateValues) {
        Set<Thing> set = new HashSet<>();

        predicateValues.forEach((key, value) -> {
            set.add(new TestThing("http://example.com/test/0", mf.createEmptyModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 1")));
            set.add(new TestThing("http://example.com/test/1", mf.createEmptyModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 2")));
            set.add(new TestThing("http://example.com/test/2", mf.createEmptyModel(), vf, null).addPropertyValue(key, vf.createLiteral(value + " 3")));

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
