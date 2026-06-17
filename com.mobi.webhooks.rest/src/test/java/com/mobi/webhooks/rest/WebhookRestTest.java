package com.mobi.webhooks.rest;

/*-
 * #%L
 * com.mobi.webhooks.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static com.mobi.rest.test.util.ErrorResponseAssert.assertErrorContains;
import static com.mobi.rest.test.util.ErrorResponseAssert.assertErrorResponse;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.WebhookExecutor;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivity;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecordFactory;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class WebhookRestTest extends MobiRestTestCXF {

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String RECORD_IRI = "http://mobi.com/webhookRecord1";
    private static final String ACTIVITY_IRI = "https://mobi.solutions/webhooks/execution/test-activity-uuid";
    private static final String CATALOG_IRI = "http://mobi.com/catalog-local";

    private static MemoryRepositoryWrapper repo;
    private static RecordManager recordManager;
    private static EngineManager engineManager;
    private static CatalogConfigProvider configProvider;
    private static BNodeService bNodeService;
    private static WebhookConfigurationService webhookConfigurationService;
    private static WebhookExecutor webhookExecutor;
    private static OrmFactory<WebhookRecord> recordFactory;

    @SuppressWarnings("unchecked")
    private static final PaginatedSearchResults<Record> searchResults = mock(PaginatedSearchResults.class);

    private static User user;
    private static IRI recordId;
    private static IRI catalogId;
    private static WebhookRecord webhookRecord1;
    private static WebhookConfiguration webhookConfig;
    private static WebhookExecutionActivity webhookExecution;

    @SuppressWarnings("unchecked")
    private static final PaginatedSearchResults<WebhookExecutionActivity> executionResults =
            mock(PaginatedSearchResults.class);

    @BeforeClass
    public static void startServer() {
        ValueFactory vf = getValueFactory();

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        recordManager = mock(RecordManager.class);
        engineManager = mock(EngineManager.class);
        configProvider = mock(CatalogConfigProvider.class);
        bNodeService = mock(BNodeService.class);
        webhookConfigurationService = mock(WebhookConfigurationService.class);
        webhookExecutor = mock(WebhookExecutor.class);

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        recordFactory = getRequiredOrmFactory(WebhookRecord.class);
        OrmFactory<WebhookConfiguration> configFactory = getRequiredOrmFactory(WebhookConfiguration.class);
        OrmFactory<WebhookExecutionActivity> executionFactory = getRequiredOrmFactory(WebhookExecutionActivity.class);

        IRI userIRI = vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME);
        recordId = vf.createIRI(RECORD_IRI);
        catalogId = vf.createIRI(CATALOG_IRI);
        user = userFactory.createNew(userIRI);
        webhookRecord1 = recordFactory.createNew(recordId);
        webhookConfig = configFactory.createNew(vf.createIRI("http://mobi.com/webhookConfig1"));
        webhookExecution = executionFactory.createNew(vf.createIRI("http://mobi.com/activities/execution1"));

        WebhookRest rest = new WebhookRest();
        rest.recordManager = recordManager;
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;
        rest.bNodeService = bNodeService;
        rest.webhookConfigurationService = webhookConfigurationService;
        rest.webhookExecutor = webhookExecutor;
        rest.webhookRecordFactory = (WebhookRecordFactory) recordFactory;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() throws Exception {
        WebhookRecord record = recordFactory.createNew(recordId);

        reset(recordManager, engineManager, configProvider, bNodeService, searchResults,
                webhookConfigurationService, webhookExecutor, executionResults);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class))).thenReturn(record);
        when(bNodeService.skolemize(any(Statement.class))).thenAnswer(i -> i.getArgument(0, Statement.class));
        when(searchResults.page()).thenReturn(List.of(webhookRecord1));
        when(searchResults.totalSize()).thenReturn(1);
        when(searchResults.pageSize()).thenReturn(10);
        when(searchResults.pageNumber()).thenReturn(1);
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class),
                any(User.class), any(RepositoryConnection.class))).thenReturn(searchResults);
        when(webhookConfigurationService.getWebhookConfig(anyString())).thenReturn(webhookConfig);
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class),
                any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.of(webhookRecord1));
        when(webhookExecutor.createCallback(any(Resource.class), any(), any(User.class)))
                .thenReturn(new LinkedHashModel());
        when(executionResults.page()).thenReturn(List.of(webhookExecution));
        when(executionResults.totalSize()).thenReturn(1);
        when(executionResults.pageSize()).thenReturn(10);
        when(executionResults.pageNumber()).thenReturn(1);
        when(webhookExecutor.getExecutions(any(Resource.class), anyInt(), anyInt(), any(), anyBoolean()))
                .thenReturn(executionResults);
        when(webhookExecutor.getLatestExecution(any(Resource.class)))
                .thenReturn(Optional.of(webhookExecution));
    }

    @After
    public void resetMocks() {
        reset(recordManager, engineManager, configProvider, bNodeService, searchResults,
                webhookConfigurationService, webhookExecutor, executionResults);
    }

    /* Webhook Record Creation */

    /* Success Test Cases */
    @Test
    public void createWebhookRecordTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(201, response.getStatus());
        assertEquals(RECORD_IRI, response.readEntity(String.class));
        verify(recordManager).createRecord(eq(user), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void createWebhookRecordWithAllFieldsTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");
        fd.field("description", "A test description");
        fd.field("markdown", "## Markdown");
        fd.field("keywords", "kw1");
        fd.field("keywords", "kw2");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(201, response.getStatus());
        assertEquals(RECORD_IRI, response.readEntity(String.class));
        verify(recordManager).createRecord(any(User.class), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class));
    }

    /* Failure Test Cases */
    @Test
    public void createWebhookRecordUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }

    @Test
    public void createWebhookRecordMissingTitleTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 400, "IllegalArgumentException", "Title is required");
    }

    @Test
    public void createWebhookRecordIllegalStateTest() {
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class)))
                .thenThrow(new IllegalStateException("Record has no linked Webhook Configuration"));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 500, "IllegalStateException", "Record has no linked Webhook Configuration");
    }

    @Test
    public void createWebhookMobiExceptionTest() {
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class)))
                .thenThrow(new MobiException("Record manager not instantiated"));

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 500, "MobiException", "Record manager not instantiated");
    }

    @Test
    public void createWebhookRecordWithJsonldTest() {
        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#url\":[{\"@value\":\"https://example.com\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#httpMethod\":[{\"@value\":\"POST\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(201, response.getStatus());
        assertEquals(RECORD_IRI, response.readEntity(String.class));
        verify(recordManager).createRecord(eq(user), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void createWebhookRecordWithTurtleFileTest() {
        String turtle = """
                @prefix : <http://mobi.solutions/ontologies/webhooks#> .
                <http://mobi.solutions/webhooks/config/1> a :WebhookConfiguration ;
                  :url "https://example.com" ;
                  :httpMethod "POST" ;
                  :eventFilter "test" ;
                  :active "ACTIVE" .""";

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");
        fd.bodyPart("file", "config.ttl",
                new ByteArrayInputStream(turtle.getBytes(StandardCharsets.UTF_8)));

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(201, response.getStatus());
        assertEquals(RECORD_IRI, response.readEntity(String.class));
        verify(recordManager).createRecord(eq(user), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class));
    }

    @Test
    public void createWebhookRecordWithUnsupportedFileFormatTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("title", "Test Webhook");
        fd.bodyPart("file", "config.csv",
                new ByteArrayInputStream("col1,col2".getBytes(StandardCharsets.UTF_8)));

        Response response = target().path("webhooks").request()
                .post(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 400, "IllegalArgumentException",
                "Unsupported file format 'csv'. Supported: Turtle (.ttl), RDF/XML (.xml/.rdf), JSON-LD (.jsonld/.json)");
    }

    /* Webhook Record List */

    /* Success Test Cases */
    @Test
    public void findWebhookRecordsTest() throws Exception {
        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .request().get();

        assertEquals(200, response.getStatus());
        verify(recordManager).findRecord(any(Resource.class), any(PaginatedSearchParams.class),
                any(User.class), any(RepositoryConnection.class));
        verify(bNodeService, atLeastOnce()).skolemize(any(Statement.class));
        ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(1, result.size());
    }

    @Test
    public void findWebhookRecordsWithSearchTextTest() {
        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .queryParam("searchText", "test").request().get();

        assertEquals(200, response.getStatus());
        verify(recordManager).findRecord(any(Resource.class), any(PaginatedSearchParams.class),
                any(User.class), any(RepositoryConnection.class));
    }

    @Test
    public void findWebhookRecordsWithSortTest() {
        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .queryParam("sort", DCTERMS.TITLE.stringValue()).request().get();

        assertEquals(200, response.getStatus());
        verify(recordManager).findRecord(any(Resource.class), any(PaginatedSearchParams.class),
                any(User.class), any(RepositoryConnection.class));
    }

    /* Failure Test Cases */
    @Test
    public void findWebhookRecordsInvalidSortTest() {
        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .queryParam("sort", "urn:not-a-valid-sort-field").request().get();

        assertErrorResponse(response, 400, "IllegalArgumentException", "Invalid sort property IRI");
    }

    @Test
    public void findWebhookRecordsNegativeOffsetTest() {
        Response response = target().path("webhooks").queryParam("offset", -1).queryParam("limit", 10)
                .request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void findWebhookRecordsUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .request().get();

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }

    @Test
    public void findWebhookRecordsMobiExceptionTest() {
        when(recordManager.findRecord(any(Resource.class), any(PaginatedSearchParams.class),
                any(User.class), any(RepositoryConnection.class)))
                .thenThrow(new MobiException("Repository unavailable"));

        Response response = target().path("webhooks").queryParam("offset", 0).queryParam("limit", 10)
                .request().get();

        assertErrorResponse(response, 500, "MobiException", "Repository unavailable");
    }

    /* Webhook Execution Retrieval */

    /* Success Test Cases */
    @Test
    public void getWebhookExecutionsTest() throws Exception {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10).request().get();

        assertEquals(200, response.getStatus());
        verify(webhookExecutor).getExecutions(eq(recordId), eq(0), eq(10), any(), eq(false));
        ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(1, result.size());
    }

    @Test
    public void getWebhookExecutionsWithSortAndAscendingTest() {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10)
                .queryParam("sort", PROV.STARTED_AT_TIME.stringValue())
                .queryParam("ascending", true).request().get();

        assertEquals(200, response.getStatus());
        verify(webhookExecutor).getExecutions(eq(recordId), eq(0), eq(10),
                eq(PROV.STARTED_AT_TIME.stringValue()), eq(true));
    }

    @Test
    public void getLatestWebhookExecutionTest() throws Exception {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions/latest")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(webhookExecutor).getLatestExecution(recordId);
        ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(1, result.size());
    }

    @Test
    public void getLatestWebhookExecutionEmptyTest() throws Exception {
        when(webhookExecutor.getLatestExecution(any(Resource.class))).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions/latest")
                .request().get();

        assertEquals(200, response.getStatus());
        ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
        assertEquals(0, result.size());
    }

    /* Failure Test Cases */
    @Test
    public void getWebhookExecutionsRecordNotFoundTest() {
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class),
                any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10).request().get();

        assertErrorResponse(response, 404, "MobiNotFoundException",
                "WebhookRecord " + RECORD_IRI + " could not be found");
    }

    @Test
    public void getWebhookExecutionsInvalidSortTest() {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10)
                .queryParam("sort", "urn:not-a-valid-sort-field").request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void getWebhookExecutionsNegativeOffsetTest() {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", -1).queryParam("limit", 10).request().get();

        assertEquals(400, response.getStatus());
    }

    @Test
    public void getWebhookExecutionsUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10).request().get();

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }

    @Test
    public void getWebhookExecutionsMobiExceptionTest() {
        when(webhookExecutor.getExecutions(any(Resource.class), anyInt(), anyInt(), any(), anyBoolean()))
                .thenThrow(new MobiException("Prov repository unavailable"));

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions")
                .queryParam("offset", 0).queryParam("limit", 10).request().get();

        assertErrorResponse(response, 500, "MobiException", "Prov repository unavailable");
    }

    @Test
    public void getLatestWebhookExecutionRecordNotFoundTest() {
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class),
                any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions/latest")
                .request().get();

        assertErrorResponse(response, 404, "MobiNotFoundException",
                "WebhookRecord " + RECORD_IRI + " could not be found");
    }

    @Test
    public void getLatestWebhookExecutionMobiExceptionTest() {
        when(webhookExecutor.getLatestExecution(any(Resource.class)))
                .thenThrow(new MobiException("Prov repository unavailable"));

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/executions/latest")
                .request().get();

        assertErrorResponse(response, 500, "MobiException", "Prov repository unavailable");
    }

    /* Webhook Configuration Retrieval */

    /* Success Test Cases */
    @Test
    public void getWebhookConfigurationTest() {
        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/configuration")
                .request().get();

        assertEquals(200, response.getStatus());
        verify(webhookConfigurationService).getWebhookConfig(RECORD_IRI);
        verify(bNodeService, atLeastOnce()).skolemize(any(Statement.class));
    }

    /* Webhook Configuration Update */

    /* Success Test Cases */
    @Test
    public void updateWebhookConfigurationWithJsonldTest() {
        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#url\":[{\"@value\":\"https://example.com\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#httpMethod\":[{\"@value\":\"POST\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(200, response.getStatus());
        verify(webhookConfigurationService).updateConfiguration(eq(webhookRecord1), any());
    }

    @Test
    public void updateWebhookConfigurationWithTurtleFileTest() {
        String turtle = """
                @prefix : <http://mobi.solutions/ontologies/webhooks#> .
                <http://mobi.solutions/webhooks/config/1> a :WebhookConfiguration ;
                  :url "https://example.com" ;
                  :httpMethod "POST" ;
                  :eventFilter "test" ;
                  :active "ACTIVE" .""";

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "config.ttl",
                new ByteArrayInputStream(turtle.getBytes(StandardCharsets.UTF_8)));

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertEquals(200, response.getStatus());
        verify(webhookConfigurationService).updateConfiguration(eq(webhookRecord1), any());
    }

    /* Failure Test Cases */
    @Test
    public void getWebhookConfigurationNotFoundTest() {
        when(webhookConfigurationService.getWebhookConfig(anyString()))
                .thenThrow(new MobiNotFoundException("Webhook configuration not found for record: " + RECORD_IRI));

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/configuration")
                .request().get();

        assertErrorResponse(response, 404, "MobiNotFoundException",
                "Webhook configuration not found for record: " + RECORD_IRI);
    }

    @Test
    public void updateWebhookConfigurationRecordNotFoundTest() {
        when(recordManager.getRecordOpt(any(Resource.class), any(Resource.class),
                any(OrmFactory.class), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#url\":[{\"@value\":\"https://example.com\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#httpMethod\":[{\"@value\":\"POST\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 404, "MobiNotFoundException",
                "WebhookRecord " + RECORD_IRI + " could not be found");
    }

    @Test
    public void getWebhookConfigurationMobiExceptionTest() {
        when(webhookConfigurationService.getWebhookConfig(anyString()))
                .thenThrow(new MobiException("Service unavailable"));

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/configuration")
                .request().get();

        assertErrorResponse(response, 500, "MobiException", "Service unavailable");
    }

    @Test
    public void getWebhookConfigurationUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + encode(RECORD_IRI) + "/configuration")
                .request().get();

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }

    @Test
    public void updateWebhookConfigurationUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", "[]");

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }

    @Test
    public void updateWebhookConfigurationIllegalArgumentTest() {
        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#url\":[{\"@value\":\"https://example.com\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#httpMethod\":[{\"@value\":\"POST\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        doThrow(new IllegalArgumentException("WebhookRecord does not have a linked configuration"))
                .when(webhookConfigurationService).updateConfiguration(any(WebhookRecord.class), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 400, "IllegalArgumentException",
                "WebhookRecord does not have a linked configuration");
    }

    @Test
    public void updateWebhookConfigurationShaclFailureTest() {
        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        doThrow(new IllegalArgumentException("WebhookConfiguration failed SHACL validation:\n<report>"))
                .when(webhookConfigurationService).updateConfiguration(any(WebhookRecord.class), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorContains(response, 400, "IllegalArgumentException", "WebhookConfiguration failed SHACL validation");
    }

    @Test
    public void updateWebhookConfigurationUnsupportedFileFormatTest() {
        FormDataMultiPart fd = new FormDataMultiPart();
        fd.bodyPart("file", "config.csv",
                new ByteArrayInputStream("col1,col2".getBytes(StandardCharsets.UTF_8)));

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 400, "IllegalArgumentException",
                "Unsupported file format 'csv'. Supported: Turtle (.ttl), RDF/XML (.xml/.rdf), JSON-LD (.jsonld/.json)");
    }

    @Test
    public void updateWebhookConfigurationMobiExceptionTest() {
        String jsonld = "[{\"@id\":\"http://mobi.solutions/webhooks/config/1\","
                + "\"@type\":[\"http://mobi.solutions/ontologies/webhooks#WebhookConfiguration\"],"
                + "\"http://mobi.solutions/ontologies/webhooks#url\":[{\"@value\":\"https://example.com\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#httpMethod\":[{\"@value\":\"POST\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#eventFilter\":[{\"@value\":\"test\"}],"
                + "\"http://mobi.solutions/ontologies/webhooks#active\":[{\"@value\":\"ACTIVE\"}]}]";

        doThrow(new MobiException("Unexpected service failure"))
                .when(webhookConfigurationService).updateConfiguration(any(WebhookRecord.class), any());

        FormDataMultiPart fd = new FormDataMultiPart();
        fd.field("jsonld", jsonld);

        Response response = target().path("webhooks/" + ResourceUtils.encode(RECORD_IRI) + "/configuration")
                .request().put(Entity.entity(fd.body(), MediaType.MULTIPART_FORM_DATA));

        assertErrorResponse(response, 500, "MobiException", "Unexpected service failure");
    }

    /* Webhook Callback Creation */

    /* Success Test Cases */
    @Test
    public void createCallbackTest() throws Exception {
        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("{\"status\":\"done\"}", MediaType.APPLICATION_JSON));

        assertEquals(201, response.getStatus());
        verify(webhookExecutor).createCallback(any(Resource.class), any(), any(User.class));
    }

    @Test
    public void createCallbackWithEmptyBodyTest() throws Exception {
        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("", MediaType.TEXT_PLAIN));

        assertEquals(201, response.getStatus());
        verify(webhookExecutor).createCallback(any(Resource.class), any(), any(User.class));
    }

    /* Failure Test Cases */
    @Test
    public void createCallbackActivityNotFoundTest() throws Exception {
        doThrow(new IllegalArgumentException("WebhookExecutionActivity not found for IRI: " + ACTIVITY_IRI))
                .when(webhookExecutor).createCallback(any(Resource.class), any(), any(User.class));

        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("{}", MediaType.APPLICATION_JSON));

        assertErrorResponse(response, 400, "IllegalArgumentException",
                "WebhookExecutionActivity not found for IRI: " + ACTIVITY_IRI);
    }

    @Test
    public void createCallbackBodyReadErrorTest() throws Exception {
        doThrow(new IllegalStateException("Could not read callback request body: stream closed"))
                .when(webhookExecutor).createCallback(any(Resource.class), any(), any(User.class));

        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("{}", MediaType.APPLICATION_JSON));

        assertErrorResponse(response, 500, "IllegalStateException",
                "Could not read callback request body: stream closed");
    }

    @Test
    public void createCallbackMobiExceptionTest() throws Exception {
        doThrow(new MobiException("Prov repository unavailable"))
                .when(webhookExecutor).createCallback(any(Resource.class), any(), any(User.class));

        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("{}", MediaType.APPLICATION_JSON));

        assertErrorResponse(response, 500, "MobiException", "Prov repository unavailable");
    }

    @Test
    public void createCallbackUserNotFoundTest() {
        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.empty());

        Response response = target().path("webhooks/" + ResourceUtils.encode(ACTIVITY_IRI) + "/callback")
                .request().post(Entity.entity("{}", MediaType.APPLICATION_JSON));

        assertErrorResponse(response, 500, "MobiException", "User not found");
    }
}
