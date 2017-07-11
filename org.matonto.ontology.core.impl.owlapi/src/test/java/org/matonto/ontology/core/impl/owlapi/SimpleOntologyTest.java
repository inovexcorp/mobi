package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import static org.easymock.EasyMock.capture;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;

import org.easymock.Capture;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.axiom.Axiom;
import org.matonto.ontology.core.api.classexpression.OClass;
import org.matonto.ontology.core.impl.owlapi.classexpression.SimpleClass;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import org.matonto.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAxiom;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyTest {
    private ValueFactory vf = SimpleValueFactory.getInstance();

    OntologyId ontologyIdMock;
    OntologyManager ontologyManager;
    SesameTransformer transformer;
    IRI ontologyIRI;
    IRI versionIRI;

    @Before
    public void setUp() {
        ontologyIdMock = mock(OntologyId.class);
        transformer = mock(SesameTransformer.class);
        ontologyManager = mock(OntologyManager.class);

        ontologyIRI = mock(IRI.class);
        expect(ontologyIRI.stringValue()).andReturn("http://test.com/ontology1").anyTimes();

        versionIRI = mock(IRI.class);
        expect(versionIRI.stringValue()).andReturn("http://test.com/ontology1/1.0.0").anyTimes();

        replay(ontologyIRI, versionIRI);

        mockStatic(SimpleOntologyValues.class);

        Capture<IRI> capture = Capture.newInstance();
        expect(SimpleOntologyValues.owlapiIRI(capture(capture)))
                .andAnswer(() -> org.semanticweb.owlapi.model.IRI.create(capture.getValue().stringValue()))
                .anyTimes();

        Capture<org.semanticweb.owlapi.model.IRI> capture2 = Capture.newInstance();
        expect(SimpleOntologyValues.matontoIRI(capture(capture2)))
                .andAnswer(() -> mock(IRI.class))
                .anyTimes();

        Capture<OClass> capture3 = Capture.newInstance();
        expect(SimpleOntologyValues.owlapiClass(capture(capture3)))
                .andAnswer(() -> new OWLClassImpl(org.semanticweb.owlapi.model.IRI.create(capture3.getValue().getIRI()
                        .stringValue())))
                .anyTimes();

        Capture<OWLObjectProperty> capture4 = Capture.newInstance();
        expect(SimpleOntologyValues.matontoObjectProperty(capture(capture4)))
                .andAnswer(() -> new SimpleObjectProperty(vf.createIRI(capture4.getValue().getIRI().toString())))
                .anyTimes();

        Capture<OWLDataProperty> capture5 = Capture.newInstance();
        expect(SimpleOntologyValues.matontoDataProperty(capture(capture5)))
                .andAnswer(() -> new SimpleDataProperty(vf.createIRI(capture5.getValue().getIRI().toString())))
                .anyTimes();

        expect(ontologyIdMock.getOntologyIRI()).andReturn(Optional.of(ontologyIRI)).anyTimes();
        expect(ontologyIdMock.getVersionIRI()).andReturn(Optional.of(versionIRI)).anyTimes();

        expect(ontologyManager.createOntologyId(isA(IRI.class), isA(IRI.class))).andReturn(ontologyIdMock).anyTimes();
        expect(ontologyManager.createOntologyId(isA(IRI.class))).andReturn(ontologyIdMock).anyTimes();
    }

    @Test
    public void testGetOntologyIdReturnsAnEqualObject() throws Exception {
        replay(ontologyIdMock, ontologyManager, SimpleOntologyValues.class);

        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        assertEquals(ontologyIdMock, ontology.getOntologyId());
    }

    @Test
    public void testStreamConstructor() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test
    public void testFileConstructor() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test
    public void testEquals() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/test.owl");
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);

        Ontology ontology3 = new SimpleOntology(file, ontologyManager, transformer);
        Ontology ontology4 = new SimpleOntology(file, ontologyManager, transformer);

        Ontology ontology5 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology6 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertEquals(ontology1, ontology2);
        assertEquals(ontology3, ontology4);
        assertEquals(ontology3, ontology5);
        assertEquals(ontology5, ontology6);
    }

    @Test
    public void testNotEquals() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/travel.owl");

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology3 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertNotEquals(ontology1, ontology2);
        assertNotEquals(ontology1, ontology3);
        assertNotEquals(ontology2, ontology3);
    }

    @Test
    @Ignore
    public void testHashCode() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        InputStream stream1 = this.getClass().getResourceAsStream("/test.owl");
        InputStream stream2 = this.getClass().getResourceAsStream("/test.owl");
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();

        Ontology ontology1 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Ontology ontology2 = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);

        Ontology ontology3 = new SimpleOntology(file, ontologyManager, transformer);
        Ontology ontology4 = new SimpleOntology(file, ontologyManager, transformer);

        Ontology ontology5 = new SimpleOntology(stream1, ontologyManager, transformer);
        Ontology ontology6 = new SimpleOntology(stream2, ontologyManager, transformer);

        assertEquals(ontology1.hashCode(), ontology2.hashCode());
        assertEquals(ontology3.hashCode(), ontology4.hashCode());
        assertEquals(ontology3.hashCode(), ontology5.hashCode());
        assertEquals(ontology5.hashCode(), ontology6.hashCode());
    }

    @Test
    public void annotationsAreEmptyForEmptyOntology() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Set<Annotation> annotations = ontology.getOntologyAnnotations();

        assertTrue(annotations.size() == 0);
    }

    @Test
    public void annotationsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        expect(SimpleOntologyValues.matontoAnnotation(isA(OWLAnnotation.class))).andReturn(mock(Annotation.class)).anyTimes();
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        // Setup
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);

        // Test
        Set<Annotation> annotations = ontology.getOntologyAnnotations();

        // Assertions
        assertTrue(annotations.size() == 1);
    }

    @Test
    public void axiomsAreEmptyForEmptyOntology() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        Ontology ontology = new SimpleOntology(ontologyIdMock, ontologyManager, transformer);
        Set<Axiom> axioms = ontology.getAxioms();
        assertTrue(axioms.size() == 0);
    }

    @Test
    public void axiomsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        expect(SimpleOntologyValues.matontoAxiom(isA(OWLAxiom.class))).andReturn(mock(Axiom.class)).anyTimes();
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        // Setup
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer);

        // Test
        Set<Axiom> axioms = ontology.getAxioms();

        // Assertions
        assertTrue(axioms.size() == 1);
    }
    
    @Test
    public void missingDirectImportTest() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/protegeSample.owl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);

        assertEquals(5, ontology.getUnloadableImportIRIs().size());
    }

    @Test
    public void getCardinalityPropertiesText() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/restriction-test-ontology.ttl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);

        assertEquals(0, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Woman")).size());
    }

    @Test
    public void getCardinalityPropertiesOfSubClassText() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/restriction-test-ontology.ttl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);

        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Parent")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassText() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/restriction-test-ontology.ttl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);

        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Person")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassAndSubClassText() throws Exception {
        replay(ontologyManager, SimpleOntologyValues.class, ontologyIdMock);

        File file = Paths.get(getClass().getResource("/restriction-test-ontology.ttl").toURI()).toFile();
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer);

        assertEquals(2, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Man")).size());
    }

    // TODO: Test asModel

    // TODO: Test asTurtle

    // TODO: Test asRdfXml

    // TODO: Test asOwlXml

    // TODO: Test asJsonLD
}
