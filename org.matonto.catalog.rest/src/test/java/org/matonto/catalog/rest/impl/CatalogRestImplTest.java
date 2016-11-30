package org.matonto.catalog.rest.impl;

/*-
 * #%L
 * org.matonto.catalog.rest
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

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.junit.Assert;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecordFactory;
import org.matonto.exception.MatOntoException;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.utils.impl.SimpleSesameTransformer;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.Assert.assertEquals;

public class CatalogRestImplTest extends MatontoRestTestNg {
    private CatalogRestImpl rest;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private UserFactory userFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private Catalog localCatalog;
    private Catalog distributedCatalog;
    private Record testRecord;
    private User user;
    private static final String ERROR_IRI = "http://matonto.org/error";
    private static final String LOCAL_IRI = "http://matonto.org/catalogs/local";
    private static final String DISTRIBUTED_IRI = "http://matonto.org/catalogs/distributed";
    private static final String RECORD_IRI = "http://matonto.org/records/test";
    private static final String USER_IRI = "http://matonto.org/users/tester";

    @Mock
    CatalogManager catalogManager;

    @Mock
    EngineManager engineManager;

    @Mock
    PaginatedSearchResults<Record> results;

    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        catalogFactory = new CatalogFactory();
        recordFactory = new RecordFactory();
        unversionedRecordFactory = new UnversionedRecordFactory();
        versionedRecordFactory = new VersionedRecordFactory();
        versionedRDFRecordFactory = new VersionedRDFRecordFactory();
        userFactory = new UserFactory();
        catalogFactory.setModelFactory(mf);
        catalogFactory.setValueFactory(vf);
        catalogFactory.setValueConverterRegistry(vcr);
        recordFactory.setModelFactory(mf);
        recordFactory.setValueFactory(vf);
        recordFactory.setValueConverterRegistry(vcr);
        unversionedRecordFactory.setModelFactory(mf);
        unversionedRecordFactory.setValueFactory(vf);
        unversionedRecordFactory.setValueConverterRegistry(vcr);
        versionedRecordFactory.setModelFactory(mf);
        versionedRecordFactory.setValueFactory(vf);
        versionedRecordFactory.setValueConverterRegistry(vcr);
        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(recordFactory);
        vcr.registerValueConverter(unversionedRecordFactory);
        vcr.registerValueConverter(versionedRecordFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        localCatalog = catalogFactory.createNew(vf.createIRI(LOCAL_IRI));
        distributedCatalog = catalogFactory.createNew(vf.createIRI(DISTRIBUTED_IRI));
        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        user = userFactory.createNew(vf.createIRI(USER_IRI));

        MockitoAnnotations.initMocks(this);

        rest = new CatalogRestImpl();
        rest.setFactory(vf);
        rest.setEngineManager(engineManager);
        rest.setSesameTransformer(new SimpleSesameTransformer());
        rest.setCatalogManager(catalogManager);
        rest.addRecordFactory(recordFactory);
        rest.addRecordFactory(unversionedRecordFactory);
        rest.addRecordFactory(versionedRecordFactory);
        rest.addRecordFactory(versionedRDFRecordFactory);

        return new ResourceConfig()
                .register(rest)
                .register(MultiPartFeature.class);
    }

    @Override
    protected void configureClient(ClientConfig config) {
        config.register(MultiPartFeature.class);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(catalogManager, engineManager, results);
        when(results.getPage()).thenReturn(Collections.singletonList(testRecord));
        when(results.getPageNumber()).thenReturn(0);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(50);
        when(catalogManager.getLocalCatalog()).thenReturn(localCatalog);
        when(catalogManager.getDistributedCatalog()).thenReturn(distributedCatalog);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), any(OrmFactory.class)))
                .thenReturn(Optional.of(testRecord));
        when(catalogManager.createRecord(any(RecordConfig.class), any(OrmFactory.class))).thenReturn(testRecord);
        when(catalogManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class))).thenReturn(results);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
    }

    @Test
    public void getCatalogsWithoutTypeTest() {
        Response response = target().path("catalogs").request().get();
        Assert.assertEquals(200, response.getStatus());
        verify(catalogManager, times(1)).getLocalCatalog();
        verify(catalogManager, times(1)).getDistributedCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 2);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "local").request().get();
        Assert.assertEquals(200, response.getStatus());
        verify(catalogManager, atLeastOnce()).getLocalCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONArray(0).getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), LOCAL_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("catalogs").queryParam("type", "distributed").request().get();
        Assert.assertEquals(200, response.getStatus());
        verify(catalogManager, atLeastOnce()).getDistributedCatalog();
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONArray(0).getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), DISTRIBUTED_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogsWithBadTypeTest() {
        Response response = target().path("catalogs").queryParam("type", "error").request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 0);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI)).request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), LOCAL_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }

        response = target().path("catalogs/" + encode(DISTRIBUTED_IRI)).request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), DISTRIBUTED_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getCatalogThatDoesNotExistTest() {
        Response response = target().path("catalogs/" + encode(ERROR_IRI)).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("type", Record.TYPE)
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("searchText", "test").request().get();
        assertEquals(200, response.getStatus());
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + results.getTotalSize());
        assertFalse(headers.containsKey("Link"));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), results.getPage().size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordsWithLinksTest() {
        // Setup:
        when(results.getPageNumber()).thenReturn(1);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(200, response.getStatus());
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertTrue(headers.containsKey("Link"));
        List<Object> links = headers.get("Link");
        assertEquals(links.size(), 2);
        assertTrue(links.get(0).toString().contains("next") || links.get(0).toString().contains("prev"));
        assertTrue(links.get(1).toString().contains("next") || links.get(1).toString().contains("prev"));
    }

    @Test
    public void getRecordsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createRecordTest() {
        //Setup:
        JSONObject record = new JSONObject();
        record.put("@type", new JSONArray().element(Record.TYPE));
        record.put(DCTERMS.TITLE.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Title")));
        record.put(DCTERMS.IDENTIFIER.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Id")));
        record.put(DCTERMS.DESCRIPTION.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Description")));
        record.put(Record.keyword_IRI, new JSONArray().element(new JSONObject().element("@value", "keyword")));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(200, response.getStatus());
        assertEquals(response.readEntity(String.class), RECORD_IRI);
        verify(catalogManager, times(1)).createRecord(any(RecordConfig.class), eq(recordFactory));
    }

    @Test
    public void createRecordWithoutTypeTest() {
        //Setup:
        JSONObject record = new JSONObject();
        record.put(DCTERMS.TITLE.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Title")));
        record.put(DCTERMS.IDENTIFIER.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Id")));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createRecordWithoutTitleTest() {
        //Setup:
        JSONObject record = new JSONObject();
        record.put("@type", new JSONArray().element(Record.TYPE));
        record.put(DCTERMS.IDENTIFIER.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Id")));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createRecordWithoutIdentifierTest() {
        //Setup:
        JSONObject record = new JSONObject();
        record.put("@type", new JSONArray().element(Record.TYPE));
        record.put(DCTERMS.TITLE.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Title")));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void createRecordWithInvalidType() {
        //Setup:
        JSONObject record = new JSONObject();
        record.put("@type", new JSONArray().element(Thing.TYPE));
        record.put(DCTERMS.TITLE.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Title")));
        record.put(DCTERMS.IDENTIFIER.stringValue(), new JSONArray().element(new JSONObject().element("@value", "Id")));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(400, response.getStatus());
    }

    @Test
    public void getRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().get();
        Assert.assertEquals(200, response.getStatus());
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject catalog = result.getJSONObject(0);
            assertTrue(catalog.containsKey("@id"));
            assertEquals(catalog.getString("@id"), RECORD_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), any(OrmFactory.class)))
                .thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(400, response.getStatus());
    }

    @Test
    public void removeRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(200, response.getStatus());
    }

    @Test
    public void removeRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeRecord(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(400, response.getStatus());
    }

    private String encode(String str) {
        String encoded = null;
        try {
            encoded = URLEncoder.encode(str, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return encoded;
    }
}
