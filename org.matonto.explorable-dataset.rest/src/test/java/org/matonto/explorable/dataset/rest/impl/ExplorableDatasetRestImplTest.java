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

import net.sf.json.JSONArray;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.PaginatedSearchResults;
import org.matonto.catalog.api.ontologies.mcat.*;
import org.matonto.dataset.api.DatasetManager;
import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.dataset.pagination.DatasetPaginatedSearchParams;
import org.matonto.dataset.rest.impl.DatasetRestImpl;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.*;
import org.matonto.rest.util.MatontoRestTestNg;
import org.matonto.rest.util.UsernameTestFilter;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.ws.rs.core.Application;
import javax.ws.rs.core.Response;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.fail;

public class ExplorableDatasetRestImplTest extends MatontoRestTestNg {
    private DatasetRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private ValueConverterRegistry vcr;
    private DatasetRecordFactory datasetRecordFactory;
    private UserFactory userFactory;
    private OntologyRecordFactory ontologyRecordFactory;
    private BranchFactory branchFactory;
    private CommitFactory commitFactory;
    private DatasetRecord record1;
    private DatasetRecord record2;
    private DatasetRecord record3;
    private Commit commit;
    private Branch branch;
    private OntologyRecord ontologyRecord;
    private String[] expectedSortOrder;
    private User user;

    private final String ONTOLOGY_RECORD_IRI = "http://example.com/ontologyRecord";
    private final String BRANCH_IRI = "http://example.com/branch";
    private final String COMMIT_IRI = "http://example.com/commit";

    @Mock
    private SesameTransformer transformer;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private PaginatedSearchResults<DatasetRecord> results;
    @Override
    protected Application configureApp() throws Exception {
        vf = SimpleValueFactory.getInstance();
        mf = LinkedHashModelFactory.getInstance();
        vcr = new DefaultValueConverterRegistry();
        datasetRecordFactory = new DatasetRecordFactory();
        userFactory = new UserFactory();
        ontologyRecordFactory = new OntologyRecordFactory();
        branchFactory = new BranchFactory();
        commitFactory = new CommitFactory();
        datasetRecordFactory.setValueFactory(vf);
        datasetRecordFactory.setModelFactory(mf);
        datasetRecordFactory.setValueConverterRegistry(vcr);
        userFactory.setValueFactory(vf);
        userFactory.setModelFactory(mf);
        userFactory.setValueConverterRegistry(vcr);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        branchFactory.setValueFactory(vf);
        branchFactory.setModelFactory(mf);
        branchFactory.setValueConverterRegistry(vcr);
        commitFactory.setValueFactory(vf);
        commitFactory.setModelFactory(mf);
        commitFactory.setValueConverterRegistry(vcr);

        vcr.registerValueConverter(datasetRecordFactory);
        vcr.registerValueConverter(userFactory);
        vcr.registerValueConverter(ontologyRecordFactory);
        vcr.registerValueConverter(branchFactory);
        vcr.registerValueConverter(commitFactory);
        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        record1 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record1"));
        record1.setProperty(vf.createLiteral("A"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record2 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record2"));
        record2.setProperty(vf.createLiteral("B"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record3 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record3"));
        record3.setProperty(vf.createLiteral("C"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        expectedSortOrder = new String[] {
                record3.getResource().stringValue(),
                record2.getResource().stringValue(),
                record1.getResource().stringValue()
        };
        user = userFactory.createNew(vf.createIRI("http://example.com/" + UsernameTestFilter.USERNAME));
        commit = commitFactory.createNew(vf.createIRI(COMMIT_IRI));
        branch = branchFactory.createNew(vf.createIRI(BRANCH_IRI));
        branch.setHead(commit);
        ontologyRecord = ontologyRecordFactory.createNew(vf.createIRI(ONTOLOGY_RECORD_IRI));
        ontologyRecord.setMasterBranch(branch);

        MockitoAnnotations.initMocks(this);
        rest = new DatasetRestImpl();
        rest.setManager(datasetManager);
        rest.setVf(vf);
        rest.setMf(mf);
        rest.setTransformer(transformer);
        rest.setEngineManager(engineManager);
        rest.setCatalogManager(catalogManager);
        rest.setOntologyRecordFactory(ontologyRecordFactory);
        rest.setBranchFactory(branchFactory);

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
        reset(datasetManager, catalogManager, transformer, results);

        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(datasetManager.getDatasetRecords(any(DatasetPaginatedSearchParams.class))).thenReturn(results);
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenReturn(record1);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(catalogManager.getRecord(any(Resource.class), any(Resource.class), eq(ontologyRecordFactory))).thenReturn(Optional.of(ontologyRecord));
        when(catalogManager.getRecord(any(Resource.class), eq(vf.createIRI("http://example.com/error")), eq(ontologyRecordFactory))).thenReturn(Optional.empty());
        when(catalogManager.getBranch(any(Resource.class), eq(branchFactory))).thenReturn(Optional.of(branch));
        when(catalogManager.getBranch(vf.createIRI("http://example.com/error"), branchFactory)).thenReturn(Optional.empty());
        when(results.getPage()).thenReturn(Stream.of(record1, record2, record3)
                .collect(Collectors.toList()));
        when(results.getPageNumber()).thenReturn(1);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(3);
    }

    @Test
    public void getClassDetailsTest() {
      //  Response response = target().path("explorable-datasets").request().get();
      //  assertEquals(response.getStatus(), 200);
        /*verify(datasetManager).getDatasetRecords(any(DatasetPaginatedSearchParams.class));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 3);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }*/
    }

}






















