package com.mobi.dataset.rest;

/*-
 * #%L
 * com.mobi.dataset.rest
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
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.config.DatasetRecordCreateSettings;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import net.sf.json.JSONArray;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.Link;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class DatasetRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private OrmFactory<Branch> branchFactory;
    private DatasetRecord record1;
    private DatasetRecord record2;
    private DatasetRecord record3;
    private Commit commit;
    private Branch branch;
    private User user;

    private IRI errorIRI;
    private IRI localIRI;
    private IRI ontologyRecordIRI;
    private IRI branchIRI;
    private IRI commitIRI;

    // Mock services used in server
    private static DatasetRest rest;
    private static ValueFactory vf;
    private static DatasetManager datasetManager;
    private static EngineManager engineManager;
    private static RecordManager recordManager;
    private static BranchManager branchManager;
    private static CommitManager commitManager;
    private static CatalogConfigProvider configProvider;
    private static BNodeService service;
    private static RDFImportService importService;

    @Mock
    private PaginatedSearchResults<DatasetRecord> results;

    @Mock
    private PaginatedSearchResults<Record> recordResults;

    @Mock
    private OsgiRepository repo;

    @Mock
    private RepositoryConnection mockConn;

    @BeforeClass
    public static void startServer() {
        vf = getValueFactory();

        datasetManager = Mockito.mock(DatasetManager.class);
        engineManager = Mockito.mock(EngineManager.class);
        recordManager = Mockito.mock(RecordManager.class);
        branchManager = Mockito.mock(BranchManager.class);
        commitManager = Mockito.mock(CommitManager.class);
        configProvider = Mockito.mock(CatalogConfigProvider.class);
        service = Mockito.mock(BNodeService.class);
        importService = Mockito.mock(RDFImportService.class);

        rest = new DatasetRest();
        rest.manager = datasetManager;
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;
        rest.recordManager = recordManager;
        rest.branchManager = branchManager;
        rest.commitManager = commitManager;
        rest.bNodeService = service;
        rest.importService = importService;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        errorIRI = vf.createIRI("http://example.com/error");
        localIRI = vf.createIRI("http://example.com/catalogs/local");
        ontologyRecordIRI = vf.createIRI("http://example.com/ontologyRecord");
        branchIRI = vf.createIRI("http://example.com/branch");
        commitIRI = vf.createIRI("http://example.com/commit");

        branchFactory = getRequiredOrmFactory(Branch.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<DatasetRecord> datasetRecordFactory = getRequiredOrmFactory(DatasetRecord.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

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

        closeable = MockitoAnnotations.openMocks(this);
        when(configProvider.getLocalCatalogIRI()).thenReturn(localIRI);
        when(configProvider.getRepository()).thenReturn(repo);
        when(repo.getConnection()).thenReturn(mockConn);
        reset(datasetManager, recordManager, branchManager, results, service, importService);

        when(service.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));

        when(datasetManager.getDatasetRecord(any(Resource.class))).thenReturn(Optional.of(record1));
        when(datasetManager.getDatasetRecords(any(DatasetPaginatedSearchParams.class))).thenReturn(results);
        when(datasetManager.deleteDataset(eq(record1.getResource()), any(User.class))).thenReturn(record1);
        when(datasetManager.safeDeleteDataset(eq(record1.getResource()), any(User.class))).thenReturn(record1);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));

        when(recordResults.getPage()).thenReturn(Stream.of(record1, record2, record3).collect(Collectors.toList()));
        when(recordResults.getPageNumber()).thenReturn(1);
        when(recordResults.getPageSize()).thenReturn(10);
        when(recordResults.getTotalSize()).thenReturn(3);

        when(branchManager.getMasterBranch(eq(localIRI), eq(ontologyRecordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class))).thenReturn(recordResults);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), any(), any(RepositoryConnection.class))).thenReturn(record1);
        when(commitManager.getHeadCommitIRI(eq(branch))).thenReturn(commitIRI);

        when(results.getPage()).thenReturn(Stream.of(record1, record2, record3).collect(Collectors.toList()));
        when(results.getPageNumber()).thenReturn(1);
        when(results.getPageSize()).thenReturn(10);
        when(results.getTotalSize()).thenReturn(3);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    /* GET datasets */

    @Test
    public void getDatasetRecordsTest() {
        Response response = target().path("datasets").request().get();
        assertEquals(response.getStatus(), 200);
        verify(recordManager).findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class));
        verify(datasetManager, never()).getDatasetRecords(any(DatasetPaginatedSearchParams.class));
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
        when(recordResults.getPage()).thenReturn(Collections.singletonList(record2));
        when(recordResults.getPageNumber()).thenReturn(2);
        when(recordResults.getPageSize()).thenReturn(1);

        Response response = target().path("datasets").queryParam("offset", 1).queryParam("limit", 1).request().get();
        assertEquals(response.getStatus(), 200);

        verify(recordManager).findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class));
        verify(datasetManager, never()).getDatasetRecords(any(DatasetPaginatedSearchParams.class));

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
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class), any(User.class), any(RepositoryConnection.class))).thenThrow(new MobiException());

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
                .field("markdown", "#markdown")
                .field("keywords", "test")
                .field("keywords", "demo")
                .field("ontologies", ontologyRecordIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), any(), any(RepositoryConnection.class));
        assertEquals("http://example.com/dataset", config.getValue().get(DatasetRecordCreateSettings.DATASET));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("test", "demo").collect(Collectors.toSet()), config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertEquals("http://example.com/dataset", config.getValue().get(DatasetRecordCreateSettings.DATASET));
        assertEquals("system", config.getValue().get(DatasetRecordCreateSettings.REPOSITORY_ID));
        assertEquals(1, config.getValue().get(DatasetRecordCreateSettings.ONTOLOGIES).size());
        verify(branchManager).getMasterBranch(eq(localIRI), eq(ontologyRecordIRI), any(RepositoryConnection.class));
        assertEquals(response.readEntity(String.class), record1.getResource().stringValue());
    }

    @Test
    public void createDatasetRecordWithoutTitleTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("repositoryId", "system");

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithoutRepositoryIdTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title");

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithInvalidParametersTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "error");
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), any(), any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithMissingOntologyRecordTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(localIRI), eq(errorIRI), any(RepositoryConnection.class));
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", errorIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void createDatasetRecordWithMissingMasterBranchTest() {
        // Setup:
        doThrow(new IllegalStateException()).when(branchManager).getMasterBranch(eq(localIRI), eq(errorIRI), any(RepositoryConnection.class));
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", errorIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void createDatasetRecordWithNoHeadCommitTest() {
        // Setup:
        Branch newBranch = branchFactory.createNew(branchIRI);
        when(branchManager.getMasterBranch(eq(localIRI), eq(ontologyRecordIRI), any(RepositoryConnection.class))).thenReturn(newBranch);
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system")
                .field("ontologies", ontologyRecordIRI.stringValue());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
    }

    @Test
    public void createDatasetRecordWithErrorTest() {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart().field("title", "title")
                .field("repositoryId", "system");
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), any(), any(RepositoryConnection.class))).thenThrow(new MobiException());

        Response response = target().path("datasets").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
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
        verify(datasetManager).deleteDataset(record1.getResource(), user);
        verify(datasetManager, never()).safeDeleteDataset(any(Resource.class), any(User.class));
    }

    @Test
    public void deleteDatasetRecordWithoutForceTest() {
        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 200);
        verify(datasetManager).safeDeleteDataset(record1.getResource(), user);
        verify(datasetManager, never()).deleteDataset(any(Resource.class), any(User.class));
    }

    @Test
    public void deleteDatasetRecordThatDoesNotExistTest() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(datasetManager).deleteDataset(any(Resource.class), any(User.class));
        doThrow(new IllegalArgumentException()).when(datasetManager).safeDeleteDataset(any(Resource.class), any(User.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 400);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void deleteDatasetRecordWithErrorTest() {
        // Setup:
        doThrow(new MobiException()).when(datasetManager).deleteDataset(any(Resource.class), any(User.class));
        doThrow(new MobiException()).when(datasetManager).safeDeleteDataset(any(Resource.class), any(User.class));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", false).request().delete();
        assertEquals(response.getStatus(), 500);

        response = target().path("datasets/" + encode(record1.getResource().stringValue()))
                .queryParam("force", true).request().delete();
        assertEquals(response.getStatus(), 500);
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
        fd.bodyPart("file", "test.ttl", getClass().getResourceAsStream("/test.ttl"));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 200);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
    }

    @Test
    public void uploadDataWithUnsupportedExtensionTest() throws Exception {
        // Setup:
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test.txt", getClass().getResourceAsStream("/test.txt"));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(importService, times(0)).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
    }

    @Test
    public void uploadDataWithBadRequestTest() throws Exception {
        // Setup:
        doThrow(new IllegalArgumentException()).when(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test.ttl", getClass().getResourceAsStream("/test.ttl"));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
    }

    @Test
    public void uploadDataWithServerErrorTest() throws Exception {
        // Setup:
        doThrow(new IOException()).when(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test.ttl", getClass().getResourceAsStream("/test.ttl"));

        Response response = target().path("datasets/" + encode(record1.getResource().stringValue()) + "/data")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 500);
        verify(importService).importInputStream(any(ImportServiceConfig.class), any(InputStream.class), eq(true));
    }
}
