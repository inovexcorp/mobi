package org.matonto.rest.util;

/*-
 * #%L
 * org.matonto.rest.util
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
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.junit.Before;
import org.junit.Test;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.web.security.util.AuthenticationProps;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.Model;
import org.openrdf.rio.RDFFormat;

import java.nio.charset.Charset;
import java.util.Optional;
import javax.ws.rs.container.ContainerRequestContext;

public class RestUtilsTest {
    private Model model;
    private String expectedJsonld;
    private String expectedTurtle;
    private String expectedGroupedTurtle;
    private String expectedGroupedRdfxml;
    private String expectedRdfxml;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private org.matonto.rdf.api.ModelFactory mf = LinkedHashModelFactory.getInstance();

    @Mock
    private ContainerRequestContext context;

    @Mock
    private EngineManager engineManager;

    @Mock
    private User user;

    @Before
    public void setUp() throws Exception {
        setUpModel();

        expectedJsonld = IOUtils.toString(getClass().getResourceAsStream("/test.json"));
        expectedTurtle = IOUtils.toString(getClass().getResourceAsStream("/test.ttl"));
        expectedGroupedTurtle = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.ttl"));
        expectedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/test.xml"));
        expectedGroupedRdfxml = IOUtils.toString(getClass().getResourceAsStream("/grouped-test.xml"));

        MockitoAnnotations.initMocks(this);
        when(context.getProperty(AuthenticationProps.USERNAME)).thenReturn("tester");
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
    }

    @Test
    public void encodeTest() throws Exception {
        String test = ":/#?=& +;\"{[}]@$%^\t";
        assertEquals("%3A%2F%23%3F%3D%26%20%2B%3B%22%7B%5B%7D%5D%40%24%25%5E%09", RestUtils.encode(test));
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
        assertEquals(expectedJsonld, RestUtils.modelToString(model, RDFFormat.JSONLD));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, RDFFormat.TURTLE));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, RDFFormat.RDFXML)));
    }

    @Test
    public void modelToStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.modelToString(model, "jsonld"));
        assertEquals(expectedTurtle, RestUtils.modelToString(model, "turtle"));
        assertTrue(equalsIgnoreNewline(expectedRdfxml, RestUtils.modelToString(model, "rdf/xml")));
        assertEquals(expectedJsonld, RestUtils.modelToString(model, "something"));
    }

    @Test
    public void groupedModelToStringWithRDFFormatTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, RDFFormat.JSONLD));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, RDFFormat.TURTLE));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, RDFFormat.RDFXML)));
    }

    @Test
    public void groupedModelToStringTest() throws Exception {
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, "jsonld"));
        assertEquals(expectedGroupedTurtle, RestUtils.groupedModelToString(model, "turtle"));
        assertTrue(equalsIgnoreNewline(expectedGroupedRdfxml, RestUtils.groupedModelToString(model, "rdf/xml")));
        assertEquals(expectedJsonld, RestUtils.groupedModelToString(model, "something"));
    }

    @Test
    public void jsonldToModelTest() throws Exception {
        Model result = RestUtils.jsonldToModel(expectedJsonld);
        assertEquals(model, result);
    }

    @Test
    public void modelToJsonldTest() throws Exception {
        String result = RestUtils.modelToJsonld(model);
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
            fail("Expected MatOntoWebException to have been thrown");
        } catch (MatOntoWebException e) {
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
        } catch (MatOntoWebException e) {
            assertEquals(401, e.getResponse().getStatus());
        }
    }

    @Test
    public void checkStringParamTest() {
        String errorMessage = "Error";
        try {
            RestUtils.checkStringParam("", errorMessage);
        } catch (MatOntoWebException e) {
            assertEquals(400, e.getResponse().getStatus());
            assertEquals(errorMessage, e.getResponse().getStatusInfo().getReasonPhrase());
        }

        try {
            RestUtils.checkStringParam(null, errorMessage);
        } catch (MatOntoWebException e) {
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

    private void setUpModel() {
        org.matonto.rdf.api.Model temp = mf.createModel();
        temp.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/0"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));
        temp.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/1"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));
        temp.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop1"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop2"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop3"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("true"));
        temp.add(vf.createIRI("http://example.com/test/2"), vf.createIRI("http://example.com/prop4"), vf.createLiteral("false"));
        model = Values.sesameModel(temp);
    }

    public boolean equalsIgnoreNewline(String s1, String s2) {
        return s1 != null && s2 != null && normalizeLineEnds(s1).equals(normalizeLineEnds(s2));
    }

    private String normalizeLineEnds(String s) {
        return s.replace("\r\n", "\n").replace('\r', '\n');
    }
}
