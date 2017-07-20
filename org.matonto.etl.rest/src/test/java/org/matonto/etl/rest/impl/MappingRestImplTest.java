package org.matonto.etl.rest.impl;

/*-
 * #%L
 * org.matonto.etl.rest
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
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.fail;

import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.versioning.VersioningManager;
import org.matonto.etl.api.delimited.MappingId;
import org.matonto.etl.api.delimited.MappingManager;
import org.matonto.etl.api.delimited.MappingWrapper;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.persistence.utils.impl.SimpleSesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.rio.RDFFormat;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.InputStream;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class MappingRestImplTest extends MatontoRestTestNg {
    private MappingRestImpl rest;
    private static final String MAPPING_IRI = "http://test.org/test";
    private static final String ERROR_IRI = "http://test.org/error";
    private String mappingJsonld;
    private ValueFactory vf;
    private ModelFactory mf;
    private Model fakeModel;

    @Mock
    private MappingManager manager;

    @Mock
    private MappingWrapper mappingWrapper;

    @Mock
    private MappingId mappingId;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private VersioningManager versioningManager;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        fakeModel = mf.createModel();
        fakeModel.add(vf.createIRI(MAPPING_IRI), vf.createIRI("http://test.org/isTest"), vf.createLiteral(true));

        MockitoAnnotations.initMocks(this);

        rest = new MappingRestImpl();
        rest.setManager(manager);
        rest.setVf(vf);
        rest.setTransformer(new SimpleSesameTransformer());
        rest.setEngineManager(engineManager);
        rest.setCatalogManager(catalogManager);
        rest.setVersioningManager(versioningManager);

        mappingJsonld = IOUtils.toString(getClass().getResourceAsStream("/mapping.jsonld"));

        return new ResourceConfig()
            .register(rest)
            .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() throws Exception {
        reset(mappingId, mappingWrapper, manager);

        when(mappingId.getMappingIdentifier()).thenReturn(vf.createIRI(MAPPING_IRI));
        when(mappingWrapper.getModel()).thenReturn(fakeModel);
        when(mappingWrapper.getId()).thenReturn(mappingId);
        when(manager.createMapping(any(InputStream.class), any(RDFFormat.class))).thenReturn(mappingWrapper);
        when(manager.createMapping(anyString())).thenReturn(mappingWrapper);
        when(manager.retrieveMapping(vf.createIRI(ERROR_IRI))).thenReturn(Optional.empty());
        when(manager.retrieveMapping(vf.createIRI(MAPPING_IRI))).thenReturn(Optional.of(mappingWrapper));
        when(manager.createMappingId(any(IRI.class))).thenAnswer(i -> new MappingId() {
            @Override
            public Optional<IRI> getMappingIRI() {
                return null;
            }

            @Override
            public Optional<IRI> getVersionIRI() {
                return null;
            }

            @Override
            public Resource getMappingIdentifier() {
                return vf.createIRI(i.getArguments()[0].toString());
            }
        });
    }

    @Test
    public void uploadEitherFileOrStringTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("mapping.jsonld").build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        fd.field("jsonld", mappingJsonld);
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);

        response = target().path("mappings").request().post(Entity.entity(null, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    /*@Test
    public void uploadFileTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        InputStream content = getClass().getResourceAsStream("/mapping.jsonld");
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("mapping.jsonld").build(),
                content, MediaType.APPLICATION_OCTET_STREAM_TYPE));
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertTrue(response.readEntity(String.class).contains(MAPPING_IRI));
    }

    @Test
    public void uploadStringTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", mappingJsonld);
        Response response = target().path("mappings").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        assertTrue(response.readEntity(String.class).contains(MAPPING_IRI));
    }*/

    /*@Test
    public void getMappingNamesTest() {
        Response response = target().path("mappings").request().get();
        assertEquals(response.getStatus(), 200);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), manager.getMappingRegistry().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMappingsByIdsTest() {
        List<String> ids = Arrays.asList("http://test.org/test1", "http://test.org/test2");
        WebTarget wt = target().path("mappings");
        for (String id : ids) {
            wt = wt.queryParam("ids", id);
        }
        Response response = wt.request().get();
        assertEquals(response.getStatus(), 200);
        ids.forEach(s -> verify(manager).retrieveMapping(vf.createIRI(s)));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), ids.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }


    }

    @Test
    public void getMappingsByIdsWithIncorrectIdTest() {
        List<String> ids = Arrays.asList("http://test.org/test1", "http://test.org/error");
        WebTarget wt = target().path("mappings");
        for (String id : ids) {
            wt = wt.queryParam("ids", id);
        }
        Response response = wt.request().get();
        assertEquals(response.getStatus(), 200);
        ids.forEach(s -> verify(manager).retrieveMapping(vf.createIRI(s)));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), ids.size() - 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }*/

    @Test
    public void getMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request()
                .accept(MediaType.APPLICATION_JSON_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
        try {
            JSONArray.fromObject(response.readEntity(String.class));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_JSON_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void downloadMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(response.getStatus(), 200);
        verify(manager).retrieveMapping(vf.createIRI(MAPPING_IRI));
    }

    @Test
    public void downloadMappingThatDoesNotExistTest() {
        Response response = target().path("mappings/" + encode(ERROR_IRI)).request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        verify(manager).retrieveMapping(vf.createIRI(ERROR_IRI));
        assertEquals(response.getStatus(), 404);
    }

    @Test
    public void deleteMappingTest() {
        Response response = target().path("mappings/" + encode(MAPPING_IRI)).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(manager).deleteMapping(vf.createIRI(MAPPING_IRI));
    }
}
