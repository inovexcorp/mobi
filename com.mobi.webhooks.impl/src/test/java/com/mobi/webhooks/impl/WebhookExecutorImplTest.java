package com.mobi.webhooks.impl;

/*-
 * #%L
 * com.mobi.webhooks.impl
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
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.WebhookExecutorConfig;
import com.mobi.webhooks.api.ontology.webhooks.ConnectionAttempt;
import com.mobi.webhooks.api.ontology.webhooks.ConnectionAttemptFactory;
import com.mobi.webhooks.api.ontology.webhooks.Header;
import com.mobi.webhooks.api.ontology.webhooks.HeaderFactory;
import com.mobi.webhooks.api.ontology.webhooks.RequestHeader;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivity;

import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivityFactory;
import org.apache.commons.io.IOUtils;
import org.apache.http.StatusLine;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.message.BasicHeader;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.event.Event;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

public class WebhookExecutorImplTest {

    private static final ValueFactory VF = new ValidatingValueFactory();
    private static final IRI USER_IRI = VF.createIRI("https://mobi.com/users/test-user");
    private static final IRI RECORD_IRI = VF.createIRI("https://mobi.com/records#test-record");
    private static final IRI SECOND_RECORD_IRI = VF.createIRI("https://mobi.com/records#second-test");
    private static final String MATCHING_TOPIC_STRING = "com/mobi/catalog/version";
    private static final String MATCHING_TOPIC_FILTER = "(&(event.topics=com/mobi/catalog/version))";
    private static final String NON_MATCHING_TOPIC_FILTER = "(&(event.topics=com/mobi/catalog/data/changed))";

    private final RepositoryManager repoManager = new SimpleRepositoryManager();
    private final OrmFactory<WebhookExecutionActivity> webhookExecutionActivityFactory = getRequiredOrmFactory(WebhookExecutionActivity.class);
    private final OrmFactory<ConnectionAttempt> connectionAttemptFactory = getRequiredOrmFactory(ConnectionAttempt.class);
    private final OrmFactory<Header> headerFactory = getRequiredOrmFactory(Header.class);
    private final OrmFactory<Entity> entityFactory = getRequiredOrmFactory(Entity.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    @Mock
    private WebhookConfigurationService webhookConfigurationService;

    @Mock
    private ProvenanceService provService;

    @Mock
    private WebhookConfiguration webhookConfiguration;

    @Mock
    private WebhookExecutorConfig config;

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private EngineManager engineManager;

    @Mock
    private CloseableHttpClient httpClient;

    @Mock
    private CloseableHttpResponse httpResponse;

    @Mock
    private RequestHeader requestHeader;

    private AutoCloseable closeable;
    private WebhookExecutorImpl executor;
    private OsgiRepository repo;
    private WebhookExecutionActivity webhookExecutionActivity;

    @Before
    public void setUp() throws IOException, InterruptedException {
        closeable = MockitoAnnotations.openMocks(this);
        repo = repoManager.createMemoryRepository();
        MemoryRepositoryWrapper provRepository = new MemoryRepositoryWrapper();
        provRepository.setDelegate(new SailRepository(new MemoryStore()));
        webhookExecutionActivity = webhookExecutionActivityFactory.createNew(VF.createIRI("https://mobi.com/activities/test-activity"));
        User user = userFactory.createNew(USER_IRI);
        user.setUsername(VF.createLiteral("test user"));

        when(config.connectionTimeout()).thenReturn(5000);
        when(config.retryLimit()).thenReturn(3);

        when(requestHeader.getHasHeaderName()).thenReturn(Optional.of("content-type"));
        when(requestHeader.getHasHeaderValue()).thenReturn(Optional.of("text/plain"));

        when(webhookConfiguration.getUrl()).thenReturn(Optional.of("https://www.example.com"));
        when(webhookConfiguration.getHttpMethod()).thenReturn(Optional.of("GET"));
        when(webhookConfiguration.getHasRequestHeader()).thenReturn(new HashSet<>(Set.of(requestHeader)));
        when(webhookConfiguration.getSecretToken()).thenReturn(Optional.empty());

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getRepositoryId()).thenReturn("System");

        when(engineManager.retrieveUser(any())).thenReturn(Optional.of(user));
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(webhookExecutionActivity);

        when(httpResponse.getStatusLine()).thenReturn(mock(StatusLine.class));
        when(httpResponse.getStatusLine().getStatusCode()).thenReturn(200);
        when(httpResponse.getEntity()).thenReturn(new StringEntity(""));


        when(httpResponse.getAllHeaders()).thenReturn(new org.apache.http.Header[]{
                 new BasicHeader("Content-Type", "application/json"),
        });

        doReturn(httpResponse).when(httpClient).execute(any(HttpUriRequest.class));

        executor = new WebhookExecutorImpl();
        executor.webhookConfigurationService = webhookConfigurationService;
        executor.provService = provService;
        executor.provRepository = provRepository;
        executor.webhookExecutionActivityFactory = (WebhookExecutionActivityFactory) webhookExecutionActivityFactory;
        executor.connectionAttemptFactory = (ConnectionAttemptFactory) connectionAttemptFactory;
        executor.headerFactory = (HeaderFactory) headerFactory;
        executor.configProvider = configProvider;
        executor.entityFactory = (EntityFactory) entityFactory;
        executor.engineManager = engineManager;

        executor.activate(config);
        executor.httpClient = httpClient;
    }

    @After
    public void tearDown() throws Exception {
        closeable.close();
    }

    /* handleEvent() */

    @Test
    public void handlesEventWithNoMatchingWebhookConfigs() {
        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(Collections.emptyMap());

        executor.handleEvent(event);

        verify(webhookConfigurationService, never()).getWebhookConfig(any(String.class));
        verify(provService, never()).addActivity(any());
    }

    @Test
    public void handlesEventWithNonMatchingFilter() {
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, NON_MATCHING_TOPIC_FILTER);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);

        executor.handleEvent(event);

        verify(webhookConfigurationService, never()).getWebhookConfig(anyString());
        verify(provService, never()).addActivity(any());
    }

    @Test
    public void handlesEventWithInvalidSyntaxFilter() {
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, MATCHING_TOPIC_STRING);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);

        executor.handleEvent(event);

        verify(webhookConfigurationService, never()).getWebhookConfig(anyString());
        verify(provService, never()).addActivity(any());
    }

    @Test
    public void handlesEventWhereRecordIsMissingConfig() {
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, MATCHING_TOPIC_FILTER);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        when(webhookConfigurationService.getWebhookConfig(RECORD_IRI)).thenThrow(
                new IllegalArgumentException("Webhook configuration not found for record: " + RECORD_IRI.stringValue()));

        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> executor.handleEvent(event));

        assertEquals("Webhook configuration not found for record: " + RECORD_IRI.stringValue(), ex.getMessage());
        verify(provService, never()).addActivity(any());
    }

    @Test
    public void handlesEventWithMultipleRecordsOneMatch() {
        loadTrigData();
        IRI recordA = VF.createIRI("https://mobi.com/records#test-record");
        IRI recordB = VF.createIRI("https://mobi.com/records#second-test");

        Map<Resource, String> filters = new HashMap<>();
        filters.put(recordA, MATCHING_TOPIC_FILTER);
        filters.put(recordB, NON_MATCHING_TOPIC_FILTER);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        when(webhookConfigurationService.getWebhookConfig(recordA)).thenReturn(webhookConfiguration);
        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);

        executor.handleEvent(event);

        verify(webhookConfigurationService).getWebhookConfig(recordA);
        verify(webhookConfigurationService, never()).getWebhookConfig(recordB);
    }

    @Test
    public void handlesEventWithSseTopics() {
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(Collections.emptyMap());
        Event event = new Event("com/mobi/sse/test", (Map<String, ?>) null);

        executor.handleEvent(event);

        verify(webhookConfigurationService, never()).retrieveEventFilters();
    }

    /* executeWebhook() */

    @Test
    public void executesMatchingWebhookConfigs() {
        loadTrigData();
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, MATCHING_TOPIC_FILTER);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        when(webhookConfigurationService.getWebhookConfig(RECORD_IRI)).thenReturn(webhookConfiguration);

        // Use an unreachable URL — executeWebhook will catch the IOException and record a failed attempt
        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);

        executor.handleEvent(event);

        verify(webhookConfigurationService).getWebhookConfig(eq(RECORD_IRI));
        verify(provService).addActivity(any(WebhookExecutionActivity.class));
        verify(provService).updateActivity(any(WebhookExecutionActivity.class));
        verifyActivityCreation(webhookExecutionActivity.getModel(), "https://www.example.com", "GET", true, "200", 1);
    }

    @Test
    public void executesWebhookRecordConfigWithMissingHTTPMethod() {
        when(webhookConfiguration.getHttpMethod()).thenReturn(Optional.empty());

        loadTrigData();
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null)));

        verify(provService, never()).addActivity(any());
        verify(provService, never()).updateActivity(any());
        assertEquals("WebhookConfiguration is missing HTTP method property", ex.getMessage());
    }

    @Test
    public void executesWebhookRecordWithNoPublisher() {
        loadTrigData();
        prepUserErrorTests(RECORD_IRI, DCTERMS.PUBLISHER);

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null)));

        verify(provService, never()).addActivity(any());
        verify(provService, never()).updateActivity(any());
        assertEquals("Publisher not found for webhook record: " + RECORD_IRI, ex.getMessage());
    }

    @Test
    public void executesWebhookRecordWhereUserHasNoUsername() {
        loadTrigData();
        prepUserErrorTests(USER_IRI, VF.createIRI(User.username_IRI));

        executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null));

        verify(provService).addActivity(any(WebhookExecutionActivity.class));
        verify(provService).updateActivity(any(WebhookExecutionActivity.class));
        verify(engineManager).retrieveUser(eq("admin"));

        verifyActivityCreation(webhookExecutionActivity.getModel(), "https://www.example.com", "GET", true, "200", 1);
    }

    @Test
    public void executesWebhookRecordWhereUserCouldNotBeFound() {
        when(engineManager.retrieveUser(eq("test user"))).thenReturn(Optional.empty());
        loadTrigData();

        executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null));

        verify(provService).addActivity(any(WebhookExecutionActivity.class));
        verify(provService).updateActivity(any(WebhookExecutionActivity.class));
        verify(engineManager).retrieveUser(eq("admin"));

        verifyActivityCreation(webhookExecutionActivity.getModel(), "https://www.example.com", "GET", true, "200", 1);
    }

    @Test
    public void executeWebhookRetriesUpToRetryLimitOnFailure() {
        when(httpResponse.getStatusLine().getStatusCode()).thenReturn(500);

        loadTrigData();
        executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null));

        verify(provService).addActivity(any(WebhookExecutionActivity.class));
        verify(provService).updateActivity(any(WebhookExecutionActivity.class));

        verifyActivityCreation(webhookExecutionActivity.getModel(), "https://www.example.com", "GET", false, "500", 3);
    }

    @Test
    public void executeWebhookReceivesException() throws IOException {
        doThrow(new IOException("Connection Refused")).when(httpClient).execute(any(HttpUriRequest.class));

        loadTrigData();
        executor.executeWebhook(RECORD_IRI, webhookConfiguration, new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null));

        verify(provService).addActivity(any(WebhookExecutionActivity.class));
        verify(provService).updateActivity(any(WebhookExecutionActivity.class));

        verifyActivityCreation(webhookExecutionActivity.getModel(), "https://www.example.com", "GET", false, "ERROR", 3);
    }

    @Test
    public void executeWebhookQueuesSubsequentRequestWhileExecuting() {
        loadTrigData();
        Map<Resource, String> filters = new HashMap<>();
        filters.put(RECORD_IRI, MATCHING_TOPIC_FILTER);
        filters.put(SECOND_RECORD_IRI, MATCHING_TOPIC_FILTER);
        when(webhookConfigurationService.retrieveEventFilters()).thenReturn(filters);
        when(webhookConfigurationService.getWebhookConfig(any(Resource.class))).thenReturn(webhookConfiguration);

        Event event = new Event(MATCHING_TOPIC_STRING, (Map<String, ?>) null);
        executor.handleEvent(event);

        verify(provService, times(2)).addActivity(any());
        verify(provService, times(2)).updateActivity(any());
    }

    /* Helper Methods */

    private void loadTrigData() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(getClass().getResourceAsStream("/webhook_record.trig"), RDFFormat.TRIG);
        } catch (IOException e) {
            fail("Could not load test data: " + e.getMessage());
        }
    }

    private void prepUserErrorTests(IRI subject, IRI predicate) {
        loadTrigData();
        try (RepositoryConnection conn = repo.getConnection()) {
            RepositoryResult<Statement> statements = conn.getStatements(subject, predicate, null, true);
            conn.remove(statements);
        } catch (RepositoryException e) {
            fail("Failed to remove statements" + e.getMessage());
        }
    }



    private void verifyActivityCreation(Model activityModel, String url, String method, boolean success,
                                        String responseStatus, int attemptCount) {

        SailRepository verificationRepo = new SailRepository(new MemoryStore());
        try (RepositoryConnection conn = verificationRepo.getConnection()) {
            conn.add(activityModel);
            String queryString = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/provenance_verification.rq")), StandardCharsets.UTF_8);
            GraphQuery query = conn.prepareGraphQuery(queryString);

            query.setBinding("url", VF.createIRI(url));
            query.setBinding("method", VF.createLiteral(method));
            query.setBinding("success", VF.createLiteral(success));
            query.setBinding("status", VF.createLiteral(responseStatus));

            try (GraphQueryResult result = query.evaluate()) {
                assertTrue(result.hasNext());
            }

            assertEquals(attemptCount, conn.getStatements(null,
                    VF.createIRI(WebhookExecutionActivity.hasConnectionAttempt_IRI), null).stream().toList().size());
        } catch (IOException e) {
            fail("Failed to load activity data: " + e.getMessage());
        }
    }
}
