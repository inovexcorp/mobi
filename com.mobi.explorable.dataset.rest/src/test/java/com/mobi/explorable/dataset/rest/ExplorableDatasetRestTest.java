package com.mobi.explorable.dataset.rest;

/*-
 * #%L
 * com.mobi.explorable.dataset.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import static com.mobi.persistence.utils.ResourceUtils.encode;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getModelFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.injectOrmFactoryReferencesIntoService;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.TestQueryResult;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.Response;

public class ExplorableDatasetRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private OrmFactory<OntologyRecord> ontologyRecordFactory;

    private MemoryRepositoryWrapper repository;
    private RepositoryConnection conn;
    private Resource recordId;
    private DatasetRecord record;
    private String commitId;
    private Model compiledModel;
    private IRI classId;
    private IRI ontologyRecordId;
    private IRI catalogId;

    private static final Set<DataProperty> dataProperties = new HashSet<>();
    private static final Set<ObjectProperty> objectProperties = new HashSet<>();
    private static final Set<Resource> range = new HashSet<>();

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

    // Mock services used in server
    private static ExplorableDatasetRest rest;
    private static ValueFactory vf;
    private static ModelFactory mf;
    private static DatasetManager datasetManager;
    private static CatalogConfigProvider configProvider;
    private static RecordManager recordManager;
    private static CompiledResourceManager compiledResourceManager;
    private static OntologyManager ontologyManager;
    private static BNodeService bNodeService;

    @Mock
    private DatasetConnection datasetConnection;

    @Mock
    private RepositoryConnection connection;

    @Mock
    private OsgiRepository repo;

    @Mock
    private Ontology ontology;

    @Mock
    private DataProperty dataProperty;

    @Mock
    private ObjectProperty objectProperty;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();
        mf = getModelFactory();

        datasetManager = Mockito.mock(DatasetManager.class);
        recordManager = Mockito.mock(RecordManager.class);
        compiledResourceManager = Mockito.mock(CompiledResourceManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        
        ontologyManager = Mockito.mock(OntologyManager.class);
        bNodeService = Mockito.mock(BNodeService.class);

        rest = new ExplorableDatasetRest();
        injectOrmFactoryReferencesIntoService(rest);
        rest.configProvider = configProvider;
        rest.recordManager = recordManager;
        rest.compiledResourceManager = compiledResourceManager;
        rest.datasetManager = datasetManager;
        rest.ontologyManager = ontologyManager;
        rest.bNodeService = bNodeService;

        configureServer(rest);
    }

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(datasetManager, recordManager, compiledResourceManager, datasetConnection, ontology, bNodeService);

        OrmFactory<DatasetRecord> datasetRecordFactory = getRequiredOrmFactory(DatasetRecord.class);
        ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);

        recordId = vf.createIRI(RECORD_ID_STR);
        record = datasetRecordFactory.createNew(recordId);

        String branchId = "https://mobi.com/branches/0";
        commitId = "https://mobi.com/commits/0";
        OntologyIdentifier identifier = new OntologyIdentifier(ONTOLOGY_RECORD_ID_STR, branchId, commitId, vf, mf);
        record.setOntology(Stream.of(identifier.getNode()).collect(Collectors.toSet()));
        record.getModel().addAll(identifier.getStatements());

        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        InputStream testData = getClass().getResourceAsStream("/test-dataset-data.trig");
        conn = repository.getConnection();
        conn.add(Rio.parse(testData, "", RDFFormat.TRIG));

        InputStream compiledData = getClass().getResourceAsStream("/compiled-resource.trig");
        compiledModel = Rio.parse(compiledData, "", RDFFormat.TRIG);

        classId = vf.createIRI(CLASS_ID_STR);
        IRI dataPropertyId = vf.createIRI(DATA_PROPERTY_ID);
        IRI objectPropertyId = vf.createIRI(OBJECT_PROPERTY_ID);
        ontologyRecordId = vf.createIRI(ONTOLOGY_RECORD_ID_STR);
        catalogId = vf.createIRI(CATALOG_ID_STR);

        range.add(vf.createIRI(MISSING_ID));
        dataProperties.add(dataProperty);
        objectProperties.add(objectProperty);

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(connection);

        when(dataProperty.getIRI()).thenReturn(dataPropertyId);
        when(objectProperty.getIRI()).thenReturn(objectPropertyId);
        when(ontologyManager.retrieveOntology(ontologyRecordId, vf.createIRI(branchId), vf.createIRI(commitId))).thenReturn(Optional.of(ontology));

        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.of(record));
        when(datasetManager.getConnection(recordId)).thenReturn(datasetConnection);

        when(compiledResourceManager.getCompiledResource(eq(vf.createIRI(commitId)), any(RepositoryConnection.class))).thenReturn(compiledModel);
        when(recordManager.getRecordOpt(catalogId, ontologyRecordId, ontologyRecordFactory, conn)).thenReturn(Optional.empty());

        when(datasetConnection.prepareTupleQuery(any(String.class))).thenAnswer(i -> conn.prepareTupleQuery(i.getArgument(0, String.class)));
        when(datasetConnection.prepareGraphQuery(any(String.class))).thenAnswer(i -> conn.prepareGraphQuery(i.getArgument(0, String.class)));
        when(datasetConnection.getStatements(any(), any(), any())).thenAnswer(i -> conn.getStatements(i.getArgument(0, Resource.class), i.getArgument(1, IRI.class), i.getArgument(2, Value.class)));
        when(datasetConnection.contains(any(Resource.class), any(), any())).thenAnswer(i -> ConnectionUtils.contains(conn, i.getArgument(0, Resource.class), i.getArgument(1, IRI.class), i.getArgument(2, Value.class)));

        when(ontology.getAllClassDataProperties(classId)).thenReturn(dataProperties);
        when(ontology.getAllClassObjectProperties(classId)).thenReturn(objectProperties);
        when(ontology.getAllNoDomainDataProperties()).thenReturn(dataProperties);
        when(ontology.getAllNoDomainObjectProperties()).thenReturn(objectProperties);
        when(ontology.getDataPropertyRange(dataProperty)).thenReturn(range);
        when(ontology.getObjectPropertyRange(objectProperty)).thenReturn(range);
        when(ontology.containsClass(classId)).thenReturn(true);
        when(ontology.containsClass(vf.createIRI(MISSING_ID))).thenReturn(false);
        when(ontology.getSubClassesFor(any(IRI.class))).thenReturn(Collections.singleton(vf.createIRI(CLASS_ID_STR_2)));
        when(ontology.getTupleQueryResults(anyString(), anyBoolean())).thenReturn(new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));

        when(bNodeService.deskolemize(any(Model.class))).thenAnswer(i -> i.getArgument(0, Model.class));
        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));
    }

    @After
    public void after() throws Exception {
        closeable.close();
        conn.close();
    }

    @Test
    public void getClassDetailsTest() throws Exception {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 2);
    }

    @Test
    public void getClassDetailsWhenClassesNotFound() throws Exception {
        //Setup:
        when(compiledResourceManager.getCompiledResource(eq(vf.createIRI(commitId)), any(RepositoryConnection.class))).thenReturn(mf.createEmptyModel());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void getClassDetailsWhenDeprecatedClassFound() throws Exception {
        //Setup:
        InputStream partialData = getClass().getResourceAsStream("/partial-compiled-resource.trig");
        Model partialModel = Rio.parse(partialData, "", RDFFormat.TRIG);
        when(compiledResourceManager.getCompiledResource(eq(vf.createIRI(commitId)), any(RepositoryConnection.class))).thenReturn(partialModel);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 1);
        assertTrue(responseArray.get(0).get("deprecated").asBoolean());
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
    public void getInstanceDetailsTest() throws Exception {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
    }

    @Test
    public void getInstanceDetailsDataTest() throws Exception {
        //Setup:
        String otherClassId = "http://mobi.com/ontologies/uhtc/CrystalStructure";
        ArrayNode expected = mapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass()
                .getResourceAsStream("/expected-instance-details.json")), StandardCharsets.UTF_8), ArrayNode.class);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(otherClassId) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
    public void getInstanceDetailsWithOffsetAndLimitTest() throws Exception {
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 13).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        assertEquals(response.getLinks().size(), 0);
    }

    @Test
    public void getInstanceDetailsWithLinksTest() throws Exception {
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 3).queryParam("limit", 3).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
    public void getInstanceDetailsWithNextLinkTest() throws Exception {
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 0).queryParam("limit", 3).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 3);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        Link link = response.getLink("next");
        assertTrue(link.getUri().getRawPath().contains(pathString));
        assertEquals("next", link.getRel());
    }

    @Test
    public void getInstanceDetailsWithPrevLinkTest() throws Exception {
        //Setup:
        String pathString = "explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/" + encode(CLASS_ID_STR)
                + "/instance-details";

        Response response = target().path(pathString).queryParam("offset", 12).queryParam("limit", 3).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 1);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
        Link link = response.getLink("prev");
        assertTrue(link.getUri().getRawPath().contains(pathString));
        assertEquals("prev", link.getRel());
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
    public void getInstanceDetailsWithInferTest() throws Exception {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/instance-details").queryParam("infer", true).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(responseArray.size(), 17);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "17");
        verify(datasetManager).getDatasetRecord(recordId);
        verify(ontology).getSubClassesFor(classId);
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
        ArrayNode expected = mapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass()
                .getResourceAsStream("/expected-class-property-details.json")), StandardCharsets.UTF_8), ArrayNode.class);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode details = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        verify(ontology, times(0)).getAllNoDomainDataProperties();
        verify(ontology, times(0)).getAllNoDomainObjectProperties();
        verify(ontology).getAllClassDataProperties(any(IRI.class));
        verify(ontology).getAllClassObjectProperties(any(IRI.class));
        assertEquals(details, expected);
    }

    @Test
    public void getClassPropertyDetailsWhenNotFoundInOntologyTest() throws Exception {
        //Setup:
        ArrayNode expected = mapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass()
                .getResourceAsStream("/expected-class-property-details.json")), StandardCharsets.UTF_8), ArrayNode.class);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(MISSING_ID) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        verify(ontology).getAllNoDomainDataProperties();
        verify(ontology).getAllNoDomainObjectProperties();
        verify(ontology, times(0)).getAllClassDataProperties(any(IRI.class));
        verify(ontology, times(0)).getAllClassObjectProperties(any(IRI.class));
        ArrayNode details = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(details, expected);
    }

    @Test
    public void getClassPropertyDetailsWhenNoPropertiesTest() throws Exception {
        //Setup:
        when(ontology.getAllNoDomainObjectProperties()).thenReturn(Collections.emptySet());
        when(ontology.getAllNoDomainDataProperties()).thenReturn(Collections.emptySet());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR_2) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode responseArray = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
        when(ontology2.getDataPropertyRange(dataProperty)).thenReturn(Collections.emptySet());
        when(ontology2.getObjectPropertyRange(objectProperty)).thenReturn(Collections.emptySet());
        when(ontology2.getTupleQueryResults(anyString(), anyBoolean())).thenReturn(new TestQueryResult(Collections.emptyList(), Collections.emptyList(), 0, vf));
        when(ontologyManager.retrieveOntology(vf.createIRI(ontologyId), vf.createIRI(branchId), vf.createIRI(commitId))).thenReturn(Optional.of(ontology2));
        ArrayNode expected = mapper.readValue(IOUtils.toString(Objects.requireNonNull(getClass()
                .getResourceAsStream("/expected-class-property-details.json")), StandardCharsets.UTF_8), ArrayNode.class);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(CLASS_ID_STR) + "/property-details").request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode details = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
        ObjectNode instance = mapper.createObjectNode().put("@id", NEW_INSTANCE_ID_STR).set(_Thing.title_IRI,
                mapper.createArrayNode().add(mapper.createObjectNode().put("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 201);
        assertEquals(response.readEntity(String.class), NEW_INSTANCE_ID_STR);
    }

    @Test
    public void createInstanceTestWhenIRIAlreadyTaken() {
        //Setup:
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR).set(_Thing.title_IRI,
                mapper.createArrayNode().add(mapper.createObjectNode().put("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void createInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        ObjectNode instance = mapper.createObjectNode().put("@id", NEW_INSTANCE_ID_STR).set(_Thing.title_IRI,
                mapper.createArrayNode().add(mapper.createObjectNode().put("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());
        ObjectNode instance = mapper.createObjectNode().put("@id", NEW_INSTANCE_ID_STR).set(_Thing.title_IRI,
                mapper.createArrayNode().add(mapper.createObjectNode().put("@value", "title")));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances").request()
                .post(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getInstanceTest() throws Exception {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().get();
        assertEquals(response.getStatus(), 200);
        JsonNode instance = mapper.readValue(response.readEntity(String.class), ArrayNode.class).get(0);
        assertTrue(instance.has("@id"));
        assertEquals(INSTANCE_ID_STR, instance.get("@id").asText());
    }

    @Test
    public void getInstanceTestWhenNotFound() {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getInstanceTestWhenMoreThan100() throws Exception{
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(LARGE_ID)).request().get();
        assertEquals(response.getStatus(), 200);
        JsonNode titles = mapper.readValue(response.readEntity(String.class), ArrayNode.class)
                .get(0).get("http://purl.org/dc/terms/title");
        assertEquals(titles.size(), 100);
    }

    @Test
    public void getInstanceTestWithReifiedStatements() throws Exception {
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(REIFIED_ID)).request().get();
        assertEquals(response.getStatus(), 200);
        ArrayNode array = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
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
        ArrayNode array = mapper.createArrayNode();
        array.add(mapper.createObjectNode().put("@value", "title"));
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR).set(_Thing.title_IRI, array);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection).remove(any(RepositoryResult.class));
        verify(datasetConnection).add(any(Model.class));
        verify(bNodeService).deskolemize(any(Model.class));
        verify(datasetConnection).commit();
    }

    @Test
    public void updateInstanceWithReifiedTriplesTest() {
        //Setup:
        ArrayNode array = mapper.createArrayNode();
        array.add(mapper.createObjectNode().put("@value", "title"));
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR).set(_Thing.title_IRI, array);

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(REIFIED_ID)).request().put(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 200);
        verify(datasetConnection).begin();
        verify(datasetConnection, times(2)).remove(any(RepositoryResult.class));
        verify(datasetConnection).add(any(Model.class));
        verify(bNodeService).deskolemize(any(Model.class));
        verify(datasetConnection).commit();
    }

    @Test
    public void updateInstanceTestWhenNotFound() {
        //Setup:
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR)
                .set(_Thing.title_IRI, mapper.createObjectNode().put("@value", "title"));

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(MISSING_ID)).request().put(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalArgumentThrown() {
        //Setup:
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR)
                .set(_Thing.title_IRI, mapper.createObjectNode().put("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance.toString()));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void updateInstanceTestWithNoDatasetConnectionTestIllegalStateThrown() {
        //Setup:
        ObjectNode instance = mapper.createObjectNode().put("@id", INSTANCE_ID_STR)
                .set(_Thing.title_IRI, mapper.createObjectNode().put("@value", "title"));
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalStateException());

        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/instances/"
                + encode(INSTANCE_ID_STR)).request().put(Entity.json(instance.toString()));
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
