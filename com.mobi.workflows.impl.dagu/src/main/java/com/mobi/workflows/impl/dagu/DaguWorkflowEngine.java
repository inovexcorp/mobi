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

import static com.mobi.persistence.utils.ResourceUtils.encode;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.server.api.Mobi;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.vfs.ontologies.documents.BinaryFileFactory;
import com.mobi.workflows.api.AbstractWorkflowEngine;
import com.mobi.workflows.api.WorkflowEngine;
import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.workflows.Action;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.ActionExecutionFactory;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.trigger.TriggerHandler;
import com.mobi.workflows.impl.dagu.actions.DaguActionDefinition;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.codec.digest.DigestUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import javax.servlet.http.Cookie;

@Component(
        immediate = true,
        service = { DaguWorkflowEngine.class, AbstractWorkflowEngine.class, WorkflowEngine.class},
        configurationPolicy = ConfigurationPolicy.REQUIRE)
@Designate(ocd = DaguWorkflowEngineConfig.class)
public class DaguWorkflowEngine extends AbstractWorkflowEngine implements WorkflowEngine {
    private final Logger log = LoggerFactory.getLogger(DaguWorkflowEngine.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final Map<String, ActionHandler<Action>> actionHandlers = new HashMap<>();
    protected final Map<String, TriggerHandler<Trigger>> triggerHandlers = new HashMap<>();

    private static final String LOG_FILE_NAMESPACE = "https://mobi.solutions/workflows/log-files/";
    private static final String ACTION_EXECUTION_NAMESPACE = "https://mobi.solutions/workflows/ActionExecution/";

    private String daguHost;
    private Path logDir;
    private long pollingTimeout;
    private long pollingInterval;
    private boolean isLocal;

    protected HttpClient client;

    @Reference
    Mobi mobi;

    @Reference
    protected TokenManager tokenManager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected UserFactory userFactory;

    @Reference
    protected OrmFactoryRegistry factoryRegistry;

    @Reference
    protected BinaryFileFactory binaryFileFactory;

    @Reference
    protected ActionExecutionFactory actionExecutionFactory;

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    @SuppressWarnings("unchecked")
    protected void addActionHandler(ActionHandler<? extends Action> actionHandler) {
        this.actionHandlers.put(actionHandler.getTypeIRI(), (ActionHandler<Action>) actionHandler);
    }

    protected void removeActionHandler(ActionHandler<? extends Action> actionHandler) {
        this.actionHandlers.remove(actionHandler.getTypeIRI());
    }

    @Activate
    protected void start(final DaguWorkflowEngineConfig config) throws IOException {
        log.debug("Starting DaguWorkflowEngine");
        log.trace("DaguWorkflowEngine started with config: " + config);
        client = HttpClient.newHttpClient();
        setUpEngine(config);
        log.debug("Started DaguWorkflowEngine");
    }

    @Modified
    protected void modified(final DaguWorkflowEngineConfig config) throws IOException {
        log.debug("Modifying DaguWorkflowEngine");
        log.trace("DaguWorkflowEngine modified with config: " + config);
        setUpEngine(config);
        log.debug("Modified DaguWorkflowEngine");
    }

    private void setUpEngine(DaguWorkflowEngineConfig config) throws IOException {
        daguHost = config.daguHost();
        isLocal = config.local();
        pollingTimeout = config.pollTimeout();
        pollingInterval = config.pollInterval();
        logDir = Paths.get(config.logDir());
        if (Files.notExists(logDir)) {
            Files.createDirectory(logDir);
        }
    }

    @Override
    public void startWorkflow(Workflow workflow, WorkflowExecutionActivity activity) {
        try {
            log.debug("Collecting actions to execute");
            HashMap<String, List<String>> actionList = createActionList(workflow);

            String workflowYaml = createYaml(workflow);
            String sha1WorkflowIRI = DigestUtils.sha1Hex(workflow.getResource().stringValue());

            log.trace("Checking if dag " + sha1WorkflowIRI + " already exists");
            HttpRequest existsRequest = HttpRequest.newBuilder(URI.create(daguHost + "/dags/" + sha1WorkflowIRI))
                    .header("Accept", "application/json")
                    .build();
            HttpResponse<String> existsResponse = client.send(existsRequest, HttpResponse.BodyHandlers.ofString());
            if (existsResponse.statusCode() != 200) {
                throw new MobiException("Could not connect to Dagu\n Status Code: "
                        + existsResponse.statusCode() + "\n  Body: " + existsResponse.body());
            }
            ObjectNode dag = mapper.readValue(existsResponse.body(), ObjectNode.class);
            if (dag.hasNonNull("DAG") && dag.get("DAG").hasNonNull("Error")) {
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

            log.trace("Updating dag " + sha1WorkflowIRI);
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

            log.trace("Running dag");
            Cookie cookie = getTokenCookie(getUser(activity.getWasAssociatedWith_resource().iterator().next()));
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

            log.debug("Successfully started Workflow " + workflow.getResource());
            new Thread(() -> {
                long max = pollingTimeout / pollingInterval;
                log.trace("Maximum polling count is " + max);
                Timer statusTimer = new Timer();
                TimerTask task = new TimerTask() {
                    int count = 0;
                    @Override
                    public void run() {
                        if (count++ == max) {
                            log.error("Polling status timer reached maximum timeout. Marking workflow as failure");
                            endExecutionActivity(activity, null, false);
                            statusTimer.cancel();
                            statusTimer.purge();
                            return;
                        }
                        try {
                            Optional<ObjectNode> opt = checkDag(sha1WorkflowIRI);
                            if (opt.isPresent()) {
                                ObjectNode objectNode = opt.get();
                                log.debug("Workflow " + workflow.getResource() + " completed");
                                ObjectNode statusObject = (ObjectNode) objectNode.get("DAG").get("Status");
                                String logFilePath = statusObject.get("Log").asText();
                                BinaryFile binaryFile = getSchedulerLog(sha1WorkflowIRI, logFilePath, activity, client);
                                initializeActionExecutions(activity, statusObject, sha1WorkflowIRI, actionList);
                                String statusText = statusObject.get("StatusText").asText();
                                log.trace("Ending execution activity");
                                endExecutionActivity(activity, binaryFile,
                                        statusText.equalsIgnoreCase("finished"));
                                statusTimer.cancel();
                                statusTimer.purge();
                            }
                        } catch (Exception ex) {
                            log.error("Polling status timer hit an exception. Marking workflow as failure");
                            log.error(ex.getMessage());
                            endExecutionActivity(activity, null, false);
                            statusTimer.cancel();
                            statusTimer.purge();
                        }
                    }
                };
                log.trace("Starting timer task");
                long interval = TimeUnit.SECONDS.toMillis(pollingInterval);
                statusTimer.schedule(task, interval, interval);
            }).start();
        } catch (IOException ex) {
            throw new MobiException("Error running dagu requests", ex);
        } catch (InterruptedException ex) {
            throw new MobiException("Error making dagu HTTP request", ex);
        } catch (Exception ex) {
            log.trace("Removing WorkflowExecutionActivity due to Exception");
            removeActivity(activity);
            throw ex;
        }
    }

    protected Cookie getTokenCookie(User user) {
        String username = user.getUsername().orElseThrow(() ->
                new IllegalStateException("User does not have a username")).stringValue();
        SignedJWT jwt = tokenManager.generateAuthToken(username);
        return tokenManager.createSecureTokenCookie(jwt);
    }

    protected BinaryFile getSchedulerLog(String sha1WorkflowIRI, String logFilePath, WorkflowExecutionActivity activity,
                                       HttpClient client) throws IOException, InterruptedException {
        String logFileName = Paths.get(logFilePath).getFileName().toString();
        IRI logFileIRI = vf.createIRI(LOG_FILE_NAMESPACE + logFileName);
        BinaryFile binaryFile = binaryFileFactory.createNew(logFileIRI, activity.getModel());
        binaryFile.setFileName(logFileName);
        binaryFile.setMimeType("text/plain");
        if (isLocal) {
            log.trace("Dagu installation is local. Pulling log file straight from system");
            log.trace("Creating Binary File " + logFileIRI + " for logs");
            binaryFile.setRetrievalURL(vf.createIRI("file://" + logFilePath));
        } else {
            log.trace("Dagu installation is not local. Pulling log file through REST");
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
            if (dag.hasNonNull("ScLog") && dag.get("ScLog").isObject()) {
                ObjectNode sciLog = (ObjectNode) dag.get("ScLog");
                String content = sciLog.get("Content").asText();
                Path workflowLogDir = Path.of(logDir + "/" + sha1WorkflowIRI);
                if (Files.notExists(workflowLogDir)) {
                    Files.createDirectory(workflowLogDir);
                }
                Path workflowLogFile = Path.of(workflowLogDir + "/" + logFileName);
                log.trace("Creating log file locally at " + workflowLogFile);
                InputStream logStream = new ByteArrayInputStream(content.getBytes());
                try {
                    Files.copy(logStream, workflowLogFile, StandardCopyOption.REPLACE_EXISTING);
                    logStream.close();
                } catch (FileNotFoundException e) {
                    throw new MobiException("Error writing log file", e);
                } catch (IOException e) {
                    throw new MobiException("Error parsing log file", e);
                }
                binaryFile.setRetrievalURL(vf.createIRI("file://" + workflowLogFile));
            } else {
                throw new MobiException("Scheduler-log response did not contain log content");
            }
        }
        return binaryFile;
    }

    protected void initializeActionExecutions(WorkflowExecutionActivity activity, ObjectNode statusNode,
                                            String sha1WorkflowIRI, HashMap<String, List<String>> actionList) throws IOException, InterruptedException {
        Set<ActionExecution> actionExecutions = new HashSet<>();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.begin();
            for (List<String> stepList : actionList.values()) {
                ActionExecution actionExecution =
                        actionExecutionFactory.createNew(vf.createIRI(ACTION_EXECUTION_NAMESPACE + UUID.randomUUID()));
                getExecutionDetails(sha1WorkflowIRI, activity, conn, statusNode, stepList, actionExecution);
                actionExecutions.add(actionExecution);

                conn.add(actionExecution.getModel());

            }
            conn.commit();
        }
        activity.setHasActionExecution(actionExecutions);
    }

    protected void getExecutionDetails(String sha1WorkflowIRI, WorkflowExecutionActivity activity, RepositoryConnection conn,
                                        ObjectNode statusNode, List<String> stepList, ActionExecution execution) throws IOException, InterruptedException {
        Set<BinaryFile> logFiles = new HashSet<>();
        JsonNode steps = statusNode.get("Nodes");
        LocalDateTime startTime = null;
        LocalDateTime stopTime = null;
        boolean succeeded = true;
        for (String stepId: stepList) {
            for (JsonNode stepNode: steps) {
                if (stepNode.at("/Step/Name").toString().equals(stepId)) {
                    logFiles.add(createLogFile(stepNode, activity, sha1WorkflowIRI));
                    String stepStartedTime = stepNode.at("/StartedAt").asText();
                    String stepStoppedTime = stepNode.at("/FinishedAt").asText();
                    String stepStatus = stepNode.at("/StatusText").asText();
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                    startTime = verifyStartDate(startTime, LocalDateTime.parse(stepStartedTime, formatter));
                    stopTime = verifyStopDate(stopTime, LocalDateTime.parse(stepStoppedTime, formatter));

                    if (!stepStatus.equals("finished")) {
                        succeeded = false;
                    }
                    break;
                }
            }
        }
        for (BinaryFile file: logFiles) {
            conn.add(file.getModel());
        }

        execution.setLogs(logFiles);
        execution.setSucceeded(succeeded);
        execution.setStartedAt(OffsetDateTime.of(startTime, ZoneOffset.UTC));
        execution.setEndedAt(OffsetDateTime.of(stopTime, ZoneOffset.UTC));
    }

    private LocalDateTime verifyStartDate(LocalDateTime priorValue, LocalDateTime newValue) {
        if (priorValue == null && newValue != null) {
            return newValue;
        } else if (priorValue != null && newValue != null) {
            if (newValue.isBefore(priorValue)) {
                return newValue;
            }
        }

        return priorValue;
    }

    private LocalDateTime verifyStopDate(LocalDateTime priorValue, LocalDateTime newValue) {
        if (priorValue == null && newValue != null) {
            return newValue;
        } else if (priorValue != null && newValue != null) {
            if (newValue.isAfter(priorValue)) {
                return newValue;
            }
        }

        return priorValue;
    }

    private BinaryFile createLogFile(JsonNode stepNode, WorkflowExecutionActivity activity, String sha1WorkflowIRI) throws IOException, InterruptedException {
        String logFilePath = stepNode.get("Log").asText();
        String logFileName = Paths.get(logFilePath).getFileName().toString();
        IRI logFileIRI = vf.createIRI(LOG_FILE_NAMESPACE + logFileName);

        BinaryFile binaryFile = binaryFileFactory.createNew(logFileIRI, activity.getModel());
        binaryFile.setFileName(logFileName);
        binaryFile.setMimeType("text/plain");
        if (isLocal) {
            log.trace("Dagu installation is local. Pulling log file straight from system");
            log.trace("Creating Binary File " + logFileIRI + " for logs");
            binaryFile.setRetrievalURL(vf.createIRI("file://" + logFilePath));
        } else {
            String stepName = encode(stepNode.get("Step").get("Name").asText());
            log.trace("Dagu installation is not local. Pulling log file through REST");
            HttpRequest logRequest = HttpRequest.newBuilder(
                            URI.create(daguHost + "/dags/" + sha1WorkflowIRI + "/log?step=" + stepName))
                    .header("Accept", "application/json")
                    .build();
            HttpResponse<String> logResponse = client.send(logRequest, HttpResponse.BodyHandlers.ofString());
            if (logResponse.statusCode() != 200) {
                throw new MobiException("Could not connect to Dagu\n Status Code: "
                        + logResponse.statusCode() + "\n  Body: " + logResponse.body());
            }
            ObjectNode dag = mapper.readValue(logResponse.body(), ObjectNode.class);
            if (dag.hasNonNull("StepLog") && dag.get("StepLog").isObject()) {
                ObjectNode stepLog = (ObjectNode) dag.get("StepLog");
                String content = stepLog.get("Content").asText();
                Path workflowLogDir = Path.of(logDir + "/" + sha1WorkflowIRI);
                if (Files.notExists(workflowLogDir)) {
                    Files.createDirectory(workflowLogDir);
                }
                Path workflowLogFile = Path.of(workflowLogDir + "/" + logFileName);
                log.trace("Creating log file locally at " + workflowLogFile);
                InputStream logStream = new ByteArrayInputStream(content.getBytes());
                try {
                    Files.copy(logStream, workflowLogFile, StandardCopyOption.REPLACE_EXISTING);
                    logStream.close();
                } catch (FileNotFoundException e) {
                    throw new MobiException("Error writing log file", e);
                } catch (IOException e) {
                    throw new MobiException("Error parsing log file", e);
                }
                binaryFile.setRetrievalURL(vf.createIRI("file://" + workflowLogFile));
            } else {
                throw new MobiException("Dagu Step log response did not contain log content");
            }
        }
        return binaryFile;
    }

    private static String getFormDataAsString(Map<String, String> formData) {
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

    private Optional<ObjectNode> checkDag(String sha1WorkflowIRI) throws IOException, InterruptedException {
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

    private ActionDefinition toActionDefinition(Action action) {
        log.trace("Identifying ActionHandler for " + action.getResource());
        OrmFactory<? extends Action> ormFactory = getActionFactory(action.getResource(),
                action.getModel());
        ActionHandler<Action> handler = actionHandlers.get(ormFactory.getTypeIRI().stringValue());
        log.trace("Identified Action type as " + handler.getTypeIRI());
        return handler.createDefinition(ormFactory.getExisting(action.getResource(), action.getModel())
                .orElseThrow(() -> new IllegalStateException("Issue converting Action types")));
    }

    private ActionHandler<Action> getActionHandler(Resource actionId, Model model) {
        OrmFactory<? extends Action> ormFactory = getActionFactory(actionId, model);
        return actionHandlers.get(ormFactory.getTypeIRI().stringValue());
    }

    private OrmFactory<? extends Action> getActionFactory(Resource actionId, Model model) {
        for (OrmFactory<? extends Action> factory : getOrmFactories(actionId, model, Action.class)) {
            if (actionHandlers.containsKey(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories or handlers for this Action type");
    }

    private <T extends Thing> List<OrmFactory<? extends T>> getOrmFactories(Resource id, Model model,
                                                                              Class<T> clazz) {
        List<Resource> types = model.filter(id, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI), null)
                .stream()
                .map(Statements::objectResource)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
        return factoryRegistry.getSortedFactoriesOfType(clazz)
                .stream()
                .filter(ormFactory -> types.contains(ormFactory.getTypeIRI()))
                .collect(Collectors.toList());
    }

    private TriggerHandler<Trigger> getTriggerHandler(Resource triggerId, Model model) {
        OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(triggerId, model);
        return triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
    }

    private OrmFactory<? extends Trigger> getTriggerFactory(Resource triggerId, Model model) {
        for (OrmFactory<? extends Trigger> factory : getOrmFactories(triggerId, model, Trigger.class)) {
            if (triggerHandlers.containsKey(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories or handlers for this Trigger type");
    }

    private User getUser(Resource userId) {
        User user;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Model userModel = QueryResults.asModel(conn.getStatements(userId, null, null));
            user = userFactory.getExisting(userId, userModel).orElseThrow(() ->
                    new IllegalStateException("No user linked to iri " + userId));
        }

        return user;
    }

    private HashMap<String, List<String>> createActionList(Workflow workflow) {
        HashMap<String, List<String>> actionList = new HashMap<>();
        for (Action action: workflow.getHasAction()) {
            ActionDefinition definition = toActionDefinition(action);
            if (definition instanceof DaguActionDefinition) {
                actionList.put(action.getResource().toString(), ((DaguActionDefinition) definition).getStepNames());
            }
        }

        return actionList;
    }

    protected String createYaml(Workflow workflow) {
        if (isLocal) {
            return "logDir: " + logDir + "\n"
                    + "params: MOBI_HOST MOBI_TOKEN\n"
                    + "steps:\n" + workflow.getHasAction().stream()
                    .map(this::toActionDefinition)
                    .filter(def -> def instanceof DaguActionDefinition)
                    .map(Object::toString)
                    .collect(Collectors.joining("\n"));
        } else {
            return "params: MOBI_HOST MOBI_TOKEN\n"
                    + "steps:\n" + workflow.getHasAction().stream()
                    .map(this::toActionDefinition)
                    .filter(def -> def instanceof DaguActionDefinition)
                    .map(Object::toString)
                    .collect(Collectors.joining("\n"));
        }
    }
}
