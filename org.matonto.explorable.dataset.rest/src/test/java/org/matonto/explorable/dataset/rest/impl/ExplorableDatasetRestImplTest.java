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
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;

import net.sf.json.JSONArray;
import org.apache.commons.io.IOUtils;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.OntologyIdentifier;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
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
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.InputStream;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.Response;

public class ExplorableDatasetRestImplTest extends MatontoRestTestNg {
    private ExplorableDatasetRestImpl rest;

    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private DatasetRecordFactory datasetRecordFactory;

    private Repository repository;
    private RepositoryConnection conn;
    private Resource recordId;
    private DatasetRecord record;
    private String commitId;
    private Model compiledModel;

    private static final String RECORD_ID_STR = "https://matonto.org/records#90075db8-e0b1-45b8-9f9e-1eda496ebcc5";
    private static final String CLASS_ID_STR = "http://matonto.org/ontologies/uhtc/Material";

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private DatasetConnection datasetConnection;

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

        recordId = vf.createIRI(RECORD_ID_STR);
        record = datasetRecordFactory.createNew(recordId);

        String ontologyRecordId = "https://matonto.org/records/0";
        String branchId = "https://matonto.org/branches/0";
        commitId = "https://matonto.org/commits/0";
        OntologyIdentifier identifier = new OntologyIdentifier(ontologyRecordId, branchId, commitId, vf, mf);
        record.setOntology(Stream.of(identifier.getNode()).collect(Collectors.toSet()));
        record.getModel().addAll(identifier.getStatements());

        repository = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repository.initialize();

        InputStream testData = getClass().getResourceAsStream("/test-dataset-data.trig");
        conn = repository.getConnection();
        conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));

        InputStream compiledData = getClass().getResourceAsStream("/compiled-resource.trig");
        compiledModel = Values.matontoModel(Rio.parse(compiledData, "", RDFFormat.TRIG));

        rest = new ExplorableDatasetRestImpl();
        rest.setCatalogManager(catalogManager);
        rest.setDatasetManager(datasetManager);
        rest.setFactory(vf);

        return new ResourceConfig().register(rest);
    }

    @BeforeMethod
    public void setupMocks() {
        reset(datasetManager, datasetConnection, catalogManager);
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.of(record));
        when(datasetManager.getConnection(recordId)).thenReturn(datasetConnection);
        when(datasetConnection.prepareTupleQuery(any(String.class))).thenAnswer(i -> conn.prepareTupleQuery(i.getArgumentAt(0, String.class)));
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(Optional.of(compiledModel));
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
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(Optional.empty());
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 0);
    }

    @Test
    public void getClassDetailsWhenPartialClassesFound() throws Exception {
        InputStream partialData = getClass().getResourceAsStream("/partial-compiled-resource.trig");
        Model partialModel = Values.matontoModel(Rio.parse(partialData, "", RDFFormat.TRIG));
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(Optional.of(partialModel));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 1);
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
        String otherCLASS_ID_STR = "http://matonto.org/ontologies/uhtc/CrystalStructure";
        JSONArray expected = JSONArray.fromObject(IOUtils.toString(getClass()
                .getResourceAsStream("/expected-instance-details.json")));
        Response response = target().path("explorable-datasets/" + encode(RECORD_ID_STR) + "/classes/"
                + encode(otherCLASS_ID_STR) + "/instance-details").request().get();
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
}
