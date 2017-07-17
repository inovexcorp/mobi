package org.matonto.ontology.core.impl.owlapi;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.IRI;

import java.util.Optional;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class MatOntoOntologyIRIMapperTest {
    private MatOntoOntologyIRIMapper mapper;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private org.matonto.rdf.api.IRI matIRI = vf.createIRI("https://test.com/ontology");
    private IRI owlIRI = IRI.create("https://test.com/ontology");

    @Mock
    private OntologyManager ontologyManager;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        PowerMockito.mockStatic(SimpleOntologyValues.class);
        when(SimpleOntologyValues.matontoIRI(any(IRI.class))).thenReturn(matIRI);

        mapper = new MatOntoOntologyIRIMapper(ontologyManager);
    }

    @Test
    public void getDocumentIRIThatExistsTest() throws Exception {
        // Setup:
        String recordIRI = "https://matonto.org/records/test";
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.of(vf.createIRI(recordIRI)));

        IRI result = mapper.getDocumentIRI(owlIRI);
        assertNotNull(result);
        assertEquals(recordIRI.replace("https:", MatOntoOntologyIRIMapper.protocol), result.getIRIString());
    }

    @Test
    public void getDocumentIRIThatDoesNotExist() throws Exception {
        // Setup:
        when(ontologyManager.getOntologyRecordResource(any(Resource.class))).thenReturn(Optional.empty());

        assertNull(mapper.getDocumentIRI(owlIRI));
    }
}
