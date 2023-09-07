package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import org.apache.cxf.helpers.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
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
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

public class WorkflowsRestTest extends MobiRestTestCXF {
    private static WorkflowsRest rest;
    private static ValueFactory vf;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static MemoryRepositoryWrapper repo;
    private static CatalogConfigProvider configProvider;
    private static RecordManager recordManager;
    private static WorkflowManager workflowManager;
    private static EngineManager engineManager;

    private static OrmFactory<WorkflowRecord> recordFactory;
    private static OrmFactory<Branch> branchFactory;
    private static OrmFactory<Commit> commitFactory;
    private static OrmFactory<WorkflowExecutionActivity> workflowActivityFactory;
    private static OrmFactory<BinaryFile> binaryFileOrmFactory;

    private static User user;
    private static WorkflowRecord record;
    private static Branch branch;
    private static Commit commit;
    private static WorkflowExecutionActivity activity;
    private static Model workflowlModel;
    private static BinaryFile binaryFile;
    private static StreamingOutput out;
    private static IRI recordId;
    private static IRI branchId;
    private static IRI commitId;
    private static IRI activityIRI;
    private static IRI catalogId;
    private static IRI workflowId;
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
            workflowlModel = Rio.parse(stream, "", RDFFormat.TRIG);
            conn.add(workflowlModel);
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        user = userFactory.createNew(vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME));

        recordFactory = getRequiredOrmFactory(WorkflowRecord.class);
        branchFactory = getRequiredOrmFactory(Branch.class);
        commitFactory = getRequiredOrmFactory(Commit.class);
        workflowActivityFactory = getRequiredOrmFactory(WorkflowExecutionActivity.class);
        binaryFileOrmFactory = getRequiredOrmFactory(BinaryFile.class);

        catalogId = vf.createIRI("http://mobi.com/catalog");
        recordId = vf.createIRI("http://mobi.com/workflowRecord1");
        workflowId = vf.createIRI("http://example.com/workflows/A");
        activityIRI = vf.createIRI("http://example.com/activity1");
        branchId = vf.createIRI("http://mobi.com/branch");
        commitId = vf.createIRI("http://mobi.com/commit");
        binaryFileId = vf.createIRI("http://mobi.com/binaryFile");

        rest = new WorkflowsRest();
        rest.configProvider = configProvider;
        rest.recordManager = recordManager;
        rest.engineManager = engineManager;
        rest.workflowManager = workflowManager;
        rest.workflowRecordFactory = (WorkflowRecordFactory) recordFactory;

        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Before
    public void setupMocks() {
        record = recordFactory.createNew(recordId);
        branch = branchFactory.createNew(branchId);
        activity = workflowActivityFactory.createNew(activityIRI);
        record.setMasterBranch(branch);
        record.setWorkflowIRI(workflowId);
        record.setActive(true);
        commit = commitFactory.createNew(commitId);
        branch.setHead(commit);
        binaryFile = binaryFileOrmFactory.createNew(binaryFileId);
        out = os -> Stream.empty();

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class), eq(WorkflowRecord.class),
                any(RepositoryConnection.class))).thenReturn(record);
    }

    @After
    public void resetMocks() {
        reset(engineManager, configProvider, recordManager,  workflowManager);
    }

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
        fd.field("jsonld", IOUtils.toString(getClass().getResourceAsStream("/test-workflow.jsonld")));
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
        fd.field("jsonld", IOUtils.toString(getClass().getResourceAsStream("/test-workflow.jsonld")));
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
        fd.field("jsonld", IOUtils.toString(getClass().getResourceAsStream("/test-workflow.jsonld")));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

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
        fd.field("jsonld", IOUtils.toString(getClass().getResourceAsStream("/test-workflow.jsonld")));
        fd.field("title", "title");
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 400);

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "I'm an exception!");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void uploadFileWithoutTitleTest() throws IOException {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", IOUtils.toString(getClass().getResourceAsStream("/test-workflow.jsonld")));
        fd.field("description", "description");
        fd.field("markdown", "#markdown");
        fd.field("keywords", "keyword1");
        fd.field("keywords", "keyword2");

        Response response = target().path("workflows").request().post(Entity.entity(fd.body(),
                MediaType.MULTIPART_FORM_DATA));
        assertEquals(response.getStatus(), 400);
    }

    @Test
    public void executeWorkflow() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "title");

        Response response = target().path("workflows/" + encode(recordId) + "/executions")
                .request().post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(response.getStatus(), 200);
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

        assertEquals(response.getStatus(), 400);

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

        assertEquals(response.getStatus(), 400);

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "Workflow http://mobi.com/workflowRecord1 is not active");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
    }

    @Test
    public void getLatestExecution() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenReturn(record);
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);

        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));

        record.setLatestActivity(activity);

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(response.getStatus(), 200);
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getLatestExecutionNoExecution() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(response.getStatus(), 400);
        verify(workflowManager, times(0)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getLatestExecutionInvalidRecord() throws JsonProcessingException {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/latest")
                .request().get();

        assertEquals(response.getStatus(), 400);

        ObjectNode responseObject = (ObjectNode) mapper.readTree(response.readEntity(String.class));
        assertEquals(responseObject.get("error").textValue(), "IllegalArgumentException");
        assertEquals(responseObject.get("errorMessage").textValue(), "WorkflowRecord " + recordId + " could not be found");
        assertNotEquals(responseObject.get("errorMessage").textValue(), null);
        verify(workflowManager, times(0)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getExecutionActivity() {
        when(recordManager.getRecord(any(Resource.class), any(Resource.class), eq(recordFactory),
                any(RepositoryConnection.class))).thenThrow(new IllegalArgumentException("WorkflowRecord " + recordId + " could not be found"));
        when(workflowManager.startWorkflow(any(User.class), eq(record))).thenReturn(activityIRI);
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI))
                .request().get();

        assertEquals(response.getStatus(), 200);
    }

    @Test
    public void getNonExistentExecution() {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());

        Response response = target().path("workflows/" + encode(recordId) + "/executions/" + encode(activityIRI))
                .request().get();

        assertEquals(response.getStatus(), 404);
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
    }

    @Test
    public void getExecutionLogs() throws VirtualFilesystemException {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        when(workflowManager.getLogFile(eq(binaryFileId))).thenReturn(out);
        activity.setLogs(binaryFile);

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                        + encode(activityIRI) + "/logs").request().get();

        assertEquals(response.getStatus(), 200);
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
    }

    @Test
    public void getExecutionLogsNoLogs() throws VirtualFilesystemException {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.ofNullable(activity));
        activity.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(response.getStatus(), 204);
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(binaryFileId);
    }

    @Test
    public void getNonExistentExecutionLogs() throws VirtualFilesystemException {
        when(workflowManager.getExecutionActivity(eq(activityIRI))).thenReturn(Optional.empty());
        activity.clearLogs();

        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs").request().get();

        assertEquals(response.getStatus(), 400);
        verify(workflowManager, times(1)).getExecutionActivity(activityIRI);
        verify(workflowManager, times(0)).getLogFile(binaryFileId);
    }

    @Test
    public void getLogs() throws VirtualFilesystemException {
        when(workflowManager.getLogFile(eq(binaryFileId))).thenReturn(out);
        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(response.getStatus(), 200);
        verify(workflowManager, times(1)).getLogFile(binaryFileId);
    }

    @Test
    public void getNonExistentLogs() throws VirtualFilesystemException {
        when(workflowManager.getLogFile(eq(binaryFileId)))
                .thenThrow(new IllegalArgumentException("Log file " + binaryFileId + " does not exist on the system."));
        Response response = target().path("workflows/" + encode(recordId) + "/executions/"
                + encode(activityIRI) + "/logs/" + encode(binaryFileId)).request().get();

        assertEquals(response.getStatus(), 400);
    }

}
