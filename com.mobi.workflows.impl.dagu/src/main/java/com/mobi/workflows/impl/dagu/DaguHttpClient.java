package com.mobi.workflows.impl.dagu;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.server.api.Mobi;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.nimbusds.jwt.SignedJWT;
import org.eclipse.rdf4j.model.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import javax.servlet.http.Cookie;

/**
 * Dagu HttpClient works with Dagu Version 1.11.0. This client breaks with Dagu Versions >= 1.12.0.
 */
public class DaguHttpClient {
    private static final ObjectMapper mapper = new ObjectMapper();
    private final Logger log = LoggerFactory.getLogger(DaguHttpClient.class);

    private String daguHost;
    protected TokenManager tokenManager;
    protected EngineManager engineManager;
    protected Mobi mobi;
    protected HttpClient client;

    /**
     * Initializes a Dagu HTTP Client using the provided details.
     *
     * @param daguHost The hostname of the Dagu server
     * @param tokenManager A TokenManager service instance to use for generating tokens
     * @param engineManager An EngineManager service instance to use for retrieving user details
     * @param mobi A Mobi service instance to use for retrieving details about the Mobi server
     */
    public DaguHttpClient(String daguHost, TokenManager tokenManager, EngineManager engineManager, Mobi mobi) {
        this.daguHost = daguHost;
        this.tokenManager = tokenManager;
        this.engineManager = engineManager;
        this.mobi = mobi;
        client = HttpClient.newHttpClient();
    }

    /**
     * Get an Individual Dag based on the SHA1 hashed Workflow IRI. If a status besides 200 is returned, throws a
     * MobiException.
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @return The JSON Object representing the Dagu response
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public ObjectNode getDag(String sha1WorkflowIRI) throws IOException, InterruptedException {
        log.trace("Checking if dag " + sha1WorkflowIRI + " already exists");
        HttpRequest existsRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags/" + sha1WorkflowIRI))
                .header("Accept", "application/json")
                .build();
        HttpResponse<String> existsResponse = client.send(existsRequest, HttpResponse.BodyHandlers.ofString());
        if (existsResponse.statusCode() != 200) {
            throw new MobiException("Could not connect to Dagu\n Status Code: "
                    + existsResponse.statusCode() + "\n  Body: " + existsResponse.body());
        }
        return mapper.readValue(existsResponse.body(), ObjectNode.class);
    }

    /**
     * Create a Dag in Dagu with the provided SHA1 hashed Workflow IRI as the identifier/name. If a status besides 200
     * is returned, throws a MobiException.
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public void createDag(String sha1WorkflowIRI) throws IOException, InterruptedException {
        log.trace("dag " + sha1WorkflowIRI + " does not exist. Creating.");
        Map<String, String> createFormData = new HashMap<>();
        createFormData.put("action", "new");
        createFormData.put("value", sha1WorkflowIRI);
        HttpRequest createRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags"))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(getFormDataAsString(createFormData)))
                .build();

        HttpResponse<String> createResponse = client.send(createRequest, HttpResponse.BodyHandlers.ofString());
        if (createResponse.statusCode() != 200) {
            throw new MobiException("Could not create new dag\n  Status Code: " + createResponse.statusCode()
                    + "\n  Body: " + createResponse.body());
        }
    }

    /**
     * Get the latest logs for a particular step within the Dag identified by the provided SHA1 hashed Workflow IRI. If
     * a status besides 200 is returned, throws a MobiException.
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @param stepName The name of the step to fetch logs for
     * @return The JSON Object representing the Dagu response
     * @throws JsonProcessingException If something goes wrong converting the HTTP response into an ObjectNode
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public ObjectNode getLogForStep(String sha1WorkflowIRI, String stepName) throws
            JsonProcessingException, IOException, InterruptedException {
        HttpRequest logRequest = HttpRequest.newBuilder(
                        URI.create(daguHost + "/dags/" + sha1WorkflowIRI + "/log?step=" + stepName))
                .header("Accept", "application/json")
                .build();
        HttpResponse<String> logResponse = client.send(logRequest, HttpResponse.BodyHandlers.ofString());
        if (logResponse.statusCode() != 200) {
            throw new MobiException("Could not connect to Dagu\n Status Code: "
                    + logResponse.statusCode() + "\n  Body: " + logResponse.body());
        }
        return mapper.readValue(logResponse.body(), ObjectNode.class);
    }

    /**
     * Get the latest logs for an entire Dag identified by the provided SHA1 hashed Workflow IRI. If a status besides
     * 200 is returned, throws a MobiException.
     * <a href="https://github.com/dagu-dev/dagu/blob/v1.11.0/internal/web/handlers/dag.go#L314">Source</a>
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @return The JSON Object representing the Dagu response
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public ObjectNode getSchedulerLog(String sha1WorkflowIRI) throws IOException, InterruptedException {
        HttpRequest logRequest = HttpRequest.newBuilder(
                        URI.create(daguHost + "/dags/" + sha1WorkflowIRI + "/scheduler-log"))
                .header("Accept", "application/json")
                .build();
        HttpResponse<String> logResponse = client.send(logRequest, HttpResponse.BodyHandlers.ofString());
        if (logResponse.statusCode() != 200) {
            throw new MobiException("Could not connect to Dagu\n Status Code: "
                    + logResponse.statusCode() + "\n  Body: " + logResponse.body());
        }
        ObjectNode dag = mapper.readValue(logResponse.body(), ObjectNode.class);
        return dag;
    }

    /**
     * Check whether a Dag exists identified by the provided SHA1 hashed Workflow IRI. If the dag status is not
     * "failed" or "finished", returns an empty Optional. If a status besides 200 is returned, throws a MobiException.
     * If any expected fields in the Dag JSON are not present, throws a MobiException.
     * <a href="https://github.com/dagu-dev/dagu/blob/v1.11.0/internal/web/handlers/dag.go#L66">Source</a>
     * <a href="https://github.com/dagu-dev/dagu/blob/v1.11.0/internal/models/status.go#L33">Source</a>
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @return Dagu Response
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public Optional<ObjectNode> checkDagExist(String sha1WorkflowIRI) throws IOException, InterruptedException {
        log.trace("Checking dag " + sha1WorkflowIRI + " status");
        HttpRequest getRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags/" + sha1WorkflowIRI))
                .header("accept", "application/json")
                .build();
        HttpResponse<String> getResponse = client.send(getRequest, HttpResponse.BodyHandlers.ofString());
        if (getResponse.statusCode() != 200) {
            throw new MobiException("Failed to connect to dagu\n  Status Code: " + getResponse.statusCode()
                    + "\n  Body: " + getResponse.body());
        }
        ObjectNode resultObject = mapper.readValue(getResponse.body(), ObjectNode.class);
        ObjectNode dagObject = resultObject.hasNonNull("DAG") && resultObject.get("DAG").isObject()
                ? (ObjectNode) resultObject.get("DAG") : null;
        if (dagObject == null) {
            throw new MobiException("dag object invalid");
        }
        ObjectNode statusObject = dagObject.hasNonNull("Status") && dagObject.get("Status").isObject()
                ? (ObjectNode) dagObject.get("Status") : null;
        if (statusObject == null) {
            throw new MobiException("dag object invalid");
        }
        String statusText = statusObject.get("StatusText").asText();
        log.trace("dag " + sha1WorkflowIRI + " status is " + statusText);
        if (statusText.equalsIgnoreCase("finished") || statusText.equalsIgnoreCase("failed")) {
            return Optional.of(resultObject);
        } else {
            return Optional.empty();
        }
    }

    /**
     * Run a Dag identified by the provided SHA1 hashed Workflow IRI. If a status besides 200 or 303 is returned,
     * throws a MobiException. Generates a token for the User associated with the provided Activity that will be
     * inserted into the Dag for use with any calls back to the Mobi host system.
     *
     * @param activity The WorkflowExecutionActivity to use to retrieve which User a token should be generated for
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public void runDagJob(WorkflowExecutionActivity activity, String sha1WorkflowIRI) throws IOException,
            InterruptedException {
        Resource userIri = activity.getWasAssociatedWith_resource().stream().findFirst().orElseThrow(() ->
                new IllegalStateException("Activity must have an associated User"));
        String username = engineManager.getUsername(userIri)
                .orElseThrow(() -> new IllegalStateException("No user linked to iri " + userIri));
        Cookie cookie = getTokenCookie(username);
        Map<String, String> startFormData = new HashMap<>();
        startFormData.put("action", "start");
        startFormData.put("params", mobi.getHostName() + " " + cookie.getValue());
        HttpRequest startRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags/" + sha1WorkflowIRI))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(getFormDataAsString(startFormData)))
                .build();
        HttpResponse<String> startResponse = client.send(startRequest, HttpResponse.BodyHandlers.ofString());
        if (startResponse.statusCode() != 200 && startResponse.statusCode() != 303) {
            throw new MobiException("Could not start dag " + sha1WorkflowIRI + "\n Status Code: "
                    + startResponse.statusCode() + "\n  Body: " + startResponse.body());
        }
    }

    /**
     * Updates a Dag identified by the provided SHA1 hashed Workflow IRI with the provided YAML string. If a status
     * besides 200 is returned, throws a MobiException.
     *
     * @param workflowYaml The updated Dag definition in Yaml
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @throws IOException If an error occurs sending the HTTP request
     * @throws InterruptedException If an error occurs sending the HTTP request
     */
    public void updateDag(String workflowYaml, String sha1WorkflowIRI) throws IOException, InterruptedException {
        Map<String, String> updateFormData = new HashMap<>();
        updateFormData.put("action", "save");
        updateFormData.put("value", workflowYaml);
        HttpRequest updateRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags/" + sha1WorkflowIRI))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(getFormDataAsString(updateFormData)))
                .build();
        HttpResponse<String> updateResponse = client.send(updateRequest, HttpResponse.BodyHandlers.ofString());
        if (updateResponse.statusCode() != 200) {
            throw new MobiException("Could not update dag " + sha1WorkflowIRI + "\n  Status Code: "
                    + updateResponse.statusCode() + "\n  Body: " + updateResponse.body());
        }
    }

    /**
     * Get a Token Cookie for a User identified by the provided username.
     *
     * @param username The username to create a token cookie for
     * @return A Token Cookie for the provided username
     */
    public Cookie getTokenCookie(String username) {
        SignedJWT jwt = tokenManager.generateAuthToken(username);
        return tokenManager.createSecureTokenCookie(jwt);
    }

    /**
     * Convert a Map of form data into a x-www-form-urlencoded string for use in calls to Dagu.
     *
     * @param formData Map of Form Data
     * @return A string formatted as x-www-form-urlencoded data
     */
    static String getFormDataAsString(Map<String, String> formData) {
        StringBuilder formBodyBuilder = new StringBuilder();
        for (Map.Entry<String, String> singleEntry : formData.entrySet()) {
            if (!formBodyBuilder.isEmpty()) {
                formBodyBuilder.append("&");
            }
            formBodyBuilder.append(URLEncoder.encode(singleEntry.getKey(), StandardCharsets.UTF_8));
            formBodyBuilder.append("=");
            formBodyBuilder.append(URLEncoder.encode(singleEntry.getValue(), StandardCharsets.UTF_8));
        }
        return formBodyBuilder.toString();
    }
}
