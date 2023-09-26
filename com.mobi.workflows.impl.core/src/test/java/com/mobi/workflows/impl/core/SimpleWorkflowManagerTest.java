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

import static com.mobi.rdf.orm.OrmFactory.RDF_TYPE_IRI;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.token.TokenManager;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.prov.api.builder.ActivityConfig;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.impl.core.record.SimpleWorkflowRecordServiceTest;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
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
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.core.StreamingOutput;

public class SimpleWorkflowManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private static final ValueFactory vf = getValueFactory();
    private static final String fileLocation;
    private static VirtualFilesystem vfs;

    static {
        StringBuilder builder = new StringBuilder(System.getProperty("java.io.tmpdir"));
        if (!System.getProperty("java.io.tmpdir").endsWith("/")) {
            builder.append("/");
        }
        fileLocation = builder.append("com.mobi.workflows.impl/").toString();
    }

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
    private WorkflowRecord record;
    private Branch branch;
    private Commit commit;
    private User user;

    private Model workflowModel;
    private MemoryRepositoryWrapper repository;
    private WorkflowExecutionActivity activity;
    private BinaryFile logFile;

    private final OrmFactory<WorkflowRecord> recordFactory = getRequiredOrmFactory(WorkflowRecord.class);
    private final OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<WorkflowExecutionActivity> executionActivityFactory = getRequiredOrmFactory(WorkflowExecutionActivity.class);
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

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        System.setProperty("karaf.etc", Objects.requireNonNull(SimpleWorkflowRecordServiceTest.class.getResource("/")).getPath());
        repository = new MemoryRepositoryWrapper();
        repository.setDelegate(new SailRepository(new MemoryStore()));

        SimpleVirtualFilesystemConfig config = mock(SimpleVirtualFilesystemConfig.class);

        user = userFactory.createNew(vf.createIRI("http://test.org/user"));
        user.setUsername(userName);
        commit = commitFactory.createNew(commitIRI);
        branch = branchFactory.createNew(branchIRI);
        branch.setHead(commit);
        branch.setProperty(vf.createLiteral("Test Branch"), vf.createIRI(_Thing.title_IRI));

        record = recordFactory.createNew(recordIRI);
        record.setProperty(vf.createLiteral("Test Record"), vf.createIRI(_Thing.title_IRI));
        record.setCatalog(catalogFactory.createNew(catalogId));
        record.setBranch(Collections.singleton(branch));
        record.setMasterBranch(branchFactory.createNew(masterBranchIRI));
        record.setWorkflowIRI(workflowIRI);

        activity = executionActivityFactory.createNew(activityIRI);

        //setting up mock calls
        when(configProvider.getRepository()).thenReturn(repository);
        when(configProvider.getRepositoryId()).thenReturn("system");
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);

        // Setup VirtualFileSystem
        vfs = new SimpleVirtualFilesystem();
        when(config.maxNumberOfTempFiles()).thenReturn(10000);
        when(config.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(config.defaultRootDirectory()).thenReturn(fileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, config);
        VirtualFile directory = vfs.resolveVirtualFile(fileLocation);
        if (!directory.exists()) {
            directory.createFolder();
        }

        logFile = binaryFactory.createNew(logFileIRI);
        String path = copyToTemp();
        String filePath = "file://" + path;
        logFile.setRetrievalURL(vf.createIRI(filePath));
        logFile.setFileName("test-log-file.txt");

        workflowManager = new SimpleWorkflowManager();
        injectOrmFactoryReferencesIntoService(workflowManager);
        workflowManager.commitManager = commitManager;
        workflowManager.branchManager = branchManager;
        workflowManager.compiledResourceManager = compiledResourceManager;
        workflowManager.tokenManager = tokenManager;
        workflowManager.provService = provService;
        workflowManager.configProvider = configProvider;
        workflowManager.thingManager = thingManager;
        workflowManager.provRepo = repository;
        workflowManager.vfs = vfs;
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
    public void workflowRecordIriExistsTest() {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(record.getModel());
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
    public void validateWorkflowTest() throws IOException {
        InputStream stream = getClass().getResourceAsStream("/test-workflow.ttl");
        workflowModel = Rio.parse(stream, "", RDFFormat.TURTLE);
        workflowManager.validateWorkflow(workflowModel);
        try (RepositoryConnection conn = repository.getConnection()) {
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
    public void initializeActivityTest() {
        ActivityConfig config = new ActivityConfig.Builder(Collections.singleton(WorkflowExecutionActivity.class), user)
                .build();
        when(provService.createActivity(config)).thenReturn(activity);
        workflowManager.initializeActivity(config);

        assertNotNull(activity.getStartedAtTime());
    }

    @Test
    public void startExecutionTest() {
        //setup
        RepositoryConnection conn = repository.getConnection();
        conn.add(record.getModel());
        when(provService.getConnection()).thenReturn(conn);
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, record);
        verify(thingManager, times(1)).updateObject(eq(record), any(RepositoryConnection.class));
        verify(provService, times(1)).addActivity(activity);
    }

    @Test
    public void startExecutionTestNoEntity() {
        //setup
        RepositoryConnection conn = repository.getConnection();
        conn.add(record.getModel());
        when(provService.getConnection()).thenReturn(conn);
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, record);
        verify(thingManager, times(1)).updateObject(eq(record), any(RepositoryConnection.class));
        verify(provService, times(1)).addActivity(activity);
    }

    @Test(expected = IllegalStateException.class)
    public void startExecutionTestNoActivity() {
        //setup
        RepositoryConnection conn = repository.getConnection();
        conn.add(record.getModel());
        activity.clearProperty(vf.createIRI(RDF_TYPE_IRI));
        when(provService.getConnection()).thenReturn(conn);
        when(provService.createActivity(any(ActivityConfig.class))).thenReturn(activity);

        workflowManager.startExecutionActivity(user, record);
        thrown.expectMessage("WorkflowExecutionActivity not made correctly");
        verify(provService, times(1)).addActivity(activity);
        verify(thingManager, times(0)).updateObject(eq(record), any(RepositoryConnection.class));
    }

    @Test
    public void getWorkflowTest() throws Exception{
        //setup
        Model workflowModel;
        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-workflow.ttl");
            workflowModel = Rio.parse(testData, "", RDFFormat.TURTLE);
            conn.add(record.getModel());
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
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(record.getModel());
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(record.getModel());

        Optional<Workflow> result = workflowManager.getWorkflow(vf.createIRI("http://example.com/workflows/B"));

        assertEquals(result, Optional.empty());
        verify(branchManager, times(0)).getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class));
        verify(commitManager, times(0)).getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class));
        verify(compiledResourceManager, times(0)).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));
    }

    @Test
    public void getExecutionTest() {
        //setup
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(activity.getModel());
        }

        Optional<WorkflowExecutionActivity> result = workflowManager.getExecutionActivity(activityIRI);
        assertTrue(result.isPresent());
        assertEquals(result.get().getModel(), activity.getModel());
    }

    @Test
    public void getExecutionNonExistent() {
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(activity.getModel());
        }

        Optional<WorkflowExecutionActivity> result = workflowManager.getExecutionActivity(vf.createIRI("http://mobi.com/test/activities#null"));
        assertEquals(result, Optional.empty());
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowNoWorkflow() {
        workflowManager.startWorkflow(user, record);
        thrown.expectMessage("Workflow " + workflowIRI + " does not exist");
    }

    @Test(expected = IllegalArgumentException.class)
    public void startWorkflowExecutingWorkflow() {
        //setup
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(record.getModel());
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(record.getModel());
        workflowManager.executingWorkflows.add(workflowIRI);

        workflowManager.startWorkflow(user, record);
        thrown.expectMessage("Workflow " + workflowIRI + " is currently executing. Wait a bit and "
                + "try again.");
    }

    @Test(expected = MobiException.class)
    public void startWorkflowNoEngine() throws Exception{
        //setup
        Model workflowModel;
        try (RepositoryConnection conn = repository.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-workflow.ttl");
            workflowModel = Rio.parse(testData, "", RDFFormat.TURTLE);
            conn.add(record.getModel());
            conn.add(workflowModel);
        }
        when(branchManager.getMasterBranch(any(Resource.class), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getHeadCommit(any(Resource.class), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(workflowModel);

        workflowManager.startWorkflow(user, record);
        thrown.expectMessage("No workflow engine configured.");
    }

    @Test
    public void getLogsTest() throws IOException {
        //setup
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(logFile.getModel());
        }

        StreamingOutput result = workflowManager.getLogFile(logFile);
        assertNotNull(result);
    }

    @Test
    public void getLogsTestBinaryFile() throws VirtualFilesystemException {
        //setup
        try (RepositoryConnection conn = repository.getConnection()) {
            conn.add(logFile.getModel());
        }

        StreamingOutput result = workflowManager.getLogFile(logFile);
        assertNotNull(result);
    }

    @Test(expected = IllegalArgumentException.class)
    public void getLogsTestNoTriples() throws VirtualFilesystemException {
        workflowManager.getLogFile(logFileIRI);
        thrown.expectMessage("Log file " + logFileIRI + " does not exist on the system.");
    }

    private String copyToTemp() throws IOException {
        String resourceName = "test-log-file.txt";
        String absolutePath = fileLocation + resourceName;
        Files.copy(Objects.requireNonNull(getClass().getResourceAsStream("/" + resourceName)), Paths.get(absolutePath), StandardCopyOption.REPLACE_EXISTING);
        return absolutePath;
    }

}
