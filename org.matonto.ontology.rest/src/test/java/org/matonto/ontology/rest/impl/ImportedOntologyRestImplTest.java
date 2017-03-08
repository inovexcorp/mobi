package org.matonto.ontology.rest.impl;

/*-
 * #%L
 * org.matonto.ontology.rest
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

import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;

import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class ImportedOntologyRestImplTest extends MatontoRestTestNg {
    private ImportedOntologyRestImpl rest;

    @Mock
    private Ontology ontology;

    @Mock
    private OntologyManager ontologyManager;

    private ValueFactory valueFactory;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);

        valueFactory = SimpleValueFactory.getInstance();

        rest = new ImportedOntologyRestImpl();
        rest.setValueFactory(valueFactory);
        rest.setOntologyManager(ontologyManager);

        return new ResourceConfig().register(rest);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(ontologyManager);
    }

    @Test
    public void testGetImportedOntology() {
        when(ontologyManager.createOntology(any(IRI.class))).thenReturn(ontology);
        Response response = target().path("imported-ontologies/" + encode("http://matonto.org/")).request().get();
        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void testGetImportedOntologyWhenErrorIsThrown() {
        when(ontologyManager.createOntology(any(IRI.class))).thenThrow(new MatontoOntologyException("Error"));
        Response response = target().path("imported-ontologies/" + encode("http://matonto.org/")).request().get();
        assertEquals(response.getStatus(), 400);
    }
}
