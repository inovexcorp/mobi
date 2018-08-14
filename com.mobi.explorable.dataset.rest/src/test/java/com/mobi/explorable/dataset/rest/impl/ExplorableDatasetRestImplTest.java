package com.mobi.explorable.dataset.rest.impl;

/*-
 * #%L
 * com.mobi.explorable.dataset.rest
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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static com.mobi.rest.util.RestUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.propertyexpression.DataProperty;
import com.mobi.ontology.core.api.propertyexpression.ObjectProperty;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.repository.impl.sesame.query.TestQueryResult;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
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

public class ExplorableDatasetRestImplTest extends MobiRestTestNg {
    private ExplorableDatasetRestImpl rest;

    private ValueFactory vf;
    private ModelFactory mf;
    private OrmFactory<OntologyRecord> ontologyRecordFactory;

    private Repository repository;
    private RepositoryConnection conn;
    private Resource recordId;
    private DatasetRecord record;
    private String commitId;
    private Model compiledModel;
    private IRI classId;
    private IRI ontologyRecordId;
    private IRI catalogId;

    private static Set<DataProperty> dataProperties = new HashSet<>();
    private static Set<ObjectProperty> objectProperties = new HashSet<>();
    private static Set<Resource> range = new HashSet<>();

    private static final String RECORD_ID_STR = "https://mobi.com/records#90075db8-e0b1-45b8-9f9e-1eda496ebcc5";
    private static final String CLASS_ID_STR = "http://mobi.com/ontologies/uhtc/Material";
    private static final String CLASS_ID_STR_2 = "http://mobi.com/ontologies/uhtc/CrystalStructure";
    private static final String INSTANCE_ID_STR = "http://mobi.com/data/uhtc/material/c1855eb9-89dc-445e-8f02-22c1162c0844";
    private static final String MISSING_ID = "http://mobi.com/data/missing";
    private static final String LARGE_ID = "http://mobi.com/data/large";
    private static final String REIFIED_ID = "http://mobi.com/data/uhtc/crystalstructure/Polymorphic";
    private static final String DATA_PROPERTY_ID = "http://mobi.com/data-property";
    private static final String OBJECT_PROPERTY_ID = "http://mobi.com/object-property";
    private static final String NEW_INSTANCE_ID_STR = "http://mobi.com/new-instance";
    private static final String ONTOLOGY_RECORD_ID_STR = "https://mobi.com/records/0";
    private static final String CATALOG_ID_STR = "https://mobi.com/catalog-local";

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private CatalogConfigProvider configProvider;

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

        RepositoryManager repoManager = new SimpleRepositoryManager();

        vf = getValueFactory();
        mf = getModelFactory();

        OrmFactory<DatasetRecord> datasetRecordFactory = getRequiredOrmFactory(DatasetRecord.class);
        ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);

        recordId = vf.createIRI(RECORD_ID_STR);
        record = datasetRecordFactory.createNew(recordId);

        String branchId = "https://mobi.com/branches/0";
        commitId = "https://mobi.com/commits/0";
        OntologyIdentifier identifier = new OntologyIdentifier(ONTOLOGY_RECORD_ID_STR, branchId, commitId, vf, mf);
        record.setOntology(Stream.of(identifier.getNode()).collect(Collectors.toSet()));
        record.getModel().addAll(identifier.getStatements());

        repository = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repository.initialize();

        InputStream testData = getClass().getResourceAsStream("/test-dataset-data.trig");
        conn = repository.getConnection();
        conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));

        InputStream compiledData = getClass().getResourceAsStream("/compiled-resource.trig");
        compiledModel = Values.mobiModel(Rio.parse(compiledData, "", RDFFormat.TRIG));

        classId = vf.createIRI(CLASS_ID_STR);
        IRI dataPropertyId = vf.createIRI(DATA_PROPERTY_ID);
        IRI objectPropertyId = vf.createIRI(OBJECT_PROPERTY_ID);
        ontologyRecordId = vf.createIRI(ONTOLOGY_RECORD_ID_STR);
        catalogId = vf.createIRI(CATALOG_ID_STR);

        range.add(vf.createIRI(MISSING_ID));
        dataProperties.add(dataProperty);
        objectProperties.add(objectProperty);

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        when(dataProperty.getIRI()).thenReturn(dataPropertyId);
        when(objectProperty.getIRI()).thenReturn(objectPropertyId);
        when(ontologyManager.retrieveOntology(ontologyRecordId, vf.createIRI(branchId), vf.createIRI(commitId))).thenReturn(Optional.of(ontology));
        when(ontologyManager.getSubClassesFor(any(IRI.class), any(RepositoryConnection.class))).thenAnswer(i -> new TestQueryResult(Collections.singletonList("s"), Collections.singletonList(CLASS_ID_STR_2), 1, vf));

        rest = new ExplorableDatasetRestImpl();
        injectOrmFactoryReferencesIntoService(rest);
        rest.setConfigProvider(configProvider);
        rest.setCatalogManager(catalogManager);
        rest.setDatasetManager(datasetManager);
        rest.setFactory(vf);
        rest.setSesameTransformer(sesameTransformer);
        rest.setModelFactory(mf);
        rest.setOntologyManager(ontologyManager);
        rest.setBNodeService(bNodeService);
        rest.setRepositoryManager(repoManager);

        return new ResourceConfig().register(rest);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(datasetManager, catalogManager, sesameTransformer, datasetConnection, ontology, bNodeService);

        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.of(record));
        when(datasetManager.getConnection(recordId)).thenReturn(datasetConnection);

        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(compiledModel);
        when(catalogManager.getRecord(catalogId, ontologyRecordId, ontologyRecordFactory)).thenReturn(Optional.empty());

        when(sesameTransformer.mobiModel(any(org.eclipse.rdf4j.model.Model.class))).thenAnswer(i -> Values.mobiModel(i.getArgumentAt(0, org.eclipse.rdf4j.model.Model.class)));
        when(sesameTransformer.mobiIRI(any(org.eclipse.rdf4j.model.IRI.class))).thenAnswer(i -> Values.mobiIRI(i.getArgumentAt(0, org.eclipse.rdf4j.model.IRI.class)));
        when(sesameTransformer.sesameModel(any(Model.class))).thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(sesameTransformer.sesameStatement(any(Statement.class))).thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

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
        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgumentAt(0, Statement.class));
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
        //Setup:
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(mf.createModel());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void getClassDetailsWhenDeprecatedClassFound() throws Exception {
        //Setup:
        InputStream partialData = getClass().getResourceAsStream("/partial-compiled-resource.trig");
        Model partialModel = Values.mobiModel(Rio.parse(partialData, "", RDFFormat.TRIG));
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
        //Setup:
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassDetailsWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassDetailsWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
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
        //Setup:
        String otherClassId = "http://mobi.com/ontologies/uhtc/CrystalStructure";
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
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 13).request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        assertEquals(response.getLinks().size(), 0);
    }

    @Test
    public void getInstanceDetailsWithLinksTest() {
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 3).queryParam("limit", 3).request().get();
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
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 3).request().get();
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
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 12).queryParam("limit", 3).request().get();
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
    public void getInstanceDetailsWithInferTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("infer", true).request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 17);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "17");
        verify(datasetManager).getDatasetRecord(recordId);
        verify(ontologyManager).getSubClassesFor(eq(classId), any(RepositoryConnection.class));
    }

    @Test
    public void getInstanceDetailsWithInferWithEmptyRecordTest() {
        //Setup:
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("infer", true).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassPropertyDetailsTest() throws Exception {
        //Setup:
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
        //Setup:
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
    public void getClassPropertyDetailsWhenNoPropertiesTest() {
        //Setup:
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
        //Setup:
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassPropertyDetailsWithSamePropertyIRI() throws Exception {
        //Setup:
        String ontologyId = "https://mobi.com/ontologies/1";
        String branchId = "https://mobi.com/branches/1";
        String commitId = "https://mobi.com/commits/1";
        OntologyIdentifier identifier = new OntologyIdentifier(ontologyId, branchId, commitId, vf, mf);
        Set<Value> nodes = record.getOntology();
        nodes.add(identifier.getNode());
        record.setOntology(nodes);
        record.getModel().addAll(identifier.getStatements());
        Ontology ontology2 = mock(Ontology.class);
        when(ontology2.containsClass(any(IRI.class))).thenReturn(true);
        when(ontology2.getAllClassDataProperties(classId)).thenReturn(dataProperties);
        when(ontology2.getAllClassObjectProperties(classId)).thenReturn(objectProperties);
        when(ontology2.getDataPropertyRange(dataProperty)).thenReturn(Collections.EMPTY_SET);
        when(ontology2.getObjectPropertyRange(objectProperty)).thenReturn(Collections.EMPTY_SET);
        when(ontologyManager.retrieveOntology(vf.createIRI(ontologyId), vf.createIRI(branchId), vf.createIRI(commitId))).thenReturn(Optional.of(ontology2));
        JSONArray expected = JSONArray.fromObject(IOUtils.toString(getClass()
                .getResourceAsStream("/expected-class-property-details.json")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray details = JSONArray.fromObject(response.readEntity(String.class));
        verify(ontology, times(0)).getAllNoDomainDataProperties();
        verify(ontology, times(0)).getAllNoDomainObjectProperties();
        verify(ontology2, times(0)).getAllNoDomainDataProperties();
        verify(ontology2, times(0)).getAllNoDomainObjectProperties();
        verify(ontology).getAllClassDataProperties(any(IRI.class));
        verify(ontology).getAllClassObjectProperties(any(IRI.class));
        verify(ontology2).getAllClassDataProperties(any(IRI.class));
        verify(ontology2).getAllClassObjectProperties(any(IRI.class));
        assertEquals(details, expected);
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
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void updateInstanceTest() {
        //Setup:
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
        //Setup:
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
        //Setup:
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        JSONObject instance = new JSONObject().element("@id", INSTANCE_ID_STR)
                .element(_Thing.title_IRI, new JSONObject().element("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void deleteInstanceTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection).remove(any(Model.class));
        verify(datasetConnection).remove((Resource) null, null, vf.createIRI(INSTANCE_ID_STR));
        verify(datasetConnection).commit();
    }

    @Test
    public void deleteInstanceWithReifiedTriplesTest() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(REIFIED_ID)).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection).remove(any(Model.class));
        verify(datasetConnection).remove((Resource) null, null, vf.createIRI(REIFIED_ID));
        verify(datasetConnection).commit();
    }

    @Test
    public void deleteInstanceTestWhenNotFound() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().delete();
        assertEquals(response.getStatus(), 500);
    }
}
