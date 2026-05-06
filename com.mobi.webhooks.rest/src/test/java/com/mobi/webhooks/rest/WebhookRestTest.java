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

import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getRequiredOrmFactory;
import static com.mobi.rdf.orm.test.OrmEnabledTestCase.getValueFactory;
import static com.mobi.rest.test.util.ErrorResponseAssert.assertErrorResponse;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.rest.test.util.FormDataMultiPart;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.test.util.UsernameTestFilter;
import com.mobi.rest.util.RestUtils;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class WebhookRestTest extends MobiRestTestCXF {

    private static final String RECORD_IRI = "http://mobi.com/webhookRecord1";
    private static final String CATALOG_IRI = "http://mobi.com/catalog-local";

    private static MemoryRepositoryWrapper repo;
    private static RecordManager recordManager;
    private static EngineManager engineManager;
    private static CatalogConfigProvider configProvider;
    private static OrmFactory<WebhookRecord> recordFactory;

    private static User user;
    private static IRI recordId;
    private static IRI catalogId;

    @BeforeClass
    public static void startServer() {
        ValueFactory vf = getValueFactory();

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        repo.init();

        recordManager = mock(RecordManager.class);
        engineManager = mock(EngineManager.class);
        configProvider = mock(CatalogConfigProvider.class);

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        recordFactory = getRequiredOrmFactory(WebhookRecord.class);

        IRI userIRI = vf.createIRI("http://mobi.com/users/" + UsernameTestFilter.USERNAME);
        recordId = vf.createIRI(RECORD_IRI);
        catalogId = vf.createIRI(CATALOG_IRI);
        user = userFactory.createNew(userIRI);

        WebhookRest rest = new WebhookRest();
        rest.recordManager = recordManager;
        rest.engineManager = engineManager;
        rest.configProvider = configProvider;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setupMocks() {
        WebhookRecord record = recordFactory.createNew(recordId);

        reset(recordManager, engineManager, configProvider);

        when(engineManager.retrieveUser(anyString())).thenReturn(Optional.of(user));
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(configProvider.getRepository()).thenReturn(repo);
        when(recordManager.createRecord(any(User.class), any(RecordOperationConfig.class),
                eq(WebhookRecord.class), any(RepositoryConnection.class))).thenReturn(record);
    }

    @After
    public void resetMocks() {
        reset(recordManager, engineManager, configProvider);
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
}
