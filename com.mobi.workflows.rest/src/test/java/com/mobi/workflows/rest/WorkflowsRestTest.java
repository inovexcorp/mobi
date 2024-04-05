package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.PaginatedWorkflowSearchParams;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import org.apache.cxf.helpers.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

public class WorkflowsRestTest extends MobiRestTestCXF {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static MemoryRepositoryWrapper repo;
    private static CatalogConfigProvider configProvider;
    private static RecordManager recordManager;
    private static WorkflowManager workflowManager;
    private static EngineManager engineManager;
    private static VirtualFilesystem vfs;
    private static final String fileLocation;

    static {
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        fileLocation = builder.append("com.mobi.workflows.impl/").toString();
    }

    private static OrmFactory<WorkflowRecord> recordFactory;
    private static OrmFactory<Branch> branchFactory;
    private static OrmFactory<Commit> commitFactory;
    private static OrmFactory<WorkflowExecutionActivity> workflowActivityFactory;
    private static OrmFactory<ActionExecution> actionExecutionFactory;
    private static OrmFactory<BinaryFile> binaryFileFactory;
    private static ValueFactory vf;

    private static User user;
    private static WorkflowRecord record;
    private static WorkflowExecutionActivity activity;
    private static ActionExecution actionExecution1;
    private static ActionExecution actionExecution2;
    private static BinaryFile binaryFile;
    private static IRI recordId;
    private static IRI branchId;
    private static IRI commitId;
    private static IRI activityIRI;
    private static IRI catalogId;
    private static IRI workflowId;
    private static IRI actionExecutionId1;
    private static IRI actionExecutionId2;
    private static IRI binaryFileId;

    @BeforeClass
    public static void startServer() throws Exception {
        vf = getValueFactory();
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        engineManager = mock(EngineManager.class) ;
        configProvider = mock(CatalogConfigProvider.class);
        recordManager = mock(RecordManager.class);
        workflowManager = mock(WorkflowManager.class);

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream stream = new ByteArrayInputStream("<http://mobi.com/branch> <http://mobi.com/ontologies/catalog#head> <http://mobi.com/commit> .".getBytes(StandardCharsets.UTF_8));
            Model workflowlModel = Rio.parse(stream, "", RDFFormat.TRIG);
            conn.add(workflowlModel);
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));

        recordFactory = getRequiredOrmFactory(WorkflowRecord.class);
        branchFactory = getRequiredOrmFactory(Branch.class);
        commitFactory = getRequiredOrmFactory(Commit.class);
        workflowActivityFactory = getRequiredOrmFactory(WorkflowExecutionActivity.class);
        actionExecutionFactory = getRequiredOrmFactory(ActionExecution.class);
        binaryFileFactory = getRequiredOrmFactory(BinaryFile.class);

        catalogId = vf.createIRI("http://mobi.com/catalog");
        recordId = vf.createIRI("http://mobi.com/workflowRecord1");
        workflowId = vf.createIRI("http://example.com/workflows/A");
        actionExecutionId1 = vf.createIRI("http://example.com/action-execution/1");
        actionExecutionId2 = vf.createIRI("http://example.com/action-execution/2");
        activityIRI = vf.createIRI("http://example.com/activity1");
        branchId = vf.createIRI("http://mobi.com/branch");
        commitId = vf.createIRI("http://mobi.com/commit");
        binaryFileId = vf.createIRI("http://mobi.com/binaryFile");

        // Setup VirtualFileSystem
        SimpleVirtualFilesystemConfig config = mock(SimpleVirtualFilesystemConfig.class);
        vfs = new SimpleVirtualFilesystem();
        when(config.maxNumberOfTempFiles()).thenReturn(10000);
        when(config.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(config.defaultRootDirectory()).thenReturn(fileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, config);
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        if (!directory.exists()) {
            directory.createFolder();
        }

        WorkflowsRest rest = new WorkflowsRest();
        rest.configProvider = configProvider;
        rest.recordManager = recordManager;
        rest.engineManager = engineManager;
        rest.workflowManager = workflowManager;
        rest.vfs = vfs;
        rest.workflowRecordFactory = (WorkflowRecordFactory) recordFactory;

        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        record = recordFactory.createNew(recordId);
        Branch branch = branchFactory.createNew(branchId);
        activity = workflowActivityFactory.createNew(activityIRI);
        activity.addProperty(recordId, PROV.USED);
        record.setMasterBranch(branch);
        record.setWorkflowIRI(workflowId);
        record.setActive(true);
        Commit commit = commitFactory.createNew(commitId);
        branch.setHead(commit);
        binaryFile = binaryFileFactory.createNew(binaryFileId);
        String path = copyToTemp();
        String filePath = "file://" + path;
        binaryFile.setRetrievalURL(vf.createIRI(filePath));
        binaryFile.setFileName("test-log-file.txt");
        actionExecution1 = actionExecutionFactory.createNew(actionExecutionId1);
        actionExecution1.addLogs(binaryFile);
        actionExecution2 = actionExecutionFactory.createNew(actionExecutionId2);

        when(workflowManager.getLogFile(binaryFileId)).thenReturn(binaryFile);
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(WorkflowRecord.class),
                any(RepositoryConnection.class))).thenReturn(record);
    }

    @After
    public void resetMocks() throws Exception {
        reset(engineManager, configProvider, recordManager,  workflowManager);
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        for (VirtualFile child : directory.getChildren()) {
            child.deleteAll();
        }
        directory.close();
    }

    /* GET */

    @Test
    public void findWorkflowRecordsTest() {
        PaginatedSearchResults<ObjectNode> results = new PaginatedSearchResults<ObjectNode>() {
            @Override
            public List<ObjectNode> getPage() {
                return Stream.of(mapper.createObjectNode()).toList();
            }

            @Override
            public int getTotalSize() {
                return 10;
            }

            @Override
            public int getPageSize() {
                return 10;
            }

            @Override
            public int getPageNumber() {
                return 1;
            }
        };
        when(workflowManager.findWorkflowRecords(any(), any(), any())).thenReturn(results);
        Response response = target().path("workflows")
                .queryParam("offset", 1)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("sort", "title")
                .queryParam("searchText", "searchText")
                .queryParam("status", "success")
                .queryParam("startingAfter", "2024-03-13T15:00:00.015Z")
                .queryParam("endingBefore", "2024-03-14T15:00:00.015Z")
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedWorkflowSearchParams.Builder builder = new PaginatedWorkflowSearchParams.Builder()
                .offset(1)
                .limit(10)
                .ascending(false)
                .sortBy("title")
                .searchText("searchText")
                .status("success")
                .startingAfter("2024-03-13T15:00:00.015Z")
                .endingBefore("2024-03-14T15:00:00.015Z");

        verify(workflowManager).findWorkflowRecords(eq(builder.build()), eq(user), any());
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + results.getTotalSize());
        assertEquals(1, response.getLinks().size());
        try {
            ArrayNode result = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            assertEquals(results.getPage().size(), result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* POST */
    @Test
    public void uploadFileTest() throws JsonProcessingException {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "test-workflow.ttl", getClass()
                .getResourceAsStream("/test-workflow.ttl"));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertTrue(responseObject.has("WorkflowId"));
        assertEquals(responseObject.get("WorkflowId").textValue(), workflowId.stringValue());
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), eq(WorkflowRecord.class),
                any(RepositoryConnection.class));
        assertEquals(catalogId.stringValue(), config.getValue().get(RecordCreateSettings.CATALOG_ID));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("keyword1", "keyword2").collect(Collectors.toSet()),
                config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        assertNotNull(config.getValue().get(VersionedRDFRecordCreateSettings.INPUT_STREAM));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    @Test
    public void uploadJSONLDTest() throws IOException {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-workflow.jsonld"))));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 201);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertTrue(responseObject.has("WorkflowId"));
        assertEquals(responseObject.get("WorkflowId").textValue(), workflowId.stringValue());
        ArgumentCaptor<RecordOperationConfig> config = ArgumentCaptor.forClass(RecordOperationConfig.class);
        verify(recordManager).createRecord(any(User.class), config.capture(), eq(WorkflowRecord.class),
                any(RepositoryConnection.class));
        assertEquals(catalogId.stringValue(), config.getValue().get(RecordCreateSettings.CATALOG_ID));
        assertEquals("title", config.getValue().get(RecordCreateSettings.RECORD_TITLE));
        assertEquals("description", config.getValue().get(RecordCreateSettings.RECORD_DESCRIPTION));
        assertEquals("#markdown", config.getValue().get(RecordCreateSettings.RECORD_MARKDOWN));
        assertEquals(Stream.of("keyword1", "keyword2").collect(Collectors.toSet()),
                config.getValue().get(RecordCreateSettings.RECORD_KEYWORDS));
        assertEquals(Collections.singleton(user), config.getValue().get(RecordCreateSettings.RECORD_PUBLISHERS));
        verify(engineManager, atLeastOnce()).retrieveUser(anyString());
    }

    @Test
    public void uploadErrorMobiExceptionTest() throws IOException {
        Mockito.doThrow(new MobiException("I'm an exception!")).when(recordManager).createRecord(any(), any(), any(),
                any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-workflow.jsonld"))));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "MobiException");
        assertEquals(responseObject.get("errorMessage").textValue(), "I'm an exception!");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void uploadErrorRDFParseExceptionTest() throws IOException {
        Mockito.doThrow(new RDFParseException("I'm an exception!"))
                .when(recordManager).createRecord(any(), any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-workflow.jsonld"))));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "RDFParseException");
        assertEquals(responseObject.get("errorMessage").textValue(), "I'm an exception!");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void uploadErrorIllegalArgumentExceptionTest() throws IOException {
        Mockito.doThrow(new IllegalArgumentException("I'm an exception!")).when(recordManager)
                .createRecord(any(), any(), any(), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-workflow.jsonld"))));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "I'm an exception!");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void uploadFileWithoutTitleTest() throws IOException {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/test-workflow.jsonld"))));
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(400, response.getStatus());
    }

    /* POST {workflowId}/executions */

    @Test
    public void executeWorkflow() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");

        Response response = target().path("workflows/" + encode(recordId) + "/executions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).startWorkflow(user, record);
    }

    @Test
    public void executeWorkflowNoRecord() throws JsonProcessingException {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");
        Response response = target().path("workflows/" + encode(recordId) + "/executions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "WorkflowRecord " + recordId + " could not be found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void executeWorkflowNoActiveStatus() throws JsonProcessingException {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);

        record.clearActive();

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");
        Response response = target().path("workflows/" + encode(recordId) + "/executions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 500);

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalStateException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Workflow Records must have active status.");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void executeWorkflowNotActive() throws JsonProcessingException {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);

        record.setActive(false);

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");
        Response response = target().path("workflows/" + encode(recordId) + "/executions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Workflow http://mobi.com/workflowRecord1 is not active");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    /* GET {workflowRecordIri}/executions */

    @Test
    public void findWorkflowExecutionActivitiesTest() {
        PaginatedSearchResults<ObjectNode> results = new PaginatedSearchResults<ObjectNode>() {
            @Override
            public List<ObjectNode> getPage() {
                return Stream.of(mapper.createObjectNode()).toList();
            }

            @Override
            public int getTotalSize() {
                return 10;
            }

            @Override
            public int getPageSize() {
                return 10;
            }

            @Override
            public int getPageNumber() {
                return 1;
            }
        };
        when(workflowManager.findWorkflowExecutionActivities(any(), any(), any(), any())).thenReturn(results);
        Response response = target().path("workflows/" + encode(workflowId) + "/executions")
                .queryParam("offset", 1)
                .queryParam("limit", 10)
                .queryParam("ascending", false)
                .queryParam("status", "success")
                .queryParam("startingAfter", "2024-03-13T15:00:00.015Z")
                .queryParam("endingBefore", "2024-03-14T15:00:00.015Z")
                .request().get();
        assertEquals(200, response.getStatus());

        PaginatedWorkflowSearchParams.Builder builder = new PaginatedWorkflowSearchParams.Builder()
                .offset(1)
                .limit(10)
                .ascending(false)
                .status("success")
                .startingAfter("2024-03-13T15:00:00.015Z")
                .endingBefore("2024-03-14T15:00:00.015Z");

        verify(workflowManager).findWorkflowExecutionActivities(eq(workflowId), eq(builder.build()), eq(user), any());
        MultivaluedMap<String, Object> headers = response.getHeaders();
        assertEquals(headers.get("X-Total-Count").get(0), "" + results.getTotalSize());
        assertEquals(1, response.getLinks().size());
        try {
            ArrayNode result = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            assertEquals(results.getPage().size(), result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    /* GET {workflowId}/executions/latest */

    @Test
    public void getLatestExecution() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);

        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));

        record.setLatestActivity(activity);

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getLatestExecutionNoExecution() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(0)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getLatestExecutionInvalidRecord() throws JsonProcessingException {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(400, response.getStatus());

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "WorkflowRecord " + recordId + " could not be found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
        verify(workflowManager, times(0)).getExecutionActivity(activityIRI);
    }


    /* GET {workflowId}/executions/{activityId} */

    @Test
    public void getExecutionActivity() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI))
                .request().get();

        assertEquals(200, response.getStatus());
    }

    @Test
    public void getExecutionActivityIncorrectWorkflow() throws Exception {
        WorkflowExecutionActivity newActivity = workflowActivityFactory.createNew(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(newActivity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI))
                .request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity is not related to the specified Workflow");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getNonExistentExecution() throws Exception {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI))
                .request().get();

        assertEquals(404, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "MobiNotFoundException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity " + activityIRI + " not found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    /* GET {workflowId}/executions/{activityId}/actions */

    @Test
    public void getActionExecutions() {
        // Setup
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        when(workflowManager.getActionExecutions(any(Resource.class))).thenReturn(new HashSet<>(Arrays.asList(actionExecution1, actionExecution2)));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI) + "/actions")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getActionExecutions(activityIRI);
        try {
            ArrayNode result = (ArrayNode) mapper.readTree(response.readEntity(String.class));
            assertEquals(2, result.size());
            JsonNode firstRecord = result.get(0);
            assertTrue(firstRecord.has("@id"));
            assertEquals(actionExecutionId1.stringValue(), firstRecord.get("@id").textValue());
            JsonNode secondRecord = result.get(1);
            assertTrue(secondRecord.has("@id"));
            assertEquals(actionExecutionId2.stringValue(), secondRecord.get("@id").textValue());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getActionExecutionsIncorrectWorkflow() throws Exception {
        // Setup
        WorkflowExecutionActivity newActivity = workflowActivityFactory.createNew(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(newActivity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI) + "/actions")
                .request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getActionExecutions(any(Resource.class));
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity is not related to the specified Workflow");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getActionExecutionsNonexistentActivity() throws Exception {
        // Setup
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI) + "/actions")
                .request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getActionExecutions(any(Resource.class));
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity " + activityIRI + " not found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    /* GET {workflowId}/executions/{activityId}/logs */

    @Test
    public void getExecutionLogs() {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        activity.addLogs(binaryFile);

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                        + encode(activityIRI) + "/logs").request().get();

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
    }

    @Test
    public void getNonExistentExecutionLogs() throws Exception {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        activity.addLogs(binaryFile);
        when(workflowManager.getLogFile(any(Resource.class)))
                .thenThrow(new IllegalArgumentException("Log file " + binaryFileId + " does not exist on the system."));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Log file " + binaryFileId + " does not exist on the system.");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getExecutionLogsIncorrectWorkflow() throws Exception {
        // Setup:
        WorkflowExecutionActivity newActivity = workflowActivityFactory.createNew(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(newActivity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(any(Resource.class));
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity is not related to the specified Workflow");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getExecutionLogsNoLogs() {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        activity.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(204, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(binaryFileId);
    }

    @Test
    public void getExecutionLogsNonExistentActivity() throws Exception {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());
        activity.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(binaryFileId);
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity " + activityIRI + " not found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    /* GET {workflowId}/executions/{activityId}/logs/{logId} */

    @Test
    public void getLogs() {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        when(workflowManager.getActionExecutions(any(Resource.class))).thenReturn(new HashSet<>(Arrays.asList(actionExecution1, actionExecution2)));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
    }

    @Test
    public void getLogsRelatedToActivity() {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        activity.addLogs(binaryFile);
        when(workflowManager.getActionExecutions(any(Resource.class))).thenReturn(new HashSet<>(Arrays.asList(actionExecution1, actionExecution2)));
        actionExecution1.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(200, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
    }

    @Test
    public void getNonRelatedLogs() throws Exception {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        when(workflowManager.getActionExecutions(any(Resource.class))).thenReturn(new HashSet<>(Arrays.asList(actionExecution1, actionExecution2)));
        actionExecution1.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(400, response.getStatus());
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(any(Resource.class));
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Log " + binaryFileId + " is not related to Activity " + activityIRI);
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getNonExistentLogs() throws Exception {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        when(workflowManager.getActionExecutions(any(Resource.class))).thenReturn(new HashSet<>(Arrays.asList(actionExecution1, actionExecution2)));
        when(workflowManager.getLogFile(eq(binaryFileId)))
                .thenThrow(new IllegalArgumentException("Log file " + binaryFileId + " does not exist on the system."));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(400, response.getStatus());
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Log file " + binaryFileId + " does not exist on the system.");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getLogsUnrelatedActivity() throws Exception {
        // Setup:
        WorkflowExecutionActivity newActivity = workflowActivityFactory.createNew(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(newActivity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(400, response.getStatus());
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity is not related to the specified Workflow");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getLogsNonExistentActivity() throws Exception {
        // Setup:
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(400, response.getStatus());
        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Execution Activity " + activityIRI + " not found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    private String copyToTemp() throws IOException {
        String resourceName = "test-log-file.txt";
        String absolutePath = fileLocation + resourceName;
        Files.copy(Objects.requireNonNull(getClass().getResourceAsStream("/" + resourceName)), Paths.get(absolutePath), StandardCopyOption.REPLACE_EXISTING);
        return absolutePath;
    }

}
