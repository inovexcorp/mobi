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
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchParams;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.builder.DistributionConfig;
import org.matonto.catalog.api.builder.RecordConfig;
import org.matonto.catalog.api.ontologies.mcat.Catalog;
import org.matonto.catalog.api.ontologies.mcat.CatalogFactory;
import org.matonto.catalog.api.ontologies.mcat.DatasetRecord;
import org.matonto.catalog.api.ontologies.mcat.DatasetRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Distribution;
import org.matonto.catalog.api.ontologies.mcat.DistributionFactory;
import org.matonto.catalog.api.ontologies.mcat.MappingRecord;
import org.matonto.catalog.api.ontologies.mcat.MappingRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Record;
import org.matonto.catalog.api.ontologies.mcat.RecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Tag;
import org.matonto.catalog.api.ontologies.mcat.TagFactory;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecord;
import org.matonto.catalog.api.ontologies.mcat.UnversionedRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.Version;
import org.matonto.catalog.api.ontologies.mcat.VersionFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecord;
import org.matonto.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.matonto.catalog.api.ontologies.mcat.VersionedRecord;
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
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.matonto.rest.util.RestUtils.encode;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class CatalogRestImplTest extends MatontoRestTestNg {
    private CatalogRestImpl rest;
    private CatalogFactory catalogFactory;
    private RecordFactory recordFactory;
    private UnversionedRecordFactory unversionedRecordFactory;
    private VersionedRecordFactory versionedRecordFactory;
    private VersionedRDFRecordFactory versionedRDFRecordFactory;
    private OntologyRecordFactory ontologyRecordFactory;
    private MappingRecordFactory mappingRecordFactory;
    private DatasetRecordFactory datasetRecordFactory;
    private DistributionFactory distributionFactory;
    private VersionFactory versionFactory;
    private TagFactory tagFactory;
    private UserFactory userFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private Catalog localCatalog;
    private Catalog distributedCatalog;
    private Record testRecord;
    private UnversionedRecord testUnversionedRecord;
    private VersionedRecord testVersionedRecord;
    private VersionedRDFRecord testVersionedRDFRecord;
    private OntologyRecord testOntologyRecord;
    private MappingRecord testMappingRecord;
    private DatasetRecord testDatasetRecord;
    private Distribution testDistribution;
    private Version testVersion;
    private Tag testTag;
    private User user;
    private static final String ERROR_IRI = "http://matonto.org/error";
    private static final String LOCAL_IRI = "http://matonto.org/catalogs/local";
    private static final String DISTRIBUTED_IRI = "http://matonto.org/catalogs/distributed";
    private static final String RECORD_IRI = "http://matonto.org/records/test";
    private static final String DISTRIBUTION_IRI = "http://matonto.org/distributions/test";
    private static final String VERSION_IRI = "http://matonto.org/versions/test";
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
        ontologyRecordFactory = new OntologyRecordFactory();
        mappingRecordFactory = new MappingRecordFactory();
        datasetRecordFactory = new DatasetRecordFactory();
        distributionFactory = new DistributionFactory();
        versionFactory = new VersionFactory();
        tagFactory = new TagFactory();
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
        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        mappingRecordFactory.setModelFactory(mf);
        mappingRecordFactory.setValueFactory(vf);
        mappingRecordFactory.setValueConverterRegistry(vcr);
        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        distributionFactory.setModelFactory(mf);
        distributionFactory.setValueFactory(vf);
        distributionFactory.setValueConverterRegistry(vcr);
        versionFactory.setModelFactory(mf);
        versionFactory.setValueFactory(vf);
        versionFactory.setValueConverterRegistry(vcr);
        tagFactory.setModelFactory(mf);
        tagFactory.setValueFactory(vf);
        tagFactory.setValueConverterRegistry(vcr);
        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(catalogFactory);
        vcr.registerValueConverter(recordFactory);
        vcr.registerValueConverter(unversionedRecordFactory);
        vcr.registerValueConverter(versionedRecordFactory);
        vcr.registerValueConverter(versionedRDFRecordFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(mappingRecordFactory);
        vcr.registerValueConverter(datasetRecordFactory);
        vcr.registerValueConverter(distributionFactory);
        vcr.registerValueConverter(versionFactory);
        vcr.registerValueConverter(tagFactory);
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
        testDistribution = distributionFactory.createNew(vf.createIRI(DISTRIBUTION_IRI));
        testDistribution.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        testVersion.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersion.setVersionedDistribution(Collections.singleton(testDistribution));
        testTag = tagFactory.createNew(vf.createIRI(VERSION_IRI));
        testTag.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testRecord = recordFactory.createNew(vf.createIRI(RECORD_IRI));
        testRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testRecord.setProperty(vf.createLiteral("ID"), vf.createIRI(DCTERMS.IDENTIFIER.stringValue()));
        testUnversionedRecord = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testUnversionedRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testUnversionedRecord.setProperty(vf.createLiteral("ID"), vf.createIRI(DCTERMS.IDENTIFIER.stringValue()));
        testUnversionedRecord.setUnversionedDistribution(Collections.singleton(testDistribution));
        testVersionedRecord = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testVersionedRecord.setProperty(vf.createLiteral("Title"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        testVersionedRecord.setProperty(vf.createLiteral("ID"), vf.createIRI(DCTERMS.IDENTIFIER.stringValue()));
        testVersionedRecord.setLatestVersion(testVersion);
        testVersionedRecord.setVersion(Collections.singleton(testVersion));
        testVersionedRDFRecord = versionedRDFRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testOntologyRecord = ontologyRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testMappingRecord = mappingRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        testDatasetRecord = datasetRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        user = userFactory.createNew(vf.createIRI(USER_IRI));

        MockitoAnnotations.initMocks(this);

        rest = new CatalogRestImpl();
        rest.setFactory(vf);
        rest.setEngineManager(engineManager);
        rest.setTransformer(new SimpleSesameTransformer());
        rest.setCatalogManager(catalogManager);
        rest.setDistributionFactory(distributionFactory);
        rest.addVersionFactory(versionFactory);
        rest.addVersionFactory(tagFactory);
        rest.addRecordFactory(recordFactory);
        rest.addRecordFactory(unversionedRecordFactory);
        rest.addRecordFactory(versionedRecordFactory);
        rest.addRecordFactory(versionedRDFRecordFactory);
        rest.addRecordFactory(ontologyRecordFactory);
        rest.addRecordFactory(mappingRecordFactory);
        rest.addRecordFactory(datasetRecordFactory);

        return new ResourceConfig()
                .register(rest)
                .register(UsernameTestFilter.class)
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
        when(catalogManager.getRecordIds(any(Resource.class))).thenReturn(Collections.singleton(testRecord.getResource()));
        when(catalogManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class))).thenReturn(results);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory))).thenReturn(Optional.of(testRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory))).thenReturn(Optional.of(testUnversionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRecordFactory))).thenReturn(Optional.of(testVersionedRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRDFRecordFactory))).thenReturn(Optional.of(testVersionedRDFRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(ontologyRecordFactory))).thenReturn(Optional.of(testOntologyRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(mappingRecordFactory))).thenReturn(Optional.of(testMappingRecord));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(datasetRecordFactory))).thenReturn(Optional.of(testDatasetRecord));
        when(catalogManager.createRecord(any(RecordConfig.class), eq(recordFactory))).thenReturn(testRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(unversionedRecordFactory))).thenReturn(testUnversionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRecordFactory))).thenReturn(testVersionedRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(versionedRDFRecordFactory))).thenReturn(testVersionedRDFRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(ontologyRecordFactory))).thenReturn(testOntologyRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(mappingRecordFactory))).thenReturn(testMappingRecord);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(datasetRecordFactory))).thenReturn(testDatasetRecord);
        when(catalogManager.getDistribution(any(Resource.class))).thenReturn(Optional.of(testDistribution));
        when(catalogManager.createDistribution(any(DistributionConfig.class))).thenReturn(testDistribution);
        when(catalogManager.getVersion(any(Resource.class), eq(versionFactory))).thenReturn(Optional.of(testVersion));
        when(catalogManager.getVersion(any(Resource.class), eq(tagFactory))).thenReturn(Optional.of(testTag));
        when(catalogManager.createVersion(anyString(), anyString(), eq(versionFactory))).thenReturn(testVersion);
        when(catalogManager.createVersion(anyString(), anyString(), eq(tagFactory))).thenReturn(testTag);
        when(engineManager.retrieveUser(anyString(), anyString())).thenReturn(Optional.of(user));
    }

    @Test
    public void getCatalogsWithoutTypeTest() {
        Response response = target().path("catalogs").request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getLocalCatalog();
        verify(catalogManager).getDistributedCatalog();
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
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 200);
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
        assertEquals(response.getStatus(), 400);
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
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + results.getTotalSize());
        assertEquals(response.getLinks().size(), 0);
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
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).findRecord(eq(vf.createIRI(LOCAL_IRI)), any(PaginatedSearchParams.class));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
                assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records"));
                assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
            });
    }

    @Test
    public void getRecordsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordTest() {
        testCreateRecordByType(recordFactory);
    }

    @Test
    public void createUnversionedRecordTest() {
        testCreateRecordByType(unversionedRecordFactory);
    }

    @Test
    public void createVersionedRecordTest() {
        testCreateRecordByType(versionedRecordFactory);
    }

    @Test
    public void createVersionedRDFRecordTest() {
        testCreateRecordByType(versionedRDFRecordFactory);
    }

    @Test
    public void createOntologyRecordTest() {
        testCreateRecordByType(ontologyRecordFactory);
    }

    @Test
    public void createMappingRecordTest() {
        testCreateRecordByType(mappingRecordFactory);
    }

    @Test
    public void createDatasetRecordTest() {
        testCreateRecordByType(datasetRecordFactory);
    }

    @Test
    public void createRecordWithoutTypeTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Record.TYPE);
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithoutIdentifierTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Record.TYPE);
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createRecordWithInvalidType() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");
        fd.field("identifier", "Id");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), recordFactory);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject record = result.getJSONObject(0);
            assertTrue(record.containsKey("@id"));
            assertEquals(record.getString("@id"), RECORD_IRI);
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
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeRecordTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeRecordWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeRecord(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    /*@Test
    public void updateRecordTest() {
        //Setup:
        JSONObject record = new JSONObject().element("@id", RECORD_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.entity(record.toString(), MediaType.APPLICATION_JSON));
        assertEquals(200, response.getStatus());
        verify(catalogManager).updateRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class));
    }*/

    @Test
    public void updateRecordWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateRecordThatDoesNotMatchTest() {
        //Setup:
        JSONObject record = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI))
                .request().put(Entity.json(record.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        verify(catalogManager, atLeastOnce()).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUnversionedDistributionsWithLinksTest() {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        record.setUnversionedDistribution(distributions);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(unversionedRecordFactory))).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        distributions.forEach(distribution -> verify(catalogManager).getDistribution(distribution.getResource()));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getUnversionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionsFromRecordThatDoesNotExist() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUnversionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), DISTRIBUTION_IRI);
        verify(catalogManager).createDistribution(any(DistributionConfig.class));
        verify(catalogManager).addDistributionToUnversionedRecord(any(Distribution.class), eq(vf.createIRI(RECORD_IRI)));
    }

    @Test
    public void createUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory)).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createUnversionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory);
        verify(catalogManager).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject distribution = result.getJSONObject(0);
            assertTrue(distribution.containsKey("@id"));
            assertEquals(distribution.getString("@id"), DISTRIBUTION_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionForIncorrectRecordTest() {
        // Setup:
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getUnversionedDistributionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getDistribution(vf.createIRI(ERROR_IRI))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeUnversionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeDistributionFromUnversionedRecord(vf.createIRI(DISTRIBUTION_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeUnversionedDistributionFromIncorrectCatalogTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeUnversionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeDistributionFromUnversionedRecord(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    /*@Test
    public void updateUnversionedDistributionTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateDistribution(any(Distribution.class));
    }*/

    @Test
    public void updateUnversionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), unversionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionForIncorrectRecordTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        UnversionedRecord record = unversionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), unversionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateUnversionedDistributionThatDoesNotMatchTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getLatestVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject distribution = result.getJSONObject(0);
            assertTrue(distribution.containsKey("@id"));
            assertEquals(distribution.getString("@id"), VERSION_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLatestVersionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getLatestVersionForRecordWithoutOneTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getLatestVersionThatDoesNotExist() {
        // Setup:
        when(catalogManager.getVersion(any(Resource.class), eq(versionFactory))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/latest")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager, atLeastOnce()).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionsWithLinksTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        Set<Version> versions = IntStream.range(1, 6)
                .mapToObj(i -> VERSION_IRI + i)
                .map(s -> versionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        record.setVersion(versions);
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(versionedRecordFactory))).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        versions.forEach(version -> verify(catalogManager).getVersion(version.getResource(), versionFactory));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionsFromRecordThatDoesNotExist() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionTest() {
        testCreateVersionByType(versionFactory);
    }

    @Test
    public void createTagTest() {
        testCreateVersionByType(tagFactory);
    }

    @Test
    public void createVersionWithoutTitleTest() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Version.TYPE);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionWithInvalidType() {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", Thing.TYPE);
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject distribution = result.getJSONObject(0);
            assertTrue(distribution.containsKey("@id"));
            assertEquals(distribution.getString("@id"), VERSION_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(ERROR_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeVersion(vf.createIRI(VERSION_IRI), vf.createIRI(RECORD_IRI));
    }

    @Test
    public void removeVersionFromIncorrectCatalogTest() {
        // Setup:
        when(catalogManager.getRecordIds(vf.createIRI(ERROR_IRI))).thenReturn(Collections.emptySet());

        Response response = target().path("catalogs/" + encode(ERROR_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeVersion(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    /*@Test
    public void updateVersionTest() {
        //Setup:
        JSONObject version = new JSONObject().element("@id", VERSION_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateVersion(any(Version.class));
    }*/

    @Test
    public void updateVersionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionThatDoesNotMatchTest() {
        //Setup:
        JSONObject version = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI))
                .request().put(Entity.json(version.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 0)
                .queryParam("limit", 10)
                .request().get();
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        verify(catalogManager, atLeastOnce()).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "1");
        assertEquals(response.getLinks().size(), 0);
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionedDistributionsWithLinksTest() {
        // Setup:
        Set<Distribution> distributions = IntStream.range(1, 6)
                .mapToObj(i -> DISTRIBUTION_IRI + i)
                .map(s -> distributionFactory.createNew(vf.createIRI(s)))
                .collect(Collectors.toSet());
        testVersion.setVersionedDistribution(distributions);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue())
                .queryParam("offset", 1)
                .queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        distributions.forEach(distribution -> verify(catalogManager).getDistribution(distribution.getResource()));
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions"));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getVersionedDistributionsWithInvalidSortIriTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.DESCRIPTION.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsFromRecordThatDoesNotExist() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionsFromVersionThatDoesNotExist() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(LOCAL_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(ERROR_IRI) + "/distributions")
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");
        fd.field("description", "Description");
        fd.field("format", "application/json");
        fd.field("accessURL", "http://example.com/Example");
        fd.field("downloadURL", "http://example.com/Example");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), DISTRIBUTION_IRI);
        verify(catalogManager).createDistribution(any(DistributionConfig.class));
        verify(catalogManager).addDistributionToVersion(any(Distribution.class), eq(vf.createIRI(VERSION_IRI)));
    }

    @Test
    public void createVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Title");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createVersionedDistributionWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory);
        verify(catalogManager).getVersion(vf.createIRI(VERSION_IRI), versionFactory);
        verify(catalogManager).getDistribution(vf.createIRI(DISTRIBUTION_IRI));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
            JSONObject distribution = result.getJSONObject(0);
            assertTrue(distribution.containsKey("@id"));
            assertEquals(distribution.getString("@id"), DISTRIBUTION_IRI);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForVersionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getVersion(vf.createIRI(ERROR_IRI), versionFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(ERROR_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionForIncorrectVersionTest() {
        // Setup:
        Version version = versionFactory.createNew(vf.createIRI(VERSION_IRI));
        when(catalogManager.getVersion(vf.createIRI(VERSION_IRI), versionFactory)).thenReturn(Optional.of(version));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getVersionedDistributionThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getDistribution(vf.createIRI(ERROR_IRI))).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(ERROR_IRI))
                .request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionedDistributionTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).removeDistributionFromVersion(vf.createIRI(DISTRIBUTION_IRI), vf.createIRI(VERSION_IRI));
    }

    @Test
    public void removeVersionedDistributionFromRecordThatDoesNotExistTest() {
        // Setup:
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionedDistributionFromIncorrectRecordTest() {
        // Setup:
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void removeVersionedDistributionWithErrorTest() {
        // Setup:
        doThrow(new MatOntoException("Error")).when(catalogManager).removeDistributionFromVersion(any(Resource.class), any(Resource.class));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().delete();
        assertEquals(response.getStatus(), 400);
    }

    /*@Test
    public void updateVersionedDistributionTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 200);
        verify(catalogManager).updateDistribution(any(Distribution.class));
    }*/

    @Test
    public void updateVersionedDistributionForRecordThatDoesNotExistTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(ERROR_IRI), versionedRecordFactory)).thenReturn(Optional.empty());

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(ERROR_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionForIncorrectRecordTest() {
        // Setup:
        JSONObject distribution = new JSONObject().element("@id", DISTRIBUTION_IRI);
        VersionedRecord record = versionedRecordFactory.createNew(vf.createIRI(RECORD_IRI));
        when(catalogManager.getRecord(vf.createIRI(LOCAL_IRI), vf.createIRI(RECORD_IRI), versionedRecordFactory)).thenReturn(Optional.of(record));

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionWithInvalidJsonTest() {
        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json("['test': true]"));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateVersionedDistributionThatDoesNotMatchTest() {
        //Setup:
        JSONObject distribution = new JSONObject().element("@id", ERROR_IRI);

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions/" + encode(VERSION_IRI) + "/distributions/" + encode(DISTRIBUTION_IRI))
                .request().put(Entity.json(distribution.toString()));
        assertEquals(response.getStatus(), 400);
    }

    private <T extends Record> void testCreateRecordByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("identifier", "Id");
        fd.field("description", "Description");
        fd.field("keywords", "keyword");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), RECORD_IRI);
        verify(catalogManager).createRecord(any(RecordConfig.class), eq(ormFactory));
        verify(catalogManager).addRecord(eq(vf.createIRI(LOCAL_IRI)), any(Record.class));
    }

    private <T extends Version> void testCreateVersionByType(OrmFactory<T> ormFactory) {
        //Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("type", ormFactory.getTypeIRI().stringValue());
        fd.field("title", "Title");
        fd.field("description", "Description");

        Response response = target().path("catalogs/" + encode(LOCAL_IRI) + "/records/" + encode(RECORD_IRI) + "/versions")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        assertEquals(response.readEntity(String.class), VERSION_IRI);
        verify(catalogManager).createVersion(anyString(), anyString(), eq(ormFactory));
        verify(catalogManager).addVersion(any(Version.class), eq(vf.createIRI(RECORD_IRI)));
    }
}
