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

import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.isA;
import static org.easymock.EasyMock.mock;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.mockStaticPartial;
import static org.powermock.api.easymock.PowerMock.replay;

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.NodeID;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLClass;
import org.semanticweb.owlapi.model.OWLDataProperty;
import org.semanticweb.owlapi.model.OWLDatatype;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLNamedIndividual;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import org.semanticweb.owlapi.model.OWLOntologyID;
import uk.ac.manchester.cs.owl.owlapi.OWLClassImpl;
import uk.ac.manchester.cs.owl.owlapi.OWLLiteralImplString;

import java.util.Optional;



@RunWith(PowerMockRunner.class)
@PrepareForTest({SimpleOntologyValues.class, 
    org.semanticweb.owlapi.model.IRI.class,
    NodeID.class})
public class SimpleOntologyValuesTest {

    private static final String IRI = "urn:test";

    private ValueFactory factory;
    private BNodeService bNodeService;
    private IRI ontologyIRI;
    private IRI versionIRI;
    private org.semanticweb.owlapi.model.IRI owlOntologyIRI;

    @Before
    public void setUp() {
        factory = OrmEnabledTestCase.getValueFactory();
        bNodeService = mock(BNodeService.class);
        owlOntologyIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        ontologyIRI = mock(IRI.class);
        versionIRI = mock(IRI.class);

        SimpleOntologyValues sov = new SimpleOntologyValues();
        sov.setValueFactory(factory);
        sov.setbNodeService(bNodeService);
    }
    
    @Test
    public void testMobiIRI() throws Exception {
        expect(owlOntologyIRI.getIRIString()).andReturn(IRI);
        replay(owlOntologyIRI);

        assertEquals(factory.createIRI(IRI), SimpleOntologyValues.mobiIRI(owlOntologyIRI));
    }
    
    @Test
    public void testOwlapiIRI() throws Exception {
        expect(ontologyIRI.stringValue()).andReturn(IRI);
        mockStatic(org.semanticweb.owlapi.model.IRI.class);
        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class))).andReturn(owlOntologyIRI);
        replay(ontologyIRI, org.semanticweb.owlapi.model.IRI.class);

        assertEquals(owlOntologyIRI, SimpleOntologyValues.owlapiIRI(ontologyIRI));
    }
    
    @Test
    public void testMobiLiteral() throws Exception {
        OWLLiteral owlLiteral = new OWLLiteralImplString("testString");
        IRI iri = factory.createIRI("http://www.w3.org/2001/XMLSchema#string");
        Literal literal = mock(Literal.class);
        Datatype datatype = mock(Datatype.class);
        
        expect(datatype.getIRI()).andReturn(iri).anyTimes();
        expect(literal.getDatatype()).andReturn(iri).anyTimes();
        expect(literal.getLabel()).andReturn("testString").anyTimes();
        
        replay(literal, datatype);
        
        mockStaticPartial(SimpleOntologyValues.class, "mobiDatatype");
        expect(SimpleOntologyValues.mobiDatatype(isA(OWLDatatype.class))).andReturn(datatype).anyTimes();
        replay(SimpleOntologyValues.class);

        assertEquals("testString", SimpleOntologyValues.mobiLiteral(owlLiteral).getLabel());
        assertEquals(iri, SimpleOntologyValues.mobiLiteral(owlLiteral).getDatatype());
    }
    
    @Test
    public void testOwlapiLiteral() throws Exception {
        Literal literal = mock(Literal.class);
        IRI datatypeIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/2001/XMLSchema#string").anyTimes();
        expect(literal.getDatatype()).andReturn(datatypeIRI);  
        expect(literal.getLanguage()).andReturn(Optional.empty());
        expect(literal.getLabel()).andReturn("test");
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(isA(IRI.class))).andReturn(owlIRI).anyTimes();
        replay(literal, datatypeIRI, SimpleOntologyValues.class);
        
        OWLLiteral owlLiteral = SimpleOntologyValues.owlapiLiteral(literal);
        assertEquals("test", owlLiteral.getLiteral());
    }
    
    @Test
    public void testMobiAnnotation() throws Exception {
        OWLAnnotation owlAnno = mock(OWLAnnotation.class);
        OWLAnnotation owlAnno1 = mock(OWLAnnotation.class);
          
        OWLAnnotationProperty owlProperty = mock(OWLAnnotationProperty.class);
        AnnotationProperty property = mock(AnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI value = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
          
        expect(owlAnno.getProperty()).andReturn(owlProperty).anyTimes();
        expect(owlAnno.getValue()).andReturn(value).anyTimes();
          
        mockStaticPartial(SimpleOntologyValues.class, "mobiAnnotationProperty", "mobiIRI");
        expect(SimpleOntologyValues.mobiAnnotationProperty(owlProperty)).andReturn(property).anyTimes();
        expect(SimpleOntologyValues.mobiIRI(value)).andReturn(iri).anyTimes();
          
        replay(owlAnno, owlAnno1, owlProperty, property, value, iri, SimpleOntologyValues.class);
    }

    @Test
    public void testOwlapiAnnotation() throws Exception {
        Annotation anno = mock(Annotation.class);
        AnnotationProperty property = mock(AnnotationProperty.class);
        OWLAnnotationProperty owlProperty = mock(OWLAnnotationProperty.class);
        IRI value = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);

        expect(anno.getProperty()).andReturn(property);
        expect(anno.getValue()).andReturn(value).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiAnnotationProperty", "owlapiIRI");
        expect(SimpleOntologyValues.owlapiAnnotationProperty(property)).andReturn(owlProperty).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(value)).andReturn(owlIRI).anyTimes();
        
        replay(anno, property, owlProperty, value,owlIRI, SimpleOntologyValues.class);
        
        assertEquals(0, SimpleOntologyValues.owlapiAnnotation(anno).annotations().count());
    }

    
    @Test
    public void testMobiIndividual() throws Exception {
        OWLNamedIndividual owlIndividual = mock(OWLNamedIndividual.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(owlIndividual.getIRI()).andReturn(owlIRI);
        expect(owlIndividual.isNamed()).andReturn(true);
        expect(owlIndividual.asOWLNamedIndividual()).andReturn(owlIndividual);
        expect(owlIRI.getIRIString()).andReturn(IRI).anyTimes();
        replay(owlIndividual, owlIRI);

        Individual mobiIndividual = SimpleOntologyValues.mobiIndividual(owlIndividual);
        assertEquals(owlIRI.getIRIString(), mobiIndividual.getIRI().stringValue());
    }
    
    @Test
    public void testOwlapiIndividual() throws Exception {
        Individual mobiIndividual = mock(Individual.class);
        IRI mobiIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        
        expect(mobiIndividual.getIRI()).andReturn(mobiIRI);
        expect(mobiIRI.stringValue()).andReturn("http://www.test.com/owlapiNamedIndividual");
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(isA(IRI.class))).andReturn(owlIRI);
        replay(mobiIndividual, mobiIRI, SimpleOntologyValues.class);
        
        assertTrue(SimpleOntologyValues.owlapiIndividual(mobiIndividual).isOWLNamedIndividual());
    }
    
    @Test
    public void testMobiOntologyId() throws Exception {
        org.semanticweb.owlapi.model.IRI oIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology");
        org.semanticweb.owlapi.model.IRI vIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology/1.0.0");
        OWLOntologyID owlId2 = new OWLOntologyID(oIRI, vIRI);

        IRI moIRI = mock(IRI.class);
        IRI mvIRI = mock(IRI.class);
        
        expect(moIRI.stringValue()).andReturn("http://www.test.com/ontology").anyTimes();
        expect(mvIRI.stringValue()).andReturn("http://www.test.com/ontology/1.0.0").anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI");
        expect(SimpleOntologyValues.mobiIRI(oIRI)).andReturn(moIRI).anyTimes();
        expect(SimpleOntologyValues.mobiIRI(vIRI)).andReturn(mvIRI).anyTimes();
        
        replay(moIRI, mvIRI, SimpleOntologyValues.class);

        OntologyId ontologyId = SimpleOntologyValues.mobiOntologyId(owlId2);
        assertEquals("http://www.test.com/ontology", ontologyId.getOntologyIRI().get().stringValue());
        assertEquals("http://www.test.com/ontology/1.0.0", ontologyId.getVersionIRI().get().stringValue());
    }
    
    @Test
    public void testOwlapiOntologyId() throws Exception {
        org.semanticweb.owlapi.model.IRI oIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology");
        org.semanticweb.owlapi.model.IRI vIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontology/1.0.0");
        OWLOntologyID owlId = new OWLOntologyID(oIRI, vIRI);

        SimpleOntologyId simpleId1 = mock(SimpleOntologyId.class);
        expect(simpleId1.getOwlapiOntologyId()).andReturn(owlId);

        OntologyId simpleId2 = mock(OntologyId.class);
        expect(simpleId2.getOntologyIRI()).andReturn(Optional.of(ontologyIRI)).anyTimes();
        expect(simpleId2.getVersionIRI()).andReturn(Optional.of(versionIRI)).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(ontologyIRI)).andReturn(oIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(versionIRI)).andReturn(vIRI).anyTimes();
        
        replay(simpleId1, simpleId2, SimpleOntologyValues.class);

        OWLOntologyID owlId1 = SimpleOntologyValues.owlapiOntologyId(simpleId1);
        OWLOntologyID owlId2 = SimpleOntologyValues.owlapiOntologyId(simpleId2);

        assertEquals(owlId, owlId1);
        assertEquals(oIRI, owlId2.getOntologyIRI().get());
        assertEquals(vIRI, owlId2.getVersionIRI().get());
    }
    
    @Test
    public void testMobiClass() throws Exception {
        org.semanticweb.owlapi.model.IRI owlClassIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontologyClass");
        OWLClass owlapiClass = new OWLClassImpl(owlClassIRI);

        IRI classIRI = mock(IRI.class);

        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI", "owlapiIRI");
        expect(SimpleOntologyValues.mobiIRI(owlClassIRI)).andReturn(classIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(classIRI)).andReturn(owlClassIRI).anyTimes();
        expect(classIRI.stringValue()).andReturn("http://www.test.com/ontologyClass").anyTimes();

        replay(classIRI, SimpleOntologyValues.class);
        
        assertEquals(classIRI, SimpleOntologyValues.mobiClass(owlapiClass).getIRI());
    }
    
    @Test
    public void testOwlapiClass() throws Exception {
        OClass mobiClass = mock(OClass.class);
        IRI classIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlClassIRI = org.semanticweb.owlapi.model.IRI.create("http://www.test.com/ontologyClass");
        
        expect(mobiClass.getIRI()).andReturn(classIRI).anyTimes();
        
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(classIRI)).andReturn(owlClassIRI).anyTimes();

        replay(mobiClass, classIRI, SimpleOntologyValues.class);
        
        assertEquals(owlClassIRI, SimpleOntologyValues.owlapiClass(mobiClass).getIRI());       
    }
    
    @Test
    public void testMobiDatatype() throws Exception {
        OWLDatatype owlDatatype = mock(OWLDatatype.class);
        org.semanticweb.owlapi.model.IRI owlDatatypeIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI datatypeIRI = mock(IRI.class);

        expect(owlDatatype.getIRI()).andReturn(owlDatatypeIRI).anyTimes();
        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral").anyTimes();

        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI", "owlapiIRI");
        expect(SimpleOntologyValues.mobiIRI(owlDatatypeIRI)).andReturn(datatypeIRI).anyTimes();
        expect(SimpleOntologyValues.owlapiIRI(datatypeIRI)).andReturn(owlDatatypeIRI).anyTimes();

        mockStaticPartial(org.semanticweb.owlapi.model.IRI.class, "create");
        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class), isA(String.class))).andReturn(owlDatatypeIRI).anyTimes();

        replay(owlDatatype, owlDatatypeIRI, datatypeIRI, SimpleOntologyValues.class, org.semanticweb.owlapi.model.IRI.class);

        assertEquals(datatypeIRI, SimpleOntologyValues.mobiDatatype(owlDatatype).getIRI());
    }
    
    @Test
    public void testOwlapiDatatype() throws Exception {
        Datatype datatype = mock(Datatype.class);
        IRI datatypeIRI = mock(IRI.class);
        org.semanticweb.owlapi.model.IRI owlDatatypeIRI = mock(org.semanticweb.owlapi.model.IRI.class);

        expect(datatype.getIRI()).andReturn(datatypeIRI).anyTimes();
        expect(datatypeIRI.stringValue()).andReturn("http://www.w3.org/1999/02/22-rdf-syntax-ns#PlainLiteral").anyTimes();

        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(datatypeIRI)).andReturn(owlDatatypeIRI).anyTimes();

        mockStaticPartial(org.semanticweb.owlapi.model.IRI.class, "create");
        expect(org.semanticweb.owlapi.model.IRI.create(isA(String.class), isA(String.class))).andReturn(owlDatatypeIRI).anyTimes();
        replay(datatype, owlDatatypeIRI, datatypeIRI, SimpleOntologyValues.class, org.semanticweb.owlapi.model.IRI.class);

        assertEquals(owlDatatypeIRI, SimpleOntologyValues.owlapiDatatype(datatype).getIRI());
    }
    
    @Test
    public void testMobiObjectProperty() throws Exception {
        OWLObjectProperty property = mock(OWLObjectProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI");
        expect(SimpleOntologyValues.mobiIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        Assert.assertEquals(iri, SimpleOntologyValues.mobiObjectProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiObjectProperty() throws Exception {
        ObjectProperty property = mock(ObjectProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiObjectProperty(property).getIRI());
    }
    
    @Test
    public void testMobiDataProperty() throws Exception {
        OWLDataProperty property = mock(OWLDataProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI");
        expect(SimpleOntologyValues.mobiIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        Assert.assertEquals(iri, SimpleOntologyValues.mobiDataProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiDataProperty() throws Exception {
        DataProperty property = mock(DataProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiDataProperty(property).getIRI());
    }
    
    @Test
    public void testMobiAnnotationProperty() throws Exception {
        OWLAnnotationProperty property = mock(OWLAnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(owlIRI).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "mobiIRI");
        expect(SimpleOntologyValues.mobiIRI(owlIRI)).andReturn(iri);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        Assert.assertEquals(iri, SimpleOntologyValues.mobiAnnotationProperty(property).getIRI());
    }
    
    @Test
    public void testOwlapiAnnotationProperty() throws Exception {
        AnnotationProperty property = mock(AnnotationProperty.class);
        org.semanticweb.owlapi.model.IRI owlIRI = mock(org.semanticweb.owlapi.model.IRI.class);
        IRI iri = mock(IRI.class);
        
        expect(property.getIRI()).andReturn(iri).anyTimes();
        mockStaticPartial(SimpleOntologyValues.class, "owlapiIRI");
        expect(SimpleOntologyValues.owlapiIRI(iri)).andReturn(owlIRI);
        
        replay(property, owlIRI, iri, SimpleOntologyValues.class);
        
        assertEquals(owlIRI, SimpleOntologyValues.owlapiAnnotationProperty(property).getIRI());
    }
}
