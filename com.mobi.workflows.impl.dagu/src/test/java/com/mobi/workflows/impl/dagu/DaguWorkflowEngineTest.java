package com.mobi.workflows.impl.dagu;

/*-
 * #%L
 * com.mobi.workflows.impl.dagu
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.api.EncryptionService;
import com.mobi.server.api.Mobi;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.Action;
import com.mobi.workflows.api.ontologies.workflows.ActionExecution;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.impl.dagu.actions.DaguHTTPRequestActionHandler;
import com.mobi.workflows.impl.dagu.actions.DaguTestActionHandler;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
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
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class DaguWorkflowEngineTest extends OrmEnabledTestCase {
    private static final ValueFactory vf = getValueFactory();
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String fileLocation;
    private static VirtualFilesystem vfs;

    static {
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        fileLocation = builder.append("com.mobi.workflows.impl/dagu").toString();
    }

    private DaguWorkflowEngine daguEngine;

    private Workflow workflowA;
    private Workflow workflowB;

    private WorkflowExecutionActivity activityA;

    private AutoCloseable closeable;

    private MemoryRepositoryWrapper provRepository;
    private MemoryRepositoryWrapper systemRepository;

    private final DaguTestActionHandler actionHandler = new DaguTestActionHandler();
    private final DaguHTTPRequestActionHandler httpActionHandler = new DaguHTTPRequestActionHandler();

    //IRI and metadata variables
    private final Literal userName = vf.createLiteral("testUser");
    private final IRI catalogId = vf.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI workflowIdA = vf.createIRI("http://example.com/workflows/A");
    private final IRI workflowIdB = vf.createIRI("http://example.com/workflows/B");

    private final IRI activityIRI = vf.createIRI("http://mobi.com/test/activities#activity");
    private final String hashString = "68335f26f9162a0a5bb2bd699970fe67d60b6ede";
    private final String schedulerLog = "agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";

    //ORM factories
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<Workflow> workflowFactory = getRequiredOrmFactory(Workflow.class);
    private final OrmFactory<WorkflowExecutionActivity> executionActivityFactory =
            getRequiredOrmFactory(WorkflowExecutionActivity.class);

    //needed to inject into service
    private final OrmFactory<Action> actionFactory = getRequiredOrmFactory(Action.class);
    private final OrmFactory<BinaryFile> binaryFileFactory = getRequiredOrmFactory(BinaryFile.class);
    private final OrmFactory<ActionExecution> actionExecutionFactory = getRequiredOrmFactory(ActionExecution.class);

    private DaguWorkflowEngineConfig config;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    protected ProvenanceService provService;

    @Mock
    protected CatalogConfigProvider configProvider;

    @Mock
    protected Mobi mobi;

    @Mock
    protected DaguHttpClient daguHttpClient;

    @Mock
    protected EventAdmin eventAdmin;

    @Mock
    protected EncryptionService encryptionService;

    @Mock
    protected ConfigurationAdmin configurationAdmin;

    @Mock
    private Bundle bundle;

    @Mock
    private BundleContext bundleContext;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        when(bundleContext.getBundle()).thenReturn(bundle);

        System.setProperty("karaf.etc", Objects.requireNonNull(DaguWorkflowEngineTest.class.getResource("/"))
                .getPath());
        config = mock(DaguWorkflowEngineConfig.class);

        provRepository = new MemoryRepositoryWrapper();
        provRepository.setDelegate(new SailRepository(new MemoryStore()));
        systemRepository = new MemoryRepositoryWrapper();
        systemRepository.setDelegate(new SailRepository(new MemoryStore()));

        InputStream streamTestAction = getClass().getResourceAsStream("/test-workflow.ttl");
        InputStream streamHttpTestAction = getClass().getResourceAsStream("/http-test-action-workflow.ttl");
        Model workflowModelA = Rio.parse(streamTestAction, "", RDFFormat.TURTLE);
        Model workflowModelB = Rio.parse(streamHttpTestAction, "", RDFFormat.TURTLE);

        User user = userFactory.createNew(vf.createIRI("http://test.org/user"));
        user.setUsername(userName);

        workflowA = workflowFactory.createNew(workflowIdA, workflowModelA);
        workflowB = workflowFactory.createNew(workflowIdB, workflowModelB);

        activityA = executionActivityFactory.createNew(activityIRI);
        activityA.addWasAssociatedWith(user);
        activityA.addStartedAtTime(OffsetDateTime.now());
        WorkflowExecutionActivity activityB = executionActivityFactory.createNew(activityIRI);
        activityB.addWasAssociatedWith(user);
        activityB.addStartedAtTime(OffsetDateTime.now());

        // Setup VirtualFileSystem
        vfs = new SimpleVirtualFilesystem();
        SimpleVirtualFilesystemConfig fileConfig = mock(SimpleVirtualFilesystemConfig.class);
        when(fileConfig.maxNumberOfTempFiles()).thenReturn(10000);
        when(fileConfig.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(fileConfig.defaultRootDirectory()).thenReturn(fileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, fileConfig);

        //setting up mock calls
        when(configProvider.getRepository()).thenReturn(systemRepository);
        when(configProvider.getRepositoryId()).thenReturn("system");
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        when(config.local()).thenReturn(true);
        when(config.logDir()).thenReturn(fileLocation);
        when(config.daguHost()).thenReturn("http://127.0.0.1:8080");
        when(config.pollInterval()).thenReturn(10L);
        when(config.pollTimeout()).thenReturn(200L);
        when(config.concurrencyLimit()).thenReturn(100);

        when(mobi.getHostName()).thenReturn("https://localhost:8443/");

        daguEngine = spy(new DaguWorkflowEngine());
        injectOrmFactoryReferencesIntoService(daguEngine);
        daguEngine.configProvider = configProvider;
        daguEngine.provService = provService;
        daguEngine.setEventAdmin(eventAdmin);
        daguEngine.addActionHandler(httpActionHandler);
        daguEngine.addActionHandler(actionHandler);
        daguEngine.factoryRegistry = getOrmFactoryRegistry();
        daguEngine.mobi = mobi;
        daguEngine.provRepo = provRepository;
        daguEngine.encryptionService = encryptionService;
        daguEngine.configurationAdmin = configurationAdmin;
    }

    @After
    public void reset() throws Exception {
        Mockito.reset(provService, configProvider, mobi, daguHttpClient);
        assertNoActivitiesSystemRepo();
        try (RepositoryConnection connection = systemRepository.getConnection()) {
            connection.clear();
        }
        try (RepositoryConnection connection = provRepository.getConnection()) {
            connection.clear();
        }
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        for (VirtualFile child : directory.getChildren()) {
            child.deleteAll();
        }
        closeable.close();
    }

    @Test
    public void createLocalHTTPAction() throws IOException {
        //setup
        when(config.local()).thenReturn(true);
        String remoteYaml = String.format("""
                logDir: %s
                params: MOBI_HOST MOBI_TOKEN
                steps:
                - name: http://example.com/workflows/B/action HTTP Request
                  executor:
                    type: http
                    config:
                      silent: true
                  command: POST https://httpbin.org/post
                  script: |
                    {
                      "timeout": 45,
                      "headers": {
                     \s
                      "Content-Type": "application/xml"
                    },
                      "query": {
                       \s
                      },
                      "body": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?><root>\
                <person><name>John Doe</name><age>30</age><email>john@example.com</email></person>\
                <person><name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>"
                    }
                """, fileLocation);

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowB);
        assertTrue(yaml.contains(remoteYaml));
    }

    @Test
    public void createRemoteHTTPAction() throws IOException {
        //setup
        when(config.local()).thenReturn(false);
        String remoteYaml = """
                params: MOBI_HOST MOBI_TOKEN
                steps:
                - name: http://example.com/workflows/B/action HTTP Request
                  executor:
                    type: http
                    config:
                      silent: true
                  command: POST https://httpbin.org/post
                  script: |
                    {
                      "timeout": 45,
                      "headers": {
                     \s
                      "Content-Type": "application/xml"
                    },
                      "query": {
                       \s
                      },
                      "body": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?><root><person>\
                <name>John Doe</name><age>30</age><email>john@example.com</email></person><person>\
                <name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>"
                    }
                """;

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowB);
        assertTrue(yaml.contains(remoteYaml));
    }

    @Test
    public void createRemoteHTTPActionExpectNotEqual() throws IOException {
        //setup
        when(config.local()).thenReturn(false);
        String remoteYaml = """
                params: MOBI_HOST MOBI_TOKEN
                steps:
                - name: http://example.com/workflows/B/action HTTP Request
                  executor:
                    type: http
                    config:
                      silent: true
                  command: GET https://httpbin.org/post
                  script: |
                    {
                      "timeout": 45,
                      "headers": {
                     \s
                      "Content-Type": "application/xml"
                    },
                      "query": {
                       \s
                      },
                      "body": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?><root><person>\
                <name>John Doe</name><age>30</age><email>john@example.com</email></person><person>\
                <name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>"
                    }
                  output: RESULT
                - name: http://example.com/workflows/B/action output
                  depends:
                    - http://example.com/workflows/B/action HTTP Request
                  command: echo $RESULT""";

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowB);
        assertNotEquals(remoteYaml, yaml);
    }

    @Test
    public void createRemoteHTTPActionInvalidYaml() throws IOException {
        daguEngine.start(config);
        Model invalidModel = workflowB.getModel();

        IRI hasHttpUrlPredicate = vf.createIRI("http://mobi.solutions/ontologies/workflows#hasHttpUrl");
        invalidModel = invalidModel.filter(null, hasHttpUrlPredicate, null);
        if (!invalidModel.isEmpty()) {
            invalidModel.removeAll(invalidModel);
        }
        thrown.expect(MobiException.class);
        thrown.expectMessage("HTTP URL for Dagu Request not present");
        daguEngine.createYaml(workflowB);
    }
    
    @Test
    public void createRemoteYamlTest() throws IOException {
        //setup
        when(config.local()).thenReturn(false);
        String remoteYaml = """
                params: MOBI_HOST MOBI_TOKEN
                steps:
                - name: http://example.com/workflows/A/action
                  command: echo "This is a test message from Workflow A\"""";

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowA);
        assertEquals(remoteYaml, yaml);
    }

    @Test
    public void createLocalYamlTest() throws IOException {
        when(config.local()).thenReturn(true);
        String localYaml = """
                logDir: %s
                params: MOBI_HOST MOBI_TOKEN
                steps:
                - name: http://example.com/workflows/A/action
                  command: echo "This is a test message from Workflow A\"""".formatted(fileLocation);
        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowA);
        assertEquals(localYaml, yaml);
    }

    @Test
    public void startWorkflowNoDaguConnectionTest() throws IOException, InterruptedException {
        //setup
        when(daguHttpClient.getDag(any(String.class))).thenThrow( new MobiException("Could not connect to Dagu\n Status Code: 404\n  Body: "));
        daguEngine.start(config);
        daguEngine.daguHttpClient = daguHttpClient;
        daguEngine.startWorkflow(workflowA, activityA);
        Model activityModel = activityA.getModel();
        assertEquals(13, activityModel.size());
        verify(provService).updateActivity(eq(activityA));
        verify(eventAdmin).postEvent(any(Event.class));

        Statement endedTriple = activityModel.getStatements(activityIRI,
                       vf.createIRI(WorkflowExecutionActivity.endedAtTime_IRI), null).iterator().next();

        Statement succeededTriple = activityModel.getStatements(activityIRI,
                        vf.createIRI(WorkflowExecutionActivity.succeeded_IRI), null).iterator().next();

        assertNotEquals(endedTriple.getObject().stringValue(), null);

        assertEquals("\"false\"^^<http://www.w3.org/2001/XMLSchema#boolean>",
                succeededTriple.getObject().toString());
    }

    @Test
    public void startWorkflowExistingDagError() throws IOException, InterruptedException {
        //setup
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/dagResponse.txt")), StandardCharsets.UTF_8);
        when(daguHttpClient.getDag(any(String.class))).thenReturn(mapper.readValue(daguResponse, ObjectNode.class));
        Mockito.doThrow(new MobiException("Could not update dag " + hashString + "\n  Status Code: 400\n  Body: " + daguResponse))
                .when(daguHttpClient).updateDag(any(String.class), any(String.class));
        daguEngine.start(config);
        daguEngine.daguHttpClient = daguHttpClient;

        daguEngine.startWorkflow(workflowA, activityA);
        Model activityModel = activityA.getModel();
        assertEquals(13, activityModel.size());
        verify(provService).updateActivity(eq(activityA));
        verify(eventAdmin).postEvent(any(Event.class));

        Statement endedTriple = activityModel.getStatements(activityIRI,
                vf.createIRI(WorkflowExecutionActivity.endedAtTime_IRI), null).iterator().next();

        Statement succeededTriple = activityModel.getStatements(activityIRI,
                vf.createIRI(WorkflowExecutionActivity.succeeded_IRI), null).iterator().next();

        assertNotEquals(endedTriple.getObject().stringValue(), null);

        assertEquals("\"false\"^^<http://www.w3.org/2001/XMLSchema#boolean>",
                succeededTriple.getObject().toString());
    }

    @Test
    public void getSchedulerLogLocal() throws Exception {
        //setup
        copyToTemp();
        String path = fileLocation + "/" + hashString + "/" + schedulerLog;

        daguEngine.start(config);
        BinaryFile file = daguEngine.getSchedulerLog(hashString, path, activityA);
        if (file.getFileName().isPresent()){
            assertEquals(schedulerLog, file.getFileName().get());
        } else {
            fail();
        }
    }

    @Test
    public void getSchedulerLogRemote() throws IOException, InterruptedException {
        //setup
        String path = fileLocation + "/" + hashString + "/" + schedulerLog;
        String daguResponse= IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/logResponse.txt")), StandardCharsets.UTF_8);
        when(config.local()).thenReturn(false);
        when(daguHttpClient.getSchedulerLog(any(String.class))).thenReturn(mapper.readValue(daguResponse, ObjectNode.class));
        daguEngine.start(config);
        daguEngine.daguHttpClient = daguHttpClient;

        BinaryFile file = daguEngine.getSchedulerLog(hashString, path, activityA);
        if (file.getFileName().isPresent()) {
            assertEquals(schedulerLog, file.getFileName().get());
        } else {
            fail();
        }
        if (file.getRetrievalURL().isPresent()) {
            String resultPath = "/68335f26f9162a0a5bb2bd699970fe67d60b6ede/" + schedulerLog;
            assertEquals("file://" + path, file.getRetrievalURL().get().toString());
            String contents = Files.readString(Path.of(file.getRetrievalURL().get().toString().replace("file://", "")));
            assertEquals(IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream(resultPath)), StandardCharsets.UTF_8), contents);
        } else {
            fail();
        }
    }

    @Test
    public void getSchedulerLogRemoteFail() throws IOException, InterruptedException {
        //setup
        String path = fileLocation + "/" + hashString + "/" + schedulerLog;
        when(config.local()).thenReturn(false);
        when(daguHttpClient.getSchedulerLog(any(String.class))).thenThrow(new MobiException("Could not connect to Dagu\n Status Code: 400\n  Body: "));
        daguEngine.start(config);
        daguEngine.daguHttpClient = daguHttpClient;

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not connect to Dagu\n Status Code: 400\n  Body: ");

        daguEngine.getSchedulerLog(hashString, path, activityA);
    }

    @Test
    public void getSchedulerLogRemoteNoLogs() throws IOException, InterruptedException {
        //setup
        String path = fileLocation + "/" + hashString + "/" + schedulerLog;
        String daguResponse= IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/invalidLogResponse.txt")), StandardCharsets.UTF_8);
        when(config.local()).thenReturn(false);
        when(daguHttpClient.getSchedulerLog(any(String.class))).thenReturn(mapper.readValue(daguResponse, ObjectNode.class));
        daguEngine.start(config);
        daguEngine.daguHttpClient = daguHttpClient;

        thrown.expect(MobiException.class);
        thrown.expectMessage("Scheduler-log response did not contain log content");

        daguEngine.getSchedulerLog(hashString, path, activityA);
    }

    @Test
    public void initializeActionExecutionTest() throws IOException, InterruptedException {
        //setup
        IRI action1 = vf.createIRI("http://example.com/workflows/A/action");
        IRI action2 = vf.createIRI("http://test.com/workflows-example#WorkflowAHTTPAction1");
        IRI action3 = vf.createIRI("http://test.com/workflows-example#WorkflowAHTTPAction2");
        HashMap<Action, List<String>> testMap = new HashMap<>();
        testMap.put(actionFactory.createNew(action1), List.of("http://example.com/workflows/A/action"));
        testMap.put(actionFactory.createNew(action2), List.of("http://test.com/workflows-example#WorkflowAHTTPAction1 HTTP Request", "http://test.com/workflows-example#WorkflowAHTTPAction1 output"));
        testMap.put(actionFactory.createNew(action3), List.of("http://test.com/workflows-example#WorkflowAHTTPAction2 HTTP Request", "http://test.com/workflows-example#WorkflowAHTTPAction2 output"));
        String jsonString = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/objectNode.txt")), StandardCharsets.UTF_8);
        ObjectNode testNode = new ObjectMapper().readValue(jsonString, ObjectNode.class);

        daguEngine.start(config);
        daguEngine.initializeActionExecutions(activityA, testNode, hashString, testMap);
        try (RepositoryConnection conn = provRepository.getConnection()) {
            // Get WorkflowExecutionActivity
            Model workflowExecutionActivityModel = QueryResults.asModel(conn.getStatements(activityIRI, null, null));
            WorkflowExecutionActivity workflowExecutionActivity = executionActivityFactory.getExisting(activityIRI, workflowExecutionActivityModel).orElseThrow(AssertionError::new);
            // Verify WorkflowExecutionActivity
            assertEquals(3, workflowExecutionActivity.getProperties(RDF.TYPE).size());
            assertEquals(3, workflowExecutionActivity.getHasActionExecution_resource().size());
            assertNotNull(workflowExecutionActivity.getStartedAtTime());
            assertEquals("[http://test.org/user]", workflowExecutionActivity.getWasAssociatedWith_resource().toString());
            List<ActionExecution> actionExecutions = workflowExecutionActivity.getHasActionExecution_resource().stream()
                    .map(iri -> {
                        Model model = QueryResults.asModel(conn.getStatements(iri, null, null));
                        return actionExecutionFactory.getExisting(iri, model).orElseThrow(AssertionError::new);
                    })
                    .toList();

            // Verify ActionExecution 1
            IRI errorIRI = vf.createIRI("urn:error");
            Optional<ActionExecution> optActionExecution1 = actionExecutions.stream()
                    .filter(actionExecution -> actionExecution.getAboutAction_resource().orElse(errorIRI).equals(action1))
                    .findFirst();
            assertTrue(optActionExecution1.isPresent());
            ActionExecution actionExecution1 = optActionExecution1.get();
            // ActionExecution 1 Properties
            assertEquals(2, actionExecution1.getProperties(RDF.TYPE).size());
            assertEquals(1, actionExecution1.getLogs_resource().size());
            ZoneOffset offset = OffsetDateTime.now().getOffset();
            assertEquals(OffsetDateTime.parse("2023-09-25T16:13" + offset), actionExecution1.getStartedAt().orElseThrow(AssertionError::new));
            assertEquals(OffsetDateTime.parse("2023-09-25T16:13" + offset), actionExecution1.getEndedAt().orElseThrow(AssertionError::new));
            assertEquals(true, actionExecution1.getSucceeded().orElseThrow(AssertionError::new));
            // ActionExecution 1 log
            Resource logIRI1 = actionExecution1.getLogs_resource().iterator().next();
            Model binaryFileModel1 = QueryResults.asModel(conn.getStatements(logIRI1, null, null));
            BinaryFile binaryFile1 = binaryFileFactory.getExisting(logIRI1, binaryFileModel1).orElseThrow(AssertionError::new);
            assertEquals(2, binaryFile1.getProperties(RDF.TYPE).size());
            assertEquals("http___example.com_workflows_A_action.20230925.16:13:00.050.9a9386f7.log", binaryFile1.getFileName().orElseThrow());
            assertEquals("text/plain", binaryFile1.getMimeType().orElseThrow());
            String actionLog = "http___example.com_workflows_A_action.20230925.16:13:00.050.9a9386f7.log";
            assertEquals(vf.createIRI("file:///Users/khalilsavoy/desktop/workflows/68335f26f9162a0a5bb2bd699970fe67d60b6ede/" + actionLog), binaryFile1.getRetrievalURL().orElseThrow());

            // Verify ActionExecution 2
            Optional<ActionExecution> optActionExecution2 = actionExecutions.stream()
                    .filter(actionExecution -> actionExecution.getAboutAction_resource().orElse(errorIRI).equals(action2))
                    .findFirst();
            assertTrue(optActionExecution2.isPresent());
            ActionExecution actionExecution2 = optActionExecution2.get();
            // ActionExecution 2 Properties
            assertEquals(2, actionExecution2.getProperties(RDF.TYPE).size());
            assertEquals(2, actionExecution2.getLogs_resource().size());
            assertEquals(OffsetDateTime.parse("2023-09-25T10:10" + offset), actionExecution2.getStartedAt().orElseThrow(AssertionError::new));
            assertEquals(OffsetDateTime.parse("2023-09-25T10:12" + offset), actionExecution2.getEndedAt().orElseThrow(AssertionError::new));
            assertEquals(true, actionExecution2.getSucceeded().orElseThrow(AssertionError::new));

            // Verify ActionExecution 3
            Optional<ActionExecution> optActionExecution3 = actionExecutions.stream()
                    .filter(actionExecution -> actionExecution.getAboutAction_resource().orElse(errorIRI).equals(action3))
                    .findFirst();
            assertTrue(optActionExecution3.isPresent());
            ActionExecution actionExecution3 = optActionExecution3.get();
            // ActionExecution 3 Properties
            assertEquals(2, actionExecution3.getProperties(RDF.TYPE).size());
            assertEquals(1, actionExecution3.getLogs_resource().size());
            assertEquals(OffsetDateTime.parse("2023-09-25T10:10" + offset), actionExecution3.getStartedAt().orElseThrow(AssertionError::new));
            assertEquals(OffsetDateTime.parse("2023-09-25T10:10" + offset), actionExecution3.getEndedAt().orElseThrow(AssertionError::new));
            assertEquals(false, actionExecution3.getSucceeded().orElseThrow(AssertionError::new));
        }
    }

    @Test
    public void validateConfigNoUsernameTest() throws IOException {
        when(config.password()).thenReturn(null);
        when(config.username()).thenReturn("test");

        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Dagu Workflow Engine cannot be run due to DaguWorkflowEngineConfig" +
                " having a basic auth username and no password configured.");

        daguEngine.start(config);
    }

    @Test
    public void validateConfigNoPasswordTest() throws IOException {
        when(config.password()).thenReturn("test");
        when(config.username()).thenReturn(null);

        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Dagu Workflow Engine cannot be run due to DaguWorkflowEngineConfig" +
                " having a basic auth password and no username configured.");

        daguEngine.start(config);
    }

    private void copyToTemp() throws IOException, URISyntaxException {
        String resourceName = hashString;
        String absolutePath = fileLocation + File.separator + resourceName;
        FileUtils.copyDirectory(Paths.get(Objects.requireNonNull(getClass().getResource("/" + resourceName)).toURI()).toFile(), Paths.get(absolutePath).toFile());
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
