package org.matonto.ontology.core.impl.owlapi;

import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;

import java.util.Optional;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyIdTest {

    Resource resourceMock;
    BNode bNodeMock;
    IRI iriMock;
    OntologyManager ontologyManager;
    ValueFactory factory;
    IRI ontologyIRI;
    IRI versionIRI;
    org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    org.semanticweb.owlapi.model.IRI owlVersionIRI;
    
    @Before
    public void setUp() {
        resourceMock = mock(Resource.class);
        bNodeMock = mock(BNode.class);
        iriMock = mock(IRI.class);
        factory = mock(ValueFactory.class);
        ontologyManager = mock(OntologyManager.class);       
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
    }
    
    @Test
    public void testConstructorWithNoInputValue() {
        expect(factory.createBNode()).andReturn(bNodeMock);
        replay(factory, bNodeMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).build();
        
        assertEquals(bNodeMock, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOnlyId() {
        replay(factory, bNodeMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(bNodeMock).build();
        
        assertEquals(bNodeMock, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOnlySpecificId() {
        expect(bNodeMock.stringValue()).andReturn("http://test.com/BNode");
        replay(factory, bNodeMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(bNodeMock).build();
        
        assertEquals(bNodeMock, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/BNode", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithIdAndOntologyIRI() {
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI);
        replay(factory, bNodeMock, owlOntologyIRI, SimpleOntologyValues.class);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(bNodeMock).ontologyIRI(ontologyIRI).build();
        
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOntologyIRIAndVersionIRIAndNoID() {
        expect(factory.createIRI(isA(String.class))).andReturn(versionIRI);
        replay(factory, bNodeMock, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
        
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRI, ontologyId.getOntologyIRI().get());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(versionIRI, ontologyId.getVersionIRI().get());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getVersionIRI().get().stringValue());
    }
    
    @Test
    public void testConstructorWithOntologyIRIAndVersionIRIAndID() {
        expect(factory.createIRI(isA(String.class))).andReturn(versionIRI);
        replay(factory, bNodeMock, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(bNodeMock).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
        
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRI, ontologyId.getOntologyIRI().get());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(versionIRI, ontologyId.getVersionIRI().get());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getVersionIRI().get().stringValue());
    }
    
}
