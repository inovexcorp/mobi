package com.mobi.workflows.impl.core.versioning;

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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.Workflow;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.*;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;

import java.io.InputStream;
import java.util.Optional;

public class WorkflowRecordVersioningServiceTest extends OrmEnabledTestCase {
    private final ValueFactory vf = getValueFactory();
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private WorkflowRecordVersioningService service;

    // OrmFactories
    private final OrmFactory<WorkflowRecord> recordFactory = getRequiredOrmFactory(WorkflowRecord.class);
    private final OrmFactory<WorkflowRecord> workflowRecordOrmFactory = getRequiredOrmFactory(WorkflowRecord.class);
    private final OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    // Constant
    private final IRI recordId = VALUE_FACTORY.createIRI("https://mobi.com/records#NewWorkflowId");
    private final IRI recordIdHead = VALUE_FACTORY.createIRI("https://mobi.com/records#NewWorkflowId/HEAD");
    private final IRI catalogId = VALUE_FACTORY.createIRI("http://mobi.com/catalog");
    private final IRI workflowId = vf.createIRI("http://example.com/workflows/A");
    private final IRI commitID = getValueFactory().createIRI("https://mobi.com/commits#NewWorkflowIdCommit000");
    private final IRI newWorkflowIdBranchId = getValueFactory().createIRI("https://mobi.com/branches#NewWorkflowIdBranchId");
    private final IRI catalogIri = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");

    // Variables
    private WorkflowRecord record;
    private Model recordHeadGraph;
    private MasterBranch masterBranch;
    private Commit commit;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    // Mock Variables
    @Mock
    private WorkflowManager workflowManager;

    // BaseVersioningService Dependencies
    @Mock
    private RecordManager recordManager;

    @Mock
    private ThingManager thingManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private CompiledResourceManager compiledResourceManager;

    @Mock
    private BundleContext context;

    @Mock
    private CatalogConfigProvider configProvider;

    public Optional<Model> optModel(Resource id, RepositoryConnection conn) {
        try (RepositoryResult<Statement> repositoryResult = conn.getStatements(null, null, null, id)) {
            Model model = QueryResults.asModel(repositoryResult, getModelFactory());
            if (model.isEmpty()) {
                return Optional.empty();
            } else {
                return Optional.of(model);
            }
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    public <T extends Thing> Optional<T> optObject(Resource id, OrmFactory<T> factory, RepositoryConnection conn) {
        try (RepositoryResult<Statement> repositoryResult = conn.getStatements(null, null, null, id)) {
            Model model = QueryResults.asModel(repositoryResult, getModelFactory());
            return factory.getExisting(id, model);
        } catch (Exception e) {
            throw new MobiException(e);
        }
    }

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            conn.commit();
            record = spy(optObject(recordId, workflowRecordOrmFactory, conn).orElseThrow(() -> new Exception("Can't find record")));
            recordHeadGraph = optModel(recordIdHead, conn).orElseThrow(() -> new Exception("Can't find record"));
            commit = spy(optObject(commitID, commitFactory, conn).orElseThrow(() -> new Exception("Can't find commit")));
            masterBranch = optObject(newWorkflowIdBranchId, masterBranchFactory, conn).orElseThrow(() -> new Exception("Can't find branch"));
        }
        closeable = MockitoAnnotations.openMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogId);
        when(branchManager.getMasterBranch(eq(catalogIri), eq(recordId), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(branchManager.getHeadGraph(masterBranch)).thenReturn(recordIdHead);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);

        service = new WorkflowRecordVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.recordManager = recordManager;
        service.commitManager = commitManager;
        service.branchManager = branchManager;
        service.compiledResourceManager = compiledResourceManager;
        service.differenceManager = differenceManager;
        service.thingManager = thingManager;
        service.workflowManager = workflowManager;
        service.configProvider = configProvider;
        service.workflowRecordFactory = (WorkflowRecordFactory) recordFactory;
        service.start(context);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // addMasterCommit, addBranchCommit, mergeIntoMaster, mergeIntoBranch test coverage provided by BaseVersioningServiceTest

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(WorkflowRecord.TYPE, service.getTypeIRI());
    }

    @Test
    public void validateAndUpdateTriggerTest() throws Exception {
        when(compiledResourceManager.getCompiledResource(eq(commitID), any(RepositoryConnection.class))).thenReturn(recordHeadGraph);
        when(commitManager.getCommit(eq(commitID), any(RepositoryConnection.class))).thenReturn(Optional.of(commit));

        try(RepositoryConnection conn = repo.getConnection()) {
            service.validateAndUpdateTrigger(record, workflowId, commitID, conn);
        } finally {
            verify(workflowManager).validateWorkflow(any(Model.class));
            verify(commitManager).getCommit(eq(commitID), any(RepositoryConnection.class));
            verify(commit, times(1)).getBaseCommit_resource();
        }
    }

    @Test
    public void validateAndUpdateTriggerPresentTest() throws Exception {
        IRI workflowIri = vf.createIRI("http://example.com/workflows/A");
        when(compiledResourceManager.getCompiledResource(eq(commitID), any(RepositoryConnection.class))).thenReturn(recordHeadGraph);
        when(commitManager.getCommit(eq(commitID), any(RepositoryConnection.class))).thenReturn(Optional.of(commit));
        commit.setProperty(commitID, vf.createIRI("http://mobi.com/ontologies/catalog#baseCommit"));

        Workflow workflowMock = mock(Workflow.class);
        when(workflowManager.getWorkflow(eq(workflowIri))).thenReturn(Optional.of(workflowMock));
        try(RepositoryConnection conn = repo.getConnection()) {
            service.validateAndUpdateTrigger(record, workflowId, commitID, conn);
        } finally {
            verify(workflowManager).validateWorkflow(any(Model.class));
            verify(commitManager).getCommit(eq(commitID), any(RepositoryConnection.class));
            verify(commit, times(1)).getBaseCommit_resource();
            verify(workflowManager).getWorkflow(eq(workflowIri));
            verify(workflowManager).updateTriggerService(eq(record), eq(workflowMock), any(RepositoryConnection.class));
        }
    }

    @Test(expected=IllegalStateException.class)
    public void updateMasterRecordIRINotContainOntologyDefinitionTest() throws Exception {
        try(RepositoryConnection conn = repo.getConnection()) {
            conn.clear();
        }
        service.updateMasterRecordIRI(record.getResource(), commit, repo.getConnection());
    }

    @Test(expected=IllegalArgumentException.class)
    public void updateMasterRecordIRIOntologyIRISameTest() throws Exception {
        when(workflowManager.workflowRecordIriExists(any(Resource.class))).thenReturn(true);
        when(thingManager.getObject(eq(record.getResource()), eq(service.workflowRecordFactory), any(RepositoryConnection.class))).thenReturn(record);

        try(RepositoryConnection conn = repo.getConnection()) {
            record.setWorkflowIRI(getValueFactory().createIRI("http://new"));
            Mockito.reset(record);
            service.updateMasterRecordIRI(record.getResource(), commit, conn);
        } finally {
            verify(record, never()).setWorkflowIRI(eq(getValueFactory().createIRI("http://new")));
            verify(thingManager, never()).updateObject(any(WorkflowRecord.class), any(RepositoryConnection.class));
        }
    }

    @Test
    public void updateMasterRecordIRIOntologyIRITest() throws Exception {
        IRI newShapeIRI = getValueFactory().createIRI("http://mobi.solutions/ontologies/workflows/NewWorkflow");
        when(workflowManager.workflowRecordIriExists(any(Resource.class))).thenReturn(false);
        when(thingManager.getObject(eq(record.getResource()), eq(service.workflowRecordFactory), any(RepositoryConnection.class))).thenReturn(record);

        try(RepositoryConnection conn = repo.getConnection()) {
            record.setWorkflowIRI(getValueFactory().createIRI("http://new"));
            Mockito.reset(record);
            service.updateMasterRecordIRI(record.getResource(), commit, conn);
        } finally {
            verify(workflowManager).workflowRecordIriExists(eq(newShapeIRI));
            verify(record).setWorkflowIRI(eq(newShapeIRI));
            verify(thingManager).updateObject(any(WorkflowRecord.class), any(RepositoryConnection.class));
        }
    }

}
