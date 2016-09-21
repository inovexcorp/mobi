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
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.Optional;

import static org.easymock.EasyMock.anyString;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyIdTest {

    IRI idMock;
    OntologyManager ontologyManager;
    ValueFactory factory;
    IRI ontologyIRI;
    IRI versionIRI;
    org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    org.semanticweb.owlapi.model.IRI owlVersionIRI;
    
    @Before
    public void setUp() {
        idMock = mock(IRI.class);
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
        expect(factory.createIRI(anyString())).andReturn(idMock);
        replay(factory, idMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).build();
        
        assertEquals(idMock, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOnlyId() {
        replay(factory, idMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(idMock).build();
        
        assertEquals(idMock, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOnlySpecificId() {
        expect(idMock.stringValue()).andReturn("http://test.com/iri1");
        replay(factory, idMock);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(idMock).build();
        
        assertEquals(idMock, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/iri1", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithIdAndOntologyIRI() {
        expect(factory.createIRI(isA(String.class))).andReturn(ontologyIRI);
        replay(factory, idMock, owlOntologyIRI, SimpleOntologyValues.class);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(idMock).ontologyIRI(ontologyIRI).build();
        
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOntologyIRIAndVersionIRIAndNoID() {
        expect(factory.createIRI(isA(String.class))).andReturn(versionIRI);
        replay(factory, idMock, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
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
        replay(factory, idMock, owlOntologyIRI, owlVersionIRI, SimpleOntologyValues.class);
        OntologyId ontologyId = new SimpleOntologyId.Builder(factory).id(idMock).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
        
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRI, ontologyId.getOntologyIRI().get());
        assertEquals("http://test.com/ontology1", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(versionIRI, ontologyId.getVersionIRI().get());
        assertEquals("http://test.com/ontology1/1.0.0", ontologyId.getVersionIRI().get().stringValue());
    }
    
}
