package org.matonto.ontology.core.impl.owlapi;

import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Optional;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.Repository;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyManager;


@RunWith(PowerMockRunner.class)
@PrepareForTest({SimpleOntologyValues.class, SimpleOntologyId.class})
public class SimpleOntologyManagerTest {

    ValueFactory factory;
    SesameTransformer transformer;
    Repository repository;
    ModelFactory modelFactory;
    OWLOntologyManager owlManager;
    OWLOntology owlOntology;
    OntologyId ontologyIdMock;
    Ontology ontology;
    BNode bNodeMock;
    IRI ontologyIRI;
    IRI versionIRI;
    org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    org.semanticweb.owlapi.model.IRI owlVersionIRI;
    
    @Before
    public void setUp() {
        factory = mock(ValueFactory.class);    
        transformer = mock(SesameTransformer.class);
        repository = mock(Repository.class);
        modelFactory = mock(ModelFactory.class);
        ontology = mock(Ontology.class);   
        owlManager = mock(OWLOntologyManager.class);
        owlOntology = mock(OWLOntology.class);
        ontologyIdMock = mock(OntologyId.class);       
        bNodeMock = mock(BNode.class);
        owlOntologyIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        owlVersionIRI = mock(org.semanticweb.owlapi.model.IRI.class);

        ontologyIRI = mock(IRI.class);
        expect(ontologyIRI.stringValue()).andReturn("http://test.com/ontology1").anyTimes();
        expect(ontologyIRI.getNamespace()).andReturn("http://test.com/ontology1").anyTimes();

        versionIRI = mock(IRI.class);
        expect(versionIRI.stringValue()).andReturn("http://test.com/ontology1/1.0.0").anyTimes();
        expect(versionIRI.getNamespace()).andReturn("http://test.com/ontology1").anyTimes();
        
        replay(ontologyIRI, versionIRI);     
        
        expect(owlOntologyIRI.getNamespace()).andReturn(ontologyIRI.getNamespace()).anyTimes();
        expect(owlVersionIRI.getNamespace()).andReturn(versionIRI.getNamespace()).anyTimes();
        
        mockStatic(SimpleOntologyValues.class);
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(owlOntologyIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(owlVersionIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlOntologyIRI)).andReturn(ontologyIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlVersionIRI)).andReturn(versionIRI).anyTimes();
        
        expect(factory.createBNode()).andReturn(bNodeMock).anyTimes();
    }
    
    @Test
    public void testCreateOntologyIdWithNoParam() throws Exception {
        replay(factory);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        ontologyIdMock = manager.createOntologyId();
        assertEquals(bNodeMock, ontologyIdMock.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyIdMock.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyIdMock.getVersionIRI());
    } 
    
    @Test
    public void testCreateOntologyIdWithBNode() throws Exception {
        replay(factory, bNodeMock);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        ontologyIdMock = manager.createOntologyId(bNodeMock);
        assertEquals(bNodeMock, ontologyIdMock.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyIdMock.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyIdMock.getVersionIRI());
    }
    
    @Test
    public void testCreateOntologyIdWithOntologyIRI() throws Exception {
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI);
        replay(factory, owlOntologyIRI, SimpleOntologyValues.class);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        ontologyIdMock = manager.createOntologyId(ontologyIRI);
        assertEquals(ontologyIRI, ontologyIdMock.getOntologyIdentifier());
        assertEquals(ontologyIRI, ontologyIdMock.getOntologyIRI().get());
        assertEquals(Optional.empty(), ontologyIdMock.getVersionIRI());
    }   
    
    @Test
    public void testCreateOntologyIdWithOntologyIRIAndVersionIRI() throws Exception {
        expect(factory.createIRI(isA(String.class))).andReturn(versionIRI);
        expect(SimpleOntologyValues.matontoIRI(isA(org.semanticweb.owlapi.model.IRI.class))).andReturn(versionIRI);
        replay(factory, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        ontologyIdMock = manager.createOntologyId(ontologyIRI, versionIRI);
        assertEquals(versionIRI, ontologyIdMock.getOntologyIdentifier());
        assertEquals(ontologyIRI, ontologyIdMock.getOntologyIRI().get());
        assertEquals(versionIRI, ontologyIdMock.getVersionIRI().get());
    }
    
    @Test
    public void testCreateOntologyWithOntologyId() throws Exception {
        expect(ontologyIdMock.getOntologyIRI()).andReturn(Optional.of(ontologyIRI)).anyTimes();
        expect(ontologyIdMock.getVersionIRI()).andReturn(Optional.of(versionIRI)).anyTimes();
        replay(ontologyIdMock, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        Ontology ontology = manager.createOntology(ontologyIdMock);
        assertEquals(ontologyIdMock, ontology.getOntologyId());
    }
    
    @Test
    public void testCreateOntologyWithFile() throws Exception {
        expect(SimpleOntologyValues.matontoIRI(isA(org.semanticweb.owlapi.model.IRI.class))).andReturn(ontologyIRI).anyTimes();
        expect(ontologyIdMock.getOntologyIRI()).andReturn(Optional.of(ontologyIRI)).anyTimes();
        expect(ontologyIdMock.getVersionIRI()).andReturn(Optional.of(versionIRI)).anyTimes();
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI);
        replay(factory, owlOntologyIRI, owlVersionIRI, ontologyIdMock, SimpleOntologyValues.class);
        
        File file = Paths.get(getClass().getResource("/test.owl").toURI()).toFile();
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        Ontology ontology = manager.createOntology(file);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
    }
    
    @Test
    public void testCreateOntologyWithInputStream() throws Exception {
        expect(SimpleOntologyValues.matontoIRI(isA(org.semanticweb.owlapi.model.IRI.class))).andReturn(ontologyIRI).anyTimes();
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI);
        replay(factory, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        InputStream stream = this.getClass().getResourceAsStream("/test.owl");
        Ontology ontology = manager.createOntology(stream);
        assertEquals(ontologyIRI, ontology.getOntologyId().getOntologyIRI().get());
    }
    
    //ToDo: TestRetrieveOntology
    
    //ToDo: TestStoreOntology
    
    //ToDo: TestDeleteOntology
}
