package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.NodeShapeSummary;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SHACL;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import javax.ws.rs.core.StreamingOutput;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleShapesGraphTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private Model shapesModel;
    private SimpleShapesGraph shapesGraph;
    private List<NodeShapeSummary> nodeShapeSummaries;

    private final IRI SHAPES_GRAPH_IRI = VALUE_FACTORY.createIRI("http://test.com/shapes-graph");
    private final IRI NODE_SHAPE_IRI = VALUE_FACTORY.createIRI("http://test.com/node-shape");

    @Mock
    Ontology ontology;

    @Mock
    Ontology importOntology1;

    @Mock
    private OntologyId ontologyId;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        shapesModel = MODEL_FACTORY.createEmptyModel();
        shapesModel.add(SHAPES_GRAPH_IRI, RDF.TYPE, OWL.ONTOLOGY);
        shapesModel.add(SHAPES_GRAPH_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Shapes Graph"));
        shapesModel.add(NODE_SHAPE_IRI, RDF.TYPE, SHACL.NODE_SHAPE);
        shapesModel.add(NODE_SHAPE_IRI, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Node Shape"));

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(shapesModel);
        }

        when(ontology.asModel()).thenReturn(shapesModel);
        when(ontology.getGraphQueryResults(anyString(), anyBoolean())).thenAnswer(i -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                GraphQuery query = conn.prepareGraphQuery(i.getArgument(0));
                return QueryResults.asModel(query.evaluate(), MODEL_FACTORY);
            }
        });
        when(ontology.getGraphQueryResultsStream(anyString(), anyBoolean(), any(RDFFormat.class), anyBoolean(), any(OutputStream.class))).thenAnswer(i -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                GraphQuery query = conn.prepareGraphQuery(i.getArgument(0));
                try (GraphQueryResult result = query.evaluate()) {
                    RDFWriter rdfWriter = Rio.createWriter(i.getArgument(2), (OutputStream) i.getArgument(4));
                    Rio.write(result, rdfWriter);
                    return i.getArgument(4);
                }
            }
        });
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(SHAPES_GRAPH_IRI));
        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontology.asTurtle(any(OutputStream.class))).thenAnswer(i -> {
            OutputStream os = i.getArgument(0);
            RDFWriter rdfWriter = Rio.createWriter(RDFFormat.TURTLE, os);
            Rio.write(shapesModel, rdfWriter);
            return os;
        });
        when(ontology.asRdfXml(any(OutputStream.class))).thenAnswer(i -> {
            OutputStream os = i.getArgument(0);
            RDFWriter rdfWriter = Rio.createWriter(RDFFormat.RDFXML, os);
            Rio.write(shapesModel, rdfWriter);
            return os;
        });
        when(ontology.asJsonLD(anyBoolean(), any(OutputStream.class))).thenAnswer(i -> {
            OutputStream os = i.getArgument(1);
            RDFWriter rdfWriter = Rio.createWriter(RDFFormat.JSONLD, os);
            Rio.write(shapesModel, rdfWriter);
            return os;
        });
        nodeShapeSummaries = new ArrayList<>(List.of(
            new NodeShapeSummary("iri:C", "Charlie", "class", "t:C", false, "ont:1"),
            new NodeShapeSummary("iri:a", "alpha", "class", "t:a", true, "ont:2"),
            new NodeShapeSummary("iri:B", "Bravo", "property", "t:B", false, "ont:1"),
            new NodeShapeSummary("iri:E", "echo", "class", "t:E", true, "ont:2"),
            new NodeShapeSummary("iri:D", "DELTA", "property", "t:D", false, "ont:1")
        ));
        shapesGraph = new SimpleShapesGraph(ontology);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void testConstructor() {
        assertEquals(ontology, shapesGraph.getOntology());
    }

    @Test
    public void testGetShapesGraphId() {
        Optional<IRI> result = shapesGraph.getShapesGraphId();
        assertTrue(result.isPresent());
        assertEquals(SHAPES_GRAPH_IRI, result.get());
        verify(ontology).getOntologyId();
        verify(ontologyId).getOntologyIRI();
    }

    @Test
    public void testGetEntity() {
        Model result = shapesGraph.getEntity(SHAPES_GRAPH_IRI, true);
        assertEquals(2, result.size());
        assertTrue(result.contains(SHAPES_GRAPH_IRI, RDF.TYPE, OWL.ONTOLOGY));
        assertTrue(result.contains(SHAPES_GRAPH_IRI, DCTERMS.TITLE, null));

        result = shapesGraph.getEntity(NODE_SHAPE_IRI, true);
        assertEquals(2, result.size());
        assertTrue(result.contains(NODE_SHAPE_IRI, RDF.TYPE, SHACL.NODE_SHAPE));
        assertTrue(result.contains(NODE_SHAPE_IRI, DCTERMS.TITLE, null));

        result = shapesGraph.getEntity(VALUE_FACTORY.createIRI("urn:missing"), true);
        assertEquals(0, result.size());
    }

    @Test
    public void testGetShapesGraphContent() {
        Model result = shapesGraph.getShapesGraphContent();
        assertFalse(result.isEmpty());
        assertTrue(result.contains(NODE_SHAPE_IRI, null, null));
        assertFalse(result.contains(SHAPES_GRAPH_IRI, null, null));
    }

    @Test(expected = IllegalStateException.class)
    public void testGetShapesGraphContentMissingIRI() {
        // Setup:
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.empty());

        shapesGraph.getShapesGraphContent();
    }

    @Test
    public void testSerializeShapesGraphTurtle() throws Exception {
        String expectedResult = """
                <http://test.com/shapes-graph> a <http://www.w3.org/2002/07/owl#Ontology>;
                  <http://purl.org/dc/terms/title> "Test Shapes Graph" .

                <http://test.com/node-shape> a <http://www.w3.org/ns/shacl#NodeShape>;
                  <http://purl.org/dc/terms/title> "Test Node Shape" .""";
        StreamingOutput result = shapesGraph.serializeShapesGraph("turtle");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphRdfXml() throws Exception {
        String expectedResult = """
                <?xml version="1.0" encoding="UTF-8"?>
                <rdf:RDF
                \txmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

                <rdf:Description rdf:about="http://test.com/shapes-graph">
                \t<rdf:type rdf:resource="http://www.w3.org/2002/07/owl#Ontology"/>
                \t<title xmlns="http://purl.org/dc/terms/">Test Shapes Graph</title>
                </rdf:Description>

                <rdf:Description rdf:about="http://test.com/node-shape">
                \t<rdf:type rdf:resource="http://www.w3.org/ns/shacl#NodeShape"/>
                \t<title xmlns="http://purl.org/dc/terms/">Test Node Shape</title>
                </rdf:Description>

                </rdf:RDF>""";
        StreamingOutput result = shapesGraph.serializeShapesGraph("rdf/xml");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphJsonld() throws Exception {
        String expectedResult = """
                [ {
                  "@id" : "http://test.com/node-shape",
                  "@type" : [ "http://www.w3.org/ns/shacl#NodeShape" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Node Shape"
                  } ]
                }, {
                  "@id" : "http://test.com/shapes-graph",
                  "@type" : [ "http://www.w3.org/2002/07/owl#Ontology" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Shapes Graph"
                  } ]
                } ]""";
        StreamingOutput result = shapesGraph.serializeShapesGraph("jsonld");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphUnknownFormat() throws Exception {
        String expectedResult = """
                [ {
                  "@id" : "http://test.com/node-shape",
                  "@type" : [ "http://www.w3.org/ns/shacl#NodeShape" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Node Shape"
                  } ]
                }, {
                  "@id" : "http://test.com/shapes-graph",
                  "@type" : [ "http://www.w3.org/2002/07/owl#Ontology" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Shapes Graph"
                  } ]
                } ]""";
        StreamingOutput result = shapesGraph.serializeShapesGraph("unknown");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphContentTurtle() throws Exception {
        String expectedResult = "<http://test.com/node-shape> a <http://www.w3.org/ns/shacl#NodeShape>;\n" +
                "  <http://purl.org/dc/terms/title> \"Test Node Shape\" .";
        StreamingOutput result = shapesGraph.serializeShapesGraphContent("turtle");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphContentRdfXml() throws Exception {
        String expectedResult = """
                <?xml version="1.0" encoding="UTF-8"?>
                <rdf:RDF
                \txmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

                <rdf:Description rdf:about="http://test.com/node-shape">
                \t<rdf:type rdf:resource="http://www.w3.org/ns/shacl#NodeShape"/>
                \t<title xmlns="http://purl.org/dc/terms/">Test Node Shape</title>
                </rdf:Description>

                </rdf:RDF>""";
        StreamingOutput result = shapesGraph.serializeShapesGraphContent("rdf/xml");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphContentJsonld() throws Exception {
        String expectedResult = """
                [ {
                  "@id" : "http://test.com/node-shape",
                  "@type" : [ "http://www.w3.org/ns/shacl#NodeShape" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Node Shape"
                  } ]
                } ]""";
        StreamingOutput result = shapesGraph.serializeShapesGraphContent("jsonld");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testSerializeShapesGraphContentUnknownFormat() throws Exception {
        String expectedResult = """
                [ {
                  "@id" : "http://test.com/node-shape",
                  "@type" : [ "http://www.w3.org/ns/shacl#NodeShape" ],
                  "http://purl.org/dc/terms/title" : [ {
                    "@value" : "Test Node Shape"
                  } ]
                } ]""";
        StreamingOutput result = shapesGraph.serializeShapesGraphContent("unknown");
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        result.write(os);
        String stringResult = os.toString(StandardCharsets.UTF_8);
        assertEquals(expectedResult, stringResult.trim());
    }

    @Test
    public void testGetUnloadableImportIRIs() {
        when(ontology.getUnloadableImportIRIs()).thenReturn(Set.of(getValueFactory().createIRI("urn:unload1")));
        Set<IRI> result = shapesGraph.getUnloadableImportIRIs();
        Set<IRI> expectedResult = Set.of(getValueFactory().createIRI("urn:unload1"));
        assertEquals(expectedResult, result);
    }

    @Test
    public void testGetImportedOntologies() {
        when(ontology.getImportsClosure()).thenReturn(Set.of(ontology, importOntology1));
        Set<Ontology> result = shapesGraph.getImportedOntologies();
        Set<Ontology> expectedResult = Set.of(importOntology1);
        assertEquals(expectedResult, result);
    }

    @Test
    public void testOrderShapeNodesSortsCaseInsensitively() {
        List<String> expectedOrder = List.of("alpha", "Bravo", "Charlie", "DELTA", "echo");;
        assertSummaryNames(expectedOrder, shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, 5));
    }

    @Test
    public void testOrderShapeNodesSortsWithDuplicateNames() {
        nodeShapeSummaries.add(new NodeShapeSummary("iri:A2", "alpha", "class", "t:A2", false, "ont:3"));
        List<String> expectedOrder = List.of("alpha", "alpha", "Bravo", "Charlie", "DELTA", "echo");
        assertSummaryNames(expectedOrder, shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, 6));
    }

    @Test
    public void testOrderShapeNodesPagination() {
        assertSummaryNames(List.of("alpha", "Bravo"), shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, 2));
        assertSummaryNames(List.of("Bravo", "Charlie"), shapesGraph.orderShapeNodes(nodeShapeSummaries, 1, 2));
        assertSummaryNames(List.of("DELTA", "echo"), shapesGraph.orderShapeNodes(nodeShapeSummaries, 3, 5));
        assertSummaryNames(List.of("DELTA", "echo"), shapesGraph.orderShapeNodes(nodeShapeSummaries, 3, 2));
    }

    @Test
    public void testOrderShapeNodesNullName() {
        nodeShapeSummaries.add(new NodeShapeSummary("iri:N", null, "class", "t:N", false, "ont:1"));
        List<String> expectedOrder = Arrays.asList("alpha", "Bravo", "Charlie", "DELTA", "echo", null);
        assertSummaryNames(expectedOrder, shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, nodeShapeSummaries.size()));
    }

    @Test
    public void testOrderShapeNodesEmptyList() {
        try {
            assertSummaryNames(List.of(), shapesGraph.orderShapeNodes(new ArrayList<>(), 0, 10));
        } catch (IllegalArgumentException e) {
            assertEquals("Offset is greater than or equal to the number of nodes.", e.getMessage());
        }
    }

    @Test
    public void testOrderShapeNodesThrowsExceptionForZeroLimit() {
        try {
            shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, 0);
        } catch (IllegalArgumentException e) {
            assertEquals("Limit must be greater than 0.", e.getMessage());
        }
    }

    @Test
    public void testOrderShapeNodesThrowsExceptionForNegativeLimit() {
        try {
            shapesGraph.orderShapeNodes(nodeShapeSummaries, 0, -5);
        } catch (IllegalArgumentException e) {
            assertEquals("Limit must be greater than 0.", e.getMessage());
        }
    }

    @Test
    public void testOrderShapeNodesThrowsExceptionForNegativeOffset() {
        try {
            shapesGraph.orderShapeNodes(nodeShapeSummaries, -1, 5);
        } catch (IllegalArgumentException e) {
            assertEquals("Offset must be greater than 0.", e.getMessage());
        }
    }

    @Test
    public void testOrderShapeNodesThrowsExceptionForOffsetEqualToSize() {
        try {
            shapesGraph.orderShapeNodes(nodeShapeSummaries, nodeShapeSummaries.size(), 1);
        } catch (IllegalArgumentException e) {
            assertEquals("Offset is greater than or equal to the number of nodes.", e.getMessage());
        }
    }

    @Test
    public void testOrderShapeNodesThrowsExceptionForOffsetGreaterThanSize() {
        try {
            shapesGraph.orderShapeNodes(nodeShapeSummaries, nodeShapeSummaries.size() + 1, 1);
            fail("Should have thrown IllegalArgumentException");
        } catch (IllegalArgumentException e) {
            assertEquals("Offset is greater than or equal to the number of nodes.", e.getMessage());
        }
    }

    private static void assertSummaryNames(List<String> expectedOrder, List<NodeShapeSummary> result) {
        List<String> names = result.stream().map(NodeShapeSummary::name).toList();
        assertEquals(expectedOrder, names);
    }
}
