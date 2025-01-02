package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static junit.framework.Assert.assertFalse;
import static junit.framework.Assert.assertTrue;
import static junit.framework.TestCase.assertEquals;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.impl.ManagerTestConstants;
import com.mobi.catalog.impl.SimpleBranchManager;
import com.mobi.catalog.impl.SimpleCommitManager;
import com.mobi.catalog.impl.SimpleRecordManager;
import com.mobi.catalog.impl.SimpleRevisionManager;
import com.mobi.catalog.impl.SimpleThingManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Agent;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;
import org.osgi.service.event.EventAdmin;

import java.lang.reflect.Field;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Set;
import java.util.UUID;

public class BaseVersioningServiceTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleVersioningService service;
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);
    private final OrmFactory<Agent> agentFactory = getRequiredOrmFactory(Agent.class);

    private User user;
    private VersionedRDFRecord record;
    private MasterBranch masterBranch;
    private Branch branch1;
    private Branch branch2;
    private IRI masterHeadGraph;
    private Commit commit;
    private Revision commitRevision;
    private IRI commitAddGraph;
    private IRI commitDelGraph;
    private InProgressCommit inProgressCommit;
    private Revision inProgressCommitRevision;
    private IRI inProgressCommitAddGraph;
    private IRI inProgressCommitDelGraph;
    private Statement initialStatement;
    private Statement statement1;
    private Statement statement2;
    private MemoryRepositoryWrapper repo;

    private SimpleThingManager thingManager;
    private SimpleBranchManager branchManager;
    private SimpleCommitManager commitManager;
    private SimpleRevisionManager revisionManager;

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

        OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);

        Catalog catalog = catalogFactory.createNew(ManagerTestConstants.CATALOG_IRI);
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));
        record = versionedRDFRecordFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#record"));
        masterHeadGraph = VALUE_FACTORY.createIRI(record.getResource().stringValue() + "/HEAD");
        masterBranch = masterBranchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#masterBranch"));
        masterBranch.setHeadGraph(masterHeadGraph);
        record.setMasterBranch(masterBranch);
        record.setCatalog(catalog);

        UUID commitRevisionUUID = UUID.randomUUID();
        commitAddGraph = VALUE_FACTORY.createIRI(Catalogs.DELTAS_NAMESPACE + commitRevisionUUID + "-A");
        commitDelGraph = VALUE_FACTORY.createIRI(Catalogs.DELTAS_NAMESPACE + commitRevisionUUID + "-B");
        commitRevision = revisionFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#revision-commit"));
        commitRevision.setDeletions(commitDelGraph);
        commitRevision.setAdditions(commitAddGraph);

        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#commit"));
        commit.setGenerated(Set.of(commitRevision));
        commit.getModel().addAll(commitRevision.getModel());
        commit.setWasAssociatedWith(Collections.singleton(agentFactory.createNew(user.getResource())));
        commit.setProperty(VALUE_FACTORY.createLiteral(OffsetDateTime.now().minus(Duration.ofDays(2))), PROV.AT_TIME);
        masterBranch.setHead(commit);

        branch1 = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#branch1"));
        branch1.setHead(commit);
        branch2 = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#branch2"));
        branch2.setHead(commit);

        UUID uuid = UUID.randomUUID();
        inProgressCommitAddGraph = VALUE_FACTORY.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-A");
        inProgressCommitDelGraph = VALUE_FACTORY.createIRI(Catalogs.DELTAS_NAMESPACE + uuid + "-B");
        inProgressCommitRevision = revisionFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#revision-ipc"));
        inProgressCommitRevision.setAdditions(inProgressCommitAddGraph);
        inProgressCommitRevision.setDeletions(inProgressCommitDelGraph);
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#in-progress-commit"));
        inProgressCommit.setWasAssociatedWith(Collections.singleton(agentFactory.createNew(user.getResource())));
        inProgressCommit.setOnVersionedRDFRecord(record);
        inProgressCommit.setGenerated(Set.of(inProgressCommitRevision));
        inProgressCommit.getModel().addAll(inProgressCommitRevision.getModel());

        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(catalog, conn);
            initialStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("urn:test"), RDF.TYPE, RDFS.CLASS);
            statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("urn:test"), RDF.TYPE, RDFS.DATATYPE);
            statement2 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("urn:test"), RDFS.COMMENT, VALUE_FACTORY.createLiteral("Comment"));
            conn.add(initialStatement, masterHeadGraph);
        }

        closeable = MockitoAnnotations.openMocks(this);

        when(context.getServiceReference(EventAdmin.class)).thenReturn(serviceReference);
        when(context.getService(serviceReference)).thenReturn(eventAdmin);

        branchManager = new SimpleBranchManager();
        commitManager = new SimpleCommitManager();
        thingManager = new SimpleThingManager();
        revisionManager = new SimpleRevisionManager();
        SimpleRecordManager recordManager = new SimpleRecordManager();
        injectOrmFactoryReferencesIntoService(branchManager);
        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(thingManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
        getField(SimpleBranchManager.class, "thingManager").set(branchManager, thingManager);
        getField(SimpleCommitManager.class, "thingManager").set(commitManager, thingManager);
        getField(SimpleCommitManager.class, "recordManager").set(commitManager, recordManager);
        getField(SimpleRevisionManager.class, "thingManager").set(revisionManager, thingManager);
        getField(SimpleCommitManager.class, "revisionManager").set(commitManager, revisionManager);
        getField(SimpleRecordManager.class, "thingManager").set(recordManager, thingManager);

        service = new SimpleVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.commitManager = commitManager;
        service.thingManager = thingManager;
        service.branchManager = branchManager;
        service.revisionManager = revisionManager;
        service.start(context);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(VersionedRDFRecord.TYPE, service.getTypeIRI());
    }

    @Test
    public void addMasterCommitInitialTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(inProgressCommit, conn);
            addThing(commit, conn);

            Resource resource = service.addMasterCommit(record, masterBranch, user, "Initial Commit.", conn);
            assertTrue(resource.stringValue().startsWith(Catalogs.COMMIT_NAMESPACE));
            assertTrue(ConnectionUtils.contains(conn, resource, RDF.TYPE, VALUE_FACTORY.createIRI(Commit.TYPE)));
            Set<Statement> revisionsOnCommit = QueryResults.asSet(conn.getStatements(resource, PROV.GENERATED, null));
            assertEquals(1, revisionsOnCommit.size());

            checkRevisionGraphsEmpty(revisionsOnCommit, conn);
            Model headGraphState = QueryResults.asModel(conn.getStatements(null, null, null, masterHeadGraph));
            assertEquals(1, headGraphState.size());
            assertTrue(ConnectionUtils.contains(conn, initialStatement.getSubject(), initialStatement.getPredicate(), initialStatement.getObject(), masterHeadGraph));
        }
    }

    @Test
    public void addMasterCommitSecondTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            populateInProgressCommit(conn);
            addThing(inProgressCommit, conn);

            Resource resource = service.addMasterCommit(record, masterBranch, user, "Second Commit.", conn);
            assertTrue(resource.stringValue().startsWith(Catalogs.COMMIT_NAMESPACE));
            assertTrue(ConnectionUtils.contains(conn, resource, RDF.TYPE, VALUE_FACTORY.createIRI(Commit.TYPE)));
            assertTrue(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.baseCommit_IRI), commit.getResource()));
            assertFalse(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.branchCommit_IRI), commit.getResource()));
            assertFalse(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.auxiliaryCommit_IRI), commit.getResource()));
            Set<Statement> revisionsOnCommit = QueryResults.asSet(conn.getStatements(resource, PROV.GENERATED, null));
            assertEquals(1, revisionsOnCommit.size());

            checkRevisionGraphsEmpty(revisionsOnCommit, conn);
            Model headGraphState = QueryResults.asModel(conn.getStatements(null, null, null, masterHeadGraph));
            assertEquals(2, headGraphState.size());
            assertFalse(ConnectionUtils.contains(conn, initialStatement.getSubject(), initialStatement.getPredicate(), initialStatement.getObject(), masterHeadGraph));
            assertTrue(ConnectionUtils.contains(conn, statement1.getSubject(), statement1.getPredicate(), statement1.getObject(), masterHeadGraph));
            assertTrue(ConnectionUtils.contains(conn, statement2.getSubject(), statement2.getPredicate(), statement2.getObject(), masterHeadGraph));

            // Check new commit Revision points to baseCommit Revision
            Resource revisionIRI = (Resource) revisionsOnCommit.stream().findFirst().get().getObject();
            assertTrue(ConnectionUtils.contains(conn, revisionIRI, PROV.HAD_PRIMARY_SOURCE, commitRevision.getResource()));

            // Check the revision delta graph on Master commit add
            assertTrue(ConnectionUtils.contains(conn, commitRevision.getResource(), VALUE_FACTORY.createIRI(Revision.additions_IRI), inProgressCommitDelGraph));
            assertTrue(ConnectionUtils.contains(conn, commitRevision.getResource(), VALUE_FACTORY.createIRI(Revision.deletions_IRI), inProgressCommitAddGraph));
        }
    }

    @Test
    public void addBranchCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            populateInProgressCommit(conn);
            addThing(inProgressCommit, conn);
            addThing(branch1, conn);

            Resource resource = service.addBranchCommit(record, branch1, user, "Branch Commit.", conn);
            assertTrue(resource.stringValue().startsWith(Catalogs.COMMIT_NAMESPACE));
            assertTrue(ConnectionUtils.contains(conn, resource, RDF.TYPE, VALUE_FACTORY.createIRI(Commit.TYPE)));
            assertFalse(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.baseCommit_IRI), commit.getResource()));
            assertTrue(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.branchCommit_IRI), commit.getResource()));
            assertFalse(ConnectionUtils.contains(conn, resource, VALUE_FACTORY.createIRI(Commit.auxiliaryCommit_IRI), commit.getResource()));
            Set<Statement> revisionsOnCommit = QueryResults.asSet(conn.getStatements(resource, PROV.GENERATED, null));
            assertEquals(1, revisionsOnCommit.size());

            checkBranchRevisionGraphsPopulated(revisionsOnCommit, conn);
            Model headGraphState = QueryResults.asModel(conn.getStatements(null, null, null, masterHeadGraph));
            assertEquals(1, headGraphState.size());
            assertTrue(ConnectionUtils.contains(conn, initialStatement.getSubject(), initialStatement.getPredicate(), initialStatement.getObject(), masterHeadGraph));
            assertFalse(ConnectionUtils.contains(conn, statement1.getSubject(), statement1.getPredicate(), statement1.getObject(), masterHeadGraph));
            assertFalse(ConnectionUtils.contains(conn, statement2.getSubject(), statement2.getPredicate(), statement2.getObject(), masterHeadGraph));

            // Check the revision delta graph on Master commit add
            assertTrue(ConnectionUtils.contains(conn, commitRevision.getResource(), VALUE_FACTORY.createIRI(Revision.additions_IRI), commitAddGraph));
            assertTrue(ConnectionUtils.contains(conn, commitRevision.getResource(), VALUE_FACTORY.createIRI(Revision.deletions_IRI), commitDelGraph));

            dumpRepoToTargetDir("output.trig", conn);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void addBranchCommitWithMasterBranchTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            addThing(inProgressCommit, conn);

            service.addBranchCommit(record, masterBranch, user, "Second Commit.", conn);
        }
    }

    @Test
    public void mergeIntoMasterOneCommitTest() throws Exception {
        /*  COMMITS
            (merge commit)
            |               \ aux
            |base            (commit on branch)
            |               /branch
            (initial commit)
         */

        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            populateInProgressCommit(conn);
            addThing(inProgressCommit, conn);
            addThing(branch1, conn);

            Resource commitOnBranch = service.addBranchCommit(record, branch1, user, "Branch Commit.", conn);
            Resource mergeCommit = service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>(), conn);
            assertTrue(mergeCommit.stringValue().startsWith(Catalogs.COMMIT_NAMESPACE));
            assertTrue(ConnectionUtils.contains(conn, mergeCommit, VALUE_FACTORY.createIRI(Commit.auxiliaryCommit_IRI), commitOnBranch));
            assertTrue(ConnectionUtils.contains(conn, mergeCommit, VALUE_FACTORY.createIRI(Commit.baseCommit_IRI), commit.getResource()));

            // Check revision pointers to other revisions
            Revision commitOnBranchRevision = revisionManager.getRevisionFromCommitId(commitOnBranch, conn);
            Revision initialCommitRevision = revisionManager.getRevisionFromCommitId(commit.getResource(), conn);
            Revision initialCommitBranchingRevision = revisionManager.getInfluencedRevisions(commit.getResource(), conn).get(0);
            Revision mergeCommitRevision = revisionManager.getRevisionFromCommitId(mergeCommit, conn);
            assertTrue(commitOnBranchRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).isPresent());
            assertEquals(initialCommitBranchingRevision.getResource(), commitOnBranchRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).get());
            assertTrue(mergeCommitRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).isPresent());
            assertEquals(initialCommitRevision.getResource(), mergeCommitRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).get());
            assertTrue(mergeCommitRevision.getProperty(PROV.WAS_DERIVED_FROM).isPresent());
            assertEquals(commitOnBranchRevision.getResource(), mergeCommitRevision.getProperty(PROV.WAS_DERIVED_FROM).get());

            // Verify head graph contents
            Model headGraph = QueryResults.asModel(conn.getStatements(null, null, null, masterHeadGraph));
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(statement1.getSubject(), statement1.getPredicate(), statement1.getObject(), masterHeadGraph);
            expected.add(statement2.getSubject(), statement2.getPredicate(), statement2.getObject(), masterHeadGraph);
            assertTrue(Models.isomorphic(expected, headGraph));

            dumpRepoToTargetDir("output.trig", conn);
        }
    }

    @Test
    public void mergeIntoMasterTwoCommitsTest() throws Exception {
        /*  COMMITS
            (merge commit)
            |               \ aux
            |base            (commit 2 on branch)
            |                |
            |                |branch
            |                |
            |                (commit 2 on branch)
            |               /branch
            (initial commit)
         */
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            populateInProgressCommit(conn);
            addThing(inProgressCommit, conn);
            addThing(branch1, conn);

            Resource commitOnBranch = service.addBranchCommit(record, branch1, user, "Branch Commit 1.", conn);
            InProgressCommit inProgressCommit2 = commitManager.createInProgressCommit(user);
            Model addModel = MODEL_FACTORY.createEmptyModel();
            addModel.add(VALUE_FACTORY.createIRI("urn:test"), RDF.TYPE, RDFS.MEMBER);
            Model delModel = MODEL_FACTORY.createEmptyModel();
            delModel.add(statement1);
            commitManager.updateInProgressCommit(ManagerTestConstants.CATALOG_IRI, record.getResource(), user, addModel, delModel, conn);
            thingManager.updateObject(inProgressCommit2, conn);
            Resource commitOnBranch2 = service.addBranchCommit(record, branch1, user, "Branch Commit 2.", conn);
            Resource mergeCommit = service.mergeIntoMaster(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>(), conn);

            assertTrue(mergeCommit.stringValue().startsWith(Catalogs.COMMIT_NAMESPACE));
            assertTrue(ConnectionUtils.contains(conn, mergeCommit, VALUE_FACTORY.createIRI(Commit.auxiliaryCommit_IRI), commitOnBranch2));
            assertTrue(ConnectionUtils.contains(conn, mergeCommit, VALUE_FACTORY.createIRI(Commit.baseCommit_IRI), commit.getResource()));

            // Check revision pointers to other revisions
            Revision commitOnBranchRevision = revisionManager.getRevisionFromCommitId(commitOnBranch, conn);
            Revision commitOnBranchRevision2 = revisionManager.getRevisionFromCommitId(commitOnBranch2, conn);
            Revision initialCommitRevision = revisionManager.getRevisionFromCommitId(commit.getResource(), conn);
            Revision initialCommitBranchingRevision = revisionManager.getInfluencedRevisions(commit.getResource(), conn).get(0);
            Revision mergeCommitRevision = revisionManager.getRevisionFromCommitId(mergeCommit, conn);
            assertTrue(commitOnBranchRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).isPresent());
            assertEquals(initialCommitBranchingRevision.getResource(), commitOnBranchRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).get());
            assertTrue(mergeCommitRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).isPresent());
            assertEquals(initialCommitRevision.getResource(), mergeCommitRevision.getProperty(PROV.HAD_PRIMARY_SOURCE).get());
            assertTrue(mergeCommitRevision.getProperty(PROV.WAS_DERIVED_FROM).isPresent());
            assertEquals(commitOnBranchRevision2.getResource(), mergeCommitRevision.getProperty(PROV.WAS_DERIVED_FROM).get());
            assertTrue(commitOnBranchRevision2.getProperty(PROV.HAD_PRIMARY_SOURCE).isPresent());
            assertEquals(commitOnBranchRevision.getResource(), commitOnBranchRevision2.getProperty(PROV.HAD_PRIMARY_SOURCE).get());

            // Verify head graph contents
            Model headGraph = QueryResults.asModel(conn.getStatements(null, null, null, masterHeadGraph));
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(VALUE_FACTORY.createIRI("urn:test"), RDF.TYPE, RDFS.MEMBER, masterHeadGraph);
            expected.add(statement2.getSubject(), statement2.getPredicate(), statement2.getObject(), masterHeadGraph);
            assertTrue(Models.isomorphic(expected, headGraph));
        }
    }

    @Test
    public void mergeIntoBranchOneCommitEach() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            populateInProgressCommit(conn);
            addThing(inProgressCommit, conn);
            addThing(branch1, conn);
            addThing(branch2, conn);

            Resource commitOnBranch1 = service.addBranchCommit(record, branch1, user, "Branch 1 Commit.", conn);
            InProgressCommit inProgressCommit2 = commitManager.createInProgressCommit(user);
            Model addModel = MODEL_FACTORY.createEmptyModel();
            addModel.add(VALUE_FACTORY.createIRI("urn:test"), RDF.TYPE, RDFS.MEMBER);
            Model delModel = MODEL_FACTORY.createEmptyModel();
            delModel.add(statement1);
            commitManager.updateInProgressCommit(ManagerTestConstants.CATALOG_IRI, record.getResource(), user, addModel, delModel, conn);
            thingManager.updateObject(inProgressCommit2, conn);
            Resource commitOnBranch2 = service.addBranchCommit(record, branch2, user, "Branch 2 Commit.", conn);
            Resource mergeCommit = service.mergeIntoBranch(record, branch2, branch1, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>() , conn);

            dumpRepoToTargetDir("output.trig", conn);
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void mergeIntoBranchWithMasterTarget() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            addThing(record, conn);
            addThing(masterBranch, conn);
            addThing(commit, conn);
            addThing(branch1, conn);

            service.mergeIntoBranch(record, branch1, masterBranch, user, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), new HashMap<>(), conn);
        }
    }

    private void populateInProgressCommit(RepositoryConnection conn) {
        conn.add(initialStatement, inProgressCommitDelGraph);
        conn.add(statement1, inProgressCommitAddGraph);
        conn.add(statement2, inProgressCommitAddGraph);
    }

    private void checkRevisionGraphsEmpty(Set<Statement> revisionsOnCommit, RepositoryConnection conn) {
        // Check revision graphs empty
        Resource revisionIRI = (Resource) revisionsOnCommit.stream().findFirst().get().getObject();
        RepositoryResult<Statement> addIRIResult = conn.getStatements(revisionIRI, VALUE_FACTORY.createIRI(Revision.additions_IRI), null);
        assertTrue(addIRIResult.hasNext());
        Resource addGraph = (Resource) addIRIResult.next().getObject();
        addIRIResult.close();
        assertTrue(QueryResults.asModel(conn.getStatements(null, null, null, addGraph)).isEmpty());

        RepositoryResult<Statement> delIRIResult = conn.getStatements(revisionIRI, VALUE_FACTORY.createIRI(Revision.deletions_IRI), null);
        assertTrue(delIRIResult.hasNext());
        Resource delGraph = (Resource) delIRIResult.next().getObject();
        delIRIResult.close();
        assertTrue(QueryResults.asModel(conn.getStatements(null, null, null, delGraph)).isEmpty());
    }

    private void checkBranchRevisionGraphsPopulated(Set<Statement> revisionsOnCommit, RepositoryConnection conn) {
        // Check revision graphs empty
        Resource revisionIRI = (Resource) revisionsOnCommit.stream().findFirst().get().getObject();
        RepositoryResult<Statement> addIRIResult = conn.getStatements(revisionIRI, VALUE_FACTORY.createIRI(Revision.additions_IRI), null);
        assertTrue(addIRIResult.hasNext());
        Resource addGraph = (Resource) addIRIResult.next().getObject();
        addIRIResult.close();
        assertFalse(QueryResults.asModel(conn.getStatements(null, null, null, addGraph)).isEmpty());

        RepositoryResult<Statement> delIRIResult = conn.getStatements(revisionIRI, VALUE_FACTORY.createIRI(Revision.deletions_IRI), null);
        assertTrue(delIRIResult.hasNext());
        Resource delGraph = (Resource) delIRIResult.next().getObject();
        delIRIResult.close();
        assertFalse(QueryResults.asModel(conn.getStatements(null, null, null, delGraph)).isEmpty());
    }

    private static Field getField(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f;
    }

    private void addThing(Thing thing, RepositoryConnection conn) {
        conn.add(thing.getModel(), thing.getResource());
    }
}
