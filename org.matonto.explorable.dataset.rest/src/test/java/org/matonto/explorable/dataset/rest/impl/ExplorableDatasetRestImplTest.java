package org.matonto.explorable.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.explorable.dataset.rest
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

import static org.matonto.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.OntologyIdentifier;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.persistence.utils.api.BNodeService;
import org.matonto.persistence.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
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
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.InputStream;
import java.util.Collections;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.Response;

public class ExplorableDatasetRestImplTest extends MatontoRestTestNg {
    private ExplorableDatasetRestImpl rest;

    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private DatasetRecordFactory datasetRecordFactory;
    private OntologyRecordFactory ontologyRecordFactory;

    private Repository repository;
    private RepositoryConnection conn;
    private Resource recordId;
    private DatasetRecord record;
    private String commitId;
    private Model compiledModel;
    private IRI classId;
    private IRI dataPropertyId;
    private IRI objectPropertyId;
    private IRI ontologyRecordId;
    private IRI catalogId;

    private static Set<DataProperty> dataProperties = new HashSet<>();
    private static Set<ObjectProperty> objectProperties = new HashSet<>();
    private static Set<Resource> range = new HashSet<>();

    private static final String RECORD_ID_STR = "https://matonto.org/records#90075db8-e0b1-45b8-9f9e-1eda496ebcc5";
    private static final String CLASS_ID_STR = "http://matonto.org/ontologies/uhtc/Material";
    private static final String CLASS_ID_STR_2 = "http://matonto.org/ontologies/uhtc/CrystalStructure";
    private static final String INSTANCE_ID_STR = "http://matonto.org/data/uhtc/material/c1855eb9-89dc-445e-8f02-22c1162c0844";
    private static final String MISSING_ID = "http://matonto.org/data/missing";
    private static final String LARGE_ID = "http://matonto.org/data/large";
    private static final String REIFIED_ID = "http://matonto.org/data/uhtc/crystalstructure/Polymorphic";
    private static final String DATA_PROPERTY_ID = "http://matonto.org/data-property";
    private static final String OBJECT_PROPERTY_ID = "http://matonto.org/object-property";
    private static final String NEW_INSTANCE_ID_STR = "http://matonto.org/new-instance";
    private static final String ONTOLOGY_RECORD_ID_STR = "https://matonto.org/records/0";
    private static final String CATALOG_ID_STR = "https://matonto.org/catalog-local";

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private DatasetConnection datasetConnection;

    @Mock
    private SesameTransformer sesameTransformer;

    @Mock
    private Ontology ontology;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private DataProperty dataProperty;

    @Mock
    private ObjectProperty objectProperty;

    @Mock
    private BNodeService bNodeService;

    @Override
    protected Application configureApp() throws Exception {
        MockitoAnnotations.initMocks(this);

        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();

        vcr = new DefaultValueConverterRegistry();
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        datasetRecordFactory = new DatasetRecordFactory();
        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(datasetRecordFactory);

        ontologyRecordFactory = new OntologyRecordFactory();
        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(ontologyRecordFactory);

        recordId = vf.createIRI(RECORD_ID_STR);
        record = datasetRecordFactory.createNew(recordId);

        String branchId = "https://matonto.org/branches/0";
        commitId = "https://matonto.org/commits/0";
        OntologyIdentifier identifier = new OntologyIdentifier(ONTOLOGY_RECORD_ID_STR, branchId, commitId, vf, mf);
        record.setOntology(Stream.of(identifier.getNode()).collect(Collectors.toSet()));
        record.getModel().addAll(identifier.getStatements());

        repository = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repository.initialize();

        InputStream testData = getClass().getResourceAsStream("/test-dataset-data.trig");
        conn = repository.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));

        InputStream compiledData = getClass().getResourceAsStream("/compiled-resource.trig");
        compiledModel = Values.matontoModel(Rio.parse(compiledData, "", RDFFormat.TRIG));

        classId = vf.createIRI(CLASS_ID_STR);
        dataPropertyId = vf.createIRI(DATA_PROPERTY_ID);
        objectPropertyId = vf.createIRI(OBJECT_PROPERTY_ID);
        ontologyRecordId = vf.createIRI(ONTOLOGY_RECORD_ID_STR);
        catalogId = vf.createIRI(CATALOG_ID_STR);

        range.add(vf.createIRI(MISSING_ID));
        dataProperties.add(dataProperty);
        objectProperties.add(objectProperty);

        when(dataProperty.getIRI()).thenReturn(dataPropertyId);
        when(objectProperty.getIRI()).thenReturn(objectPropertyId);
        when(ontologyManager.retrieveOntology(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(ontology));

        rest = new ExplorableDatasetRestImpl();
        rest.setCatalogManager(catalogManager);
        rest.setDatasetManager(datasetManager);
        rest.setFactory(vf);
        rest.setSesameTransformer(sesameTransformer);
        rest.setModelFactory(mf);
        rest.setOntologyManager(ontologyManager);
        rest.setOntologyRecordFactory(ontologyRecordFactory);
        rest.setBNodeService(bNodeService);

        return new ResourceConfig().register(rest);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(datasetManager, catalogManager, sesameTransformer, datasetConnection, ontology, bNodeService);
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.of(record));
        when(datasetManager.getConnection(recordId)).thenReturn(datasetConnection);
        when(catalogManager.getLocalCatalogIRI()).thenReturn(catalogId);
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(compiledModel);
        when(catalogManager.getRecord(catalogId, ontologyRecordId, ontologyRecordFactory)).thenReturn(Optional.empty());
        when(sesameTransformer.matontoModel(any(org.openrdf.model.Model.class))).thenAnswer(i -> Values.matontoModel(i.getArgumentAt(0, org.openrdf.model.Model.class)));
        when(sesameTransformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(sesameTransformer.matontoIRI(any(org.openrdf.model.IRI.class))).thenAnswer(i -> Values.matontoIRI(i.getArgumentAt(0, org.openrdf.model.IRI.class)));
        when(datasetConnection.prepareTupleQuery(any(String.class))).thenAnswer(i -> conn.prepareTupleQuery(i.getArgumentAt(0, String.class)));
        when(datasetConnection.prepareGraphQuery(any(String.class))).thenAnswer(i -> conn.prepareGraphQuery(i.getArgumentAt(0, String.class)));
        when(datasetConnection.getStatements(any(Resource.class), any(IRI.class), any(Value.class))).thenAnswer(i -> conn.getStatements(i.getArgumentAt(0, Resource.class), i.getArgumentAt(1, IRI.class), i.getArgumentAt(2, Value.class)));
        when(datasetConnection.contains(any(Resource.class), any(IRI.class), any(Value.class))).thenAnswer(i -> conn.contains(i.getArgumentAt(0, Resource.class), i.getArgumentAt(1, IRI.class), i.getArgumentAt(2, Value.class)));
        when(ontology.getAllClassDataProperties(classId)).thenReturn(dataProperties);
        when(ontology.getAllClassObjectProperties(classId)).thenReturn(objectProperties);
        when(ontology.getAllNoDomainDataProperties()).thenReturn(dataProperties);
        when(ontology.getAllNoDomainObjectProperties()).thenReturn(objectProperties);
        when(ontology.getDataPropertyRange(dataProperty)).thenReturn(range);
        when(ontology.getObjectPropertyRange(objectProperty)).thenReturn(range);
        when(ontology.containsClass(classId)).thenReturn(true);
        when(ontology.containsClass(vf.createIRI(MISSING_ID))).thenReturn(false);
        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgumentAt(0, Model.class));
    }

    @AfterTest
    public void after() {
        conn.close();
    }

    @Test
    public void getClassDetailsTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 2);
    }

    @Test
    public void getClassDetailsWhenClassesNotFound() {
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(mf.createModel());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void getClassDetailsWhenDeprecatedClassFound() throws Exception {
        InputStream partialData = getClass().getResourceAsStream("/partial-compiled-resource.trig");
        Model partialModel = Values.matontoModel(Rio.parse(partialData, "", RDFFormat.TRIG));
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(partialModel);
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 1);
        assertTrue(responseArray.getJSONObject(0).getBoolean("deprecated"));
    }

    @Test
    public void getClassDetailsWithEmptyDatasetRecordTest() {
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassDetailsWithNoDatasetConnectionTestIllegalArgumentThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassDetailsWithNoDatasetConnectionTestIllegalStateThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getInstanceDetailsTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
    }

    @Test
    public void getInstanceDetailsDataTest() throws Exception {
        String otherClassId = "http://matonto.org/ontologies/uhtc/CrystalStructure";
        JSONArray expected = JSONArray.fromObject(IOUtils.toString(getClass()
                .getResourceAsStream("/expected-instance-details.json")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(otherClassId) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray, expected);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "4");
    }

    @Test
    public void getInstanceDetailsWithNoDatasetConnectionTestIllegalArgumentThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceDetailsWithNoDatasetConnectionTestIllegalStateThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getInstanceDetailsWithOffsetAndLimitTest() {
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";
        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 13).request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        assertEquals(response.getLinks().size(), 0);
    }

    @Test
    public void getInstanceDetailsWithLinksTest() {
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";
        Response response = target().path(pathString).queryParam("offset", 3).queryParam("limit", 3).request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 3);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        links.forEach(link -> {
            assertTrue(link.getUri().getRawPath().contains(pathString));
            assertTrue(link.getRel().equals("prev") || link.getRel().equals("next"));
        });
    }

    @Test
    public void getInstanceDetailsWithNextLinkTest() {
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";
        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 3).request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 3);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        Link link = response.getLink("next");
        assertTrue(link.getUri().getRawPath().contains(pathString));
        assertTrue(link.getRel().equals("next"));
    }

    @Test
    public void getInstanceDetailsWithPrevLinkTest() {
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";
        Response response = target().path(pathString).queryParam("offset", 12).queryParam("limit", 3).request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 1);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        Link link = response.getLink("prev");
        assertTrue(link.getUri().getRawPath().contains(pathString));
        assertTrue(link.getRel().equals("prev"));
    }

    @Test
    public void getInstanceDetailsWithNegativeOffsetTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("offset", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceDetailsWithNegativeLimitTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceDetailsWithOffsetThatIsTooLargeTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("offset", 14).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassPropertyDetailsTest() throws Exception {
        JSONArray expected = JSONArray.fromObject(IOUtils.toString(getClass()
                .getResourceAsStream("/expected-class-property-details.json")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray details = JSONArray.fromObject(response.readEntity(String.class));
        verify(ontology, times(0)).getAllNoDomainDataProperties();
        verify(ontology, times(0)).getAllNoDomainObjectProperties();
        verify(ontology).getAllClassDataProperties(any(IRI.class));
        verify(ontology).getAllClassObjectProperties(any(IRI.class));
        assertEquals(details, expected);
    }

    @Test
    public void getClassPropertyDetailsWhenNotFoundInOntologyTest() throws Exception {
        JSONArray expected = JSONArray.fromObject(IOUtils.toString(getClass()
                .getResourceAsStream("/expected-class-property-details.json")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(MISSING_ID) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        verify(ontology).getAllNoDomainDataProperties();
        verify(ontology).getAllNoDomainObjectProperties();
        verify(ontology, times(0)).getAllClassDataProperties(any(IRI.class));
        verify(ontology, times(0)).getAllClassObjectProperties(any(IRI.class));
        JSONArray details = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(details, expected);
    }

    @Test
    public void getClassPropertyDetailsWhenNoPropertiesTest() throws Exception {
        when(ontology.getAllNoDomainObjectProperties()).thenReturn(Collections.EMPTY_SET);
        when(ontology.getAllNoDomainDataProperties()).thenReturn(Collections.EMPTY_SET);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR_2) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void getClassPropertyDetailsWithEmptyDatasetRecordTest() {
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createInstanceTest() {
        //Setup:
        JSONObject instance = new JSONObject().element("@id", NEW_INSTANCE_ID_STR).element(_Thing.title_IRI,
                new JSONArray().element(new JSONObject().element("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), NEW_INSTANCE_ID_STR);
    }

    @Test
    public void createInstanceTestWhenIRIAlreadyTaken() {
        //Setup:
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR).element(_Thing.title_IRI, new JSONArray()
                .element(new JSONObject().element("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void createInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        JSONObject instance = new JSONObject().element("@id", NEW_INSTANCE_ID_STR).element(_Thing.title_IRI,
                new JSONArray().element(new JSONObject().element("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        JSONObject instance = new JSONObject().element("@id", NEW_INSTANCE_ID_STR).element(_Thing.title_IRI,
                new JSONArray().element(new JSONObject().element("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getInstanceTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 200);
        JSONObject instance = JSONArray.fromObject(response.readEntity(String.class)).getJSONObject(0);
        assertTrue(instance.containsKey("@id"));
        assertEquals(instance.getString("@id"), INSTANCE_ID_STR);
    }

    @Test
    public void getInstanceTestWhenNotFound() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceTestWhenMoreThan100() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(LARGE_ID)).request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray titles = JSONArray.fromObject(response.readEntity(String.class)).getJSONObject(0).getJSONArray("http://purl.org/dc/terms/title");
        assertEquals(titles.size(), 100);
    }

    @Test
    public void getInstanceTestWithReifiedStatements() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(REIFIED_ID)).request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray array = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(array.size(), 2);
    }

    @Test
    public void getInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateInstanceTest() {
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONArray().add(new JSONObject().element("@value", "title")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection).remove(any(Iterable.class));
        verify(datasetConnection).add(any(Model.class));
        verify(bNodeService).deskolemize(any(Model.class));
        verify(datasetConnection).commit();
    }

    @Test
    public void updateInstanceWithReifiedTriplesTest() {
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONArray().add(new JSONObject().element("@value", "title")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(REIFIED_ID)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection, times(2)).remove(any(Iterable.class));
        verify(datasetConnection).add(any(Model.class));
        verify(bNodeService).deskolemize(any(Model.class));
        verify(datasetConnection).commit();
    }

    @Test
    public void updateInstanceTestWhenNotFound() {
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 500);
    }
}
