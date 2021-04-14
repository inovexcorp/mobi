package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.when;

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleIRI;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;

import java.io.*;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyTest extends OrmEnabledTestCase {
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private RepositoryManager repoManager = new SimpleRepositoryManager();
    private InputStream restrictionInputStream;
    private InputStream hasDoctypeInputStream;
    private File testFile;
    private IRI ontologyIRI;
    private Repository repo;

    @Mock
    private OntologyId ontologyIdMock;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private RepositoryConfig repositoryConfig;

    @Mock
    private IRI versionIRI;

    @Mock
    private ForkJoinPool threadPool;

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

        Repository mr = repoManager.createMemoryRepository();
        repo = spy(mr);
        repo.initialize();
        Mockito.when(repo.getConfig()).thenReturn(repositoryConfig);
        Mockito.when(repositoryConfig.id()).thenReturn("ontologyCache");


//        when(transformer.sesameModel(any(Model.class))).thenReturn(new LinkedHashModel());
//        when(transformer.sesameResource(any(Resource.class))).thenReturn(new SimpleIRI("http://test.com/ontology1"));

        Mockito.when(transformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        Mockito.when(transformer.sesameModel(any(com.mobi.rdf.api.Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, com.mobi.rdf.api.Model.class)));
        Mockito.when(transformer.sesameResource(any(Resource.class))).thenAnswer(i -> Values.sesameResource(i.getArgumentAt(0, Resource.class)));
        Mockito.when(transformer.mobiStatement(any(Statement.class))).thenAnswer(i -> Values.mobiStatement(i.getArgumentAt(0, Statement.class)));
        Mockito.when(transformer.sesameStatement(any(com.mobi.rdf.api.Statement.class))).thenAnswer(i ->
                Values.sesameStatement(i.getArgumentAt(0, com.mobi.rdf.api.Statement.class)));

    }

    @Test
    public void testStreamConstructor() throws Exception {
        InputStream stream = new FileInputStream(testFile);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
        assertEquals(versionIRI, ontology.getOntologyId().getVersionIRI().get());
    }

    @Test (expected = MobiOntologyException.class)
    public void testStreamConstructorEmpty() throws Exception {
        InputStream stream =  new ByteArrayInputStream(new byte[0]);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
    }

    @Test (expected = MobiOntologyException.class)
    public void testStreamConstructorNoFormatMatch() throws Exception {
        String noMatch = "This is not a valid ontology file.";
        InputStream stream =  new ByteArrayInputStream(noMatch.getBytes());
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
    }

    @Test
    public void testEquals() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = new FileInputStream(testFile);

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);

        assertEquals(ontology1, ontology2);
    }

    @Test
    public void testNotEquals() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = this.getClass().getResourceAsStream("/travel.owl");

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);

        assertNotEquals(ontology1, ontology2);
    }

    @Test
    @Ignore
    public void testHashCode() throws Exception {
        InputStream stream1 = new FileInputStream(testFile);
        InputStream stream2 = new FileInputStream(testFile);

        Ontology ontology1 = new SimpleOntology(stream1, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
        Ontology ontology2 = new SimpleOntology(stream2, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);

        assertEquals(ontology1.hashCode(), ontology2.hashCode());
    }

    @Test
    public void annotationsAreEmptyForEmptyOntology() throws Exception {
        Model emptyModel = MODEL_FACTORY.createModel();
        Ontology ontology = new SimpleOntology(emptyModel, ontologyManager, transformer, bNodeService, repoManager, threadPool, vf);
        Set<Annotation> annotations = ontology.getOntologyAnnotations();
        assertEquals(0, annotations.size());
    }

    @Test
    public void annotationsAreCorrectForNonemptyOntology() throws Exception {
        // Behaviors
        when(SimpleOntologyValues.mobiAnnotation(any(OWLAnnotation.class))).thenReturn(mock(Annotation.class));

        // Setup
        InputStream stream = new FileInputStream(testFile);
        Ontology ontology = new SimpleOntology(stream, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);

        // Test
        Set<Annotation> annotations = ontology.getOntologyAnnotations();

        // Assertions
        assertEquals(1, annotations.size());
    }

    @Test
    public void testGetDeprecatedIris() {
        // Setup:
        Set<IRI> expected = Stream.of(vf.createIRI("http://mobi.com/ontology#Class3a")).collect(Collectors.toSet());

        // Setup
        InputStream file = getClass().getResourceAsStream("/test-ontology.ttl");
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);

        Set<IRI> results = ontology.getDeprecatedIRIs();
        assertEquals(results, expected);
    }

    @Test
    public void missingDirectImportTest() throws Exception {
        InputStream file = getClass().getResourceAsStream("/protegeSample.owl");
        Ontology ontology = new SimpleOntology(file, ontologyManager, transformer, bNodeService, repoManager, true, threadPool, vf);
        assertEquals(5, ontology.getUnloadableImportIRIs().size());
    }


    // TODO: Test asModel

    // TODO: Test asTurtle

    // TODO: Test asRdfXml

    // TODO: Test asOwlXml

    // TODO: Test asJsonLD
}
