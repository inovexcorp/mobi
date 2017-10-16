package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.io.IRIDocumentSource;
import org.semanticweb.owlapi.io.OWLOntologyDocumentSource;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDocumentFormat;
import org.semanticweb.owlapi.model.OWLImportsDeclaration;
import org.semanticweb.owlapi.model.OWLOntology;
import org.semanticweb.owlapi.model.OWLOntologyFactory;
import org.semanticweb.owlapi.model.OWLOntologyID;
import org.semanticweb.owlapi.model.OWLOntologyLoaderConfiguration;
import org.semanticweb.owlapi.model.OWLOntologyManager;
import org.semanticweb.owlapi.model.OWLOntologyWriterConfiguration;
import org.semanticweb.owlapi.model.OntologyConfigurator;
import org.semanticweb.owlapi.model.parameters.Imports;

import java.util.Optional;
import java.util.stream.Stream;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class MobiOntologyFactoryTest {
    private MobiOntologyFactory factory;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private com.mobi.rdf.api.IRI matIRI = vf.createIRI("https://test.com/ontology");
    private IRI owlIRI = IRI.create("https://test.com/ontology");
    private IRI owlProtocolIRI = IRI.create(MobiOntologyIRIMapper.protocol + "//test.com/ontology");
    private OWLOntologyDocumentSource source = new IRIDocumentSource(owlIRI);
    private OWLOntologyDocumentSource protocolSource = new IRIDocumentSource(owlProtocolIRI);

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private OWLOntologyManager owlOntologyManager;

    @Mock
    private OWLOntologyFactory ontologyFactory;

    @Mock
    private Ontology ontology;

    @Mock
    private OWLOntology owlOntology;

    @Mock
    private OWLOntologyFactory.OWLOntologyCreationHandler handler;

    @Mock
    private OWLOntologyLoaderConfiguration configuration;

    @Mock
    private OWLImportsDeclaration importsDeclaration;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private SesameTransformer sesameTransformer;

    @Mock
    private OntologyConfigurator ontologyConfigurator;

    @Mock
    private OWLOntologyWriterConfiguration owlOntologyWriterConfiguration;

    @Mock
    private OWLOntologyID owlOntologyID;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        PowerMockito.mockStatic(SimpleOntologyValues.class);

        when(SimpleOntologyValues.owlapiOntology(any(Ontology.class))).thenReturn(owlOntology);
        when(SimpleOntologyValues.mobiIRI(any(IRI.class))).thenReturn(matIRI);

        when(ontologyFactory.createOWLOntology(any(OWLOntologyManager.class), any(OWLOntologyID.class), any(IRI.class), any(OWLOntologyFactory.OWLOntologyCreationHandler.class))).thenReturn(owlOntology);
        when(ontologyManager.retrieveOntology(any(Resource.class))).thenReturn(Optional.of(ontology));
        when(ontologyManager.getOntologyModel(any(Resource.class))).thenReturn(mf.createModel());
        when(owlOntologyManager.getOntology(any(IRI.class))).thenReturn(owlOntology);
        when(owlOntologyManager.getOntologyConfigurator()).thenReturn(ontologyConfigurator);
        when(ontologyConfigurator.buildWriterConfiguration()).thenReturn(owlOntologyWriterConfiguration);
        when(owlOntologyWriterConfiguration.shouldRemapAllAnonymousIndividualsIds()).thenReturn(false);
        when(owlOntology.importsDeclarations()).thenReturn(Stream.of(importsDeclaration));
        when(owlOntology.getOWLOntologyManager()).thenReturn(owlOntologyManager);
        when(owlOntology.annotationPropertiesInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.dataPropertiesInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.objectPropertiesInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.classesInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.datatypesInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.individualsInSignature(any(Imports.class))).thenReturn(Stream.empty());
        when(owlOntology.getOntologyID()).thenReturn(owlOntologyID);
        when(owlOntologyID.getOntologyIRI()).thenReturn(Optional.empty());
        when(owlOntologyID.isAnonymous()).thenReturn(true);
        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontology.asModel(any(ModelFactory.class))).thenReturn(mf.createModel());
        when(ontologyId.getOntologyIdentifier()).thenReturn(vf.createIRI("https://inovexcorp.com/mobi/test-ontology"));
        when(sesameTransformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));

        factory = new MobiOntologyFactory(ontologyManager, ontologyFactory, sesameTransformer);
    }

    @Test
    public void canCreateFromDocumentIRITest() throws Exception {
        assertFalse(factory.canCreateFromDocumentIRI(owlIRI));
        assertTrue(factory.canCreateFromDocumentIRI(owlProtocolIRI));
    }

    @Test
    public void canAttemptLoadingTest() throws Exception {
        assertFalse(factory.canAttemptLoading(source));
        assertTrue(factory.canAttemptLoading(protocolSource));
    }

    @Test
    public void createOWLOntologyTest() throws Exception {
        OWLOntologyID id = new OWLOntologyID();
        assertEquals(owlOntology, factory.createOWLOntology(owlOntologyManager, id, owlProtocolIRI, handler));
        verify(ontologyFactory).createOWLOntology(owlOntologyManager, id, owlProtocolIRI, handler);
    }

    @Test
    public void loadOWLOntologyTest() throws Exception {
        assertEquals(owlOntology, factory.loadOWLOntology(owlOntologyManager, protocolSource, handler, configuration));
        verify(ontologyManager).getOntologyModel(matIRI);
        verify(handler).setOntologyFormat(any(OWLOntology.class), any(OWLDocumentFormat.class));
        verify(owlOntologyManager).removeOntology(any(OWLOntology.class));
        verify(ontologyFactory, times(2)).createOWLOntology(eq(owlOntologyManager), any(OWLOntologyID.class), eq(owlProtocolIRI), eq(handler));
    }
}
