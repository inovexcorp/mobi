package com.mobi.shapes.impl.versioning;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.OWL;
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
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.io.InputStream;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ShapesGraphRecordVersioningServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private ShapesGraphRecordVersioningService service;
    private final OrmFactory<ShapesGraphRecord> shapesGraphRecordOrmFactory = getRequiredOrmFactory(ShapesGraphRecord.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);

    private final IRI originalIRI = VALUE_FACTORY.createIRI("http://test.com/ontology");
    private final IRI newIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/new");
    private final IRI usedIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/used");
    private final IRI typeIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI ontologyIRI = VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue());

    private User user;
    private ShapesGraphRecord record;
    private Branch branch;
    private Commit commit;
    private Revision revision;
    private InProgressCommit inProgressCommit;
    private Stream<Statement> additions;
    private Stream<Statement> additionsUsed;
    private Stream<Statement> additionsNoIRI;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private ShapesGraphManager shapesGraphManager;

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
    private EventAdmin eventAdmin;

    @Mock
    private BundleContext context;

    @Mock
    private ServiceReference<EventAdmin> serviceReference;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/users#user"));
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit"));
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit"));
        revision = revisionFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/revisions#revision"));
        commit.setGenerated(Collections.singleton(revision));
        commit.setWasAssociatedWith(Collections.singleton(user));

        branch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch"));
        branch.setHead(commit);
        record = shapesGraphRecordOrmFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#shapes-record"));
        record.setMasterBranch(branch);
        record.setShapesGraphIRI(originalIRI);
        additions = Stream.of(VALUE_FACTORY.createStatement(newIRI, typeIRI, ontologyIRI));
        additionsUsed = Stream.of(VALUE_FACTORY.createStatement(usedIRI, typeIRI, ontologyIRI));
        additionsNoIRI = Stream.of(VALUE_FACTORY.createStatement(originalIRI, VALUE_FACTORY.createIRI(_Thing.title_IRI), VALUE_FACTORY.createLiteral("Title")));

        closeable = MockitoAnnotations.openMocks(this);

        when(branchManager.getBranch(any(ShapesGraphRecord.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(commitManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(thingManager.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(thingManager.getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(differenceManager.applyDifference(any(), any())).thenAnswer(i -> i.getArgument(1, Difference.class).getAdditions());
        when(compiledResourceManager.getCompiledResource(anyList(), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createEmptyModel());

        when(shapesGraphManager.shapesGraphIriExists(usedIRI)).thenReturn(true);

        when(commitManager.createCommit(any(InProgressCommit.class), anyString(), any(), any())).thenReturn(commit);
        when(commitManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        when(context.getServiceReference(EventAdmin.class)).thenReturn(serviceReference);
        when(context.getService(serviceReference)).thenReturn(eventAdmin);

        service = new ShapesGraphRecordVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.commitManager = commitManager;
        service.branchManager = branchManager;
        service.compiledResourceManager = compiledResourceManager;
        service.differenceManager = differenceManager;
        service.thingManager = thingManager;
        service.shapesGraphManager = shapesGraphManager;
        service.start(context);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(ShapesGraphRecord.TYPE, service.getTypeIRI());
    }

    /* addCommit(Branch, Commit, RepositoryConnection) */

    @Test
    public void addCommitToOtherBranchWithCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch newBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#new"));

            service.addCommit(record, newBranch, commit, conn);
            verify(commitManager).addCommit(newBranch, commit, conn);
            verify(thingManager, times(0)).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(thingManager, times(0)).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(newIRI);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithNoBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(record, branch, commit, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            verify(thingManager, times(0)).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(newIRI);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndNewOntologyIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));

            service.addCommit(record, branch, commit, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            verify(thingManager).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager).shapesGraphIriExists(newIRI);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(newIRI, record.getShapesGraphIRI().get());
            verify(thingManager).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterOfRecordWithoutIRIWithCommitWithBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
            ShapesGraphRecord newRecord = shapesGraphRecordOrmFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#new"));
            when(thingManager.getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), eq(conn))).thenReturn(newRecord);

            service.addCommit(record, branch, commit, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            verify(thingManager).getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), eq(conn));
            verify(shapesGraphManager).shapesGraphIriExists(newIRI);
            assertTrue(newRecord.getShapesGraphIRI().isPresent());
            assertEquals(newIRI, newRecord.getShapesGraphIRI().get());
            verify(thingManager).updateObject(newRecord, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndUsedOntologyIRITest() throws Exception {
        // Setup:
        commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
        Revision revisionUsed = revisionFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/revisions#revisionUsed"));
        commit.setGenerated(Collections.singleton(revisionUsed));
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Shapes Graph already exists with IRI " + usedIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(record, branch, commit, conn);
        } finally {
            verify(thingManager).getObject(eq(record.getResource()), eq(shapesGraphRecordOrmFactory), any(RepositoryConnection.class));
            verify(commitManager, times(0)).addCommit(eq(branch), eq(commit), any(RepositoryConnection.class));
            verify(shapesGraphManager).shapesGraphIriExists(usedIRI);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(eq(record), any(RepositoryConnection.class));
            verify(eventAdmin, times(0)).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndNoIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
            Revision revisionNoChange = revisionFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/revisions#revision2"));
            commit.setGenerated(Collections.singleton(revisionNoChange));

            service.addCommit(record, branch, commit, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            verify(thingManager).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(any(IRI.class));
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    /* addCommit(Branch, User, String, Model, Model, Commit, Commit, RepositoryConnection)*/

    @Test
    public void addCommitToOtherBranchWithChangesTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch newBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#new"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, newBranch, user, "Message", additions, deletions, commit, null, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager, times(0)).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additions, deletions, conn);
            verify(commitManager).addCommit(newBranch, commit, conn);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndNoBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additions = MODEL_FACTORY.createEmptyModel();
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, branch, user, "Message", additions, deletions, null, null, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", null, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager, times(0)).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additions, deletions, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndBaseAndNoAuxTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createEmptyModel();
            additionsModel.addAll(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additionsModel, deletions, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(newIRI, record.getShapesGraphIRI().get());
            verify(thingManager).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndBaseAndAuxTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createEmptyModel();
            additionsModel.addAll(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, branch, user, "Message", additionsModel, deletions, commit, commit, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, commit);
            verify(commitManager, times(2)).getCommitChain(commit.getResource(), false, conn);
            verify(compiledResourceManager).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additionsModel, deletions, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(newIRI, record.getShapesGraphIRI().get());
            verify(thingManager).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterOfRecordWithoutIRIWithChangesAndBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            ShapesGraphRecord newRecord = shapesGraphRecordOrmFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#new"));
            when(thingManager.getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), eq(conn))).thenReturn(newRecord);
            Model additionsModel = MODEL_FACTORY.createEmptyModel();
            additionsModel.addAll(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager).getObject(any(Resource.class), eq(shapesGraphRecordOrmFactory), eq(conn));
            verify(shapesGraphManager).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additionsModel, deletions, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            assertTrue(newRecord.getShapesGraphIRI().isPresent());
            assertEquals(newIRI, newRecord.getShapesGraphIRI().get());
            verify(thingManager).updateObject(newRecord, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesWithBaseAndUsedOntologyIRITest() throws Exception {
        // Setup:
        Model additionsModel = MODEL_FACTORY.createEmptyModel();
        additionsModel.addAll(additionsUsed.collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createEmptyModel();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Shapes Graph already exists with IRI " + usedIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(record, branch, user, "Message", additionsModel, deletions, commit, null, conn);
        } finally {
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), any(RepositoryConnection.class));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), any(RepositoryConnection.class));
            verify(differenceManager).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager).getObject(eq(record.getResource()), eq(shapesGraphRecordOrmFactory), any(RepositoryConnection.class));
            verify(shapesGraphManager).shapesGraphIriExists(usedIRI);
            verify(commitManager, times(0)).updateCommit(eq(commit), eq(additionsModel), eq(deletions), any(RepositoryConnection.class));
            verify(commitManager, times(0)).addCommit(eq(branch), eq(commit), any(RepositoryConnection.class));
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(eq(record), any(RepositoryConnection.class));
            verify(eventAdmin, times(0)).postEvent(any(Event.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesWithBaseAndNoIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createEmptyModel();
            additionsModel.addAll(additionsNoIRI.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();

            service.addCommit(record, branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(commitManager).createInProgressCommit(user);
            verify(commitManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(commitManager, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(compiledResourceManager, times(0)).getCompiledResource(anyList(), eq(conn));
            verify(differenceManager).applyDifference(any(Model.class), any(Difference.class));
            verify(thingManager).getObject(record.getResource(), shapesGraphRecordOrmFactory, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(newIRI);
            verify(commitManager).updateCommit(commit, additionsModel, deletions, conn);
            verify(commitManager).addCommit(branch, commit, conn);
            verify(shapesGraphManager, times(0)).shapesGraphIriExists(any(IRI.class));
            assertTrue(record.getShapesGraphIRI().isPresent());
            assertEquals(originalIRI, record.getShapesGraphIRI().get());
            verify(thingManager, times(0)).updateObject(record, conn);
            verify(eventAdmin).postEvent(any(Event.class));
        }
    }
}
