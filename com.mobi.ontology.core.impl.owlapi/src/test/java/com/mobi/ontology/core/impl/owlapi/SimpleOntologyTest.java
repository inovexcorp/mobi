package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.when;

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.classexpression.OClass;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleDataProperty;
import com.mobi.ontology.core.impl.owlapi.propertyExpression.SimpleObjectProperty;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleIRI;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryManager;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.Set;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyTest extends OrmEnabledTestCase {
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private InputStream restrictionInputStream;
    private InputStream hasDoctypeInputStream;
    private File testFile;
    private IRI ontologyIRI;

    @Mock
    private OntologyId ontologyIdMock;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private IRI versionIRI;

    @Before
    public void setUp() throws Exception {
        restrictionInputStream = getClass().getResourceAsStream("/restriction-test-ontology.ttl");
        hasDoctypeInputStream = getClass().getResourceAsStream("/hasDoctype.owl");
        testFile = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();

        MockitoAnnotations.initMocks(this);

        ontologyIRI = VALUE_FACTORY.createIRI("http://test.com/ontology1");
        when(versionIRI.stringValue()).thenReturn("http://test.com/ontology1/1.0.0");

        mockStatic(SimpleOntologyValues.class);

        when(SimpleOntologyValues.owlapiIRI(any(IRI.class))).thenAnswer(i -> org.semanticweb.owlapi.model.IRI.create(i.getArgumentAt(0, IRI.class).stringValue()));
        when(SimpleOntologyValues.mobiIRI(any(org.semanticweb.owlapi.model.IRI.class))).thenAnswer(i -> vf.createIRI(i.getArgumentAt(0, org.semanticweb.owlapi.model.IRI.class).toString()));
        when(SimpleOntologyValues.owlapiClass(any(OClass.class))).thenAnswer(i -> new OWLClassImpl(org.semanticweb.owlapi.model.IRI.create(i.getArgumentAt(0, OClass.class).getIRI().stringValue())));
        when(SimpleOntologyValues.mobiObjectProperty(any(OWLObjectProperty.class))).thenAnswer(i -> new SimpleObjectProperty(vf.createIRI(i.getArgumentAt(0, OWLObjectProperty.class).getIRI().toString())));
        when(SimpleOntologyValues.mobiDataProperty(any(OWLDataProperty.class))).thenAnswer(i -> new SimpleDataProperty(vf.createIRI(i.getArgumentAt(0, OWLDataProperty.class).getIRI().toString())));

        when(ontologyIdMock.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyIdMock.getVersionIRI()).thenReturn(Optional.of(versionIRI));
        when(ontologyIdMock.getOntologyIdentifier()).thenReturn(ontologyIRI);

        when(ontologyManager.createOntologyId(any(IRI.class), any(IRI.class))).thenReturn(ontologyIdMock);
        when(ontologyManager.createOntologyId(any(IRI.class))).thenReturn(ontologyIdMock);
        when(ontologyManager.createOntologyId()).thenReturn(ontologyIdMock);
        when(ontologyManager.getOntologyRecordResource(any(IRI.class))).thenReturn(Optional.empty());
        when(transformer.sesameModel(any(Model.class))).thenReturn(new LinkedHashModel());
        when(transformer.sesameResource(any(Resource.class))).thenReturn(new SimpleIRI("http://test.com/ontology1"));
    }

    @Test
    public void testStreamConstructor() throws Exception {
        InputStream stream = new FileInputStream(testFile);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test (expected = MobiOntologyException.class)
    public void testStreamConstructorEmpty() throws Exception {
        InputStream stream =  new ByteArrayInputStream(new byte[0]);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repositoryManager, true);
    }

    @Test (expected = MobiOntologyException.class)
    public void testStreamConstructorNoFormatMatch() throws Exception {
        String noMatch = "This is not a valid ontology file.";
        InputStream stream =  new ByteArrayInputStream(noMatch.getBytes());
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repositoryManager, true);
    }

    @Test
    public void testEquals() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = new FileInputStream(testFile);

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repositoryManager, true);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repositoryManager, true);

        assertEquals(ontology1, ontology2);
    }

    @Test
    public void testNotEquals() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = this.getClass().getResourceAsStream("/travel.owl");

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repositoryManager, true);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repositoryManager, true);

        assertNotEquals(ontology1, ontology2);
    }

    @Test
    @Ignore
    public void testHashCode() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = new FileInputStream(testFile);

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repositoryManager, true);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repositoryManager, true);

        assertEquals(ontology1.hashCode(), ontology2.hashCode());
    }

    @Test
    public void annotationsAreEmptyForEmptyOntology() throws Exception {
        Model emptyModel = MODEL_FACTORY.createModel();
        Ontology ontology = new SimpleOntology(emptyModel, ontologyManager, transformer, bNodeService, repositoryManager);
        Set<Annotation> annotations = ontology.getOntologyAnnotations();
        assertTrue(annotations.size() == 0);
    }

    @Test
    public void annotationsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        when(SimpleOntologyValues.mobiAnnotation(any(OWLAnnotation.class))).thenReturn(mock(Annotation.class));

        // Setup
        InputStream stream = new FileInputStream(testFile);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repositoryManager, true);

        // Test
        Set<Annotation> annotations = ontology.getOntologyAnnotations();

        // Assertions
        assertTrue(annotations.size() == 1);
    }
    
    @Test
    public void missingDirectImportTest() throws Exception {
        InputStream file = getClass().getResourceAsStream("/protegeSample.owl");
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(5, ontology.getUnloadableImportIRIs().size());
    }

    @Test
    public void getCardinalityPropertiesTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionInputStream, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(0, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Woman")).size());
    }

    @Test
    public void getCardinalityPropertiesOfSubClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionInputStream, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Parent")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionInputStream, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(1, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Person")).size());
    }

    @Test
    public void getCardinalityPropertiesOfEquivalentClassAndSubClassTest() throws Exception {
        Ontology ontology = new SimpleOntology(restrictionInputStream, ontologyManager, transformer, bNodeService, repositoryManager, true);
        assertEquals(2, ontology.getCardinalityProperties(vf.createIRI("http://example.com/owl/families#Man")).size());
    }

    // TODO: Test asModel

    // TODO: Test asTurtle

    // TODO: Test asRdfXml

    // TODO: Test asOwlXml

    // TODO: Test asJsonLD
}
