package org.matonto.explorable.dataset.rest.impl;

/*-
 * #%L
 * org.matonto.explorable-dataset.rest
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.fail;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
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
import org.matonto.rest.util.MatontoRestTestNg;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;

import java.io.InputStream;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;

public class ExplorableDatasetRestImplTest extends MatontoRestTestNg {
    private ExplorableDatasetRestImpl rest;

    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private DatasetRecordFactory datasetRecordFactory;

    private Repository repository;
    private RepositoryConnection conn;

    private String recordIdStr;
    private Resource recordId;
    private DatasetRecord record;
    private String ontologyRecordId;
    private String commitId;
    private Model compiledModel;
    private String classIdStr;
    private Resource classId;

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

        recordIdStr = "https://matonto.org/records#90075db8-e0b1-45b8-9f9e-1eda496ebcc5";
        recordId = vf.createIRI(recordIdStr);
        record = datasetRecordFactory.createNew(recordId);

        classIdStr = "http://matonto.org/ontologies/uhtc/Material";
        classId = vf.createIRI(classIdStr);

        ontologyRecordId = "https://matonto.org/records/0";
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
        reset(datasetManager);
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.of(record));
        when(datasetManager.getConnection(recordId)).thenReturn(datasetConnection);
        when(datasetConnection.prepareTupleQuery(any(String.class))).thenAnswer(i -> conn.prepareTupleQuery(i.getArgumentAt(0, String.class)));
        when(catalogManager.getCompiledResource(vf.createIRI(commitId))).thenReturn(Optional.of(compiledModel));
    }

    @Test
    public void getClassDetailsWithEmptyDatasetRecordTest() {
        when(datasetManager.getDatasetRecord(recordId)).thenReturn(Optional.empty());
        Response response = target().path("explorable-datasets/" + encode(recordIdStr) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getClassDetailsWithNoDatasetConnectionTest() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(recordIdStr) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getClassDetailsTest() {
        Response response = target().path("explorable-datasets/" + encode(recordIdStr) + "/class-details").request()
                .get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 2);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "2");
    }

    @Test
    public void getInstanceDetailsWithNoDatasetConnectionTest() {
        when(datasetManager.getConnection(recordId)).thenThrow(new IllegalArgumentException());
        Response response = target().path("explorable-datasets/" + encode(recordIdStr) + "/classes/"
                + encode(classIdStr) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void getInstanceDetailsTest() {
        Response response = target().path("explorable-datasets/" + encode(recordIdStr) + "/classes/"
                + encode(classIdStr) + "/instance-details").request().get();
        assertEquals(response.getStatus(), 200);
        JSONArray responseArray = JSONArray.fromObject(response.readEntity(String.class));
        assertEquals(responseArray.size(), 13);
        assertEquals(response.getHeaders().get("X-Total-Count").get(0), "13");
    }
}
