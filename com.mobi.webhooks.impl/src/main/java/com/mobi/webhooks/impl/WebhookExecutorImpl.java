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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.prov.api.ProvOntologyLoader;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.sse.SSETopics;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.WebhookExecutor;
import com.mobi.webhooks.api.WebhookExecutorConfig;
import com.mobi.webhooks.api.ontology.webhooks.ConnectionAttempt;
import com.mobi.webhooks.api.ontology.webhooks.ConnectionAttemptFactory;
import com.mobi.webhooks.api.ontology.webhooks.Header;
import com.mobi.webhooks.api.ontology.webhooks.HeaderFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookCallback;
import com.mobi.webhooks.api.ontology.webhooks.WebhookCallbackFactory;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivity;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivityFactory;

import org.apache.commons.io.IOUtils;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.methods.RequestBuilder;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.osgi.framework.Filter;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;
import javax.servlet.http.HttpServletRequest;

/**
 * Simple implementation of WebhookExecutor for executing webhook HTTP requests.
 */
@Component(immediate = true,
        service = { WebhookExecutor.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=com/mobi/*"
)
@Designate(ocd = WebhookExecutorConfig.class)
public class WebhookExecutorImpl implements WebhookExecutor, EventHandler {
    private static final ValueFactory VF = new ValidatingValueFactory();
    private static final Logger LOG = LoggerFactory.getLogger(WebhookExecutorImpl.class);
    private static final String WEBHOOK_NAMESPACE = "https://mobi.solutions/webhooks/";
    private static final String RECORD_BINDING = "record";
    private static final String ACTIVITY_BINDING = "activity";
    private static final String GET_EXECUTIONS_QUERY;
    private static final String GET_EXECUTION_MODEL_QUERY;

    static {
        try {
            GET_EXECUTIONS_QUERY = IOUtils.toString(Objects.requireNonNull(
                    WebhookExecutorImpl.class.getResourceAsStream("/get-webhook-executions.rq")),
                    StandardCharsets.UTF_8);
            GET_EXECUTION_MODEL_QUERY = IOUtils.toString(Objects.requireNonNull(
                    WebhookExecutorImpl.class.getResourceAsStream("/get-webhook-execution-model.rq")),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private final ConcurrentLinkedQueue<PendingWebhookRequest> pendingRequests = new ConcurrentLinkedQueue<>();
    private final CopyOnWriteArrayList<ExecutingWebhook> currentlyExecuting = new CopyOnWriteArrayList<>();
    private final ObjectMapper mapper = new ObjectMapper();

    private int retryLimit;

    private record PendingWebhookRequest(Resource recordIri, WebhookConfiguration config, Event event) {}
    private record ExecutingWebhook(Resource recordIri, Resource activityIri) {}

    /**
     * Simple {@link PaginatedSearchResults} implementation backing the webhook execution retrieval endpoints.
     */
    private record WebhookExecutionResults(List<WebhookExecutionActivity> page, int totalSize, int pageSize,
                                           int pageNumber) implements PaginatedSearchResults<WebhookExecutionActivity> {
    }

    protected CloseableHttpClient httpClient;

    @Reference
    WebhookConfigurationService webhookConfigurationService;

    @Reference
    ProvenanceService provService;

    @Reference(target = "(id=prov)")
    OsgiRepository provRepository;

    @Reference
    EntityFactory entityFactory;

    @Reference
    WebhookExecutionActivityFactory webhookExecutionActivityFactory;

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    ConnectionAttemptFactory connectionAttemptFactory;

    @Reference
    HeaderFactory headerFactory;

    @Reference
    WebhookCallbackFactory webhookCallbackFactory;

    @Reference
    EngineManager engineManager;

    @Reference
    PDP pdp;

    @Activate
    @Modified
    void activate(final WebhookExecutorConfig config) {
        int connectionTimeout = config.connectionTimeout();
        this.retryLimit = config.retryLimit();
        LOG.debug("Activating WebhookExecutorImpl with connectionTimeout={}ms, retryLimit={}", connectionTimeout,
                retryLimit);

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectTimeout(connectionTimeout)
                .build();

        this.httpClient = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .useSystemProperties()
                .build();
        LOG.trace("HTTP client initialized for webhook execution");

        ProvOntologyLoader.loadOntology(provRepository,
                WebhookConfigurationService.class.getResourceAsStream("/webhooks.ttl"));

        LOG.debug("Webhooks provenance ontology loaded into prov repository");
        LOG.info("WebhookExecutorImpl activated successfully");
    }

    @Override
    public void handleEvent(Event event) {
        LOG.trace("Received event on topic: {}", event.getTopic());
        if (!event.getTopic().startsWith(SSETopics.TOPIC_NAME)) {
            Map<Resource, String> filters = webhookConfigurationService.retrieveEventFilters();

            if (filters.isEmpty()) {
                LOG.debug("No filters registered for event topic: {}", event.getTopic());
                return;
            }
            LOG.debug("Evaluating {} registered webhook filter(s) against event on topic: {}", filters.size(),
                    event.getTopic());

            Hashtable<String, Object> data = new Hashtable<>(Arrays.stream(event.getPropertyNames())
                    .collect(Collectors.toMap(k -> k, name -> String.valueOf(event.getProperty(name)))));

            List<Resource> matchedRecordIRIs = filters.entrySet().stream()
                    .filter(entry -> {
                        try {
                            Filter filter = FrameworkUtil.createFilter(entry.getValue());
                            return filter.match(data);
                        } catch (InvalidSyntaxException e) {
                            LOG.error("Filter string for record: {}, has invalid syntax", entry.getKey());
                            return false;
                        }
                    }).map(Map.Entry::getKey)
                    .toList();

            if (matchedRecordIRIs.isEmpty()) {
                LOG.debug("No matching webhook records found for event on topic: {}", event.getTopic());
            } else {
                LOG.debug("Matched {} webhook record(s) for event on topic {}: {}", matchedRecordIRIs.size(),
                        event.getTopic(), matchedRecordIRIs);
                for (Resource recordIri : matchedRecordIRIs) {
                    WebhookConfiguration config = webhookConfigurationService.getWebhookConfig(recordIri);
                    if (currentlyExecuting.isEmpty()) {
                        LOG.debug("No webhooks currently executing, executing webhook for record {} immediately",
                                recordIri);
                        executeWebhook(recordIri, config, event);
                    } else {
                        LOG.debug("{} webhook(s) currently executing, queueing webhook for record {}",
                                currentlyExecuting.size(), recordIri);
                        pendingRequests.offer(new PendingWebhookRequest(recordIri, config, event));
                    }
                }
            }
        }
    }

    @Override
    public void executeWebhook(Resource recordIri, WebhookConfiguration config, Event event) {
        LOG.info("Executing webhook for record {}", recordIri);
        String url = config.getUrl().orElseThrow(
                () -> new IllegalStateException("WebhookConfiguration is missing URL property"));
        String method = config.getHttpMethod().orElseThrow(
                () -> new IllegalStateException("WebhookConfiguration is missing HTTP method property"));
        LOG.debug("Webhook for record {} resolved to {} {}", recordIri, method, url);

        // Create WebhookExecutionActivity
        ActivityConfig activityConfig = createActivityConfig(recordIri);
        WebhookExecutionActivity activity = startWebhookActivity(url, method, activityConfig);
        Resource activityIRI = activity.getResource();
        LOG.debug("Created webhook execution activity IRI {} for record {}", activityIRI, recordIri);

        // Build payload from event properties + activity IRI
        String requestBody;
        try {
            requestBody = buildPayload(event, config, activity);
        } catch (JsonProcessingException e) {
            LOG.error("Failed to build webhook payload for record {} (activity {})", recordIri, activityIRI, e);
            throw new IllegalStateException("Failed to build webhook payload", e);
        }
        activity.setRequestBody(requestBody);

        // Attach request headers to activity
        handleRequestHeaders(config, activity);

        //Ensure execution is tracked
        currentlyExecuting.add(new ExecutingWebhook(recordIri, activityIRI));
        provService.addActivity(activity);
        LOG.trace("Webhook execution activity {} registered and tracked for record {}", activityIRI, recordIri);

        //Execution of connection attempts
        boolean succeeded = false;
        int attempts = 0;

        String recordIriStr = recordIri.stringValue();

        while (attempts < retryLimit) {
            attempts++;
            Resource attemptIri = VF.createIRI(WEBHOOK_NAMESPACE + "attempt/" + UUID.randomUUID());
            ConnectionAttempt attempt = connectionAttemptFactory.createNew(attemptIri);
            attempt.setRequestTimestamp(OffsetDateTime.now());
            LOG.debug("Sending webhook request {} {} for record {} (attempt {}/{}, attemptIri {})", method, url,
                    recordIriStr, attempts, retryLimit, attemptIri);

            try (CloseableHttpResponse response = executeRequest(config, url, method, requestBody)) {
                int statusCode = response.getStatusLine().getStatusCode();
                LOG.debug("Webhook request to {} for record {} returned status {} (attempt {}/{})", url, recordIriStr,
                        statusCode, attempts, retryLimit);

                closeConnectionAttempt(activity, attempt, "", response, statusCode);

                succeeded = statusCode >= 200 && statusCode < 300;
                if (succeeded) {
                    LOG.info("Webhook request to {} for record {} succeeded with status {} on attempt {}/{}", url,
                            recordIriStr, statusCode, attempts, retryLimit);
                    break;
                }

                LOG.warn("Webhook request to {} returned non-success status {} (attempt {}/{})",
                        url, statusCode, attempts, retryLimit);

            } catch (IOException | InterruptedException e) {
                LOG.error("Error executing webhook for record {} (attempt {}/{})", recordIriStr, attempts,
                        retryLimit, e);

                closeConnectionAttempt(activity, attempt, e.getMessage(), null, null);
                if (e instanceof InterruptedException) {
                    LOG.warn("Webhook execution for record {} was interrupted on attempt {}/{}, aborting retries",
                            recordIriStr, attempts, retryLimit);
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        // Tracking of end of execution
        endWebhookActivity(recordIriStr, activity, attempts, succeeded);
        if (succeeded) {
            LOG.info("Webhook execution for record {} completed successfully after {} attempt(s) (activity {})",
                    recordIriStr, attempts, activityIRI);
        } else {
            LOG.warn("Webhook execution for record {} failed after {} attempt(s) (activity {})", recordIriStr,
                    attempts, activityIRI);
        }
        currentlyExecuting.removeIf(e ->
                e.recordIri().equals(recordIri) && e.activityIri().equals(activityIRI));
        LOG.trace("Webhook execution activity {} removed from tracking for record {}", activityIRI, recordIriStr);

        PendingWebhookRequest next = pendingRequests.poll();
        if (next != null) {
            LOG.debug("Dequeued pending webhook for record {} ({} still queued)", next.recordIri(),
                    pendingRequests.size());
            executeWebhook(next.recordIri(), next.config(), next.event());
        } else {
            LOG.trace("No pending webhook requests remaining in queue");
        }
    }

    @Override
    public Model createCallback(Resource activityIri, HttpServletRequest request, User user)
            throws IllegalAccessException {
        long start = System.currentTimeMillis();
        LOG.debug("createCallback called for activity: {}, method={} URL={} user={}",
                activityIri, request.getMethod(), request.getRequestURL(), user.getResource().stringValue());
        WebhookExecutionActivity activity = resolveActivity(activityIri);
        verifyLinkedRecordAccess(activity, user);
        WebhookCallback callback = buildCallback(request);
        persistCallback(activity, callback);
        LOG.debug("Callback {} created and linked to activity {} in {}ms",
                callback.getResource(), activityIri, System.currentTimeMillis() - start);
        return callback.getModel();
    }

    private WebhookExecutionActivity resolveActivity(Resource activityIri) {
        Activity genericActivity = provService.getActivity(activityIri).orElseThrow(
                () -> new IllegalArgumentException(
                        "WebhookExecutionActivity not found for IRI: " + activityIri));
        return webhookExecutionActivityFactory
                .getExisting(genericActivity.getResource(), genericActivity.getModel())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Resource " + activityIri + " is not a WebhookExecutionActivity"));
    }

    private void verifyLinkedRecordAccess(WebhookExecutionActivity activity, User user)
            throws IllegalAccessException {
        Resource recordIri = activity.getUsed_resource().stream().findFirst().orElseThrow(
                () -> new IllegalArgumentException(
                        "WebhookExecutionActivity " + activity.getResource() + " has no linked WebhookRecord"));
        IRI subjectId = (IRI) user.getResource();
        LOG.debug("Verifying user {} has access to WebhookRecord {}", subjectId.stringValue(), recordIri);
        IRI actionId = VF.createIRI(Read.TYPE);
        Map<String, Literal> subjectAttrs = new HashMap<>();
        Map<String, Literal> actionAttrs = new HashMap<>();
        subjectAttrs.put(XACML.SUBJECT_ID, VF.createLiteral(subjectId.stringValue()));
        actionAttrs.put(XACML.ACTION_ID, VF.createLiteral(actionId.stringValue()));
        Request pdpRequest = pdp.createRequest(List.of(subjectId), subjectAttrs, List.of((IRI) recordIri),
                new HashMap<>(), List.of(actionId), actionAttrs);
        LOG.debug("Executing XACML request for user: {} to access WebhookRecord {}",
                subjectId.stringValue(), recordIri);
        Set<String> viewableRecords = pdp.filter(pdpRequest, VF.createIRI(POLICY_PERMIT_OVERRIDES));
        if (viewableRecords.isEmpty()) {
            throw new IllegalAccessException("User " + subjectId.stringValue()
                    + " does not have access to WebhookRecord " + recordIri);
        }
    }

    private WebhookCallback buildCallback(HttpServletRequest request) {
        String body;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(request.getInputStream(), StandardCharsets.UTF_8))) {
            body = reader.lines().collect(Collectors.joining(System.lineSeparator()));
        } catch (IOException e) {
            throw new IllegalStateException("Could not read callback request body: " + e.getMessage(), e);
        }
        Resource callbackIri = VF.createIRI(WEBHOOK_NAMESPACE + "callback/" + UUID.randomUUID());
        WebhookCallback callback = webhookCallbackFactory.createNew(callbackIri);
        callback.setCallbackFireTime(OffsetDateTime.now());
        callback.setCallbackBody(body);
        callback.setCallbackIssuer(resolveCallbackIssuer(request));
        return callback;
    }

    private void persistCallback(WebhookExecutionActivity activity, WebhookCallback callback) {
        activity.addHasCallback(callback);
        activity.getModel().addAll(callback.getModel());
        provService.updateActivity(activity);
    }

    private String resolveCallbackIssuer(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return origin;
        }
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            return referer;
        }
        return request.getRemoteAddr();
    }

    private String buildPayload(Event event, WebhookConfiguration config, WebhookExecutionActivity activity)
            throws JsonProcessingException {

        ObjectNode node = mapper.createObjectNode();
        Optional<String> requestBody = config.getRequestBody();

        requestBody.ifPresent(s -> node.put("data", s));
        node.put("activityIRI", activity.getResource().stringValue());

        ObjectNode eventData = mapper.createObjectNode();
        for (String key : event.getPropertyNames()) {
            eventData.put(key, event.getProperty(key).toString());
        }
        node.set("event", eventData);

        String payload = mapper.writeValueAsString(node);
        LOG.trace("Built webhook payload for activity {}.", activity.getResource());
        return payload;
    }

    private WebhookExecutionActivity startWebhookActivity(String url, String method,
                                                          ActivityConfig activityConfig) {
        WebhookExecutionActivity activity = (WebhookExecutionActivity) provService.createActivity(activityConfig);

        activity.setRequestUrl(VF.createIRI(url));
        activity.setRequestMethod(method);
        activity.addStartedAtTime(OffsetDateTime.now());
        LOG.trace("Started webhook execution activity {} for {} {}", activity.getResource(), method, url);
        return activity;
    }

    private void closeConnectionAttempt(WebhookExecutionActivity activity, ConnectionAttempt attempt, String error,
                                        CloseableHttpResponse response, Integer statusCode) {
        if (error.isEmpty()) {
            LOG.trace("Recording successful connection attempt {} with status {} for activity {}",
                    attempt.getResource(), statusCode, activity.getResource());
            attempt.setResponseStatus(String.valueOf(statusCode));

            try {
                attempt.setResponseBody(EntityUtils.toString(response.getEntity()));
            } catch (IOException ex) {
                LOG.error("Error reading response body for webhook execution activity: {}", activity.getResource(), ex);
                attempt.setResponseBody("Error reading response body");
            }

            attempt.setResponseTimestamp(OffsetDateTime.now());

            Arrays.stream(response.getAllHeaders()).forEach(header -> {
                Resource respHeaderIri = VF.createIRI(WEBHOOK_NAMESPACE + "headers/" + UUID.randomUUID());
                Header respHeader = headerFactory.createNew(respHeaderIri);
                respHeader.setHasHeaderName(header.getName());
                respHeader.setHasHeaderValue(String.join(", ", header.getValue()));
                attempt.addHasResponseHeader(respHeader);
                attempt.getModel().addAll(respHeader.getModel());
            });
        } else {
            LOG.trace("Recording failed connection attempt {} with error '{}' for activity {}",
                    attempt.getResource(), error, activity.getResource());
            attempt.setResponseStatus("ERROR");
            attempt.setResponseBody(error);
            attempt.setResponseTimestamp(OffsetDateTime.now());
        }

        activity.addHasConnectionAttempt(attempt);
        activity.getModel().addAll(attempt.getModel());
    }

    private void endWebhookActivity(String recordIri, WebhookExecutionActivity activity, int attempts,
                                    boolean succeeded) {
        activity.setSucceeded(succeeded);
        activity.addEndedAtTime(OffsetDateTime.now());
        if (!succeeded) {
            String activityMsg = "Webhook execution failed after " + attempts + " attempt(s) for record: " + recordIri;
            activity.setActivityMessage(activityMsg);
        }
        provService.updateActivity(activity);
        LOG.debug("Finalized webhook execution activity {} for record {} (succeeded={}, attempts={})",
                activity.getResource(), recordIri, succeeded, attempts);
    }

    private void handleRequestHeaders(WebhookConfiguration config, WebhookExecutionActivity activity) {
        LOG.trace("Attaching {} request header(s) to webhook execution activity {}",
                config.getHasRequestHeader().size(), activity.getResource());
        config.getHasRequestHeader().forEach(reqHeader -> {
            Resource headerIri = VF.createIRI(WEBHOOK_NAMESPACE + "headers/" + UUID.randomUUID());
            Header header = headerFactory.createNew(headerIri);
            reqHeader.getHasHeaderName().ifPresent(header::setHasHeaderName);
            reqHeader.getHasHeaderValue().ifPresent(header::setHasHeaderValue);
            activity.addHasHeader(header);
            activity.getModel().addAll(header.getModel());
        });
    }

    private ActivityConfig createActivityConfig(Resource recordIRI) throws IllegalStateException {
        LOG.trace("Building activity config for webhook record {}", recordIRI);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Model recordModel = QueryResults.asModel(conn.getStatements(recordIRI, null, null, recordIRI));
            Entity record = entityFactory.getExisting(recordIRI, recordModel)
                    .orElseGet(() -> {
                        LOG.warn("No Entity found for workflow record: {}", recordIRI);
                        Entity entity = entityFactory.createNew(recordIRI);
                        entity.addProperty(VF.createLiteral(configProvider.getRepositoryId()), PROV.AT_LOCATION);
                        return entity;
                    });

            Value userIRI;
            Iterator<Statement> statements = recordModel.getStatements(null, DCTERMS.PUBLISHER, null).iterator();
            if (statements.hasNext()) {
                userIRI = statements.next().getObject();
            } else {
                throw new IllegalStateException("Publisher not found for webhook record: " + recordIRI);
            }

            User user;
            try (RepositoryResult<Statement> usernameResult = conn.getStatements(
                    (Resource) userIRI, VF.createIRI(User.username_IRI), null)) {
                if (usernameResult.hasNext()) {
                    String username = usernameResult.next().getObject().stringValue();
                    LOG.trace("Resolved publisher username '{}' for webhook record {}", username, recordIRI);
                    Optional<User> userOpt = engineManager.retrieveUser(username);
                    if (userOpt.isEmpty()) {
                        LOG.error("No user could be found with IRI {}, using admin user instead", userIRI);
                        user = engineManager.retrieveUser("admin").orElseThrow(() ->
                                new IllegalStateException("Admin user could not be found."));
                    } else {
                        user = userOpt.get();
                    }
                } else {
                    LOG.error("No username set on user with IRI {}, Using admin user instead.", userIRI);
                    user = engineManager.retrieveUser("admin").orElseThrow(() ->
                            new IllegalStateException("Admin user could not be found."));
                }
            }

            return new ActivityConfig.Builder(Collections.singleton(WebhookExecutionActivity.class), user)
                    .usedEntity(record)
                    .build();
        }
    }

    private CloseableHttpResponse executeRequest(WebhookConfiguration config, String url, String method,
                                                 String requestBody) throws IOException,
            InterruptedException, IllegalArgumentException {

        HttpUriRequest request;
        if (method.equalsIgnoreCase("GET")) {
            request = new HttpGet(url);
        } else if (method.equalsIgnoreCase("POST")) {
            request = RequestBuilder.post(url)
                    .setEntity(new StringEntity(requestBody, ContentType.APPLICATION_JSON))
                    .build();
        } else {
            LOG.error("Unsupported HTTP method '{}' requested for webhook to {}", method, url);
            throw new IllegalArgumentException("Unsupported HTTP method: " + method);
        }

        config.getHasRequestHeader().forEach(h -> {
            String name = h.getHasHeaderName().orElse("");
            String value = h.getHasHeaderValue().orElse("");
            if (!name.isEmpty()) {
                request.addHeader(name, value);
            }
        });

        config.getSecretToken().ifPresent(token -> {
            LOG.trace("Adding Authorization bearer token header to webhook request to {}", url);
            request.addHeader("Authorization", "Bearer " + token);
        });

        LOG.debug("Dispatching {} request to {}", method, url);
        return httpClient.execute(request);
    }

    /**
     *     sort parameter is not currently used due to only timestamp filter logic being implemented, but should be left
     *     as a placeholder for future implementation.
     */
    @Override
    public PaginatedSearchResults<WebhookExecutionActivity> getExecutions(Resource recordIri, int offset, int limit,
                                                                          String sort, boolean ascending) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = provService.getConnection()) {
            List<Resource> activityIris = getExecutionActivityIris(conn, recordIri, ascending, false);
            int totalSize = activityIris.size();

            List<Resource> pageIris = paginate(activityIris, offset, limit);
            List<WebhookExecutionActivity> page = new ArrayList<>();
            for (Resource activityIri : pageIris) {
                loadFullActivity(conn, activityIri).ifPresent(page::add);
            }

            int pageSize = limit > 0 ? limit : totalSize;
            int pageNumber = limit > 0 ? (offset / limit) + 1 : 1;
            LOG.debug("Retrieved {} of {} webhook execution(s) for record {} in {}ms",
                    page.size(), totalSize, recordIri, System.currentTimeMillis() - start);
            return new WebhookExecutionResults(page, totalSize, pageSize, pageNumber);
        }
    }

    @Override
    public Optional<WebhookExecutionActivity> getLatestExecution(Resource recordIri) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = provService.getConnection()) {
            List<Resource> activityIris = getExecutionActivityIris(conn, recordIri, false, true);

            Optional<WebhookExecutionActivity> latest = activityIris.isEmpty() ? Optional.empty()
                    : loadFullActivity(conn, activityIris.get(0));

            LOG.debug("Retrieved latest webhook execution for record {} in {}ms (found={})",
                    recordIri, System.currentTimeMillis() - start, latest.isPresent());
            return latest;
        }
    }

    /**
     * Runs the execution-listing SPARQL query for the given record, returning the matching
     * {@link WebhookExecutionActivity} IRIs ordered by start time.
     *
     * @param conn       a connection to the provenance repository
     * @param recordIri  the WebhookRecord IRI to filter executions by
     * @param ascending  whether to order by start time ascending (true) or descending (false)
     * @param latestOnly whether to apply the latest filter (LIMIT 1, descending) regardless of {@code ascending}
     * @return the ordered list of WebhookExecutionActivity IRIs
     */
    private List<Resource> getExecutionActivityIris(RepositoryConnection conn, Resource recordIri, boolean ascending,
                                                    boolean latestOnly) {

        LOG.trace("Retrieving IRI of executions for {}", recordIri);
        StringBuilder queryStr = new StringBuilder(GET_EXECUTIONS_QUERY);
        if (latestOnly) {
            LOG.trace("Applying latest filter for record IRI: {}", recordIri);
            queryStr.append("\nORDER BY DESC(?startTime)\nLIMIT 1");
        } else {
            queryStr.append("\nORDER BY ").append(ascending ? "ASC" : "DESC").append("(?startTime)");
        }

        TupleQuery query = conn.prepareTupleQuery(queryStr.toString());
        LOG.trace("Setting record binding for record IRI: {}", recordIri);
        query.setBinding(RECORD_BINDING, recordIri);

        List<Resource> activityIris = new ArrayList<>();
        try (TupleQueryResult result = query.evaluate()) {
            result.forEach(bindings -> activityIris.add((Resource) bindings.getValue(ACTIVITY_BINDING)));
        }
        return activityIris;
    }

    /**
     * Builds the full RDF model for a single WebhookExecutionActivity (its own statements plus its
     * ConnectionAttempts and headers) and wraps it as a {@link WebhookExecutionActivity}.
     *
     * @param conn        a connection to the provenance repository
     * @param activityIri the IRI of the WebhookExecutionActivity to load
     * @return an Optional containing the populated WebhookExecutionActivity, or empty if it could not be loaded
     */
    private Optional<WebhookExecutionActivity> loadFullActivity(RepositoryConnection conn, Resource activityIri) {
        LOG.trace("Loading full activity for {}", activityIri);

        GraphQuery query = conn.prepareGraphQuery(GET_EXECUTION_MODEL_QUERY);
        query.setBinding(ACTIVITY_BINDING, activityIri);
        Model model = QueryResults.asModel(query.evaluate());
        return webhookExecutionActivityFactory.getExisting(activityIri, model);
    }

    /**
     * Returns the sublist of IRIs for the requested page, accounting for offset and limit bounds.
     */
    private List<Resource> paginate(List<Resource> activityIris, int offset, int limit) {
        if (offset >= activityIris.size()) {
            return Collections.emptyList();
        }
        int end = limit > 0 ? Math.min(offset + limit, activityIris.size()) : activityIris.size();
        return activityIris.subList(offset, end);
    }
}
