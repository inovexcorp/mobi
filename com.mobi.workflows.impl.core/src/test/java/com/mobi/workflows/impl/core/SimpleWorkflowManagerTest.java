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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.util.DefaultIndenter;
import com.fasterxml.jackson.core.util.DefaultPrettyPrinter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.PaginatedWorkflowSearchParams;
import com.mobi.workflows.api.WorkflowEngine;
import com.mobi.workflows.api.action.ActionHandler;
import com.mobi.workflows.api.ontologies.workflows.Action;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.Trigger;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.trigger.TriggerHandler;
import com.mobi.workflows.impl.core.fedx.FedXUtils;
import com.mobi.workflows.impl.core.record.SimpleWorkflowRecordServiceTest;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.Repository;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

public class SimpleWorkflowManagerTest extends OrmEnabledTestCase {
    private static final ObjectMapper mapper = new ObjectMapper();
    private AutoCloseable closeable;
    private static final ValueFactory vf = getValueFactory();

    private final IRI recordIRI = vf.createIRI("http://mobi.com/test/records#WorkflowRecord");
    private final IRI workflowIRI = vf.createIRI("http://example.com/workflows/A");
    private final IRI catalogId = vf.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI branchIRI = vf.createIRI("http://mobi.com/test/branches#branch");
    private final IRI commitIRI = vf.createIRI("http://mobi.com/test/commits#commit");
    private final IRI masterBranchIRI = vf.createIRI("http://mobi.com/test/branches#master");
    private final IRI activityIRI = vf.createIRI("http://mobi.com/test/activities#activity");
    private final IRI logFileIRI = vf.createIRI("http://mobi.com/test/file#logFile");
    private final Literal userName = vf.createLiteral("testUser");

    private SimpleWorkflowManager workflowManager;
    private WorkflowRecord workflowRecord;
    private Branch branch;
    private Commit commit;
    private WorkflowExecutionActivity activity;
    private BinaryFile logFile;
    private User user;
    private Model workflowModel;
    private MemoryRepositoryWrapper provRepository;
    private MemoryRepositoryWrapper systemRepository;

    private final OrmFactory<WorkflowRecord> recordFactory = getRequiredOrmFactory(WorkflowRecord.class);
    private final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<WorkflowExecutionActivity> executionActivityFactory = getRequiredOrmFactory(WorkflowExecutionActivity.class);
    private final OrmFactory<ActionExecution> actionExecutionFactory = getRequiredOrmFactory(ActionExecution.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<BinaryFile> binaryFactory = getRequiredOrmFactory(BinaryFile.class);

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    TokenManager tokenManager;

    @Mock
    ProvenanceService provService;

    @Mock
    BranchManager branchManager;

    @Mock
    CommitManager commitManager;

    @Mock
    CompiledResourceManager compiledResourceManager;

    @Mock
    ThingManager thingManager;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    PDP pdp;

    @Mock
    protected EventAdmin eventAdmin;

    @Mock
    WorkflowEngine workflowEngine;

    DefaultPrettyPrinter.Indenter indenter = new DefaultIndenter("  ", DefaultIndenter.SYS_LF);
    DefaultPrettyPrinter printer = new DefaultPrettyPrinter();

    @Before
    public void setUp() throws Exception {
        printer.indentObjectsWith(indenter);
        printer.indentArraysWith(indenter);
        closeable = MockitoAnnotations.openMocks(this);
        System.setProperty("karaf.etc", Objects.requireNonNull(SimpleWorkflowRecordServiceTest.class.getResource("/")).getPath());
        provRepository = new MemoryRepositoryWrapper();
        provRepository.setDelegate(new SailRepository(new MemoryStore()));

        systemRepository = new MemoryRepositoryWrapper();
        systemRepository.setDelegate(new SailRepository(new MemoryStore()));

        BNodeService bNodeService = Mockito.mock(BNodeService.class);

        when(bNodeService.deterministicSkolemize(any(Model.class), anyMap())).thenReturn(new LinkedHashModel());

        SimpleVirtualFilesystemConfig config = mock(SimpleVirtualFilesystemConfig.class);

        user = userFactory.createNew(vf.createIRI("http://test.org/user"));
        user.setUsername(userName);
        commit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);
        branch.setProperty(vf.createLiteral("Test Branch"), vf.createIRI(_Thing.title_IRI));

        workflowRecord = recordFactory.createNew(recordIRI);
        workflowRecord.setProperty(vf.createLiteral("Test Record"), vf.createIRI(_Thing.title_IRI));
        workflowRecord.setCatalog(catalogFactory.createNew(catalogId));
        workflowRecord.setBranch(Collections.singleton(branch));
        workflowRecord.setMasterBranch(branchFactory.createNew(masterBranchIRI));
        workflowRecord.setWorkflowIRI(workflowIRI);

        activity = executionActivityFactory.createNew(activityIRI);

        //setting up mock calls
        when(configProvider.getRepository()).thenReturn(systemRepository);
        when(configProvider.getRepositoryId()).thenReturn("system");
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        when(provService.getConnection()).thenAnswer((Answer<RepositoryConnection>) invocation -> provRepository.getConnection());
        doAnswer((InvocationOnMock invocationOnMock) -> {
            // real method throws IllegalArgumentException if activity already exist in repo
            try (RepositoryConnection conn = provRepository.getConnection()) {
                conn.begin();
                Activity activity = invocationOnMock.getArgument(0);
                conn.add(activity.getModel()); // No Context
                conn.commit();
            }
            return null;
        }).when(provService).addActivity(any(Activity.class));

        doAnswer((InvocationOnMock invocationOnMock) -> {
            Thing thing = invocationOnMock.getArgument(0);
            RepositoryConnection conn = invocationOnMock.getArgument(1);
            conn.getStatements(null, null, null, thing.getResource()).forEach(conn::remove);
            conn.add(thing.getModel(), thing.getResource());
            return null;
        }).when(thingManager).updateObject(any(Thing.class), any(RepositoryConnection.class));

        logFile = binaryFactory.createNew(logFileIRI);

        workflowManager = Mockito.spy(new SimpleWorkflowManager());
        injectOrmFactoryReferencesIntoService(workflowManager);
        workflowManager.bNodeService = bNodeService;
        workflowManager.commitManager = commitManager;
        workflowManager.branchManager = branchManager;
        workflowManager.compiledResourceManager = compiledResourceManager;
        workflowManager.tokenManager = tokenManager;
        workflowManager.provService = provService;
        workflowManager.configProvider = configProvider;
        workflowManager.thingManager = thingManager;
        workflowManager.provRepo = provRepository;
        workflowManager.pdp = pdp;
        workflowManager.eventAdmin = eventAdmin;
    }

    @After
    public void reset() throws Exception {
        assertNoActivitiesSystemRepo();
        try (RepositoryConnection connection = systemRepository.getConnection()) {
            connection.clear();
        }
        try (RepositoryConnection connection = provRepository.getConnection()) {
            connection.clear();
        }
        closeable.close();
        workflowManager.workflowEngine = null;
    }

    @Test
    public void workflowRecordIriExistsTest() {
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
        }
        boolean result = workflowManager.workflowRecordIriExists(workflowIRI);
        assertTrue(result);
    }

    @Test
    public void workflowRecordIriExistsInvalidTest() {
        boolean result = workflowManager.workflowRecordIriExists(workflowIRI);
        assertFalse(result);
    }

    @Test
    public void buildSparqlQueryWithCorrectAmountResults() {
        List<Resource> values = Arrays.asList(
                vf.createIRI("http://example.com/subject0"),
                vf.createIRI("http://example.com/subject1"),
                vf.createIRI("http://example.com/subject2"));
        String expectedQuery = "CONSTRUCT {?s ?p ?o} WHERE { ?s ?p ?o . FILTER(?s IN (<http://example.com/subject0>, <http://example.com/subject1>, <http://example.com/subject2>)) }";
        String actualQuery = workflowManager.buildSparqlQuery(values);
        assertEquals(expectedQuery, actualQuery);
    }

    @Test
    public void buildSparqlQueryWithIncorrectAmountResults() {
        List<Resource> values = Arrays.asList(
                vf.createIRI("http://example.com/subject0"),
                vf.createIRI("http://example.com/subject1"));
        String expectedQuery = "CONSTRUCT {?s ?p ?o} WHERE { ?s ?p ?o . FILTER(?s IN (<http://example.com/subject0>, <http://example.com/subject1>, <http://example.com/subject2>)) }";
        String actualQuery = workflowManager.buildSparqlQuery(values);
        assertNotEquals(expectedQuery, actualQuery);
    }

    @Test
    public void buildSparqlQueryWithIncorrectResults() {
        List<Resource> values = Arrays.asList(
                vf.createIRI("http://example.com/subject1"),
                vf.createIRI("http://example.com/subject2"));
        String expectedQuery = "CONSTRUCT {?s ?p ?o} WHERE { ?s ?p ?o . FILTER(?s IN (<http://example.com/subject0>, <http://example.com/subject2>)) }";
        String actualQuery = workflowManager.buildSparqlQuery(values);
        assertNotEquals(expectedQuery, actualQuery);
    }

    @Test
    public void buildSparqlQueryWithEmptyList() {
        List<Resource> values = List.of();
        String expectedQuery = "CONSTRUCT {?s ?p ?o} WHERE { ?s ?p ?o . FILTER(?s IN ()) }";
        String actualQuery = workflowManager.buildSparqlQuery(values);
        assertEquals(expectedQuery, actualQuery);
    }

    private void addFindWorkflowData() throws IOException {
        FedXUtils mockFedXUtils = mock(FedXUtils.class);
        doAnswer((InvocationOnMock invocationOnMock) -> {
            Model model = invocationOnMock.getArgument(0);
            Repository repo1 = invocationOnMock.getArgument(1);
            Repository repo2 = invocationOnMock.getArgument(2);

            Repository inMemoryRepo = new SailRepository(new MemoryStore());
            try(RepositoryConnection conn = inMemoryRepo.getConnection()) {
                conn.add(model);
                conn.add(repo1.getConnection().getStatements(null, null, null));
                conn.add(repo2.getConnection().getStatements(null, null, null));
            }
            return inMemoryRepo;
        }).when(mockFedXUtils).getFedXRepoWithModel(any(Model.class), any(Repository.class));
        workflowManager.fedXUtils = mockFedXUtils;

        Model permissionModel = new LinkedHashModel();
        IRI adminIri = vf.createIRI("http://mobi.com/users/admin");
        IRI readActionIri = vf.createIRI(Read.TYPE);
        permissionModel.add(adminIri, readActionIri, vf.createIRI("https://mobi.com/records#workflow1"));
        permissionModel.add(adminIri, readActionIri, vf.createIRI("https://mobi.com/records#workflow2"));
        permissionModel.add(adminIri, readActionIri, vf.createIRI("https://mobi.com/records#workflow3"));
        permissionModel.add(adminIri, readActionIri, vf.createIRI("https://mobi.com/records#workflow4"));
        Mockito.doReturn(permissionModel).when(workflowManager).populateViewableWorkflowRecords(any(User.class), any(RepositoryConnection.class));
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            Model workflowDataSystem = Rio.parse(getClass().getResourceAsStream("/find-workflow-data-system.trig"), "", RDFFormat.TRIG);
            conn.add(workflowDataSystem);
        }
        try (RepositoryConnection conn = provRepository.getConnection()) {
            Model workflowDataProv = Rio.parse(getClass().getResourceAsStream("/find-workflow-data-prov.trig"), "", RDFFormat.TRIG);
            conn.add(workflowDataProv);
        }
    }

    @Test
    public void findWorkflowRecordsTest() throws IOException {
        addFindWorkflowData();
        // ASSERT
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            IRI adminIri = vf.createIRI("http://mobi.com/users/admin");
            User adminUser = userFactory.createNew(adminIri, QueryResults.asModel(conn.getStatements(adminIri, null, null)));

            PaginatedWorkflowSearchParams searchParams = new PaginatedWorkflowSearchParams.Builder()
                    .build();

            PaginatedSearchResults<ObjectNode> results = workflowManager.findWorkflowRecords(searchParams, adminUser, conn);
            assertNotNull(results);
            assertNotNull(results.getPage());
            assertEquals(4, results.getTotalSize());
            assertEquals(4, results.getPageSize());
            assertEquals(1, results.getPageNumber());

            String expectedJson = IOUtils.toString(
                    Objects.requireNonNull(SimpleWorkflowManager.class.getResourceAsStream("/expected-find-workflows-01.json")),
                    StandardCharsets.UTF_8
            );
            assertEquals(expectedJson, mapper.writer(printer).writeValueAsString(results.getPage()));
        }
    }

    @Test
    public void findWorkflowRecordsFilterTest() throws IOException {
        String testingData = IOUtils.toString(
            Objects.requireNonNull(SimpleWorkflowManager.class.getResourceAsStream("/expected-find-workflows-filters.json")),
            StandardCharsets.UTF_8
        );
        JsonNode testingDataJsonNode = mapper.readValue(testingData, JsonNode.class);

        addFindWorkflowData();
        // ASSERT
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            ArrayNode output = mapper.createArrayNode();
            for (JsonNode node: testingDataJsonNode) {
                User adminUser;
                String requestUserIri;
                if (node.hasNonNull("requestUser")) {
                    requestUserIri = node.get("requestUser").asText();
                    IRI adminIri = vf.createIRI(node.get("requestUser").asText());
                    adminUser = userFactory.createNew(adminIri, QueryResults.asModel(conn.getStatements(adminIri, null, null)));
                } else {
                    requestUserIri = "http://mobi.com/users/admin";
                    IRI adminIri = vf.createIRI(node.get("requestUser").asText());
                    adminUser = userFactory.createNew(adminIri, QueryResults.asModel(conn.getStatements(adminIri, null, null)));
                }
                PaginatedWorkflowSearchParams.Builder searchParamsBuilder = new PaginatedWorkflowSearchParams.Builder();

                if (node.hasNonNull("params")) {
                    JsonNode params = node.get("params");
                    Optional.ofNullable(params.get("searchText")).ifPresent((input) -> searchParamsBuilder.searchText(input.asText()));
                    Optional.ofNullable(params.get("startingAfter")).ifPresent((input) -> searchParamsBuilder.startingAfter(input.asText()));
                    Optional.ofNullable(params.get("endingBefore")).ifPresent((input) -> searchParamsBuilder.endingBefore(input.asText()));
                    Optional.ofNullable(params.get("status")).ifPresent((input) -> searchParamsBuilder.status(input.asText()));
                    Optional.ofNullable(params.get("sortBy")).ifPresent((input) -> searchParamsBuilder.sortBy(input.asText()));
                    Optional.ofNullable(params.get("limit")).ifPresent((input) -> searchParamsBuilder.limit(input.asInt()));
                    Optional.ofNullable(params.get("offset")).ifPresent((input) -> searchParamsBuilder.offset(input.asInt()));
                    Optional.ofNullable(params.get("ascending")).ifPresent((input) -> searchParamsBuilder.ascending(input.asBoolean()));
                }
                PaginatedSearchResults<ObjectNode> results = workflowManager.findWorkflowRecords(searchParamsBuilder.build(), adminUser, conn);
                assertNotNull(results);

                ObjectNode jsonResults = mapper.createObjectNode();
                List<String> actualIds = results.getPage().stream()
                        .map((record) -> record.get("iri").textValue()).toList();
                jsonResults.put("totalSize", results.getTotalSize());
                jsonResults.put("pageSize", results.getPageSize());
                jsonResults.put("pageNumber", results.getPageNumber());
                jsonResults.set("expectedIris", mapper.convertValue(actualIds, ArrayNode.class));

                ObjectNode expectedObjectNode = mapper.createObjectNode();
                expectedObjectNode.put("requestUser", requestUserIri);
                expectedObjectNode.set("params", node.get("params"));
                expectedObjectNode.set("results", jsonResults);
                output.add(expectedObjectNode);
            }
            assertEquals(testingData, mapper.writer(printer).writeValueAsString(output));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateWorkflowTestWithUndefinedValues() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/undefined-workflow.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);

        TriggerHandler<Trigger> mockTriggerHandler = mock(TriggerHandler.class);
        when(mockTriggerHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/triggerOntology.ttl"));
        workflowManager.addTriggerHandler(mockTriggerHandler);
        workflowManager.validateWorkflow(workflowModel);
    }

    @Test
    public void validateWorkflowTestWithUndefinedValuesInSystemRepo() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/undefined-workflow.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            Resource recordIri = conn.getValueFactory().createIRI("https://mobi.com/records#f5350991-5ff6-4ee0-9436-ca75db6b027b");
            Resource branchIri = conn.getValueFactory().createIRI("https://mobi.com/branches#281711aa-919c-492c-a2cd-7cbf1921fe2a");
            Statement recordTypeStatement = conn.getValueFactory().createStatement(recordIri, RDF.TYPE, conn.getValueFactory().createIRI("http://mobi.com/ontologies/catalog#VersionedRDFRecord"));
            Statement branchTypeStatement = conn.getValueFactory().createStatement(branchIri, RDF.TYPE, conn.getValueFactory().createIRI("http://mobi.com/ontologies/catalog#Branch"));
            conn.add(recordTypeStatement);
            conn.add(branchTypeStatement);

            conn.commit();

            ActionHandler<Action> mockActionHandler = mock(ActionHandler.class);
            when(mockActionHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/workflows.ttl"));
            workflowManager.addActionHandler(mockActionHandler);
            TriggerHandler<Trigger> mockTriggerHandler = mock(TriggerHandler.class);
            when(mockTriggerHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/triggerOntology.ttl"));
            workflowManager.addTriggerHandler(mockTriggerHandler);

            workflowManager.validateWorkflow(workflowModel);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateWorkflowTestWithDifferemtValuesInSystemRepo() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/undefined-workflow.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            Resource recordIri = conn.getValueFactory().createIRI("https://mobi.com/record0#f5350991-5ff6-4ee0-9436-ca75db6b027b");
            Resource branchIri = conn.getValueFactory().createIRI("https://mobi.com/branch0#281711aa-919c-492c-a2cd-7cbf1921fe2a");
            Statement recordTypeStatement = conn.getValueFactory().createStatement(recordIri, RDF.TYPE, conn.getValueFactory().createIRI("http://mobi.com/ontologies/catalog#VersionedRDFRecord"));
            Statement branchTypeStatement = conn.getValueFactory().createStatement(branchIri, RDF.TYPE, conn.getValueFactory().createIRI("http://mobi.com/ontologies/catalog#Branch"));
            conn.add(recordTypeStatement);
            conn.add(branchTypeStatement);

            conn.commit();

            ActionHandler<Action> mockActionHandler = mock(ActionHandler.class);
            when(mockActionHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/workflows.ttl"));
            workflowManager.addActionHandler(mockActionHandler);
            TriggerHandler<Trigger> mockTriggerHandler = mock(TriggerHandler.class);
            when(mockTriggerHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/triggerOntology.ttl"));
            workflowManager.addTriggerHandler(mockTriggerHandler);

            workflowManager.validateWorkflow(workflowModel);
        }
    }

    @Test
    public void validateWorkflowTest() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/test-workflow.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        workflowManager.validateWorkflow(workflowModel);
        try (RepositoryConnection conn = provRepository.getConnection()) {
            conn.add(workflowModel);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateWorkflowNoWorkflowIRITest() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/test-workflow-no-iri.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        workflowManager.validateWorkflow(workflowModel);
        thrown.expectMessage("No workflow provided in RDF data.");
    }

    @Test(expected = IllegalArgumentException.class)
    public void validateWorkflowInvalidModelTest() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/test-workflow-invalid.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        workflowManager.validateWorkflow(workflowModel);
        thrown.expectMessage("Workflow definition is not valid:");
    }

    @Test
    public void validateWorkflowWithDuplicateValues() throws IOException {
        // Load the test workflow model
        InputStream stream = getClass().getResourceAsStream("/test-workflow.ttl");
        Model workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);

        // Mock the ActionHandler by loading in duplicate input stream
        ActionHandler<Action> mockActionHandler = mock(ActionHandler.class);
        when(mockActionHandler.getShaclDefinition()).thenReturn(getClass().getResourceAsStream("/workflows.ttl"));
        workflowManager.addActionHandler(mockActionHandler);

        // Call the method to validate the workflow with duplicate values
        workflowManager.validateWorkflow(workflowModel);
        verify(mockActionHandler).getShaclDefinition();
    }

    @Test
    public void initializeActivityTest() {
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(WorkflowExecutionActivity.class), user)
                .build();
        when(provService.createActivity(config)).thenReturn(activity);
        workflowManager.initializeActivity(config);

        assertNotNull(activity.getStartedAtTime());
    }

    @Test
    public void startExecutionActivityTest() {
        //setup
        try(RepositoryConnection conn = systemRepository.getConnection()) {
            conn.begin();
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
            conn.commit();
            // Assert WorkflowRecord
            Model workflowRecordModel = QueryResults.asModel(conn.getStatements(workflowRecord.getResource(), null, null));
            assertEquals(10, workflowRecordModel.size());
            WorkflowRecord workflowRecordRepo = recordFactory.getExisting(workflowRecord.getResource(), workflowRecordModel).orElseThrow(AssertionError::new);
            assertEquals("[\"Test Record\"]", workflowRecordRepo.getProperties(DCTERMS.TITLE).toString());
            assertEquals(5, workflowRecordRepo.getProperties(RDF.TYPE).size());
            assertEquals(catalogId, workflowRecordRepo.getCatalog_resource().orElseThrow());
            assertEquals("[http://mobi.com/test/branches#branch]", workflowRecordRepo.getBranch_resource().toString());
            assertEquals(masterBranchIRI, workflowRecordRepo.getMasterBranch_resource().orElseThrow());
            assertEquals(workflowIRI, workflowRecordRepo.getWorkflowIRI().orElseThrow());
            assertFalse(workflowRecordRepo.getLatestActivity_resource().isPresent());
        }
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, workflowRecord);
        verify(eventAdmin).postEvent(any(Event.class));
        verify(thingManager, times(1)).updateObject(eq(workflowRecord), any(RepositoryConnection.class));
        verify(provService, times(1)).addActivity(activity);
        // Verify SystemRepo
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            Model workflowRecordModel = QueryResults.asModel(conn.getStatements(workflowRecord.getResource(), null, null));
            assertEquals(11, workflowRecordModel.size());
            WorkflowRecord workflowRecordRepo = recordFactory.getExisting(workflowRecord.getResource(), workflowRecordModel).orElseThrow(AssertionError::new);
            assertEquals("[\"Test Record\"]", workflowRecordRepo.getProperties(DCTERMS.TITLE).toString());
            assertEquals(5, workflowRecordRepo.getProperties(RDF.TYPE).size());
            assertEquals(catalogId, workflowRecordRepo.getCatalog_resource().orElseThrow());
            assertEquals("[http://mobi.com/test/branches#branch]", workflowRecordRepo.getBranch_resource().toString());
            assertEquals(masterBranchIRI, workflowRecordRepo.getMasterBranch_resource().orElseThrow());
            assertEquals(workflowIRI, workflowRecordRepo.getWorkflowIRI().orElseThrow());
            assertEquals(activityIRI, workflowRecordRepo.getLatestActivity_resource().orElseThrow());
        }
        // Verify ProvRepo
        try (RepositoryConnection conn = provRepository.getConnection()) {
            Model workflowExecutionActivityModel = QueryResults.asModel(conn.getStatements(activityIRI, null, null));
            assertEquals(4, workflowExecutionActivityModel.size());
            WorkflowExecutionActivity workflowExecutionActivityRepo = executionActivityFactory.getExisting(activityIRI, workflowExecutionActivityModel).orElseThrow(AssertionError::new);
            assertEquals(3, workflowExecutionActivityRepo.getProperties(RDF.TYPE).size());
            assertEquals(0, workflowExecutionActivityRepo.getHasActionExecution_resource().size());
            assertNotNull(workflowExecutionActivityRepo.getStartedAtTime());
            assertEquals("[]", workflowExecutionActivityRepo.getWasAssociatedWith_resource().toString());
        }
    }

    @Test
    public void startExecutionActivityNoEntityTest() {
        //setup
        try(RepositoryConnection conn = systemRepository.getConnection()) {
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
        }
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, workflowRecord);
        verify(thingManager, times(1)).updateObject(eq(workflowRecord), any(RepositoryConnection.class));
        verify(provService, times(1)).addActivity(activity);
        verify(eventAdmin).postEvent(any(Event.class));
    }

    @Test(expected = IllegalStateException.class)
    public void startExecutionActivityNoActivityTest() {
        //setup
        try(RepositoryConnection conn = systemRepository.getConnection()) {
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
        }
        activity.clearProperty(RDF.TYPE);
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, workflowRecord);
        thrown.expectMessage("WorkflowExecutionActivity not made correctly");
        verify(provService, times(1)).addActivity(activity);
        verify(thingManager, times(0)).updateObject(eq(workflowRecord), any(RepositoryConnection.class));
        verify(eventAdmin, times(0)).postEvent(any(Event.class));
    }

    @Test
    public void getWorkflowTest() throws Exception{
        //setup
        Model workflowModel;
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-workflow.ttl");
            workflowModel = Rio.parse(testData, "", RDFFormat.TURTLE);
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
            conn.add(workflowModel);
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(workflowModel);

        Optional<Workflow> result = workflowManager.getWorkflow(workflowIRI);
        assertTrue(result.isPresent());
        assertEquals(result.get().getModel(), workflowModel);
        verify(branchManager, times(1)).getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class));
        verify(commitManager, times(1)).getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class));
        verify(compiledResourceManager, times(1)).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));
    }

    @Test
    public void getWorkflowTestNonExistent() {
        //setup
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(workflowRecord.getModel());

        Optional<Workflow> result = workflowManager.getWorkflow(vf.createIRI("http://example.com/workflows/B"));

        assertEquals(result, Optional.empty());
        verify(branchManager, times(0)).getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class));
        verify(commitManager, times(0)).getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class));
        verify(compiledResourceManager, times(0)).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));
    }

    @Test
    public void findWorkflowsActivitiesFilterTest() throws IOException {
        String testingData = IOUtils.toString(
                Objects.requireNonNull(SimpleWorkflowManager.class.getResourceAsStream("/expected-find-workflows-activities-filters.json")),
                StandardCharsets.UTF_8
        );
        JsonNode testingDataJsonNode = mapper.readValue(testingData, JsonNode.class);

        addFindWorkflowData();
        // ASSERT
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            ArrayNode output = mapper.createArrayNode();
            for (JsonNode node: testingDataJsonNode) {
                User adminUser;
                String requestUserIri;
                IRI workflowRecordIri = vf.createIRI(node.get("workflowRecordIri").asText());

                if (node.hasNonNull("requestUser")) {
                    requestUserIri = node.get("requestUser").asText();
                    IRI adminIri = vf.createIRI(node.get("requestUser").asText());
                    adminUser = userFactory.createNew(adminIri, QueryResults.asModel(conn.getStatements(adminIri, null, null)));
                } else {
                    requestUserIri = "http://mobi.com/users/admin";
                    IRI adminIri = vf.createIRI(node.get("requestUser").asText());
                    adminUser = userFactory.createNew(adminIri, QueryResults.asModel(conn.getStatements(adminIri, null, null)));
                }
                PaginatedWorkflowSearchParams.Builder searchParamsBuilder = new PaginatedWorkflowSearchParams.Builder();

                if (node.hasNonNull("params")) {
                    JsonNode params = node.get("params");
                    Optional.ofNullable(params.get("startingAfter")).ifPresent((input) -> searchParamsBuilder.startingAfter(input.asText()));
                    Optional.ofNullable(params.get("endingBefore")).ifPresent((input) -> searchParamsBuilder.endingBefore(input.asText()));
                    Optional.ofNullable(params.get("status")).ifPresent((input) -> searchParamsBuilder.status(input.asText()));
                    Optional.ofNullable(params.get("sortBy")).ifPresent((input) -> searchParamsBuilder.sortBy(input.asText()));
                    Optional.ofNullable(params.get("limit")).ifPresent((input) -> searchParamsBuilder.limit(input.asInt()));
                    Optional.ofNullable(params.get("offset")).ifPresent((input) -> searchParamsBuilder.offset(input.asInt()));
                    Optional.ofNullable(params.get("ascending")).ifPresent((input) -> searchParamsBuilder.ascending(input.asBoolean()));
                }
                PaginatedSearchResults<ObjectNode> results = workflowManager.findWorkflowExecutionActivities(workflowRecordIri, searchParamsBuilder.build(), adminUser, conn);
                assertNotNull(results);
                ObjectNode jsonResults = mapper.createObjectNode();
                jsonResults.put("totalSize", results.getTotalSize());
                jsonResults.put("pageSize", results.getPageSize());
                jsonResults.put("pageNumber", results.getPageNumber());
                jsonResults.set("page", mapper.convertValue(results.getPage(), ArrayNode.class));

                ObjectNode expectedObjectNode = mapper.createObjectNode();
                expectedObjectNode.put("requestUser", requestUserIri);
                expectedObjectNode.put("workflowRecordIri", workflowRecordIri.stringValue());
                expectedObjectNode.set("params", node.get("params"));
                expectedObjectNode.set("results", jsonResults);
                output.add(expectedObjectNode);
            }
            assertEquals(testingData, mapper.writer(printer).writeValueAsString(output));
        }
    }

    @Test
    public void getExecutionTest() {
        //setup
        try (RepositoryConnection conn = provRepository.getConnection()) {
            conn.add(activity.getModel());
        }

        Optional<WorkflowExecutionActivity> result = workflowManager.getExecutionActivity(activityIRI);
        assertTrue(result.isPresent());
        assertEquals(result.get().getModel(), activity.getModel());
    }

    @Test
    public void getExecutionNonExistent() {
        try (RepositoryConnection conn = provRepository.getConnection()) {
            conn.add(activity.getModel());
        }

        Optional<WorkflowExecutionActivity> result = workflowManager.getExecutionActivity(vf.createIRI("http://mobi.com/test/activities#null"));
        assertEquals(result, Optional.empty());
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowNoWorkflow() {
        workflowManager.workflowEngine = workflowEngine;
        workflowManager.startWorkflow(user, workflowRecord);
        thrown.expectMessage("Workflow " + workflowIRI + " does not exist");
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowWithExecutingWorkflow() {
        //setup
        workflowManager.workflowEngine = workflowEngine;

        try (RepositoryConnection conn = systemRepository.getConnection()) {
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(workflowRecord.getModel());
        workflowEngine.getExecutingWorkflows().add(workflowIRI);

        workflowManager.startWorkflow(user, workflowRecord);
        thrown.expectMessage("There is currently a workflow executing. Please wait a bit and try " +
                "again.");
    }

    @Test(expected = MobiException.class)
    public void startWorkflowNoEngine() throws Exception{
        //setup
        Model workflowModel;
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-workflow.ttl");
            workflowModel = Rio.parse(testData, "", RDFFormat.TURTLE);
            conn.add(workflowRecord.getModel(), workflowRecord.getResource());
            conn.add(workflowModel);
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(workflowModel);

        workflowManager.startWorkflow(user, workflowRecord);
        thrown.expectMessage("No workflow engine configured.");
    }

    @Test
    public void getLogFile() {
        //setup
        try (RepositoryConnection conn = provRepository.getConnection()) {
            conn.add(logFile.getModel());
        }
        BinaryFile result = workflowManager.getLogFile(logFileIRI);
        assertNotNull(result);
        assertTrue(Models.isomorphic(logFile.getModel(), result.getModel()));
    }

    @Test(expected = IllegalArgumentException.class)
    public void getMissingLogFile() {
        workflowManager.getLogFile(logFileIRI);
        thrown.expectMessage("Log file " + logFileIRI + " does not exist on the system.");
    }

    @Test
    public void getActionExecutions() {
        IRI actionExecIRI1 = vf.createIRI("http://mobi.solutions/test/action-execution1");
        ActionExecution actionExec1 = actionExecutionFactory.createNew(actionExecIRI1);
        ActionExecution actionExec2 = actionExecutionFactory.createNew(vf.createIRI("http://mobi.solutions/test/action-execution2"));
        ActionExecution actionExec3 = actionExecutionFactory.createNew(vf.createIRI("http://mobi.solutions/test/action-execution3"));
        activity.addHasActionExecution(actionExec1);
        WorkflowExecutionActivity otherActivity = executionActivityFactory.createNew(vf.createIRI("http://mobi.solutions/test/activities"));
        otherActivity.addHasActionExecution(actionExec3);
        try (RepositoryConnection conn = provRepository.getConnection()) {
            conn.add(activity.getModel());
            conn.add(otherActivity.getModel());
            conn.add(actionExec1.getModel());
            conn.add(actionExec2.getModel());
            conn.add(actionExec3.getModel());
        }
        Set<ActionExecution> result = workflowManager.getActionExecutions(activity.getResource());
        assertEquals(1, result.size());
        ActionExecution result1 = result.iterator().next();
        assertEquals(actionExecIRI1, result1.getResource());
        assertTrue(Models.isomorphic(result1.getModel(), actionExec1.getModel()));
    }

    private void assertNoActivitiesSystemRepo() {
        try (RepositoryConnection conn = systemRepository.getConnection()) {
            List<Statement> workflowExecutionActivities = QueryResults.asList(conn.getStatements(null, null, vf.createIRI(WorkflowExecutionActivity.TYPE)));
            assertTrue(workflowExecutionActivities.isEmpty());
            List<Statement> actionExecutions = QueryResults.asList(conn.getStatements(null, null, vf.createIRI(ActionExecution.TYPE)));
            assertTrue(actionExecutions.isEmpty());
            List<Statement> binaryFiles = QueryResults.asList(conn.getStatements(null, null, vf.createIRI(BinaryFile.TYPE)));
            assertTrue(binaryFiles.isEmpty());
        }
    }
}
