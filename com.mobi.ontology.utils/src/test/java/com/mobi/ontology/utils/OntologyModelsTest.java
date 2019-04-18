package com.mobi.ontology.utils;

/*-
 * #%L
 * com.mobi.ontology.utils
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.junit.Before;
import org.junit.Test;

import java.util.Optional;

public class OntologyModelsTest extends OrmEnabledTestCase {

    private ModelFactory mf;
    private ValueFactory vf;
    private IRI ontologyIRI;
    private IRI versionIRI;
    private IRI type;
    private IRI versionType;
    private IRI ontologyObj;

    @Before
    public void setUp() {
        mf = getModelFactory();
        vf = getValueFactory();
        ontologyIRI = vf.createIRI("urn:ontologyIRI");
        versionIRI = vf.createIRI("urn:versionIRI");
        type = vf.createIRI(RDF.TYPE.stringValue());
        versionType = vf.createIRI(OWL.VERSIONIRI.stringValue());
        ontologyObj = vf.createIRI(OWL.ONTOLOGY.stringValue());
    }

    @Test
    public void findFirstOntologyIRIOneTest() {
        Model model = mf.createModel();
        model.add(ontologyIRI, type, vf.createIRI(OWL.ONTOLOGY.stringValue()));

        Optional<IRI> ontologyIRIOpt = OntologyModels.findFirstOntologyIRI(model, vf);
        assertTrue(ontologyIRIOpt.isPresent());
        assertEquals(ontologyIRI, ontologyIRIOpt.get());
    }

    @Test
    public void findFirstOntologyIRIMultipleTest() {
        Model model = mf.createModel();
        model.add(ontologyIRI, type, ontologyObj);
        model.add(vf.createIRI("urn:ontologyIRI2"), type, ontologyObj);
        model.add(vf.createIRI("urn:ontologyIRI3"), type, ontologyObj);

        Optional<IRI> ontologyIRIOpt = OntologyModels.findFirstOntologyIRI(model, vf);
        assertTrue(ontologyIRIOpt.isPresent());
    }

    @Test
    public void findFirstOntologyIRIEmptyModelTest() {
        Model model = mf.createModel();

        Optional<IRI> ontologyIRIOpt = OntologyModels.findFirstOntologyIRI(model, vf);
        assertTrue(!ontologyIRIOpt.isPresent());
    }

    @Test
    public void findFirstVersionIRIOneTest() {
        Model model = mf.createModel();
        model.add(ontologyIRI, type, ontologyObj);
        model.add(ontologyIRI, versionType, versionIRI);

        Optional<IRI> versionIRIOpt = OntologyModels.findFirstVersionIRI(model, ontologyIRI, vf);
        assertTrue(versionIRIOpt.isPresent());
        assertEquals(versionIRI, versionIRIOpt.get());
    }

    @Test
    public void findFirstVersionIRIMultipleTest() {
        Model model = mf.createModel();
        model.add(ontologyIRI, type, ontologyObj);
        model.add(ontologyIRI, versionType, versionIRI);
        model.add(ontologyIRI, versionType, vf.createIRI("urn:versionIRI2"));
        model.add(ontologyIRI, versionType, vf.createIRI("urn:versionIRI3"));

        Optional<IRI> versionIRIOpt = OntologyModels.findFirstVersionIRI(model, ontologyIRI, vf);
        assertTrue(versionIRIOpt.isPresent());
    }

    @Test
    public void findFirstVersionIRIEmptyModelTest() {
        Model model = mf.createModel();

        Optional<IRI> versionIRIOpt = OntologyModels.findFirstVersionIRI(model, ontologyIRI, vf);
        assertTrue(!versionIRIOpt.isPresent());
    }

    @Test
    public void findFirstVersionIRIOntologyIRINotInModelTest() {
        Model model = mf.createModel();
        model.add(ontologyIRI, type, ontologyObj);
        model.add(ontologyIRI, versionType, versionIRI);

        Optional<IRI> versionIRIOpt = OntologyModels.findFirstVersionIRI(model, vf.createIRI("urn:ontologyIRI2"), vf);
        assertTrue(!versionIRIOpt.isPresent());
    }
}
