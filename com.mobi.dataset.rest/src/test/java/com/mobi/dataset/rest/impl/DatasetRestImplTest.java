package com.mobi.dataset.rest.impl;

/*-
 * #%L
 * com.mobi.dataset.rest
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
import static com.mobi.persistence.utils.ResourceUtils.encode;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertTrue;
import static org.testng.Assert.fail;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.DatasetRecordConfig;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.rest.util.MobiRestTestNg;
import com.mobi.rest.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.glassfish.jersey.client.ClientConfig;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataMultiPart;
import org.glassfish.jersey.media.multipart.MultiPartFeature;
import org.glassfish.jersey.server.ResourceConfig;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class DatasetRestImplTest extends MobiRestTestNg {
    private DatasetRestImpl rest;
    private ValueFactory vf;
    private ModelFactory mf;
    private OrmFactory<Branch> branchFactory;
    private DatasetRecord record1;
    private DatasetRecord record2;
    private DatasetRecord record3;
    private Commit commit;
    private Branch branch;
    private User user;
    private CreateActivity createActivity;
    private DeleteActivity deleteActivity;

    private IRI errorIRI;
    private IRI localIRI;
    private IRI ontologyRecordIRI;
    private IRI branchIRI;
    private IRI commitIRI;

    @Mock
    private SesameTransformer transformer;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private EngineManager engineManager;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private PaginatedSearchResults<DatasetRecord> results;

    @Mock
    private BNodeService service;

    @Mock
    private CatalogProvUtils provUtils;

    @Mock
    private RDFImportService importService;

    @Override
    protected Application configureApp() throws Exception {
        vf = getValueFactory();
        mf = getModelFactory();
        errorIRI = vf.createIRI("http://example.com/error");
        localIRI = vf.createIRI("http://example.com/catalogs/local");
        ontologyRecordIRI = vf.createIRI("http://example.com/ontologyRecord");
        branchIRI = vf.createIRI("http://example.com/branch");
        commitIRI = vf.createIRI("http://example.com/commit");

        branchFactory = getRequiredOrmFactory(Branch.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<DatasetRecord> datasetRecordFactory = getRequiredOrmFactory(DatasetRecord.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<CreateActivity> createActivityFactory = getRequiredOrmFactory(CreateActivity.class);
        OrmFactory<DeleteActivity> deleteActivityFactory = getRequiredOrmFactory(DeleteActivity.class);

        record1 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record1"));
        record1.setProperty(vf.createLiteral("A"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record2 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record2"));
        record2.setProperty(vf.createLiteral("B"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        record3 = datasetRecordFactory.createNew(vf.createIRI("http://example.com/record3"));
        record3.setProperty(vf.createLiteral("C"), vf.createIRI(DCTERMS.TITLE.stringValue()));
        user = userFactory.createNew(vf.createIRI("http://example.com/" + UsernameTestFilter.USERNAME));
        commit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);
        createActivity = createActivityFactory.createNew(vf.createIRI("http://example.com/activity/create"));
        deleteActivity = deleteActivityFactory.createNew(vf.createIRI("http://example.com/activity/delete"));

        MockitoAnnotations.initMocks(this);

        when(configProvider.getLocalCatalogIRI()).thenReturn(localIRI);

        rest = new DatasetRestImpl();
        rest.setManager(datasetManager);
        rest.setVf(vf);
        rest.setMf(mf);
        rest.setTransformer(transformer);
        rest.setEngineManager(engineManager);
        rest.setConfigProvider(configProvider);
        rest.setCatalogManager(catalogManager);
        rest.setBNodeService(service);
        rest.setProvUtils(provUtils);
        rest.setImportService(importService);

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
        reset(datasetManager, catalogManager, transformer, results, service, provUtils, importService);

        when(transformer.sesameModel(any(Model.class)))
                .thenAnswer(i -> Values.sesameModel(i.getArgumentAt(0, Model.class)));
        when(transformer.sesameStatement(any(Statement.class)))
                .thenAnswer(i -> Values.sesameStatement(i.getArgumentAt(0, Statement.class)));

        when(service.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgumentAt(0, Statement.class));

        when(datasetManager.getDatasetRecord(any(Resource.class))).thenReturn(Optional.of(record1));
        when(datasetManager.getDatasetRecords(any(DatasetPaginatedSearchParams.class))).thenReturn(results);
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenReturn(record1);
        when(datasetManager.deleteDataset(record1.getResource())).thenReturn(record1);
        when(datasetManager.safeDeleteDataset(record1.getResource())).thenReturn(record1);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));

        when(catalogManager.getMasterBranch(localIRI, ontologyRecordIRI)).thenReturn(branch);

        when(results.getPage()).thenReturn(Stream.of(record1, record2, record3).collect(Collectors.toList()));
        when(results.getPageNumber()).thenReturn(1);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(3);

        when(provUtils.startCreateActivity(any(User.class))).thenReturn(createActivity);
        when(provUtils.startDeleteActivity(any(User.class), any(IRI.class))).thenReturn(deleteActivity);
    }

    /* GET datasets */

    @Test
    public void getDatasetRecordsTest() {
        Response response = target().path("datasets").request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords(any(DatasetPaginatedSearchParams.class));
        verify(service, atLeastOnce()).skolemize(any(Statement.class));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 3);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithLinksTest() {
        // Setup:
        when(results.getPage()).thenReturn(Collections.singletonList(record2));
        when(results.getPageNumber()).thenReturn(2);
        when(results.getPageSize()).thenReturn(1);

        Response response = target().path("datasets").queryParam("offset", 1).queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecords(any(DatasetPaginatedSearchParams.class));
        verify(service, atLeastOnce()).skolemize(any(Statement.class));
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "3");
        Set<Link> links = response.getLinks();
        assertEquals(links.size(), 2);
        assertTrue(response.hasLink("prev"));
        assertTrue(response.hasLink("next"));
        try {
            JSONArray result = JSONArray.fromObject(response.readEntity(String.class));
            assertEquals(result.size(), 1);
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getDatasetRecordsWithNegativeLimitTest() {
        Response response = target().path("datasets").queryParam("limit", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getDatasetRecordsWithNegativeOffsetTest() {
        Response response = target().path("datasets").queryParam("offset", -1).request().get();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void getDatasetRecordsWithErrorTest() {
        // Setup:
        when(datasetManager.getDatasetRecords(any(DatasetPaginatedSearchParams.class))).thenThrow(new MobiException());

        Response response = target().path("datasets").request().get();
        assertEquals(response.getStatus(), 500);
    }

    /* POST datasets */

    @Test
    public void createDatasetRecordTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("datasetIRI", "http://example.com/dataset")
                .field("repositoryId", "system")
                .field("description", "description")
                .field("keywords", "test")
                .field("keywords", "demo")
                .field("ontologies", ontologyRecordIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        verify(datasetManager).createDataset(any(DatasetRecordConfig.class));
        verify(catalogManager).getMasterBranch(localIRI, ontologyRecordIRI);
        assertEquals(response.readEntity(String.class), record1.getResource().stringValue());
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).endCreateActivity(createActivity, record1.getResource());
    }

    @Test
    public void createDatasetRecordWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("repositoryId", "system");

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(provUtils, times(0)).startCreateActivity(user);
    }

    @Test
    public void createDatasetRecordWithoutRepositoryIdTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title");

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(provUtils, times(0)).startCreateActivity(user);
    }

    @Test
    public void createDatasetRecordWithInvalidParametersTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "error");
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).removeActivity(createActivity);
    }

    @Test
    public void createDatasetRecordWithMissingOntologyRecordTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getMasterBranch(localIRI, errorIRI);
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", errorIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).removeActivity(createActivity);
    }

    @Test
    public void createDatasetRecordWithMissingMasterBranchTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(catalogManager).getMasterBranch(localIRI, errorIRI);
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", errorIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).removeActivity(createActivity);
    }

    @Test
    public void createDatasetRecordWithNoHeadCommitTest() {
        // Setup:
        Branch newBranch = branchFactory.createNew(branchIRI);
        when(catalogManager.getMasterBranch(localIRI, ontologyRecordIRI)).thenReturn(newBranch);
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", ontologyRecordIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).removeActivity(createActivity);
    }

    @Test
    public void createDatasetRecordWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system");
        when(datasetManager.createDataset(any(DatasetRecordConfig.class))).thenThrow(new MobiException());

        Response response = target().path("datasets").request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(provUtils).startCreateActivity(user);
        verify(provUtils).removeActivity(createActivity);
    }

    /* GET datasets/{datasetId} */

    @Test
    public void getDatasetRecordTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).getDatasetRecord(record1.getResource());
    }

    @Test
    public void getDatasetRecordThatCouldNotBeFoundTest() {
        when(datasetManager.getDatasetRecord(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 404);
        verify(datasetManager).getDatasetRecord(record1.getResource());
    }

    @Test
    public void getDatasetRecordThatDoesNotExistTest() {
        doThrow(new IllegalArgumentException()).when(datasetManager).getDatasetRecord(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 400);
        verify(datasetManager).getDatasetRecord(record1.getResource());
    }

    @Test
    public void getDatasetRecordWithIllegalStateTest() {
        doThrow(new IllegalStateException()).when(datasetManager).getDatasetRecord(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(datasetManager).getDatasetRecord(record1.getResource());
    }

    @Test
    public void getDatasetRecordWithFailedConnectionTest() {
        doThrow(new RepositoryException()).when(datasetManager).getDatasetRecord(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue())).request().get();
        assertEquals(response.getStatus(), 500);
        verify(datasetManager).getDatasetRecord(record1.getResource());
    }

    /* DELETE datasets/{datasetId} */

    @Test
    public void deleteDatasetRecordWithForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).deleteDataset(record1.getResource());
        verify(datasetManager, never()).safeDeleteDataset(any(Resource.class));
        verify(provUtils).startDeleteActivity(user, record1.getResource());
        verify(provUtils).endDeleteActivity(deleteActivity, record1);
    }

    @Test
    public void deleteDatasetRecordWithoutForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).safeDeleteDataset(record1.getResource());
        verify(datasetManager, never()).deleteDataset(any(Resource.class));
        verify(provUtils).startDeleteActivity(user, record1.getResource());
        verify(provUtils).endDeleteActivity(deleteActivity, record1);
    }

    @Test
    public void deleteDatasetRecordThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(datasetManager).deleteDataset(any(Resource.class));
        doThrow(new IllegalArgumentException()).when(datasetManager).safeDeleteDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 400);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 400);
        verify(provUtils, times(2)).startDeleteActivity(user, record1.getResource());
        verify(provUtils, times(2)).removeActivity(deleteActivity);
    }

    @Test
    public void deleteDatasetRecordWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(datasetManager).deleteDataset(any(Resource.class));
        doThrow(new MobiException()).when(datasetManager).safeDeleteDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 500);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 500);
        verify(provUtils, times(2)).startDeleteActivity(user, record1.getResource());
        verify(provUtils, times(2)).removeActivity(deleteActivity);
    }

    /* DELETE datasets/{datasetId}/data */

    @Test
    public void clearDatasetRecordWithForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).clearDataset(record1.getResource());
        verify(datasetManager, never()).safeClearDataset(any(Resource.class));
    }

    @Test
    public void clearDatasetRecordWithoutForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).safeClearDataset(record1.getResource());
        verify(datasetManager, never()).clearDataset(any(Resource.class));
    }

    @Test
    public void clearDatasetRecordThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(datasetManager).clearDataset(any(Resource.class));
        doThrow(new IllegalArgumentException()).when(datasetManager).safeClearDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 400);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void clearDatasetRecordWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(datasetManager).clearDataset(any(Resource.class));
        doThrow(new MobiException()).when(datasetManager).safeClearDataset(any(Resource.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 500);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 500);
    }

    /* POST datasets/{datasetId}/data */

    @Test
    public void uploadDataTest() throws Exception {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("test.ttl").build(),
                getClass().getResourceAsStream("/test.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
    }

    @Test
    public void uploadDataWithUnsupportedExtensionTest() throws Exception {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("test.txt").build(),
                getClass().getResourceAsStream("/test.txt"), MediaType.APPLICATION_OCTET_STREAM_TYPE));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(importService, times(0)).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
    }

    @Test
    public void uploadDataWithBadRequestTest() throws Exception {
        // Setup:
        doThrow(new IllegalArgumentException()).when(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("test.ttl").build(),
                getClass().getResourceAsStream("/test.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
    }

    @Test
    public void uploadDataWithServerErrorTest() throws Exception {
        // Setup:
        doThrow(new IOException()).when(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart(new FormDataBodyPart(FormDataContentDisposition.name("file").fileName("test.ttl").build(),
                getClass().getResourceAsStream("/test.ttl"), MediaType.APPLICATION_OCTET_STREAM_TYPE));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd, MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class));
    }
}
