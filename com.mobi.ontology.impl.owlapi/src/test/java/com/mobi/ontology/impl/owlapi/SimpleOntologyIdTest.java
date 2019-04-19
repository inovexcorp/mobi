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
import static org.junit.Assert.assertTrue;
import static org.powermock.api.mockito.PowerMockito.mockStatic;
import static org.powermock.api.mockito.PowerMockito.when;

import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
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

        ArgumentCaptor<IRI> mobiIRI = ArgumentCaptor.forClass(IRI.class);
        ArgumentCaptor<org.semanticweb.owlapi.model.IRI> owlapiIRI = ArgumentCaptor.forClass(org.semanticweb.owlapi.model.IRI.class);


        mockStatic(SimpleOntologyValues.class);
        when(SimpleOntologyValues.owlapiIRI(mobiIRI.capture())).thenAnswer(invocation -> org.semanticweb.owlapi.model.IRI.create(mobiIRI.getValue().stringValue()));
        when(SimpleOntologyValues.mobiIRI(owlapiIRI.capture())).thenAnswer(invocation -> vf.createIRI(owlapiIRI.getValue().getIRIString()));
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
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
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
        assertTrue(ontologyId.getOntologyIRI().isPresent());
        assertTrue(ontologyId.getOntologyIRI().get().equals(ontologyIRI)
                || ontologyId.getOntologyIRI().get().equals(vf.createIRI("urn:secondIRI"))
                || ontologyId.getOntologyIRI().get().equals(vf.createIRI("urn:thirdIRI")));
        assertEquals(ontologyId.getOntologyIRI().get(), ontologyId.getOntologyIdentifier());
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
        if (ontologyId.getVersionIRI().isPresent()) {
            assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
            assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
            assertEquals(Optional.of(versionIRI), ontologyId.getVersionIRI());
        } else {
            assertTrue(ontologyId.getOntologyIRI().isPresent());
            assertEquals(ontologyId.getOntologyIRI().get(), ontologyId.getOntologyIdentifier());
            assertEquals(Optional.empty(), ontologyId.getVersionIRI());
        }
    }

    @Test
    public void testConstructorWithModelSingleOntologyIRIMultipleVersionIRIs() {
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);
        model.add(ontologyIRI, versionIRIPred, vf.createIRI("urn:secondIRI"));

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertTrue(ontologyId.getVersionIRI().isPresent());
        assertTrue(ontologyId.getVersionIRI().get().equals(versionIRI) || ontologyId.getVersionIRI().get().equals(vf.createIRI("urn:secondIRI")));
        assertEquals(ontologyId.getVersionIRI().get(), ontologyId.getOntologyIdentifier());
        assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
    }

    @Test
    public void testConstructorWithModelMultipleOntologyIRIsMultipleVersionIRIs() {
        IRI ontologyIRI2 = vf.createIRI("urn:secondOntIRI");
        IRI versionIRI2 = vf.createIRI("urn:secondVersIRI");
        Model model = mf.createModel();
        model.add(ontologyIRI, typeIRI, ontologyType);
        model.add(ontologyIRI, versionIRIPred, versionIRI);
        model.add(ontologyIRI2, typeIRI, ontologyType);
        model.add(ontologyIRI2, versionIRIPred, versionIRI2);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertTrue(ontologyId.getVersionIRI().isPresent());
        if (ontologyId.getVersionIRI().get().equals(versionIRI)) {
            assertEquals(versionIRI, ontologyId.getOntologyIdentifier());
            assertEquals(Optional.of(ontologyIRI), ontologyId.getOntologyIRI());
            assertEquals(Optional.of(versionIRI), ontologyId.getVersionIRI());
        } else if (ontologyId.getVersionIRI().get().equals(versionIRI2)) {
            assertEquals(versionIRI2, ontologyId.getOntologyIdentifier());
            assertEquals(Optional.of(ontologyIRI2), ontologyId.getOntologyIRI());
            assertEquals(Optional.of(versionIRI2), ontologyId.getVersionIRI());
        }
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

    @Test
    public void testConstructorWithModelVNoOntologyIRIAndVersionIRI() {
        Model model = mf.createModel();
        model.add(ontologyIRI, versionIRIPred, versionIRI);

        OntologyId ontologyId = new SimpleOntologyId.Builder(vf).model(model).build();
        assertTrue(ontologyId.getOntologyIdentifier().stringValue().startsWith(ONTOLOGY_PREFIX));
        assertEquals(Optional.empty(), ontologyId.getOntologyIRI());
        assertEquals(Optional.empty(), ontologyId.getVersionIRI());
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
