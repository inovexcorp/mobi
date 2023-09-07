package com.mobi.workflows.impl.core;

/*-
 * #%L
 * com.mobi.workflows.impl.core
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

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.Statements;
import com.mobi.prov.api.ProvOntologyLoader;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.vfs.ontologies.documents.BinaryFileFactory;
import com.mobi.workflows.api.WorkflowEngine;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.WorkflowsTopics;
import com.mobi.workflows.api.action.ActionDefinition;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.workflows.Action;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivityFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import com.mobi.workflows.api.trigger.TriggerHandler;
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.common.exception.ValidationException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF4J;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.eclipse.rdf4j.sail.shacl.ShaclSail;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import javax.servlet.http.Cookie;
import javax.ws.rs.core.StreamingOutput;

@Component(immediate = true, service = { SimpleWorkflowManager.class, WorkflowManager.class, EventHandler.class })
public class SimpleWorkflowManager implements WorkflowManager, EventHandler {

    protected final Map<String, TriggerHandler<Trigger>> triggerHandlers = new HashMap<>();
    protected final Map<String, ActionHandler<Action>> actionHandlers = new HashMap<>();
    protected final List<Resource> executingWorkflows = new ArrayList<>();
    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final ModelFactory mf = new DynamicModelFactory();

    private final Logger log = LoggerFactory.getLogger(SimpleWorkflowManager.class);
    private static final String AT_LOCATION = "http://www.w3.org/ns/prov#atLocation";
    private static final String WORKFLOW_IRI = "workflowIRI";
    private static final String CATALOG = "catalog";
    private static final String FIND_WORKFLOW;
    private static final String GET_EXECUTING_WORKFLOWS;

    static {
        try {
            FIND_WORKFLOW = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class.getResourceAsStream("/find-workflow-graph.rq")),
                    StandardCharsets.UTF_8
            );
            GET_EXECUTING_WORKFLOWS = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class
                            .getResourceAsStream("/get_executing_workflows.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference(target = "(id=prov)")
    protected OsgiRepository provRepo;

    @Reference
    protected WorkflowRecordFactory workflowRecordFactory;

    @Reference
    protected WorkflowFactory workflowFactory;

    @Reference
    protected UserFactory userFactory;

    @Reference
    protected WorkflowExecutionActivityFactory workflowExecutionActivityFactory;

    @Reference
    protected EntityFactory entityFactory;

    @Reference
    protected VirtualFilesystem vfs;

    @Reference
    protected BinaryFileFactory binaryFileFactory;

    @Reference
    protected OrmFactoryRegistry factoryRegistry;

    @Reference
    protected ProvenanceService provService;

    @Reference
    protected TokenManager tokenManager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected RecordManager recordManager;

    @Reference
    protected CompiledResourceManager compiledResourceManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected BranchManager branchManager;

    @Reference
    protected ThingManager thingManager;

    @Reference(cardinality = ReferenceCardinality.OPTIONAL)
    protected WorkflowEngine workflowEngine;

    @Reference(cardinality = ReferenceCardinality.MULTIPLE, policy = ReferencePolicy.DYNAMIC)
    @SuppressWarnings("unchecked")
    protected void addTriggerHandler(TriggerHandler<? extends Trigger> triggerHandler) {
        this.triggerHandlers.put(triggerHandler.getTypeIRI(), (TriggerHandler<Trigger>) triggerHandler);
        initializeTriggerServices(triggerHandler.getTypeIRI());
    }

    protected void removeTriggerHandler(TriggerHandler<? extends Trigger> triggerHandler) {
        this.triggerHandlers.remove(triggerHandler.getTypeIRI());
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
    protected void startService() {
        ProvOntologyLoader.loadOntology(provRepo, WorkflowManager.class.getResourceAsStream("/workflows.ttl"));
        initializeExecutingWorkflowsList();
    }

    private void initializeExecutingWorkflowsList() {
        log.debug("Initializing currently executing Workflows");
        try (RepositoryConnection conn = provService.getConnection();
                TupleQueryResult result = conn.prepareTupleQuery(GET_EXECUTING_WORKFLOWS).evaluate()) {
            if (result.hasNext()) {
                result.forEach(bindings -> {
                    Resource workflowId = Bindings.requiredResource(bindings, "workflow");
                    log.trace("Workflow " + workflowId + " is currently executing");
                    if (!executingWorkflows.contains(workflowId)) {
                        executingWorkflows.add(workflowId);
                    }
                });
            } else {
                log.trace("No executing Workflows found");
            }
        }
    }

    private void initializeTriggerServices(String triggerType) {
        log.debug("Initializing Workflow TriggerServices for " + triggerType);
        //TODO come back and figure out what to do with these exceptions
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder().ascending(true);
            builder.typeFilter(vf.createIRI(WorkflowRecord.TYPE));
            List<Record> records = recordManager.findRecord(configProvider.getLocalCatalogIRI(),
                    builder.build(), conn).getPage();

            if (!records.isEmpty()) {
                for (Record record : records) {
                    Value workflowIRI = record.getProperty(vf.createIRI(WorkflowRecord.workflowIRI_IRI))
                            .orElseThrow(() -> new IllegalStateException("Workflow Records must have linked Workflow"));

                    Workflow workflow = getWorkflow(vf.createIRI(workflowIRI.toString()))
                            .orElseThrow(() ->
                                    new IllegalArgumentException("Workflow " + workflowIRI + " does not exist"));

                    Optional<Trigger> trigger = workflow.getHasTrigger();

                    if (trigger.isPresent()) {
                        log.trace("Workflow " + workflowIRI + " has Trigger " + trigger.get().getResource());
                        Resource triggerId = trigger.get().getResource();

                        OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(triggerId, workflow.getModel());
                        TriggerHandler<Trigger> handler = triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
                        log.trace("Identified Trigger type as " + handler.getTypeIRI());
                        if (handler.exists(triggerId)) {
                            log.trace("TriggerService already exists for " + triggerId);
                        } else if (ormFactory.getTypeIRI().stringValue().equals(triggerType)) {
                            log.debug("Creating TriggerService for " + triggerId);
                            handler.create(workflow.getResource(), ormFactory.getExisting(triggerId, workflow.getModel())
                                    .orElseThrow(() -> new IllegalStateException("Issue converting Trigger types")));
                        }
                    }
                }
            } else {
                log.trace("No Workflow Records Found");
            }
        }
    }

    @Override
    public boolean workflowRecordIriExists(Resource workflowId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(FIND_WORKFLOW);
            query.setBinding(WORKFLOW_IRI, workflowId);
            query.setBinding(CATALOG, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            boolean exists = result.hasNext();
            result.close();
            return exists;
        }
    }

    @Override
    public void createTriggerService(WorkflowRecord workflowRecord) {
        Optional<Resource> workflowIRIOpt = workflowRecord.getWorkflowIRI();
        if (workflowIRIOpt.isPresent()) {
            Resource workflowIRI = workflowIRIOpt.get();
            Workflow workflow = getWorkflow(workflowIRI).orElseThrow(() ->
                    new IllegalArgumentException("Workflow " + workflowIRI + " does not exist"));

            // Create trigger service if present
            workflow.getHasTrigger_resource().ifPresent(triggerIRI -> {
                log.debug("Creating TriggerService for " + triggerIRI);
                try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                    Model triggerModel = QueryResults.asModel(conn.getStatements(triggerIRI, null, null));
                    OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(triggerIRI, triggerModel);
                    TriggerHandler<Trigger> handler = triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
                    log.trace("Identified Trigger type as " + handler.getTypeIRI());
                    // Assumption that Workflows don't share Triggers
                    handler.create(workflow.getResource(), ormFactory.getExisting(triggerIRI, triggerModel)
                            .orElseThrow(() -> new IllegalStateException("Issue converting Trigger types")));
                }
            });
        }
    }

    @Override
    public void deleteTriggerService(WorkflowRecord workflowRecord) {
        Optional<Resource> workflowIRIOpt = workflowRecord.getWorkflowIRI();
        if (workflowIRIOpt.isPresent()) {
            Resource workflowIRI = workflowIRIOpt.get();
            log.trace("Searching for original Workflow");
            Workflow workflow = getWorkflow(workflowIRI).orElseThrow(() ->
                    new IllegalArgumentException("Workflow " + workflowIRI + " does not exist and can't be deleted."));

            // Remove trigger service if present
            workflow.getHasTrigger().ifPresent(trigger -> {
                log.debug("Removing TriggerService for " + trigger.getResource());
                TriggerHandler<Trigger> handler = getTriggerHandler(trigger.getResource(), trigger.getModel());
                log.trace("Identified Trigger type as " + handler.getTypeIRI());
                handler.remove(trigger.getResource());
            });
        }
    }

    @Override
    public void updateTriggerService(WorkflowRecord workflowRecord, Workflow oldWorkflow) {
        log.debug("Updating trigger services linked to Record " + workflowRecord.getResource());
        Resource workflowIRI = workflowRecord.getWorkflowIRI().orElseThrow(() ->
                new IllegalArgumentException("Workflow Record " + workflowRecord.getResource()
                        + " missing workflow entity"));

        Workflow workflow = getWorkflow(workflowIRI).orElseThrow(() ->
                new IllegalArgumentException("Workflow " + workflowIRI + " does not exist"));

        if (executingWorkflows.contains(workflowIRI)) {
            throw new IllegalArgumentException("Workflow " + workflowIRI + " is currently executing. "
                    + "Cannot update.");
        }

        // Clean up old Trigger and handle new Trigger
        Optional<Trigger> newTrigger = workflow.getHasTrigger();
        AtomicBoolean updated = new AtomicBoolean(false);
        oldWorkflow.getHasTrigger().ifPresent(trigger -> {
            log.debug("Cleaning up old TriggerService for " + trigger.getResource());
            OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(trigger.getResource(), trigger.getModel());
            TriggerHandler<Trigger> handler = triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
            log.trace("Identified old Trigger type as " + handler.getTypeIRI());
            if (handler.exists(trigger.getResource())) {
                if (newTrigger.isPresent() && newTrigger.get().getResource().equals(trigger.getResource())) {
                    log.debug("Old Trigger is being updated with new Trigger");
                    // Assumption made that if IRI is the same, the type is the same
                    Trigger convertedTrigger = ormFactory.getExisting(trigger.getResource(), trigger.getModel())
                            .orElseThrow(() -> new IllegalStateException("Issue converting Trigger types"));
                    handler.update(convertedTrigger);
                    updated.set(true);
                } else {
                    log.trace("Old Trigger is being removed");
                    handler.remove(trigger.getResource());
                }
            } else {
                log.trace("Old TriggerService no longer exists");
            }
        });
        if (!updated.get() && newTrigger.isPresent()) {
            Trigger trigger = newTrigger.get();
            log.debug("Adding new TriggerService for " + trigger.getResource());
            OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(trigger.getResource(), trigger.getModel());
            TriggerHandler<Trigger> handler = triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
            log.trace("Identified new Trigger type as " + handler.getTypeIRI());
            // Assumption made that trigger didn't already exist
            handler.create(workflow.getResource(), ormFactory.getExisting(trigger.getResource(), trigger.getModel())
                    .orElseThrow(() -> new IllegalStateException("Issue converting Trigger types")));
        }
        log.debug("Successfully updated Workflow for workflow Record " + workflowRecord.getResource());
    }

    @Override
    public Optional<Workflow> getWorkflow(Resource workflowId) {
        log.trace("Retrieving Workflow " + workflowId);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return getWorkflow(workflowId, conn);
        }
    }

    private Optional<Workflow> getWorkflow(Resource workflowId, RepositoryConnection conn) {
        RepositoryResult<Statement> results = conn.getStatements(null, vf.createIRI(WorkflowRecord.workflowIRI_IRI),
                workflowId);
        Optional<Statement> optStmt = results.stream().findFirst();
        results.close();

        if (optStmt.isPresent()) {
            Resource workflowRecordIRI = optStmt.get().getSubject();

            Branch masterBranch = branchManager.getMasterBranch(configProvider.getLocalCatalogIRI(),
                    workflowRecordIRI, conn);

            Commit headCommit = commitManager.getHeadCommit(configProvider.getLocalCatalogIRI(), workflowRecordIRI,
                    masterBranch.getResource(), conn);

            Model recordModel = compiledResourceManager.getCompiledResource(headCommit.getResource(), conn);

            return workflowFactory.getExisting(workflowId, recordModel);
        }
        return Optional.empty();
    }

    @Override
    public Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId) {
        log.trace("Retrieving Workflow Execution Activity " + executionId);
        try (RepositoryConnection conn = provRepo.getConnection()) {
            return getExecutionActivity(executionId, conn);
        }
    }

    private Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId, RepositoryConnection conn) {
        if (ConnectionUtils.contains(conn, executionId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(WorkflowExecutionActivity.TYPE))) {
            Model model = QueryResults.asModel(conn.getStatements(executionId, null, null), mf);
            return workflowExecutionActivityFactory.getExisting(executionId, model);
        }
        return Optional.empty();
    }

    @Override
    public StreamingOutput getLogFile(BinaryFile binaryFile) throws VirtualFilesystemException {
        return retrieveLogContents(binaryFile);
    }

    @Override
    public StreamingOutput getLogFile(Resource logId) throws VirtualFilesystemException {
        try (RepositoryConnection conn = provRepo.getConnection()) {
            if (ConnectionUtils.contains(conn, logId, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                    vf.createIRI(BinaryFile.TYPE))) {
                Model model = QueryResults.asModel(conn.getStatements(logId, null, null), mf);
                BinaryFile logFile = binaryFileFactory.getExisting(logId, model).orElseThrow(() ->
                        new IllegalStateException("Expected Log file " + logId + " not found")
                );

                return retrieveLogContents(logFile);
            } else {
                throw new IllegalArgumentException("Log file " + logId + " does not exist on the system.");
            }
        }
    }

    @Override
    public Resource startWorkflow(User user, WorkflowRecord workflowRecord) {
        Resource workflowId = workflowRecord.getWorkflowIRI().orElseThrow(() ->
                new IllegalStateException("Workflow Record must be linked to workflow object."));

        log.debug("Starting Workflow " + workflowId + " for User " + user.getResource());
        log.trace("Retrieving Workflow definition");
        Workflow workflow = getWorkflow(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow " + workflowId + " does not exist"));

        if (executingWorkflows.contains(workflowId)) {
            throw new IllegalArgumentException("Workflow " + workflowId + " is currently executing. Wait a bit and "
                    + "try again.");
        }

        if (workflowEngine == null) {
            throw new MobiException("No workflow engine configured.");
        }
        WorkflowExecutionActivity activity = startExecutionActivity(user, workflowRecord);

        try {
            workflowEngine.startWorkflow(workflow, activity);
            return activity.getResource();
        } catch (NullPointerException ex) {
            removeActivity(activity);
            throw new MobiException("No workflow engine configured.");
        }
    }

    @Override
    public void handleEvent(Event event) {
        log.debug("Identified Workflow start Event");
        Resource workflowId = (Resource) event.getProperty(WorkflowsTopics.START_PROPERTY_WORKFLOW);
        log.debug("Start Event for Workflow " + workflowId);
        log.trace("Retrieving Workflow definition");

        Workflow workflow = getWorkflow(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow " + workflowId + " does not exist"));

        Resource workFlowRecordIRI;
        WorkflowRecord workflowRecord;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(WorkflowRecord.workflowIRI_IRI), workflowId));

            workFlowRecordIRI = statements.get(0).getSubject();

            workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(), workFlowRecordIRI,
                    workflowRecordFactory, conn);
        }

        // Sets user on activity to the creator when automatically triggered
        log.trace("Collecting creator of Workflow");
        Resource userId = (Resource) workflow.getProperty(vf.createIRI(_Thing.creator_IRI)).orElseThrow(() ->
                new IllegalStateException("Workflow must have a dct:creator set"));
        log.debug("Workflow Start Event as User " + userId);
        if (workflowRecord.getActive().isEmpty()) {
            log.debug("Workflow " + workflowId + " is not active. Skipping execution.");
        } else {
            if (executingWorkflows.contains(workflowId)) {
                log.debug("Workflow " + workflowId + " is currently executing. Skipping execution.");
            } else {
                WorkflowExecutionActivity activity = startExecutionActivity(userFactory.createNew(userId),
                        workflowRecord);
                try {
                    workflowEngine.startWorkflow(workflow, activity);
                } catch (NullPointerException ex) {
                    removeActivity(activity);
                    throw new MobiException("No workflow engine configured.");
                }
            }
        }
    }

    protected ActionDefinition toActionDefinition(Action action) {
        log.trace("Identifying ActionHandler for " + action.getResource());
        OrmFactory<? extends Action> ormFactory = getActionFactory(action.getResource(),
                action.getModel());
        ActionHandler<Action> handler = actionHandlers.get(ormFactory.getTypeIRI().stringValue());
        log.trace("Identified Action type as " + handler.getTypeIRI());
        return handler.createDefinition(ormFactory.getExisting(action.getResource(), action.getModel())
                .orElseThrow(() -> new IllegalStateException("Issue converting Action types")));
    }

    protected TriggerHandler<Trigger> getTriggerHandler(Resource triggerId, Model model) {
        OrmFactory<? extends Trigger> ormFactory = getTriggerFactory(triggerId, model);
        return triggerHandlers.get(ormFactory.getTypeIRI().stringValue());
    }

    protected OrmFactory<? extends Trigger> getTriggerFactory(Resource triggerId, Model model) {
        for (OrmFactory<? extends Trigger> factory : getOrmFactories(triggerId, model, Trigger.class)) {
            if (triggerHandlers.containsKey(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories or handlers for this Trigger type");
    }

    protected ActionHandler<Action> getActionHandler(Resource actionId, Model model) {
        OrmFactory<? extends Action> ormFactory = getActionFactory(actionId, model);
        return actionHandlers.get(ormFactory.getTypeIRI().stringValue());
    }

    protected OrmFactory<? extends Action> getActionFactory(Resource actionId, Model model) {
        for (OrmFactory<? extends Action> factory : getOrmFactories(actionId, model, Action.class)) {
            if (actionHandlers.containsKey(factory.getTypeIRI().stringValue())) {
                return factory;
            }
        }

        throw new IllegalArgumentException("No known factories or handlers for this Action type");
    }

    protected <T extends Thing> List<OrmFactory<? extends T>> getOrmFactories(Resource id, Model model,
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

    protected WorkflowExecutionActivity startExecutionActivity(User user, WorkflowRecord workflowRecord) {
        Resource recordId = workflowRecord.getResource();
        Entity workflowEntity;
        try (RepositoryConnection conn = provService.getConnection()) {
            workflowEntity = entityFactory.getExisting(recordId, QueryResults.asModel(
                            conn.getStatements(recordId, null, null), mf))
                    .orElseGet(() -> {
                        log.warn("No Entity found for workflow record" + recordId);
                        Entity entity = entityFactory.createNew(recordId);
                        entity.addProperty(vf.createLiteral(configProvider.getRepositoryId()),
                                vf.createIRI(AT_LOCATION));
                        return entity;
                    });
        }
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(WorkflowExecutionActivity.class), user)
                .usedEntity(workflowEntity)
                .build();
        Activity activity = initializeActivity(config);

        provService.addActivity(activity);

        WorkflowExecutionActivity workflowActivity = workflowExecutionActivityFactory.getExisting(
                activity.getResource(), activity.getModel()).orElseThrow(() ->
                new IllegalStateException("WorkflowExecutionActivity not made correctly"));

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            conn.begin();
            workflowRecord.clearLatestActivity();
            workflowRecord.setLatestActivity(workflowActivity);
            thingManager.updateObject(workflowRecord, conn);
            conn.commit();
        }
        return workflowActivity;
    }

    protected Activity initializeActivity(ActivityConfig config) {
        Activity activity = provService.createActivity(config);
        activity.addStartedAtTime(OffsetDateTime.now());

        return activity;
    }

    protected void removeActivity(Activity activity) {
        if (activity != null) {
            provService.deleteActivity(activity.getResource());
        }
    }

    protected Cookie getTokenCookie(User user) {
        String username = user.getUsername().orElseThrow(() ->
                new IllegalStateException("User does not have a username")).stringValue();
        SignedJWT jwt = tokenManager.generateAuthToken(username);
        return tokenManager.createSecureTokenCookie(jwt);
    }

    protected StreamingOutput retrieveLogContents(BinaryFile logFile) throws VirtualFilesystemException {
        StreamingOutput out;
        Optional<IRI> logPath = logFile.getRetrievalURL();
        if (logPath.isPresent()) {
            String path = logPath.get().stringValue().replace("file://", "");
            try (VirtualFile file = this.vfs.resolveVirtualFile(path)) {
                if (file.exists()) {
                    out = os -> IOUtils.copy(file.readContent(), os);
                    return out;
                }
            } catch (Exception ex) {
                throw new VirtualFilesystemException(ex);
            }
        }
        return null;
    }

    @Override
    public void validateWorkflow(Model workflowModel) throws IllegalArgumentException {
        log.debug("Validating provided Workflow RDF");
        ShaclSail shaclSail = new ShaclSail(new MemoryStore());
        Repository validationRepo = new SailRepository(shaclSail);

        if (!workflowModel.contains(null, vf.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI),
                vf.createIRI(Workflow.TYPE))) {
            throw new IllegalArgumentException("No workflow provided in RDF data.");
        }

        try (RepositoryConnection conn = validationRepo.getConnection()) {
            conn.begin();
            log.trace("Adding Workflow Model");
            conn.add(workflowModel);
            log.trace("Adding base SHACL definitions");
            conn.add(WorkflowManager.class.getResourceAsStream("/workflows.ttl"), RDFFormat.TURTLE,
                    RDF4J.SHACL_SHAPE_GRAPH);
            log.trace("Adding Trigger SHACL definitions");
            for (TriggerHandler<Trigger> handler : triggerHandlers.values()) {
                conn.add(handler.getShaclDefinition(), RDFFormat.TURTLE, RDF4J.SHACL_SHAPE_GRAPH);
            }
            log.trace("Adding Action SHACL definitions");
            for (ActionHandler<Action> handler : actionHandlers.values()) {
                conn.add(handler.getShaclDefinition(), RDFFormat.TURTLE, RDF4J.SHACL_SHAPE_GRAPH);
            }
            conn.commit();
            log.trace("Workflow RDF deemed valid");
        } catch (IOException ex) {
            log.error("Could not read in workflow ontology", ex);
        } catch (RepositoryException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof ValidationException) {
                Model validationReportModel = ((ValidationException) cause).validationReportAsModel();
                StringWriter sw = new StringWriter();
                Rio.write(validationReportModel, sw, RDFFormat.TURTLE);
                throw new IllegalArgumentException("Workflow definition is not valid:\n" + sw);
            } else {
                throw ex;
            }
        } finally {
            validationRepo.shutDown();
        }
    }
}
