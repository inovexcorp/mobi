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

import static org.easymock.EasyMock.capture;
import static org.easymock.EasyMock.expect;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.powermock.api.easymock.PowerMock.mockStatic;
import static org.powermock.api.easymock.PowerMock.replay;

import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.easymock.Capture;
import org.easymock.EasyMock;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.util.Optional;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyIdTest extends OrmEnabledTestCase  {
    private IRI ontologyIRI;
    private IRI versionIRI;
    private IRI identifierIRI;
    private String ontologyIRIString = "http://test.com/ontology1";
    private String versionIRIString = "http://test.com/ontology1/1.0.0";
    private String identifierString = "http://test.com/identifier";
    private ValueFactory vf;
    private ModelFactory mf;
    private IRI ontologyType;
    private IRI typeIRI;
    private IRI versionIRIPred;

    private static final String ONTOLOGY_PREFIX = "http://mobi.com/ontologies/";

    @Before
    public void setUp() {
        vf = getValueFactory();
        mf = getModelFactory();

        ontologyIRI = vf.createIRI(ontologyIRIString);
        versionIRI = vf.createIRI(versionIRIString);
        identifierIRI = vf.createIRI(identifierString);

        ontologyType = vf.createIRI(OWL.ONTOLOGY.stringValue());
        typeIRI = vf.createIRI(RDF.TYPE.stringValue());
        versionIRIPred = vf.createIRI(OWL.VERSIONIRI.stringValue());

        org.semanticweb.owlapi.model.IRI owlOntIRI = org.semanticweb.owlapi.model.IRI.create(ontologyIRIString);
        org.semanticweb.owlapi.model.IRI owlVerIRI = org.semanticweb.owlapi.model.IRI.create(versionIRIString);


        Capture<IRI> mobiIRI = EasyMock.newCapture();
        Capture<org.semanticweb.owlapi.model.IRI> owlapiIRI = EasyMock.newCapture();


        mockStatic(SimpleOntologyValues.class);
        expect(SimpleOntologyValues.owlapiIRI(capture(mobiIRI))).andAnswer(() -> org.semanticweb.owlapi.model.IRI.create(mobiIRI.getValue().stringValue())).anyTimes();
        expect(SimpleOntologyValues.mobiIRI(capture(owlapiIRI))).andAnswer(() -> vf.createIRI(owlapiIRI.getValue().getIRIString())).anyTimes();

        replay(SimpleOntologyValues.class);
    }
    
    @Test
    public void testConstructorWithNoInputValue() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).build();
        
        assertTrue(ontologyId.getOntologyIdentifier().stringValue().startsWith(ONTOLOGY_PREFIX));
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithOnlyId() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).id(identifierIRI).build();
        
        assertEquals(identifierIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
    
    @Test
    public void testConstructorWithIdAndOntologyIRI() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).id(identifierIRI).ontologyIRI(ontologyIRI).build();
        
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test
    public void testConstructorWithIdAndOntologyIRIAndVersionIRI() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).id(identifierIRI).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();

        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals(versionIRIString, ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRI, ontologyId.getOntologyIRI().get());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(versionIRI, ontologyId.getVersionIRI().get());
        assertEquals(versionIRIString, ontologyId.getVersionIRI().get().stringValue());
    }

    @Test
    public void testConstructorWithNoIdAndOntologyIRIAndNoVersionIRI() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).ontologyIRI(ontologyIRI).build();

        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test(expected = MobiOntologyException.class)
    public void testConstructorWithNoIdAndNoOntologyIRIAndVersionIRI() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).versionIRI(versionIRI).build();
    }

    @Test
    public void testConstructorWithNoIdAndOntologyIRIAndVersionIRI() {
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).ontologyIRI(ontologyIRI).versionIRI(versionIRI).build();
        
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals(versionIRIString, ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRI, ontologyId.getOntologyIRI().get());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(versionIRI, ontologyId.getVersionIRI().get());
        assertEquals(versionIRIString, ontologyId.getVersionIRI().get().stringValue());
    }

    @Test
    public void testConstructorWithModelNoOntologyIRINoVersionIRI() {
        Model model = mf.createModel();

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertTrue(ontologyId.getOntologyIdentifier().stringValue().startsWith(ONTOLOGY_PREFIX));
        assertTrue(ontologyId.getOntologyIRI().get().stringValue().startsWith(ONTOLOGY_PREFIX));
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test
    public void testConstructorWithModelSingleOntologyIRINoVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test
    public void testConstructorWithModelMultipleOntologyIRIsNoVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(vf.createIRI("urn:secondIRI"), typeIRI, ontologyType);
        model.add(vf.createIRI("urn:thirdIRI"), typeIRI, ontologyType);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test
    public void testConstructorWithModelSingleOntologyIRIAndSingleVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.of(versionIRI), ontologyId.getVersionIRI());
    }

    @Test
    public void testConstructorWithModelMultipleOntologyIRIsSingleVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(vf.createIRI("urn:secondIRI"), typeIRI, ontologyType);
        model.add(vf.createIRI("urn:thirdIRI"), typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.of(versionIRI), ontologyId.getVersionIRI());
    }

    @Test(expected = MobiOntologyException.class)
    public void testConstructorWithModelSingleOntologyIRIsMultipleVersionIRIs() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);
        model.add(ontologyIRI, versionIRIPred, vf.createIRI("urn:secondIRI"));

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
    }

    @Test(expected = MobiOntologyException.class)
    public void testConstructorWithModelMultipleOntologyIRIsMultipleVersionIRIs() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(vf.createIRI("urn:secondIRI"), typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);
        model.add(ontologyIRI, versionIRIPred, vf.createIRI("urn:secondIRI"));

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
    }

    @Test
    public void testConstructorWithModelOntologyIRIandID() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).id(identifierIRI).model(model).build();

        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIdentifier().stringValue());
        assertEquals(ontologyIRIString, ontologyId.getOntologyIRI().get().stringValue());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }

    @Test(expected = MobiOntologyException.class)
    public void testConstructorWithModelVNoOntologyIRIAndVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, versionIRIPred, versionIRI);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
    }

    @Test
    public void testConstructorWithModelAndOtherFieldsSet() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).ontologyIRI(vf.createIRI("urn:otherOntologyIRI")).versionIRI(vf.createIRI("urn:otherVersionIRI")).id(identifierIRI).build();
        assertEquals(ontologyIRI, ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
    }
}
