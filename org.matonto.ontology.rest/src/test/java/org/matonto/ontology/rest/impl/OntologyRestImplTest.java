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

import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactoryService;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.Assert;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.when;

public class OntologyRestImplTest extends MatontoRestTestNg {
    private OntologyRestImpl rest;

    @Mock
    OntologyManager ontologyManager;

    @Mock
    CatalogManager catalogManager;

    @Mock
    OntologyRecordFactory ontologyRecordFactory;

    @Mock
    InProgressCommitFactory inProgressCommitFactory;

    @Mock
    EngineManager engineManager;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);
        ModelFactory modelFactory = new LinkedHashModelFactoryService();

        rest = new OntologyRestImpl();
        rest.setModelFactory(modelFactory);
        rest.setOntologyManager(ontologyManager);
        rest.setCatalogManager(catalogManager);
        rest.setOntologyRecordFactory(ontologyRecordFactory);
        rest.setInProgressCommitFactory(inProgressCommitFactory);
        rest.setEngineManager(engineManager);

        /*ValueFactory valueFactory = SimpleValueFactory.getInstance();
        UserFactory userFactory = new UserFactory();
        String userNamespace = "http://matonto.org/users/";

        when(engineManager.retrieveUser(anyString(), anyString())).thenAnswer(s -> userFactory
                .createNew(valueFactory.createIRI(userNamespace + s.getArguments()[1].toString())));*/

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @Test
    public void testUploadFile() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("file", getClass().getResourceAsStream("/test-ontology.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE);
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("keywords", "keyword1,keyword2");

        WebTarget target = target().path("ontologies");
        System.out.println("target: " + target.toString());

        Response response = target().path("ontologies").request().post(Entity.entity(fd,
                MediaType.MULTIPART_FORM_DATA));

        Assert.assertEquals(response.getStatus(), 200);
    }
}
