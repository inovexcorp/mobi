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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
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
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.ontologies.rdfs.Property;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
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
import com.nimbusds.jwt.SignedJWT;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
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
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import javax.servlet.http.Cookie;

public class DaguWorkflowEngineTest extends OrmEnabledTestCase {
    private static final ValueFactory vf = getValueFactory();
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
    private Cookie cookie;
    private SignedJWT signedJWT;
    private User user;
    private MemoryRepositoryWrapper repository;
    private Workflow workflowA;
    private Workflow workflowB;

    private WorkflowExecutionActivity activityA;
    private WorkflowExecutionActivity activityB;

    private AutoCloseable closeable;

    private final DaguTestActionHandler actionHandler = new DaguTestActionHandler();
    private final DaguHTTPRequestActionHandler httpActionHandler = new DaguHTTPRequestActionHandler();


    //IRI and metadata variables
    private final Literal userName = vf.createLiteral("testUser");
    private final IRI catalogId = vf.createIRI("http://mobi.com/test/catalogs#catalog-test");
    private final IRI workflowIdA = vf.createIRI("http://example.com/workflows/A");
    private final IRI workflowIdB = vf.createIRI("http://example.com/workflows/B");

    private final IRI activityIRI = vf.createIRI("http://mobi.com/test/activities#activity");
    private final String hashString = "68335f26f9162a0a5bb2bd699970fe67d60b6ede";

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
    TokenManager tokenManager;

    @Mock
    protected ProvenanceService provService;

    @Mock
    protected CatalogConfigProvider configProvider;

    @Mock
    protected Mobi mobi;

    @Mock
    protected HttpClient httpClient;

    @Mock
    protected HttpResponse httpResponse;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        signedJWT = mock(SignedJWT.class);
        System.setProperty("karaf.etc", Objects.requireNonNull(DaguWorkflowEngineTest.class.getResource("/"))
                .getPath());
        config = mock(DaguWorkflowEngineConfig.class);

        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        InputStream streamTestAction = getClass().getResourceAsStream("/test-workflow.ttl");
        InputStream streamHttpTestAction = getClass().getResourceAsStream("/http-test-action-workflow.ttl");
        Model workflowModelA = Rio.parse(streamTestAction, "", RDFFormat.TURTLE);
        Model workflowModelB = Rio.parse(streamHttpTestAction, "", RDFFormat.TURTLE);
        cookie = mock(Cookie.class);

        user = userFactory.createNew(vf.createIRI("http://test.org/user"));
        user.setUsername(userName);

        workflowA = workflowFactory.createNew(workflowIdA, workflowModelA);
        workflowB = workflowFactory.createNew(workflowIdB, workflowModelB);

        activityA = executionActivityFactory.createNew(activityIRI);
        activityA.addWasAssociatedWith(user);
        activityA.addStartedAtTime(OffsetDateTime.now());
        activityB = executionActivityFactory.createNew(activityIRI);
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
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getRepositoryId()).thenReturn("system");
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        when(config.local()).thenReturn(true);
        when(config.logDir()).thenReturn(fileLocation);
        when(config.daguHost()).thenReturn("http://127.0.0.1:8080");
        when(config.pollInterval()).thenReturn(10L);
        when(config.pollTimeout()).thenReturn(200L);

        when(mobi.getHostName()).thenReturn("https://localhost:8443/");

        daguEngine = spy(new DaguWorkflowEngine());
        injectOrmFactoryReferencesIntoService(daguEngine);
        daguEngine.tokenManager = tokenManager;
        daguEngine.configProvider = configProvider;
        daguEngine.client = httpClient;
        daguEngine.provService = provService;
        daguEngine.addActionHandler(httpActionHandler);
        daguEngine.addActionHandler(actionHandler);
        daguEngine.factoryRegistry = getOrmFactoryRegistry();
        daguEngine.mobi = mobi;
    }

    @After
    public void reset() throws Exception {
        try (RepositoryConnection connection = repository.getConnection()) {
            connection.clear();

            VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
            for (VirtualFile child : directory.getChildren()) {
                child.deleteAll();
            }
        }

        closeable.close();
    }

    @Test
    public void getTokenCookieTest() {
        //setup
        when(tokenManager.generateAuthToken(eq(userName.stringValue()))).thenReturn(signedJWT);
        when(tokenManager.createSecureTokenCookie(eq(signedJWT))).thenReturn(cookie);

        Cookie cookieResult = daguEngine.getTokenCookie(user);
        assertEquals(cookieResult, cookie);
    }

    @Test(expected = IllegalStateException.class)
    public void getTokenCookieNoUsernameTest() {
        //setup
        user.clearUsername();

        daguEngine.getTokenCookie(user);
        thrown.expectMessage("User does not have a username");
    }

    @Test
    public void createLocalHTTPAction() throws IOException {
        //setup
        when(config.local()).thenReturn(true);
        String remoteYaml = String.format("logDir: %s\n" +
                "params: MOBI_HOST MOBI_TOKEN\n" +
                "steps:\n" +
                "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: POST https://httpbin.org/post\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 45,\n" +
                "      \"headers\": {\n" +
                "      \n" +
                "      \"Content-Type\": \"application/xml\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?><root>" +
                "<person><name>John Doe</name><age>30</age><email>john@example.com</email></person>" +
                "<person><name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>\"\n" +
                "    }\n", fileLocation);

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowB);
        assertTrue(yaml.contains(remoteYaml));
    }

    @Test
    public void createRemoteHTTPAction() throws IOException {
        //setup
        when(config.local()).thenReturn(false);
        String remoteYaml = "params: MOBI_HOST MOBI_TOKEN\n" +
                "steps:\n" +
                "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: POST https://httpbin.org/post\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 45,\n" +
                "      \"headers\": {\n" +
                "      \n" +
                "      \"Content-Type\": \"application/xml\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?><root><person>" +
                "<name>John Doe</name><age>30</age><email>john@example.com</email></person><person>" +
                "<name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>\"\n" +
                "    }\n";

        daguEngine.start(config);
        String yaml = daguEngine.createYaml(workflowB);
        assertTrue(yaml.contains(remoteYaml));
    }

    @Test
    public void createRemoteHTTPActionExpectNotEqual() throws IOException {
        //setup
        when(config.local()).thenReturn(false);
        String remoteYaml = "params: MOBI_HOST MOBI_TOKEN\n" +
                "steps:\n" +
                "- name: http://example.com/workflows/B/action HTTP Request\n" +
                "  executor:\n" +
                "    type: http\n" +
                "    config:\n" +
                "      silent: true\n" +
                "  command: GET https://httpbin.org/post\n" +
                "  script: |\n" +
                "    {\n" +
                "      \"timeout\": 45,\n" +
                "      \"headers\": {\n" +
                "      \n" +
                "      \"Content-Type\": \"application/xml\"\n" +
                "    },\n" +
                "      \"query\": {\n" +
                "        \n" +
                "      },\n" +
                "      \"body\": \"<?xml version=\\\"1.0\\\" encoding=\\\"UTF-8\\\"?><root><person>" +
                "<name>John Doe</name><age>30</age><email>john@example.com</email></person><person>" +
                "<name>Jane Smith</name><age>25</age><email>jane@example.com</email></person></root>\"\n" +
                "    }\n" +
                "  output: RESULT\n" +
                "- name: http://example.com/workflows/B/action output\n" +
                "  depends:\n" +
                "    - http://example.com/workflows/B/action HTTP Request\n" +
                "  command: echo $RESULT";

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
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass())))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(404);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not connect to Dagu\n Status Code: 404\n  Body: ");

        daguEngine.start(config);
        daguEngine.client = httpClient;
        daguEngine.startWorkflow(workflowA, activityA);

        verify(provService).deleteActivity(eq(activityIRI));
    }

    @Test
    public void startWorkflowExistingDagError() throws IOException, InterruptedException {
        //setup
        String daguResponse = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/dagResponse.txt")), StandardCharsets.UTF_8);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass())))
                .thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200, 400);
        when(httpResponse.body()).thenReturn(daguResponse);
        when(tokenManager.generateAuthToken(eq(userName.stringValue()))).thenReturn(signedJWT);
        when(tokenManager.createSecureTokenCookie(eq(signedJWT))).thenReturn(cookie);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not update dag " + hashString + "\n  Status Code: 400\n  Body: " + daguResponse);

        daguEngine.start(config);
        daguEngine.client = httpClient;
        daguEngine.startWorkflow(workflowA, activityA);
        verify(provService).deleteActivity(eq(activityIRI));
    }

    @Test
    public void getSchedulerLogLocal() throws IOException, InterruptedException {
        //setup
        copyToTemp();
        String path = fileLocation + "/" + hashString + "/agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";

        daguEngine.start(config);
        daguEngine.client = httpClient;
        BinaryFile file = daguEngine.getSchedulerLog(hashString, path, activityA, httpClient);
        if (file.getFileName().isPresent()){
            assertEquals("agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log", file.getFileName().get());
        } else {
            fail();
        }
    }

    @Test
    public void getSchedulerLogRemote() throws IOException, InterruptedException {
        //setup
        String path = fileLocation + "/" + hashString + "/agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";
        String daguResponse= IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/logResponse.txt")), StandardCharsets.UTF_8);
        when(config.local()).thenReturn(false);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);

        daguEngine.start(config);
        daguEngine.client = httpClient;
        BinaryFile file = daguEngine.getSchedulerLog(hashString, path, activityA, httpClient);
        if (file.getFileName().isPresent()) {
            assertEquals("agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log", file.getFileName().get());
        } else {
            fail();
        }

        if (file.getRetrievalURL().isPresent()) {
            String resultPath = "/68335f26f9162a0a5bb2bd699970fe67d60b6ede/agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";
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
        String path = fileLocation + "/" + hashString + "/agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";
        when(config.local()).thenReturn(false);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(400);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Could not connect to Dagu\n Status Code: 400\n  Body: ");

        daguEngine.start(config);
        daguEngine.client = httpClient;
        daguEngine.getSchedulerLog(hashString, path, activityA, httpClient);
    }

    @Test
    public void getSchedulerLogRemoteNoLogs() throws IOException, InterruptedException {
        //setup
        String path = fileLocation + "/" + hashString + "/agent_68335f26f9162a0a5bb2bd699970fe67d60b6ede.20230925.11:31:49.459.44dc0c43.log";
        String daguResponse= IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/invalidLogResponse.txt")), StandardCharsets.UTF_8);
        when(config.local()).thenReturn(false);
        when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandlers.ofString().getClass()))).thenReturn(httpResponse);
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(daguResponse);

        thrown.expect(MobiException.class);
        thrown.expectMessage("Scheduler-log response did not contain log content");

        daguEngine.start(config);
        daguEngine.client = httpClient;
        daguEngine.getSchedulerLog(hashString, path, activityA, httpClient);
    }

    @Test
    public void initializeActionExecutionTest() throws IOException, InterruptedException {
        //setup
        HashMap<String, List<String>> testMap = new HashMap<>();
        ArrayList<String> testList = new ArrayList<>();
        testList.add("\"http://example.com/workflows/A/action\"");
        testMap.put("http://example.com/workflows/A/action", testList);
        String jsonString = IOUtils.toString(Objects.requireNonNull(getClass().getResourceAsStream("/objectNode.txt")), StandardCharsets.UTF_8);
        ObjectNode testNode = new ObjectMapper().readValue(jsonString, ObjectNode.class);

        daguEngine.start(config);
        daguEngine.initializeActionExecutions(activityA, testNode, hashString, testMap);
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.begin();
            conn.add(activityA.getModel());
            conn.commit();

            assertEquals(1, activityA.getHasActionExecution_resource().size());
            Resource actionIRI = activityA.getHasActionExecution_resource().stream().findFirst().get();
            Model actionModel = QueryResults.asModel(conn.getStatements(actionIRI, null, null));
            Optional<ActionExecution> executionOpt = actionExecutionFactory.getExisting(actionIRI, actionModel);
            if (executionOpt.isPresent()) {
                ActionExecution execution = executionOpt.get();
                assertEquals(1, execution.getLogs_resource().size());
                assertTrue(execution.getStartedAt().isPresent());
                assertTrue(execution.getEndedAt().isPresent());
                if (execution.getSucceeded().isPresent()) {
                    assertTrue(execution.getSucceeded().get());
                } else {
                    fail();
                }
            } else {
                fail();
            }
        }
    }

    private void copyToTemp() throws IOException {
        String resourceName = hashString;
        String absolutePath = fileLocation + resourceName;
        Files.copy(Objects.requireNonNull(getClass().getResourceAsStream("/" + resourceName)), Paths.get(absolutePath), StandardCopyOption.REPLACE_EXISTING);
    }

}
