package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import com.mobi.utils.cli.CliTestUtils;
import com.mobi.utils.cli.api.EndRestoreException;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;

import java.util.List;
import java.util.stream.Stream;

public class ConsolidateTrackedIdentifiersTest {
    private final ValueFactory vf = new ValidatingValueFactory();
    private final IRI CATALOG = vf.createIRI("urn:catalog");
    private final IRI ONTOLOGY_RECORD_1 = vf.createIRI("urn:ontologyRecord1");
    private final IRI SHAPES_RECORD_1 = vf.createIRI("urn:shapesRecord1");
    private final IRI SHAPES_RECORD_2 = vf.createIRI("urn:shapesRecord2");
    private final IRI ONTOLOGY_IRI = vf.createIRI("urn:ontologyIRI");
    private final IRI SHAPES_GRAPH_IRI = vf.createIRI("urn:shapesGraphIRI");
    private final IRI VRDF_RECORD_TYPE = vf.createIRI(VersionedRDFRecord.TYPE);
    private final IRI ONTOLOGY_RECORD_TYPE = vf.createIRI(OntologyRecord.TYPE);
    private final IRI SHAPES_GRAPH_RECORD_TYPE = vf.createIRI(ShapesGraphRecord.TYPE);
    private final IRI ONTOLOGY_IRI_PRED = vf.createIRI("http://mobi.com/ontologies/ontology-editor#ontologyIRI");
    private final IRI SHAPES_GRAPH_IRI_PRED = vf.createIRI("http://mobi.com/ontologies/shapes-graph-editor#shapesGraphIRI");
    private final IRI TRACKED_ID_PRED = vf.createIRI(VersionedRDFRecord.trackedIdentifier_IRI);

    private ConsolidateTrackedIdentifiers operation;
    private MemoryRepositoryWrapper repo;

    @Before
    public void setupMocks() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        operation = new ConsolidateTrackedIdentifiers();
        operation.tempRepo = repo;
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of("1.12;true",
                "1.13;true",
                "1.14;true",
                "1.15;true",
                "1.16;true",
                "1.17;true",
                "1.18;true",
                "1.19;true",
                "1.20;true",
                "1.21;true",
                "1.22;true",
                "2.0;true",
                "2.1;true",
                "2.2;true",
                "2.3;true",
                "2.4;true",
                "2.5;true",
                "3.0;true",
                "3.1;true",
                "4.0;false",
                "4.1;false"
        ).toList();
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void executeNoDuplicatesTest() {
        // Setup
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ONTOLOGY_RECORD_1, RDF.TYPE, VRDF_RECORD_TYPE, ONTOLOGY_RECORD_1);
            conn.add(ONTOLOGY_RECORD_1, RDF.TYPE, ONTOLOGY_RECORD_TYPE, ONTOLOGY_RECORD_1);
            conn.add(ONTOLOGY_RECORD_1, ONTOLOGY_IRI_PRED, ONTOLOGY_IRI, ONTOLOGY_RECORD_1);

            conn.add(SHAPES_RECORD_1, RDF.TYPE, VRDF_RECORD_TYPE, SHAPES_RECORD_1);
            conn.add(SHAPES_RECORD_1, RDF.TYPE, SHAPES_GRAPH_RECORD_TYPE, SHAPES_RECORD_1);
            conn.add(SHAPES_RECORD_1, SHAPES_GRAPH_IRI_PRED, SHAPES_GRAPH_IRI, SHAPES_RECORD_1);
        }

        operation.execute();

        try (RepositoryConnection conn = repo.getConnection()) {
            Model ontologyRecord = QueryResults.asModel(conn.getStatements(ONTOLOGY_RECORD_1, null, null));
            assertFalse(ontologyRecord.isEmpty());
            assertTrue(ontologyRecord.contains(ONTOLOGY_RECORD_1, TRACKED_ID_PRED, ONTOLOGY_IRI));
            assertFalse(ontologyRecord.contains(ONTOLOGY_RECORD_1, ONTOLOGY_IRI_PRED, ONTOLOGY_IRI));

            Model shapesRecord = QueryResults.asModel(conn.getStatements(SHAPES_RECORD_1, null, null));
            assertFalse(shapesRecord.isEmpty());
            assertTrue(shapesRecord.contains(SHAPES_RECORD_1, TRACKED_ID_PRED, SHAPES_GRAPH_IRI));
            assertFalse(shapesRecord.contains(SHAPES_RECORD_1, SHAPES_GRAPH_IRI_PRED, SHAPES_GRAPH_IRI));
        }
    }

    @Test(expected = EndRestoreException.class)
    public void executeDuplicatesTest() {
        // Setup
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(ONTOLOGY_RECORD_1, RDF.TYPE, VRDF_RECORD_TYPE, ONTOLOGY_RECORD_1);
            conn.add(ONTOLOGY_RECORD_1, RDF.TYPE, ONTOLOGY_RECORD_TYPE, ONTOLOGY_RECORD_1);
            conn.add(ONTOLOGY_RECORD_1, ONTOLOGY_IRI_PRED, ONTOLOGY_IRI, ONTOLOGY_RECORD_1);

            conn.add(SHAPES_RECORD_1, RDF.TYPE, VRDF_RECORD_TYPE, SHAPES_RECORD_1);
            conn.add(SHAPES_RECORD_1, RDF.TYPE, SHAPES_GRAPH_RECORD_TYPE, SHAPES_RECORD_1);
            conn.add(SHAPES_RECORD_1, SHAPES_GRAPH_IRI_PRED, ONTOLOGY_IRI, SHAPES_RECORD_1);

            conn.add(SHAPES_RECORD_2, RDF.TYPE, VRDF_RECORD_TYPE, SHAPES_RECORD_2);
            conn.add(SHAPES_RECORD_2, RDF.TYPE, SHAPES_GRAPH_RECORD_TYPE, SHAPES_RECORD_2);
            conn.add(SHAPES_RECORD_2, SHAPES_GRAPH_IRI_PRED, SHAPES_GRAPH_IRI, SHAPES_RECORD_2);
        }

        operation.execute();
    }
}
