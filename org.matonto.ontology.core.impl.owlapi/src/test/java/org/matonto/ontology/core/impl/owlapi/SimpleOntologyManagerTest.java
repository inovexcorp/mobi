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

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.rdf.api.BNode;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Optional;

import static org.easymock.EasyMock.anyString;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;


@RunWith(PowerMockRunner.class)
@PrepareForTest({SimpleOntologyValues.class, SimpleOntologyId.class})
public class SimpleOntologyManagerTest {

    private ValueFactory factory;
    private OntologyId ontologyIdMock;
    private IRI idMock;
    private IRI ontologyIRI;
    private IRI versionIRI;

    @Before
    public void setUp() {
        factory = mock(ValueFactory.class);    
        ontologyIdMock = mock(OntologyId.class);
        idMock = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlOntologyIRI = org.semanticweb.owlapi.model.IRI.create("http://test.com/ontology1");
        org.semanticweb.owlapi.model.IRI owlVersionIRI = org.semanticweb.owlapi.model.IRI.create("http://test.com/ontology1/1.0.0");

        ontologyIRI = mock(IRI.class);
        expect(ontologyIRI.stringValue()).andReturn("http://test.com/ontology1").anyTimes();
        expect(ontologyIRI.getNamespace()).andReturn("http://test.com/ontology1").anyTimes();

        versionIRI = mock(IRI.class);
        expect(versionIRI.stringValue()).andReturn("http://test.com/ontology1/1.0.0").anyTimes();
        expect(versionIRI.getNamespace()).andReturn("http://test.com/ontology1").anyTimes();
        
        replay(ontologyIRI, versionIRI);     

        mockStatic(SimpleOntologyValues.class);
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(owlOntologyIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(owlVersionIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlOntologyIRI)).andReturn(ontologyIRI).anyTimes();
        expect(SimpleOntologyValues.matontoIRI(owlVersionIRI)).andReturn(versionIRI).anyTimes();
    }
    
    @Test
    public void testCreateOntologyIdWithNoParam() throws Exception {
        expect(factory.createIRI(anyString())).andReturn(idMock).anyTimes();

        replay(factory);
        
        SimpleOntologyManager manager = new SimpleOntologyManager();
        manager.setValueFactory(factory);
        ontologyIdMock = manager.createOntologyId();
        assertEquals(idMock, ontologyIdMock.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyIdMock.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyIdMock.getVersionIRI());
    } 
    
    @Test
    public void testCreateOntologyIdWithBNode() throws Exception {
        BNode bNodeMock = mock(BNode.class);
        replay(factory, idMock, bNodeMock);
        
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
        replay(factory, SimpleOntologyValues.class);
        
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
        replay(factory, SimpleOntologyValues.class);
        
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
        replay(ontologyIdMock, SimpleOntologyValues.class);
        
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
        replay(factory, ontologyIdMock, SimpleOntologyValues.class);
        
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
        replay(factory, SimpleOntologyValues.class);
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
