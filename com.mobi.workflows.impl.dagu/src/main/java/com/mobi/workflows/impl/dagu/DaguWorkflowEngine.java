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
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.persistence.utils.Statements;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.security.api.EncryptionService;
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
import org.apache.commons.codec.digest.DigestUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.event.EventAdmin;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        service = { DaguWorkflowEngine.class, AbstractWorkflowEngine.class, WorkflowEngine.class},
        configurationPolicy = ConfigurationPolicy.REQUIRE,
        property = {
                "engineName=DaguWorkflowEngine"
        })
@Designate(ocd = DaguWorkflowEngineConfig.class)
public class DaguWorkflowEngine extends AbstractWorkflowEngine implements WorkflowEngine {
    public static final String ENGINE_NAME = "com.mobi.workflows.impl.dagu.DaguWorkflowEngine";

    private final Logger log = LoggerFactory.getLogger(DaguWorkflowEngine.class);

    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final Map<String, ActionHandler<Action>> actionHandlers = new HashMap<>();
    protected final Map<String, TriggerHandler<Trigger>> triggerHandlers = new HashMap<>();

    private Path logDir;
    private long pollingTimeout;
    private long pollingInterval;
    private boolean isLocal;
    private String password;
    private int concurrentLimit;

    protected DaguHttpClient daguHttpClient;

    @Reference
    TokenManager tokenManager;

    @Reference
    EngineManager engineManager;

    @Reference
    Mobi mobi;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference(target = "(id=prov)")
    protected OsgiRepository provRepo;

    @Reference
    protected OrmFactoryRegistry factoryRegistry;

    @Reference
    protected BinaryFileFactory binaryFileFactory;

    @Reference
    protected ActionExecutionFactory actionExecutionFactory;

    @Reference
    protected ConfigurationAdmin configurationAdmin;

    @Reference
    protected EncryptionService encryptionService;

    @Reference
    protected void setEventAdmin(EventAdmin eventAdmin) {
        this.eventAdmin = eventAdmin;
    }

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
        setupEncryption(config);
        validateConfig(config);
        log.trace("DaguWorkflowEngine started with config: " + config);
        setUpEngine(config);
        log.debug("Started DaguWorkflowEngine");
    }

    public boolean availableToRun() {
        return threadPool.getActiveCount() < concurrentLimit;
    }

    @Override
    public void startWorkflow(Workflow workflow, WorkflowExecutionActivity activity) {
        String sha1WorkflowIRI = DigestUtils.sha1Hex(workflow.getResource().stringValue());
        try {
            log.debug("Collecting actions to execute");
            Map<Action, List<String>> actionList = createActionList(workflow);
            String workflowYaml = createYaml(workflow);

            ObjectNode dag = daguHttpClient.getDag(sha1WorkflowIRI);
            if (dag.hasNonNull("DAG") && dag.get("DAG").hasNonNull("Error")) {
                daguHttpClient.createDag(sha1WorkflowIRI);
            }
            log.trace("Updating dag " + sha1WorkflowIRI);
            daguHttpClient.updateDag(workflowYaml, sha1WorkflowIRI);

            log.trace("Running dag");
            daguHttpClient.runDagJob(activity, sha1WorkflowIRI);

            log.info("Successfully started Workflow " + workflow.getResource());
            Runnable runnable = () -> {
                CountDownLatch latch = new CountDownLatch(1);
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
                            latch.countDown();
                            return;
                        }
                        try {
                            Optional<ObjectNode> opt = daguHttpClient.checkDagExist(sha1WorkflowIRI);
                            if (opt.isPresent()) {
                                ObjectNode objectNode = opt.get();
                                log.debug("Workflow " + workflow.getResource() + " completed");
                                ObjectNode statusObject = (ObjectNode) objectNode.get("DAG").get("Status");
                                String logFilePath = statusObject.get("Log").asText();
                                BinaryFile binaryFile = getSchedulerLog(sha1WorkflowIRI, logFilePath, activity);
                                initializeActionExecutions(activity, statusObject, sha1WorkflowIRI, actionList);
                                String statusText = statusObject.get("StatusText").asText();
                                log.trace("Ending execution activity");
                                executingWorkflows.remove(workflow.getResource());
                                endExecutionActivity(activity, binaryFile,
                                        statusText.equalsIgnoreCase("finished"));
                                statusTimer.cancel();
                                statusTimer.purge();
                                latch.countDown();
                            }
                        } catch (Exception ex) {
                            log.error("Polling status timer hit an exception. Marking workflow as failure");
                            StringWriter sw = new StringWriter();
                            PrintWriter pw = new PrintWriter(sw);
                            ex.printStackTrace(pw);
                            BinaryFile errorLog = createErrorLog(activity, sha1WorkflowIRI, sw.toString());
                            endExecutionActivity(activity, errorLog, false);
                            executingWorkflows.remove(workflow.getResource());
                            statusTimer.cancel();
                            statusTimer.purge();
                            latch.countDown();
                        }
                    }
                };
                log.trace("Starting timer task");
                long interval = TimeUnit.SECONDS.toMillis(pollingInterval);
                statusTimer.schedule(task, interval, interval);

                try {
                    latch.await();   // Wait until the latch count reaches zero
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            };

            threadPool.submit(runnable);
        } catch (Exception ex) {
            log.debug("Ending WorkflowExecutionActivity due to Exception");
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            ex.printStackTrace(pw);
            BinaryFile errorLog = createErrorLog(activity, sha1WorkflowIRI, sw.toString());
            endExecutionActivity(activity, errorLog, false);
            executingWorkflows.remove(workflow.getResource());
        }
    }

    /**
     * Create a BinaryFile for the latest scheduler log for a Dag identified by the SHA1 hashed Workflow IRI at the
     * provided log file path if it is a local Dagu installation. Creates the BinaryFile triples in the model of the
     * provided WorkflowExecutionActivity.
     *
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @param logFilePath The File Path to where the log file should be stored
     * @param activity WorkflowExecutionActivity
     * @return The BinaryFile instance for the scheduler log of the latest Workflow execution
     * @throws IOException If an error occurs sending HTTP requests
     * @throws InterruptedException If an error occurs sending HTTP requests
     */
    protected BinaryFile getSchedulerLog(String sha1WorkflowIRI, String logFilePath,
                                         WorkflowExecutionActivity activity) throws IOException, InterruptedException {
        Path logFilePathObj = Paths.get(logFilePath);
        String logFileName = logFilePathObj.getFileName().toString();
        IRI logFileIRI = vf.createIRI(LOG_FILE_NAMESPACE + logFileName);
        BinaryFile binaryFile = binaryFileFactory.createNew(logFileIRI, activity.getModel());
        binaryFile.setFileName(logFileName);
        binaryFile.setMimeType("text/plain");
        if (isLocal) {
            log.trace("Dagu installation is local. Pulling log file straight from system");
            log.trace("Creating Binary File " + logFileIRI + " for logs");
            binaryFile.setRetrievalURL(vf.createIRI("file://" + logFilePath));
            binaryFile.setSize(Long.valueOf(Files.size(logFilePathObj)).doubleValue());
        } else {
            log.trace("Dagu installation is not local. Pulling log file through REST");
            ObjectNode dag = daguHttpClient.getSchedulerLog(sha1WorkflowIRI);
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
                binaryFile.setSize(Long.valueOf(Files.size(workflowLogFile)).doubleValue());
            } else {
                throw new MobiException("Scheduler-log response did not contain log content");
            }
        }
        return binaryFile;
    }

    /**
     * Initialize Action Executions for the latest execution of a Dag identified by the provided SHA1 hashed Workflow
     * IRI. The Action Executions are added to the provided WorkflowExecutionActivity. Only creates Action Executions
     * for the actions represented in the provided Map of Action IRIs to Dagu step names. WorkflowExecutionActivity and
     * ActionExecution should be in ProvRepo
     * <a href="https://github.com/dagu-dev/dagu/blob/v1.11.0/internal/web/handlers/dag.go#L66">statusNode</a>
     *
     * @param workflowExecutionActivity The WorkflowExecutionActivity to attach the Action Executions to
     * @param statusNode The Dagu Response DAG -> Status
     * @param sha1WorkflowIRI A Workflow IRI that has been SHA1 hashed
     * @param actionList A map of Action IRIs to their associated Dagu step names
     * @throws IOException If an error occurs sending HTTP requests
     * @throws InterruptedException If an error occurs sending HTTP requests
     */
    protected void initializeActionExecutions(WorkflowExecutionActivity workflowExecutionActivity,
                                              ObjectNode statusNode, String sha1WorkflowIRI,
                                              Map<Action, List<String>> actionList)
            throws IOException, InterruptedException {
        Set<ActionExecution> actionExecutions = new HashSet<>();

        try (RepositoryConnection conn = provRepo.getConnection()) {
            conn.begin();
            for (Action action : actionList.keySet()) {
                List<String> stepList = actionList.get(action);
                ActionExecution actionExecution =
                        actionExecutionFactory.createNew(vf.createIRI(ACTION_EXECUTION_NAMESPACE + UUID.randomUUID()));
                actionExecution.setAboutAction(action);
                Set<BinaryFile> logFiles = getExecutionDetails(sha1WorkflowIRI, workflowExecutionActivity, statusNode,
                        stepList, actionExecution);
                actionExecutions.add(actionExecution);

                conn.add(actionExecution.getModel());
                for (BinaryFile file: logFiles) {
                    conn.add(file.getModel());
                }
            }
            workflowExecutionActivity.setHasActionExecution(actionExecutions);
            // Update workflowExecutionActivity
            conn.getStatements(workflowExecutionActivity.getResource(), null, null).forEach(conn::remove);
            conn.add(workflowExecutionActivity.getModel());
            conn.commit();
        }
    }

    /**
     * Returns a set of BinaryFiles representing the logs of all the steps making up the provided ActionExecution.
     * If none of the steps were able to run, returns an empty set representing that the ActionExecution should not
     * be created.
     */
    protected Set<BinaryFile> getExecutionDetails(String sha1WorkflowIRI, WorkflowExecutionActivity activity,
                                        ObjectNode statusNode, List<String> stepList, ActionExecution execution)
            throws IOException, InterruptedException {
        Set<BinaryFile> logFiles = new HashSet<>();
        JsonNode steps = statusNode.get("Nodes");
        LocalDateTime startTime = null;
        LocalDateTime stopTime = null;
        boolean succeeded = true;
        for (String stepId: stepList) {
            for (JsonNode stepNode: steps) {
                if (stepNode.at("/Step/Name").toString().equals(stepId)) {
                    BinaryFile file = createLogFile(stepNode, activity, sha1WorkflowIRI);
                    if (file != null) {
                        logFiles.add(file);
                        String stepStartedTime = stepNode.at("/StartedAt").asText();
                        String stepStoppedTime = stepNode.at("/FinishedAt").asText();
                        String stepStatus = stepNode.at("/StatusText").asText();
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                        if (!stepStartedTime.equals("-") && !stepStoppedTime.equals("-")) {
                            startTime = verifyStartDate(startTime, LocalDateTime.parse(stepStartedTime, formatter));
                            stopTime = verifyStopDate(stopTime, LocalDateTime.parse(stepStoppedTime, formatter));
                        }

                        if (!stepStatus.equals("finished")) {
                            succeeded = false;
                        }
                        break;
                    }
                }
            }
        }
        execution.setLogs(logFiles);
        if (startTime == null || stopTime == null) {
            log.debug("None of the Steps for Action " + execution.getAboutAction_resource().get() + " were run");
        } else {
            ZoneOffset offset = OffsetDateTime.now().getOffset();
            execution.setStartedAt(startTime.atOffset(offset));
            execution.setEndedAt(stopTime.atOffset(offset));
            execution.setSucceeded(succeeded);
        }
        return logFiles;
    }

    private BinaryFile createLogFile(JsonNode stepNode, WorkflowExecutionActivity activity, String sha1WorkflowIRI)
            throws IOException, InterruptedException {
        String logFilePath = stepNode.get("Log").asText();
        if (logFilePath.isEmpty()) {
            return null;
        }
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
            ObjectNode dag = daguHttpClient.getLogForStep(sha1WorkflowIRI, stepName);
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

    /**
     * Create a Map of Action IRIs to the names of their associated Dagu steps from within the provided Workflow.
     *
     * @param workflow Workflow to create action list from
     * @return A Map of Action IRIs to the names of their associated Dagu steps
     */
    private Map<Action, List<String>> createActionList(Workflow workflow) {
        Map<Action, List<String>> actionList = new HashMap<>();
        for (Action action: workflow.getHasAction()) {
            ActionDefinition definition = toActionDefinition(action);
            if (definition instanceof DaguActionDefinition) {
                actionList.put(action, ((DaguActionDefinition) definition).getStepNames());
            }
        }
        return actionList;
    }

    /**
     * Create a Dagy Yaml string for the provided Workflow. Iterates through all Actions turning them into
     * {@link ActionDefinition} instances and adding their parsed Dagu steps. If Dagu installation is local, specifies
     * the directory for storing log files.
     * <a href="https://github.com/dagu-dev/dagu/blob/v1.11.0/docs/source/yaml_format.rst">Yaml Format</a>
     *
     * @param workflow The Workflow to generate Yaml for
     * @return A Dagu compliant Yaml String
     */
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

    /**
     * Creates a log file in the configured directory that holds the stacktrace of the exception that caused the
     * workflow to fail.
     *
     * @param activity The executing {@link WorkflowExecutionActivity} that has failed with an exception.
     * @param sha1WorkflowIRI A string representing the hashed value of the Workflows {@link IRI}.
     * @param error The String representation of the stacktrace of the exception that caused the execution to fail.
     * @return An {@link BinaryFile} that holds the stacktrace details and should be attached to the execution activity.
     */
    protected BinaryFile createErrorLog(WorkflowExecutionActivity activity, String sha1WorkflowIRI, String error) {
        OffsetDateTime now = OffsetDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String currentTime = now.format(formatter);
        String fileName = "error-" + currentTime + ".log";
        BinaryFile errorLogFile = binaryFileFactory.createNew(vf.createIRI(LOG_FILE_NAMESPACE + fileName),
                activity.getModel());
        errorLogFile.setFileName(fileName);
        errorLogFile.setMimeType("text/plain");
        Path workflowLogDir = Path.of(logDir + "/" + sha1WorkflowIRI);

        try (InputStream logStream = new ByteArrayInputStream(error.getBytes())) {
            if (Files.notExists(workflowLogDir)) {
                Files.createDirectory(workflowLogDir);
            }
            Path workflowLogFile = Path.of(workflowLogDir + "/" + fileName);
            Files.copy(logStream, workflowLogFile, StandardCopyOption.REPLACE_EXISTING);
            errorLogFile.setRetrievalURL(vf.createIRI("file://" + workflowLogFile));
        } catch (IOException ex) {
            String errorText = "Could not create log file for error. Please see karaf logs for more details.";
            log.error(errorText);
            throw new MobiException(errorText);
        }

        return errorLogFile;
    }

    protected void updatedEncryptionService(EncryptionService encryptionService) {
        try {
            encryptionService.encrypt(password, "password", this.configurationAdmin.getConfiguration(ENGINE_NAME));
        } catch (IOException e) {
            log.error("Could not get configuration for " + ENGINE_NAME, e);
            throw new MobiException(e);
        } catch (MobiException m) {
            log.error("Encryption service password has been changed. Please enter the DAGU basic auth password in " +
                    "plaintext to encrypt/decrypt.");
        }
    }

    /**
     * Sets up the Dagu Workflow Engine with the provided configuration options.
     *
     * @param config The {@link DaguWorkflowEngineConfig} for the Dagu Workflow Engine
     * @throws IOException If an error occurs during setup
     */
    private void setUpEngine(DaguWorkflowEngineConfig config) throws IOException {
        daguHttpClient = new DaguHttpClient(config.daguHost(), tokenManager, engineManager, mobi,
                config.username(), password);
        isLocal = config.local();
        pollingTimeout = config.pollTimeout();
        pollingInterval = config.pollInterval();
        concurrentLimit = config.concurrencyLimit();
        threadPool = (ThreadPoolExecutor) Executors.newFixedThreadPool(config.concurrencyLimit());
        logDir = Paths.get(config.logDir());
        if (Files.notExists(logDir)) {
            Files.createDirectory(logDir);
        }
    }

    /**
     * Validates whether the configuration for the Dagu Workflow Engine has both the basic auth username and password
     * or neither of the two. Throws an IllegalArgumentException if the configuration is invalid.
     *
     * @param config The {@link DaguWorkflowEngineConfig} to validate
     * @throws IllegalArgumentException if the configuration is invalid
     */
    private void validateConfig(DaguWorkflowEngineConfig config) {
        if (config.username() != null & config.password() == null) {
            throw new IllegalArgumentException("Dagu Workflow Engine cannot be run due to DaguWorkflowEngineConfig" +
                    " having a basic auth username and no password configured.");
        } else if (config.username() == null & config.password() != null) {
            throw new IllegalArgumentException("Dagu Workflow Engine cannot be run due to DaguWorkflowEngineConfig" +
                    " having a basic auth password and no username configured.");
        }
    }

    private void setupEncryption(DaguWorkflowEngineConfig config) {
        try {
            password = encryptionService.isEnabled() ? encryptionService.decrypt(config.password(), "password",
                    this.configurationAdmin.getConfiguration(ENGINE_NAME)) : config.password();
        } catch (IOException e) {
            log.error("Could not get configuration for " + ENGINE_NAME, e);
            throw new MobiException(e);
        } catch (MobiException m) {
            log.error("Encryption service password has been changed. Please enter the DAGU basic auth password in" +
                    "plaintext to encrypt/decrypt.");
        }
    }
}
