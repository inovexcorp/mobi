package com.mobi.workflows.impl.core;

/*-
 * #%L
 * com.mobi.workflows.impl.core
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

import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.EntityFactory;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.persistence.utils.SkolemizedStatementCollector;
import com.mobi.persistence.utils.Statements;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.prov.api.ProvOntologyLoader;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.xacml.XACML;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.vfs.ontologies.documents.BinaryFileFactory;
import com.mobi.workflows.api.PaginatedWorkflowSearchParams;
import com.mobi.workflows.api.WorkflowEngine;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.WorkflowsTopics;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.workflows.Action;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.ActionExecutionFactory;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivityFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowFactory;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import com.mobi.workflows.api.trigger.TriggerHandler;
import com.mobi.workflows.impl.core.fedx.FedXUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.common.exception.ValidationException;
import org.eclipse.rdf4j.federated.exception.FedXException;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDF4J;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.eclipse.rdf4j.sail.shacl.ShaclSail;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.component.annotations.ReferencePolicyOption;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component(immediate = true,
        service = { SimpleWorkflowManager.class, WorkflowManager.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=" + WorkflowsTopics.TOPIC_START)
public class SimpleWorkflowManager implements WorkflowManager, EventHandler {
    public static final String WORKFLOW_RECORD_IRI_BINDING = "workflowRecordIri";

    private final Logger log = LoggerFactory.getLogger(SimpleWorkflowManager.class);

    protected final Map<String, TriggerHandler<Trigger>> triggerHandlers = new HashMap<>();
    protected final Map<String, ActionHandler<Action>> actionHandlers = new HashMap<>();
    protected final ValueFactory vf = new ValidatingValueFactory();
    protected final ModelFactory mf = new DynamicModelFactory();

    // Queries
    private static final String GET_EXECUTING_WORKFLOWS;
    private static final String FIND_WORKFLOWS_RECORDS;
    private static final String GET_WORKFLOW_RECORD;
    private static final String FIND_WORKFLOWS_ACTIVITIES;
    private static final String GET_ACTION_EXECUTIONS;
    // Substitutions
    private static final String FIND_RECORDS_SELECT_VARIABLES = "%SELECT_VARIABLES%";
    // Bindings
    private static final String AT_LOCATION = "http://www.w3.org/ns/prov#atLocation";
    private static final String ACTIVITY_IRI_BINDING = "activityIri";
    private static final String WORKFLOW_IRI_BINDING = "workflowIri";
    private static final String REQUEST_USER_IRI_BINDING = "requestUserIri";
    private static final String CATALOG_BINDING = "catalog";
    private static final String RECORD_COUNT_BINDING = "count";
    private static final String SEARCH_BINDING = "searchText";
    private static final String STARTING_AFTER_FILTER_BINDING = "startingAfterFilter";
    private static final String ENDING_BEFORE_FILTER_BINDING = "endingBeforeFilter";
    private static final String STATUS_FILTER_BINDING = "statusFilter";
    private static final List<String> FIND_WORKFLOW_RECORDS_BINDINGS = Stream.of(
            "iri", "title", "issued", "modified", "description", "active", "status", "workflowIRI", "master",
            "executionId", "executorIri", "executorUsername", "executorDisplayName", "startTime", "endTime",
            "succeeded", "runningTime"
    ).toList();
    private static final List<String> FIND_WORKFLOWS_ACTIVITIES_BINDINGS = Stream.of(
            "executionId", "executorIri", "executorUsername", "executorDisplayName", "startTime", "endTime",
            "succeeded", "status", "isLatestActivity"
    ).toList();

    static {
        try {
            FIND_WORKFLOWS_RECORDS = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class
                            .getResourceAsStream("/find-workflow-records.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ACTION_EXECUTIONS = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class
                            .getResourceAsStream("/get-action-executions.rq")),
                    StandardCharsets.UTF_8
            );
            FIND_WORKFLOWS_ACTIVITIES = IOUtils.toString(
                Objects.requireNonNull(SimpleWorkflowManager.class.getResourceAsStream("/find-workflow-activities.rq")),
                StandardCharsets.UTF_8
            );
            GET_EXECUTING_WORKFLOWS = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class
                            .getResourceAsStream("/get-executing-workflows.rq")),
                    StandardCharsets.UTF_8
            );
            GET_WORKFLOW_RECORD = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class
                            .getResourceAsStream("/get-workflow-record.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    protected PDP pdp;

    @Reference(target = "(id=prov)")
    protected OsgiRepository provRepo;

    @Reference
    protected WorkflowRecordFactory workflowRecordFactory;

    @Reference
    protected WorkflowFactory workflowFactory;

    @Reference
    protected WorkflowExecutionActivityFactory workflowExecutionActivityFactory;

    @Reference
    protected ActionExecutionFactory actionExecutionFactory;

    @Reference
    protected EntityFactory entityFactory;

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

    @Reference(cardinality = ReferenceCardinality.OPTIONAL, policyOption = ReferencePolicyOption.GREEDY)
    protected WorkflowEngine workflowEngine;

    @Reference
    protected EngineManager engineManager;

    @Reference
    protected EventAdmin eventAdmin;

    protected FedXUtils fedXUtils;

    @Reference
    BNodeService bNodeService;

    @Activate
    protected void startService() {
        fedXUtils = new FedXUtils();
        ProvOntologyLoader.loadOntology(provRepo, WorkflowManager.class.getResourceAsStream("/workflows.ttl"));
        initializeExecutingWorkflowsList();
    }

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

    private void initializeExecutingWorkflowsList() {
        log.debug("Initializing currently executing Workflows");

        if (workflowEngine != null) {
            try (RepositoryConnection conn = provService.getConnection();
                    TupleQueryResult result = conn.prepareTupleQuery(GET_EXECUTING_WORKFLOWS).evaluate()) {
                if (result.hasNext()) {
                    result.forEach(bindings -> {
                        Resource workflowId = Bindings.requiredResource(bindings, "workflow");
                        log.trace("Workflow " + workflowId + " is currently executing");
                        List<Resource> executingWorkflows = workflowEngine.getExecutingWorkflows();
                        if (!executingWorkflows.contains(workflowId)) {
                            executingWorkflows.add(workflowId);
                        }
                    });
                } else {
                    log.trace("No executing Workflows found");
                }
            }
        } else {
            log.debug("Cannot initialize list of executing workflows due to no workflow engine being configured.");
        }
    }

    private void initializeTriggerServices(String triggerType) {
        log.debug("Initializing Workflow TriggerServices for " + triggerType);
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
                            handler.create(workflow.getResource(),
                                    ormFactory.getExisting(triggerId, workflow.getModel())
                                    .orElseThrow(() -> new IllegalStateException("Issue converting Trigger types")));
                        }
                    }
                }
            } else {
                log.trace("No Workflow Records Found");
            }
        } catch (NullPointerException ex) {
            log.error(ex.getMessage());
            log.error("SimpleWorkflowManager references not initialized. "
                    + "The service will initialize triggers when complete.");
        }
    }

    @Override
    public boolean workflowRecordIriExists(Resource workflowId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(GET_WORKFLOW_RECORD);
            query.setBinding(WORKFLOW_IRI_BINDING, workflowId);
            query.setBinding(CATALOG_BINDING, configProvider.getLocalCatalogIRI());
            TupleQueryResult result = query.evaluate();
            boolean exists = result.hasNext();
            result.close();
            return exists;
        }
    }

    /**
     * Creates a model with triples representing which WorkflowRecords for readable by the provided user. Each Viewable
     * Record is represented with a triple of the format `UserIRI policy:Read RecordIRI`. Queries over the provided
     * RepositoryConnection to collect the WorkflowRecord IRIs, expected to be the system repository.
     *
     * @param requestUser The User requesting to read WorkflowRecords
     * @param conn A System Repo Connection
     * @return Model with triples representing which WorkflowRecords the user can read
     */
    protected Model populateViewableWorkflowRecords(User requestUser, RepositoryConnection conn) {
        Model memoryView = new LinkedHashModel();
        // Filter by Viewable WorkflowRecords for User
        Map<String, Literal> subjectAttrs = new HashMap<>();
        Map<String, Literal> actionAttrs = new HashMap<>();

        IRI readActionIri = vf.createIRI(Read.TYPE);
        subjectAttrs.put(XACML.SUBJECT_ID, vf.createLiteral(requestUser.getResource().stringValue()));
        actionAttrs.put(XACML.ACTION_ID, vf.createLiteral(readActionIri.stringValue()));

        List<IRI> resourceIds = conn.getStatements(null, RDF.TYPE, vf.createIRI(WorkflowRecord.TYPE)).stream()
                .map(stmt -> (IRI) stmt.getSubject())
                .toList();

        if (resourceIds.isEmpty()) {
            return memoryView;
        }
        // Create PDP Request
        Request request = pdp.createRequest(List.of((IRI) requestUser.getResource()), subjectAttrs, resourceIds,
                new HashMap<>(), List.of(readActionIri), actionAttrs);

        Set<String> viewableRecords = pdp.filter(request, vf.createIRI(POLICY_PERMIT_OVERRIDES));

        for (String recordIRI: viewableRecords) {
            memoryView.add(requestUser.getResource(), readActionIri, vf.createIRI(recordIRI));
        }
        return memoryView;
    }

    @Override
    public PaginatedSearchResults<ObjectNode> findWorkflowRecords(PaginatedWorkflowSearchParams searchParams,
                                                                  User requestUser, RepositoryConnection conn) {
        try {
            Model viewableWorkflowRecordsModel = populateViewableWorkflowRecords(requestUser, conn);
            // Create Federated Repository
            Repository fedXRepo = fedXUtils.getFedXRepoWithModel(viewableWorkflowRecordsModel,
                    conn.getRepository(),
                    provRepo);
            // Get Total Count
            TupleQuery countQuery = fedXRepo.getConnection().prepareTupleQuery(
                    FIND_WORKFLOWS_RECORDS.replace(FIND_RECORDS_SELECT_VARIABLES,
                            "(COUNT(DISTINCT ?iri) as ?count)"));
            setFindWorkflowRecordsQueryBindings(searchParams, requestUser, countQuery);

            // Evaluate
            TupleQueryResult countResults = countQuery.evaluate();

            int totalCount;
            BindingSet countBindingSet;
            if (countResults.hasNext()
                    && (countBindingSet = countResults.next()).getBindingNames().contains(RECORD_COUNT_BINDING)) {
                totalCount = Bindings.requiredLiteral(countBindingSet, RECORD_COUNT_BINDING).intValue();
                countResults.close();
                if (totalCount == 0) {
                    return WorkflowSearchResults.emptyResults();
                }
            } else {
                countResults.close();
                conn.close();
                return WorkflowSearchResults.emptyResults();
            }
            log.debug("Record count: " + totalCount);
            return executeFindWorkflowRecordsQuery(searchParams, totalCount, requestUser, fedXRepo.getConnection());
        } catch (FedXException | NoSuchElementException exp) {
            throw new MobiException(exp);
        }
    }

    private PaginatedSearchResults<ObjectNode> executeFindWorkflowRecordsQuery(
            PaginatedWorkflowSearchParams searchParams, int totalCount, User requestUser, RepositoryConnection conn) {
        try {
            // Prepare Query
            int offset = searchParams.getOffset();
            int limit = searchParams.getLimit().orElse(totalCount);

            if (offset > totalCount) {
                throw new IllegalArgumentException("Offset exceeds total size");
            }
            String bindings = String.join("\n", FIND_WORKFLOW_RECORDS_BINDINGS
                    .stream().map(binding -> String.format("?%s", binding)).toList());
            StringBuilder queryString = new StringBuilder(FIND_WORKFLOWS_RECORDS
                    .replace(FIND_RECORDS_SELECT_VARIABLES, bindings));
            // Build Suffix
            StringBuilder querySuffix = new StringBuilder();
            // ORDER BY & Ascending
            String sortByParam = searchParams.getSortBy().orElse("title");
            boolean isAsc = searchParams.getAscending().orElse(true);
            if (isAsc) {
                querySuffix.append(String.format("\nORDER BY ASC(?%s)", sortByParam));
            } else {
                querySuffix.append(String.format("\nORDER BY DESC(?%s)", sortByParam));
            }
            // LIMIT and OFFSET
            querySuffix.append("\nLIMIT ").append(limit).append("\nOFFSET ").append(offset);
            queryString.append(querySuffix);

            TupleQuery query = conn.prepareTupleQuery(queryString.toString());
            setFindWorkflowRecordsQueryBindings(searchParams, requestUser, query);

            log.trace("Query Plan:\n" + query);
            // Get Results
            TupleQueryResult result = query.evaluate();
            List<ObjectNode> records = RestUtils.convertToObjectNodes(result, FIND_WORKFLOW_RECORDS_BINDINGS);
            result.close();

            log.debug("Result set size: " + records.size());

            int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;
            return new WorkflowSearchResults(records, totalCount, limit, pageNumber);
        } catch (MalformedQueryException e) {
            throw new MobiException(e);
        }
    }

    private void setFindWorkflowRecordsQueryBindings(PaginatedWorkflowSearchParams searchParams, User requestUser,
                                                     TupleQuery query) {
        query.setBinding(REQUEST_USER_IRI_BINDING, requestUser.getResource());
        searchParams.getSearchText().ifPresent(searchText ->
                query.setBinding(SEARCH_BINDING, vf.createLiteral(searchText)));
        searchParams.getStartingAfter().ifPresent(dateTime ->
                query.setBinding(STARTING_AFTER_FILTER_BINDING, vf.createLiteral(dateTime)));
        searchParams.getEndingBefore().ifPresent(dateTime ->
                query.setBinding(ENDING_BEFORE_FILTER_BINDING, vf.createLiteral(dateTime)));
        searchParams.getStatus().ifPresent(status ->
                query.setBinding(STATUS_FILTER_BINDING, vf.createLiteral(status)));
    }

    @Override
    public void createTriggerService(WorkflowRecord workflowRecord) {
        Optional<Resource> workflowIRIOpt = workflowRecord.getWorkflowIRI();
        if (workflowIRIOpt.isPresent()) {
            Resource workflowIRI = workflowIRIOpt.get();
            Workflow workflow = getWorkflow(workflowIRI).orElseThrow(() ->
                    new IllegalStateException("Workflow " + workflowIRI + " does not exist"));

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

        if (workflowEngine.getExecutingWorkflows().contains(workflowIRI)) {
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
        TupleQuery query = conn.prepareTupleQuery(GET_WORKFLOW_RECORD);
        query.setBinding("workflowIri", workflowId);
        TupleQueryResult result = query.evaluate();
        Optional<Resource> optStmt = result.stream()
                .map(c -> (Resource) c.getBinding("iri").getValue()).findFirst();
        result.close();

        if (optStmt.isPresent()) {
            Resource workflowRecordIRI = optStmt.get();
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
    public PaginatedSearchResults<ObjectNode> findWorkflowExecutionActivities(Resource workflowRecordIri,
                                                                              PaginatedWorkflowSearchParams searchParams,
                                                                              User requestUser,
                                                                              RepositoryConnection conn) {
        try {
            Model viewableWorkflowRecordsModel = populateViewableWorkflowRecords(requestUser, conn);
            // Create Federated Repository
            Repository fedXRepo = fedXUtils.getFedXRepoWithModel(viewableWorkflowRecordsModel,
                    conn.getRepository(), provRepo);
            // Get Total Count
            TupleQuery countQuery = fedXRepo.getConnection()
                    .prepareTupleQuery(FIND_WORKFLOWS_ACTIVITIES.replace(FIND_RECORDS_SELECT_VARIABLES,
                            "(COUNT(DISTINCT ?executionId) as ?count)"));
            setWorkflowExecutionActivitiesQueryBindings(workflowRecordIri, searchParams, requestUser, countQuery);

            // Evaluate
            TupleQueryResult countResults = countQuery.evaluate();
            int totalCount;
            BindingSet countBindingSet;
            if (countResults.hasNext()
                    && (countBindingSet = countResults.next()).getBindingNames().contains(RECORD_COUNT_BINDING)) {
                totalCount = Bindings.requiredLiteral(countBindingSet, RECORD_COUNT_BINDING).intValue();
                countResults.close();
                if (totalCount == 0) {
                    return WorkflowSearchResults.emptyResults();
                }
            } else {
                countResults.close();
                conn.close();
                return WorkflowSearchResults.emptyResults();
            }
            log.debug("Workflow Activities count: " + totalCount);
            return executeWorkflowExecutionActivities(workflowRecordIri,
                    searchParams, totalCount, requestUser, fedXRepo.getConnection());
        } catch (FedXException | NoSuchElementException exp) {
            throw new MobiException(exp);
        }
    }

    private PaginatedSearchResults<ObjectNode> executeWorkflowExecutionActivities(Resource workflowRecordIri,
                                                                                  PaginatedWorkflowSearchParams searchParams,
                                                                                  int totalCount,
                                                                                  User requestUser,
                                                                                  RepositoryConnection conn) {
        try {
            // Prepare Query
            int offset = searchParams.getOffset();
            int limit = searchParams.getLimit().orElse(totalCount);

            if (offset > totalCount) {
                throw new IllegalArgumentException("Offset exceeds total size");
            }
            String bindings = String.join("\n", FIND_WORKFLOWS_ACTIVITIES_BINDINGS
                    .stream().map(binding -> String.format("?%s", binding)).toList());
            StringBuilder queryString = new StringBuilder(
                    FIND_WORKFLOWS_ACTIVITIES.replace(FIND_RECORDS_SELECT_VARIABLES, bindings));

            // Build Suffix
            StringBuilder querySuffix = new StringBuilder();
            // ORDER BY & Ascending
            String sortByParam = searchParams.getSortBy().orElse("startTime");
            boolean isAsc = searchParams.getAscending().orElse(true);
            if (isAsc) {
                querySuffix.append(String.format("\nORDER BY ASC(?%s)", sortByParam));
            } else {
                querySuffix.append(String.format("\nORDER BY DESC(?%s)", sortByParam));
            }
            // LIMIT and OFFSET
            querySuffix.append("\nLIMIT ").append(limit).append("\nOFFSET ").append(offset);
            queryString.append(querySuffix);

            TupleQuery query = conn.prepareTupleQuery(queryString.toString());
            setWorkflowExecutionActivitiesQueryBindings(workflowRecordIri, searchParams, requestUser, query);

            log.trace("WorkflowExecutionActivities Query Plan:\n" + query);
            // Get Results
            TupleQueryResult result = query.evaluate();
            List<ObjectNode> records = RestUtils.convertToObjectNodes(result, FIND_WORKFLOWS_ACTIVITIES_BINDINGS);
            result.close();
            log.debug("WorkflowExecutionActivities Result set size: " + records.size());
            int pageNumber = (limit > 0) ? (offset / limit) + 1 : 1;
            return new WorkflowSearchResults(records, totalCount, limit, pageNumber);
        } catch (MalformedQueryException e) {
            throw new MobiException(e);
        }
    }

    private void setWorkflowExecutionActivitiesQueryBindings(Resource workflowRecordId,
                                                             PaginatedWorkflowSearchParams searchParams,
                                                             User requestUser, TupleQuery query) {
        query.setBinding(REQUEST_USER_IRI_BINDING, requestUser.getResource());
        query.setBinding(WORKFLOW_RECORD_IRI_BINDING, workflowRecordId);
        searchParams.getStartingAfter().ifPresent(dateTime ->
                query.setBinding(STARTING_AFTER_FILTER_BINDING, vf.createLiteral(dateTime)));
        searchParams.getEndingBefore().ifPresent(dateTime ->
                query.setBinding(ENDING_BEFORE_FILTER_BINDING, vf.createLiteral(dateTime)));
        searchParams.getStatus().ifPresent(status ->
                query.setBinding(STATUS_FILTER_BINDING, vf.createLiteral(status)));
    }

    @Override
    public Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId) {
        log.trace("Retrieving Workflow Execution Activity " + executionId);
        try (RepositoryConnection conn = provRepo.getConnection()) {
            return getExecutionActivity(executionId, conn);
        }
    }

    private Optional<WorkflowExecutionActivity> getExecutionActivity(Resource executionId,
                                                                     RepositoryConnection provConn) {
        if (ConnectionUtils.contains(provConn, executionId, RDF.TYPE, vf.createIRI(WorkflowExecutionActivity.TYPE))) {
            Model model = QueryResults.asModel(provConn.getStatements(executionId, null, null), mf);
            return workflowExecutionActivityFactory.getExisting(executionId, model);
        }
        return Optional.empty();
    }

    @Override
    public Set<ActionExecution> getActionExecutions(Resource executionId) {
        log.trace("Retrieving Action Executions for Workflow Execution Activity " + executionId);
        try (RepositoryConnection conn = provRepo.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_ACTION_EXECUTIONS);
            query.setBinding(ACTIVITY_IRI_BINDING, executionId);
            Model results = QueryResults.asModel(query.evaluate(), mf);
            return new HashSet<>(actionExecutionFactory.getAllExisting(results));
        }
    }

    @Override
    public BinaryFile getLogFile(Resource logId) {
        try (RepositoryConnection conn = provRepo.getConnection()) {
            if (ConnectionUtils.contains(conn, logId, RDF.TYPE, vf.createIRI(BinaryFile.TYPE))) {
                Model model = QueryResults.asModel(conn.getStatements(logId, null, null), mf);
                return binaryFileFactory.getExisting(logId, model).orElseThrow(() ->
                        new IllegalStateException("Expected Log file " + logId + " not found")
                );
            } else {
                throw new IllegalArgumentException("Log file " + logId + " does not exist on the system.");
            }
        }
    }

    @Override
    public Resource startWorkflow(User user, WorkflowRecord workflowRecord) {
        if (workflowEngine == null) {
            throw new MobiException("No workflow engine configured.");
        }

        Resource workflowId = workflowRecord.getWorkflowIRI().orElseThrow(() ->
                new IllegalStateException("Workflow Record must be linked to workflow object."));

        log.debug("Starting Workflow " + workflowId + " for User " + user.getResource());
        log.trace("Retrieving Workflow definition");
        Workflow workflow = getWorkflow(workflowId)
                .orElseThrow(() -> new IllegalArgumentException("Workflow " + workflowId + " does not exist"));
        List<Resource> executingWorkflows = workflowEngine.getExecutingWorkflows();
        if (!executingWorkflows.isEmpty()) {
            throw new IllegalArgumentException("There is currently a workflow executing. Please wait a bit and try " +
                    "again.");
        }

        executingWorkflows.add(workflow.getResource());
        WorkflowExecutionActivity activity = startExecutionActivity(user, workflowRecord);

        workflowEngine.startWorkflow(workflow, activity);
        return activity.getResource();
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
        Resource userId;
        User user;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            List<Statement> statements = QueryResults.asList(conn.getStatements(null,
                    vf.createIRI(WorkflowRecord.workflowIRI_IRI), workflowId));

            workFlowRecordIRI = statements.get(0).getSubject();

            workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(), workFlowRecordIRI,
                    workflowRecordFactory, conn);

            // Sets user on activity to the creator when automatically triggered
            log.trace("Collecting creator of Workflow");
            userId = (Resource) workflowRecord.getProperty(vf.createIRI(_Thing.publisher_IRI)).orElseThrow(() ->
                    new IllegalStateException("Workflow Record must have a dct:publisher set"));

            user = getUser(userId, conn);
        }

        log.debug("Workflow Start Event as User " + userId);
        if (workflowRecord.getActive().isEmpty() || !workflowRecord.getActive().get()) {
            log.debug("Workflow " + workflowId + " is not active. Skipping execution.");
        } else {
            try {
                List<Resource> executingWorkflows = workflowEngine.getExecutingWorkflows();
                if (executingWorkflows.contains(workflowId)) {
                    log.debug("Workflow " + workflowId + " is currently executing. Skipping execution.");
                } else {
                    executingWorkflows.add(workflow.getResource());
                    WorkflowExecutionActivity activity = startExecutionActivity(user, workflowRecord);
                    workflowEngine.startWorkflow(workflow, activity);
                }
            } catch (NullPointerException ex) {
                throw new MobiException("No workflow engine configured.");
            }
        }
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

    protected <T extends Thing> List<OrmFactory<? extends T>> getOrmFactories(Resource id, Model model,
                                                                              Class<T> clazz) {
        List<Resource> types = model.filter(id, RDF.TYPE, null)
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
        // Notify that an activity has started
        Map<String, Object> eventProps = new HashMap<>();
        eventProps.put(WorkflowsTopics.ACTIVITY_PROPERTY_ACTIVITY, activity.getResource());
        Event event = new Event(WorkflowsTopics.TOPIC_ACTIVITY_START, eventProps);
        eventAdmin.postEvent(event);

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

    @Override
    public void validateWorkflow(Model workflowModel) throws IllegalArgumentException {
        log.debug("Validating provided Workflow RDF");
        ShaclSail shaclSail = new ShaclSail(new MemoryStore());
        Repository validationRepo = new SailRepository(shaclSail);

        if (!workflowModel.contains(null, RDF.TYPE, vf.createIRI(Workflow.TYPE))) {
            throw new IllegalArgumentException("No workflow provided in RDF data.");
        }

        try (RepositoryConnection conn = validationRepo.getConnection()) {
            conn.begin();
            log.trace("Adding Workflow Model");
            conn.add(workflowModel);
            log.trace("Adding base SHACL definitions");

            ModelFactory modelFactory = new DynamicModelFactory();
            Map<BNode, IRI> skolemizedBNodes = new HashMap<>();
            StatementCollector stmtCollector = new SkolemizedStatementCollector(modelFactory,
                    bNodeService, skolemizedBNodes);
            RDFParser parser = Rio.createParser(RDFFormat.TURTLE);
            parser.setRDFHandler(stmtCollector);
            parser.parse(WorkflowManager.class.getResourceAsStream("/workflows.ttl"), "");
            conn.add(stmtCollector.getStatements(), RDF4J.SHACL_SHAPE_GRAPH);

            log.trace("Adding Trigger SHACL definitions");
            for (TriggerHandler<Trigger> handler : triggerHandlers.values()) {
                stmtCollector.clear();
                parser.parse(handler.getShaclDefinition());
                conn.add(stmtCollector.getStatements(), RDF4J.SHACL_SHAPE_GRAPH);
            }
            log.trace("Adding Action SHACL definitions");
            for (ActionHandler<Action> handler : actionHandlers.values()) {
                stmtCollector.clear();
                parser.parse(handler.getShaclDefinition());
                conn.add(stmtCollector.getStatements(), RDF4J.SHACL_SHAPE_GRAPH);
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

    private User getUser(Resource userId, RepositoryConnection conn) {
        Optional<Statement> usernameOpt = conn.getStatements(userId, vf.createIRI(User.username_IRI), null)
                .stream().findFirst();

        if (usernameOpt.isPresent()) {
            String username = usernameOpt.get().getObject().stringValue();
            Optional<User> userOpt = engineManager.retrieveUser(username);
            if (userOpt.isEmpty()) {
                log.error("No user could be found with IRI " + userId + ", using admin user instead");
            } else {
                return userOpt.get();
            }
        } else {
            log.error("No username set on user with IRI " + userId + ", Using admin user instead.");
        }
        return engineManager.retrieveUser("admin").orElseThrow(() ->
                new IllegalStateException("Admin user could not be found. Workflow will not be executed."));
    }
}