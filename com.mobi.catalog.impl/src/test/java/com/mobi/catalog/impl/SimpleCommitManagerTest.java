package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertNotSame;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontologies.provo.Activity;
import com.mobi.ontologies.provo.Entity;
import com.mobi.ontologies.provo.InstantaneousEvent;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCommitManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleCommitManager manager;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private final OrmFactory<Tag> tagFactory = getRequiredOrmFactory(Tag.class);
    private final OrmFactory<Record> recordFactory = getRequiredOrmFactory(Record.class);
    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private final SimpleVersionManager versionManager = spy(new SimpleVersionManager());
    private final SimpleBranchManager branchManager = spy(new SimpleBranchManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_IRI);
        when(configProvider.getDistributedCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_DISTRIBUTED_IRI);

        branchManager.recordManager = recordManager;
        branchManager.versionedRDFRecordFactory = (VersionedRDFRecordFactory) versionedRDFRecordFactory;
        branchManager.thingManager = thingManager;
        recordManager.thingManager = thingManager;
        revisionManager.thingManager = thingManager;
        versionManager.recordManager = recordManager;
        manager = spy(new SimpleCommitManager());
        manager.thingManager = thingManager;
        manager.branchManager = branchManager;
        manager.versionManager = versionManager;
        manager.revisionManager = revisionManager;
        manager.recordManager = recordManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(versionManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    /* createCommit */

    @Test
    public void testCreateCommit() throws Exception {
        // Setup:
        IRI provGenerated = VALUE_FACTORY.createIRI(Activity.generated_IRI);
        IRI provAtTime = VALUE_FACTORY.createIRI(InstantaneousEvent.atTime_IRI);
        IRI provWasAssociatedWith = VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI);
        IRI revisionId = VALUE_FACTORY.createIRI("http://mobi.com/revisions#test");
        Resource generation = VALUE_FACTORY.createIRI("http://mobi.com/test");
        Resource generation2 = VALUE_FACTORY.createIRI("http://mobi.com/test2");
        Commit base = commitFactory.createNew(ManagerTestConstants.COMMIT_IRI);
        base.setProperty(generation, provGenerated);
        Commit auxiliary = commitFactory.createNew(ManagerTestConstants.COMMIT_IRI);
        auxiliary.setProperty(generation2, provGenerated);
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        inProgressCommit.setProperty(VALUE_FACTORY.createIRI("http://mobi.com/user"), provWasAssociatedWith);
        inProgressCommit.setProperty(revisionId, provGenerated);
        Revision revision = revisionFactory.createNew(revisionId);
        inProgressCommit.getModel().addAll(revision.getModel());

        Commit result = manager.createCommit(inProgressCommit, "message", null, null);
        assertTrue(result.getProperty(provAtTime).isPresent());
        assertEquals("message", result.getProperty(DCTERMS.TITLE).get().stringValue());
        assertFalse(result.getBaseCommit().isPresent());
        assertFalse(result.getAuxiliaryCommit().isPresent());
        assertFalse(result.getModel().contains(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));

        result = manager.createCommit(inProgressCommit, "message", base, auxiliary);
        assertTrue(result.getProperty(provAtTime).isPresent());
        assertEquals("message", result.getProperty(DCTERMS.TITLE).get().stringValue());
        assertTrue(result.getBaseCommit_resource().isPresent() && result.getBaseCommit_resource().get().equals(ManagerTestConstants.COMMIT_IRI));
        assertTrue(result.getAuxiliaryCommit_resource().isPresent() && result.getAuxiliaryCommit_resource().get().equals(ManagerTestConstants.COMMIT_IRI));
        assertFalse(result.getModel().contains(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, null, null));
        assertTrue(result.getModel().contains(revisionId, null, null));
    }

    @Test
    public void testCreateCommitWithOnlyAuxiliary() {
        //Setup:
        InProgressCommit inProgressCommit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        Commit auxiliary = commitFactory.createNew(ManagerTestConstants.COMMIT_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Commit must have a base commit in order to have an auxiliary commit");

        manager.createCommit(inProgressCommit, "message", null, auxiliary);
    }

    /* createInProgressCommit */

    @Test
    public void testCreateInProgressCommit() throws Exception {
        // Setup:
        IRI provWasDerivedFrom = VALUE_FACTORY.createIRI(Entity.wasDerivedFrom_IRI);
        IRI provGenerated = VALUE_FACTORY.createIRI(Activity.generated_IRI);
        IRI provWasAssociatedWith = VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI);
        IRI provWasInformedBy = VALUE_FACTORY.createIRI(Activity.wasInformedBy_IRI);
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);

        InProgressCommit result = manager.createInProgressCommit(user);
        assertTrue(result.getProperty(provWasAssociatedWith).isPresent());
        assertEquals(ManagerTestConstants.USER_IRI.stringValue(), result.getProperty(provWasAssociatedWith).get().stringValue());
        assertTrue(result.getProperty(provGenerated).isPresent());
        Revision revision = revisionFactory.createNew((Resource) result.getProperty(provGenerated).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        result = manager.createInProgressCommit(user);
        assertEquals(ManagerTestConstants.USER_IRI.stringValue(), result.getProperty(provWasAssociatedWith).get().stringValue());
        assertTrue(result.getProperty(provGenerated).isPresent());
        assertFalse(result.getProperty(provWasInformedBy).isPresent());
        revision = revisionFactory.createNew((Resource) result.getProperty(provGenerated).get(),
                result.getModel());
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());
        assertFalse(revision.getProperty(provWasDerivedFrom).isPresent());
    }

    /* createInProgressCommit(Resource catalogId, Resource versionedRDFRecordId, User user,
                                                   @Nullable File additionsFile, @Nullable File deletionsFile,
                                                   RepositoryConnection conn)
    */
    @Test
    public void testCreateInProgressCommitWithFiles() throws Exception {
        // Setup:
        IRI provWasDerivedFrom = VALUE_FACTORY.createIRI(Entity.wasDerivedFrom_IRI);
        IRI provGenerated = VALUE_FACTORY.createIRI(Activity.generated_IRI);
        IRI provWasAssociatedWith = VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI);
        IRI provWasInformedBy = VALUE_FACTORY.createIRI(Activity.wasInformedBy_IRI);
        User user = userFactory.createNew(ManagerTestConstants.USER3_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit result = manager.createInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, null, null, conn);
            assertTrue(result.getProperty(provWasAssociatedWith).isPresent());
            assertEquals(ManagerTestConstants.USER3_IRI.stringValue(), result.getProperty(provWasAssociatedWith).get().stringValue());
            assertTrue(result.getProperty(provGenerated).isPresent());
            assertTrue(result.getProperty(provGenerated).isPresent());
            assertFalse(result.getProperty(provWasInformedBy).isPresent());
            Revision revision = revisionFactory.createNew((Resource) result.getProperty(provGenerated).get(),
                    result.getModel());
            assertTrue(revision.getAdditions().isPresent());
            assertTrue(revision.getDeletions().isPresent());
            assertFalse(revision.getProperty(provWasDerivedFrom).isPresent());
        }
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommit() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        try (RepositoryConnection conn  = repo.getConnection()) {
            manager.updateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, additions, deletions, conn);
            verify(manager).validateInProgressCommit(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
            verify(manager).updateCommit(any(Resource.class), any(Revision.class), eq(additions), eq(deletions), any(RepositoryConnection.class));
        }
    }

    /* updateInProgressCommit(Resource, Resource, Resource, Model, Model) */

    @Test
    public void testUpdateInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        try (RepositoryConnection conn  = repo.getConnection()) {
            manager.updateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, additions, deletions, conn);
            verify(recordManager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
            verify(manager).updateCommit(any(Commit.class), eq(additions), eq(deletions), any(RepositoryConnection.class));
        }
    }

    /* addInProgressCommit */

    @Test
    public void testAddInProgressCommit() throws Exception {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.NEW_IRI);
        commit.setProperty(user.getResource(), VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.empty()).when(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, commit, conn);
            verify(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
            verify(recordManager).getRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
            verify(thingManager).addObject(eq(commit), any(RepositoryConnection.class));
            assertTrue(commit.getOnVersionedRDFRecord_resource().isPresent());
            assertEquals(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, commit.getOnVersionedRDFRecord_resource().get());
        }
    }

    @Test
    public void testAddInProgressCommitWithNoUser() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.NEW_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("User not set on InProgressCommit " + commit.getResource());

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, commit, conn);
            verify(thingManager, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
        }
    }

    @Test
    public void testAddInProgressCommitWhenYouAlreadyHaveOne() {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.NEW_IRI);
        commit.setProperty(ManagerTestConstants.USER_IRI, VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.of(ManagerTestConstants.NEW_IRI)).when(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("User " + ManagerTestConstants.USER_IRI + " already has an InProgressCommit for Record " + ManagerTestConstants.VERSIONED_RDF_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, commit, conn);
            verify(thingManager, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testAddInProgressCommitWithTakenResource() {
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        commit.setProperty(ManagerTestConstants.USER_IRI, VALUE_FACTORY.createIRI(Activity.wasAssociatedWith_IRI));
        doReturn(Optional.empty()).when(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, commit, conn);
            verify(thingManager, times(0)).addObject(eq(commit), any(RepositoryConnection.class));
            verify(thingManager).throwAlreadyExists(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, inProgressCommitFactory);
        }
    }

    /* getCommit */

    @Test
    public void testGetCommitThatIsNotTheHead() throws Exception {
        // Setup:
        Resource headId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test4a");
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test0");
        Branch branch = branchFactory.createNew(ManagerTestConstants.MASTER_BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(headId).when(manager).getHeadCommitIRI(branch);
        doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        doReturn(true).when(manager).commitInBranch(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
        doReturn(Stream.of(headId, commitId).collect(Collectors.toList())).when(manager).getCommitChain(eq(headId), eq(false), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MASTER_BRANCH_IRI, commitId, conn);
            verify(branchManager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.MASTER_BRANCH_IRI), any(RepositoryConnection.class));
            verify(manager).commitInBranch(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(commit, result.get());
        }
    }

    @Test
    public void testGetCommit() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test0");
        Commit commit = commitFactory.createNew(commitId);
        doReturn(Optional.of(commit)).when(thingManager).optObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Commit> result = manager.getCommit(commitId, conn);
            verify(thingManager).optObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(commit, result.get());
        }
    }

    @Test
    public void testGetCommitThatIsTheHead() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test4a");
        Branch branch = branchFactory.createNew(ManagerTestConstants.MASTER_BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(commitId).when(manager).getHeadCommitIRI(branch);
        doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
        doReturn(true).when(manager).commitInBranch(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MASTER_BRANCH_IRI, commitId, conn);
            verify(branchManager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.MASTER_BRANCH_IRI), any(RepositoryConnection.class));
            verify(manager).commitInBranch(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
            verify(manager, times(0)).getCommitChain(eq(commitId), eq(false), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(commit, result.get());
        }
    }

    @Test
    public void testGetCommitThatDoesNotBelongToBranch() {
        // Setup:
        Resource headId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test4a");
        Branch branch = branchFactory.createNew(ManagerTestConstants.MASTER_BRANCH_IRI);
        doReturn(headId).when(manager).getHeadCommitIRI(branch);
        doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(false).when(manager).commitInBranch(eq(ManagerTestConstants.MASTER_BRANCH_IRI), eq(ManagerTestConstants.COMMIT_IRI), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MASTER_BRANCH_IRI, ManagerTestConstants.COMMIT_IRI, conn);
            verify(branchManager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.MASTER_BRANCH_IRI), any(RepositoryConnection.class));
            verify(thingManager, times(0)).getExpectedObject(eq(ManagerTestConstants.COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));
            assertFalse(result.isPresent());
        }
    }

    /* getHeadCommit */

    @Test
    public void getHeadCommit() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test4a");
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        Commit commit = commitFactory.createNew(commitId);
        doReturn(commitId).when(manager).getHeadCommitIRI(branch);
        doReturn(branch).when(thingManager).getExpectedObject(eq(ManagerTestConstants.BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
        doReturn(commit).when(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            Commit result = manager.getHeadCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, conn);
            verify(branchManager).validateBranch(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.BRANCH_IRI), eq(branchFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(commitId), eq(commitFactory), any(RepositoryConnection.class));
            assertEquals(commit, result);
        }
    }

    /* getHeadCommitFromBranch */

    @Test
    public void getHeadCommitFromBranchTest() throws Exception {
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        branch.setHead(commitFactory.createNew(ManagerTestConstants.COMMIT_IRI));
        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getHeadCommitFromBranch(branch, conn);
            assertTrue(result.isPresent());
            assertEquals(ManagerTestConstants.COMMIT_IRI, result.get().getResource());
            verify(thingManager).optObject(eq(ManagerTestConstants.COMMIT_IRI), any(CommitFactory.class), eq(conn));
        }
    }

    @Test
    public void getHeadCommitFromBranchNoCommitTest() throws Exception {
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        branch.setHead(commitFactory.createNew(ManagerTestConstants.COMMIT_IRI));
        doReturn(Optional.empty()).when(thingManager).optObject(eq(ManagerTestConstants.COMMIT_IRI), any(CommitFactory.class), any(RepositoryConnection.class));
        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getHeadCommitFromBranch(branch, conn);
            assertFalse(result.isPresent());
            verify(thingManager).optObject(eq(ManagerTestConstants.COMMIT_IRI), any(CommitFactory.class), eq(conn));
        }
    }

    @Test
    public void getHeadCommitFromBranchNoHeadTest() throws Exception {
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        try (RepositoryConnection conn  = repo.getConnection()) {
            Optional<Commit> result = manager.getHeadCommitFromBranch(branch, conn);
            assertFalse(result.isPresent());
            verify(thingManager, never()).optObject(eq(ManagerTestConstants.COMMIT_IRI), any(CommitFactory.class), eq(conn));
        }
    }

    /* getInProgressCommit(Resource, Resource, User) */

    @Test
    public void testGetInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        doReturn(Optional.of(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI)).when(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
        doReturn(commit).when(thingManager).getExpectedObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<InProgressCommit> result = manager.getInProgressCommitOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, conn);
            verify(recordManager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
            verify(thingManager).optObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
            assertTrue(result.isPresent());
            assertEquals(commit.getResource(), result.get().getResource());
        }
    }

    @Test
    public void testGetInProgressCommitForUserWithoutOne() {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        doReturn(Optional.empty()).when(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(user.getResource()), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<InProgressCommit> result = manager.getInProgressCommitOpt(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, conn);
            verify(recordManager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(manager).getInProgressCommitIRI(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(user.getResource()), any(RepositoryConnection.class));
            verify(thingManager, times(0)).getExpectedObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
            assertFalse(result.isPresent());
        }
    }

    /* getInProgressCommits(User) */

    @Test
    public void testGetInProgressCommitByUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);

        try (RepositoryConnection conn  = repo.getConnection()) {
            List<InProgressCommit> result = manager.getInProgressCommits(user, conn);
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_NO_RECORD_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
            assertEquals(3, result.size());
        }
    }

    @Test
    public void testGetInProgressCommitByUserNoResults() throws Exception {
        // Setup:
        User user = userFactory.createNew(VALUE_FACTORY.createIRI("urn:user"));

        try (RepositoryConnection conn  = repo.getConnection()) {
            List<InProgressCommit> result = manager.getInProgressCommits(user, conn);
            verify(thingManager, never()).getExpectedObject(any(), any(), any());
            assertEquals(0, result.size());
        }
    }

    /* removeInProgressCommit(Resource, Resource, User) */

    @Test
    public void testRemoveInProgressCommitWithUser() throws Exception {
        // Setup:
        User user = userFactory.createNew(ManagerTestConstants.USER_IRI);
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        doReturn(commit).when(manager).getInProgressCommit(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            manager.removeInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, user, conn);
            verify(recordManager).validateRecord(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(versionedRDFRecordFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(manager).getInProgressCommit(eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.USER_IRI), any(RepositoryConnection.class));
            verify(manager).removeInProgressCommit(eq(commit), any(RepositoryConnection.class));
        }
    }

    /* removeInProgressCommit(Resource) */

    @Test
    public void testRemoveInProgressCommitByResource() throws Exception {
        // Setup:
        InProgressCommit commit = inProgressCommitFactory.createNew(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
        doReturn(commit).when(thingManager).getObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            manager.removeInProgressCommit(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
            verify(thingManager).getObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));
            verify(manager).removeInProgressCommit(eq(commit), any(RepositoryConnection.class));
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRemoveInProgressCommitByResourceException() throws Exception {
        // Setup:
        doThrow(IllegalArgumentException.class).when(thingManager).getObject(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            manager.removeInProgressCommit(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getTaggedCommit */

    @Test
    public void testGetTaggedCommit() throws Exception {
        // Setup:
        Tag tag = tagFactory.createNew(ManagerTestConstants.TAG_IRI);
        Commit commit = commitFactory.createNew(ManagerTestConstants.COMMIT_IRI);
        tag.setCommit(commit);
        doReturn(tag).when(thingManager).getExpectedObject(eq(ManagerTestConstants.TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
        doReturn(commit).when(thingManager).getExpectedObject(eq(ManagerTestConstants.COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));

        try (RepositoryConnection conn  = repo.getConnection()) {
            Commit result = manager.getTaggedCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.TAG_IRI, conn);
            verify(versionManager).validateVersion(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.TAG_IRI), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.TAG_IRI), eq(tagFactory), any(RepositoryConnection.class));
            verify(thingManager).getExpectedObject(eq(ManagerTestConstants.COMMIT_IRI), eq(commitFactory), any(RepositoryConnection.class));
            assertEquals(commit, result);
        }
    }

    @Test
    public void isCommitBranchHeadTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA1");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(manager.commitInBranch(ManagerTestConstants.BRANCH_IRI, commitId, conn));
        }
    }

    @Test
    public void isCommitBranchNotHeadTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA0");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(manager.commitInBranch(ManagerTestConstants.BRANCH_IRI, commitId, conn));
        }
    }

    @Test
    public void isCommitBranchNotTest() {
        Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a");
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(manager.commitInBranch(ManagerTestConstants.BRANCH_IRI, commitId, conn));
        }
    }

    /* validateInProgressCommit */

    @Test
    public void testInProgressCommitPathWithMissingCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithMissingRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongCatalog() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void testMissingInProgressCommitPath() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MISSING_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithoutRecordSet() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + ManagerTestConstants.IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void testInProgressCommitPathWithWrongRecord() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("InProgressCommit %s does not belong to VersionedRDFRecord %s", ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.validateInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithUserTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = manager.getInProgressCommit(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.USER2_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getMissingInProgressCommitTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit not found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.USER_IRI, conn);
        }
    }

    /* getInProgressCommit(Resource, Resource, Resource, RepositoryConnection) */

    @Test
    public void getInProgressCommitWithPathTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            InProgressCommit commit = manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
            assertFalse(commit.getModel().isEmpty());
            assertEquals(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, commit.getResource());
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Catalog " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.MISSING_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndMissingRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("VersionedRDFRecord " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.MISSING_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongCatalogTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Record %s does not belong to Catalog %s", ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.CATALOG_IRI));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_NO_CATALOG_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    @Test
    public void getMissingInProgressCommitWithPathTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + ManagerTestConstants.MISSING_IRI + " could not be found");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.MISSING_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathWithoutRecordSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Record was not set on InProgressCommit " + ManagerTestConstants.IN_PROGRESS_COMMIT_NO_RECORD_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_NO_RECORD_IRI, conn);
        }
    }

    @Test
    public void getInProgressCommitWithPathAndWrongRecordTest() {
        // Setup:
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("InProgressCommit " + ManagerTestConstants.IN_PROGRESS_COMMIT_IRI + " does not belong to VersionedRDFRecord " + ManagerTestConstants.VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getInProgressCommit(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.VERSIONED_RDF_RECORD_MISSING_BRANCH_IRI, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, conn);
        }
    }

    /* getInProgressCommitIRI */

    @Test
    public void getInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = manager.getInProgressCommitIRI(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.USER2_IRI, conn);
            assertTrue(iri.isPresent());
            assertEquals(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, iri.get());
        }
    }

    @Test
    public void getMissingInProgressCommitIRITest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            Optional<Resource> iri = manager.getInProgressCommitIRI(ManagerTestConstants.VERSIONED_RECORD_MISSING_VERSION_IRI, ManagerTestConstants.USER_IRI, conn);
            assertFalse(iri.isPresent());
        }
    }

    /* removeInProgressCommit */

    @Test
    public void removeInProgressCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = getThing(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, inProgressCommitFactory, conn);
            Resource additionsResource = getAdditionsResource(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI);
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(commit, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, ManagerTestConstants.IN_PROGRESS_COMMIT_IRI));
            assertEquals(0, conn.size(additionsResource));
            assertEquals(0, conn.size(deletionsResource));
        }
    }

    @Test
    public void removeInProgressCommitWithQuadsTest() throws Exception {
        IRI quadInProgressCommit = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "quad-in-progress-commit");
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = getThing(quadInProgressCommit, inProgressCommitFactory, conn);

            Resource additionsResource = getAdditionsResource(quadInProgressCommit);
            Resource deletionsResource = getDeletionsResource(quadInProgressCommit);
            assertTrue(ConnectionUtils.containsContext(conn, additionsResource));
            assertTrue(ConnectionUtils.containsContext(conn, deletionsResource));

            IRI graph1AdditionsResource = getQuadAdditionsResource(quadInProgressCommit, ManagerTestConstants.GRAPHS + "quad-graph1");
            IRI graph1DeletionsResource = getQuadDeletionsResource(quadInProgressCommit, ManagerTestConstants.GRAPHS + "quad-graph1");
            assertTrue(ConnectionUtils.containsContext(conn, graph1AdditionsResource));
            assertTrue(ConnectionUtils.containsContext(conn, graph1DeletionsResource));

            manager.removeInProgressCommit(commit, conn);
            assertFalse(ConnectionUtils.containsContext(conn, quadInProgressCommit));
            assertFalse(ConnectionUtils.containsContext(conn, additionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, deletionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, graph1AdditionsResource));
            assertFalse(ConnectionUtils.containsContext(conn, graph1DeletionsResource));
        }
    }

    @Test
    public void removeInProgressCommitWithReferencedChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            InProgressCommit commit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit-referenced"));
            Resource additionsResource = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionsResource = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            commit.getModel().add(commit.getResource(), VALUE_FACTORY.createIRI(Revision.additions_IRI), additionsResource, commit.getResource());
            commit.getModel().add(commit.getResource(), VALUE_FACTORY.createIRI(Revision.deletions_IRI), deletionsResource, commit.getResource());
            assertTrue(ConnectionUtils.contains(conn, null, null, null, commit.getResource()));
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);

            manager.removeInProgressCommit(commit, conn);
            assertFalse(ConnectionUtils.contains(conn, null, null, null, commit.getResource()));
            assertTrue(conn.size(additionsResource) > 0);
            assertTrue(conn.size(deletionsResource) > 0);
        }
    }

    /* updateCommit(Commit, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"));
            Statement statement2 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("Description"));
            Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(statement1).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(statement3).collect(Collectors.toSet()));

            manager.updateCommit(commit, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitAndDuplicatesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            Statement triple = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(triple).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(triple).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

            manager.updateCommit(commit, additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitNullAdditionsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(statement3, existingAddStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
            expectedDeletions.addAll(Stream.of(statement3, existingDelStatement).collect(Collectors.toSet()));

            manager.updateCommit(commit, null, deletions, conn);

            List<Statement> actualAdds = QueryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = QueryResults.asList(conn.getStatements(null, null, null, deletionId));
            assertEquals(expectedDeletions.size(), actualDels.size());
            actualDels.forEach(statement -> assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitNullDeletionsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_IRI, commitFactory, conn);
            Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, existingDelStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(statement1, existingAddStatement).collect(Collectors.toSet()));
            Model expectedDeletions = MODEL_FACTORY.createEmptyModel();

            manager.updateCommit(commit, additions, null, conn);

            List<Statement> actualAdds = QueryResults.asList(conn.getStatements(null, null, null, additionId));
            assertEquals(expectedAdditions.size(), actualAdds.size());
            actualAdds.forEach(statement -> assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));

            List<Statement> actualDels = QueryResults.asList(conn.getStatements(null, null, null, deletionId));
            assertEquals(expectedDeletions.size(), actualDels.size());
            actualDels.forEach(statement -> assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithCommitWithoutAdditionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_NO_ADDITIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Additions not set on Commit " + ManagerTestConstants.COMMIT_NO_ADDITIONS_IRI);

            manager.updateCommit(commit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitWithoutDeletionsSetTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(ManagerTestConstants.COMMIT_NO_DELETIONS_IRI, commitFactory, conn);
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Deletions not set on Commit " + ManagerTestConstants.COMMIT_NO_DELETIONS_IRI);

            manager.updateCommit(commit, MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    @Test
    public void updateCommitWithCommitAndQuadsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Commit commit = getThing(VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "quad-test1"), commitFactory, conn);

            Resource graph1 = VALUE_FACTORY.createIRI(ManagerTestConstants.GRAPHS + "quad-graph1");
            Resource graphTest = VALUE_FACTORY.createIRI(ManagerTestConstants.GRAPHS + "quad-graph-test");

            Statement addQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"), graphTest);
            Statement addAndDeleteQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("Description"), graph1);
            Statement deleteQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test/object2"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"), graph1);
            Statement existingAddQuad = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object2"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"), graph1);
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(addQuad, addAndDeleteQuad).collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.addAll(Stream.of(addAndDeleteQuad, deleteQuad, existingAddQuad).collect(Collectors.toSet()));

            Resource additionsGraph = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1");
            Resource deletionsGraph = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1");
            Statement expAdd1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object1"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"), additionsGraph);
            Statement expDel1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object1"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 0 Title"), deletionsGraph);

            Resource additionsGraph1 = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");
            Resource deletionsGraph1 = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph1");
            Statement expAddGraph1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/object2"), RDF.TYPE, ManagerTestConstants.OWL_THING, additionsGraph1);
            Statement expDelGraph1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test/object2"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"), deletionsGraph1);

            Resource additionsGraphTest = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph-test");
            Resource deletionsGraphTest = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "quad-test1%00http%3A%2F%2Fmobi.com%2Ftest%2Fgraphs%23quad-graph-test");
            Statement expAddGraphTest = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"), additionsGraphTest);

            manager.updateCommit(commit, additions, deletions, conn);

            List<Statement> adds = QueryResults.asList(conn.getStatements(null, null, null, additionsGraph));
            assertEquals(1, adds.size());
            assertTrue(adds.contains(expAdd1));

            List<Statement> dels = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraph));
            assertEquals(1, dels.size());
            assertTrue(dels.contains(expDel1));

            List<Statement> addsGraph1 = QueryResults.asList(conn.getStatements(null, null, null, additionsGraph1));
            assertEquals(1, addsGraph1.size());
            assertTrue(addsGraph1.contains(expAddGraph1));

            List<Statement> delsGraph1 = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraph1));
            assertEquals(1, delsGraph1.size());
            assertTrue(delsGraph1.contains(expDelGraph1));

            List<Statement> addsGraphTest = QueryResults.asList(conn.getStatements(null, null, null, additionsGraphTest));
            assertEquals(1, addsGraphTest.size());
            assertTrue(addsGraphTest.contains(expAddGraphTest));

            List<Statement> delsGraphTest = QueryResults.asList(conn.getStatements(null, null, null, deletionsGraphTest));
            assertEquals(0, delsGraphTest.size());
        }
    }

    /* updateCommit(Resource, Model, Model, RepositoryConnection) */

    @Test
    public void updateCommitWithResourceTest() {
        // Setup:
        Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
        Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
        Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"));
        Statement statement2 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("Description"));
        Statement statement3 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), RDFS.LABEL, VALUE_FACTORY.createLiteral("Label"));
        Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
        Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
        Model additions = MODEL_FACTORY.createEmptyModel();
        additions.addAll(Stream.of(statement1, statement2, existingDeleteStatement).collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createEmptyModel();
        deletions.addAll(Stream.of(statement2, statement3, existingAddStatement).collect(Collectors.toSet()));
        Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
        expectedAdditions.addAll(Stream.of(statement1).collect(Collectors.toSet()));
        Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
        expectedDeletions.addAll(Stream.of(statement3).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateCommit(manager.getCommit(ManagerTestConstants.COMMIT_IRI, conn).get(), additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithResourceAndDuplicatesTest() {
        // Setup:
        Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
        Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
        Statement triple = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"));
        Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
        Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
        Model additions = MODEL_FACTORY.createEmptyModel();
        additions.addAll(Stream.of(triple).collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createEmptyModel();
        deletions.addAll(Stream.of(triple).collect(Collectors.toSet()));
        Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
        expectedAdditions.addAll(Stream.of(existingAddStatement).collect(Collectors.toSet()));
        Model expectedDeletions = MODEL_FACTORY.createEmptyModel();
        expectedDeletions.addAll(Stream.of(existingDeleteStatement).collect(Collectors.toSet()));

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateCommit(manager.getCommit(ManagerTestConstants.COMMIT_IRI, conn).get(), additions, deletions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            conn.getStatements(null, null, null, deletionId).forEach(statement ->
                    assertTrue(expectedDeletions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
        }
    }

    @Test
    public void updateCommitWithResourceWithoutAdditionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Additions not set on Commit " + ManagerTestConstants.COMMIT_NO_ADDITIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateCommit(manager.getCommit(ManagerTestConstants.COMMIT_NO_ADDITIONS_IRI, conn).get(), MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    @Test
    public void updateCommitWithResourceWithoutDeletionsSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Deletions not set on Commit " + ManagerTestConstants.COMMIT_NO_DELETIONS_IRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.updateCommit(manager.getCommit(ManagerTestConstants.COMMIT_NO_DELETIONS_IRI, conn).get(), MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conn);
        }
    }

    /* addCommit */

    @Test
    public void addCommitTest() {
        // Setup:
        IRI newIRI = VALUE_FACTORY.createIRI("http://mobi.com/test#new");
        IRI headCommitIRI = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commitA1");
        IRI headIRI = VALUE_FACTORY.createIRI(Branch.head_IRI);

        Commit commit = commitFactory.createNew(newIRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            Record record = recordManager.getRecord(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.SIMPLE_VERSIONED_RDF_RECORD_IRI, recordFactory, conn);
            String previousRecordModDate = getModifiedIriValue(ManagerTestConstants.SIMPLE_VERSIONED_RDF_RECORD_IRI, conn);

            Branch branch = branchManager.getBranch(ManagerTestConstants.CATALOG_IRI, ManagerTestConstants.SIMPLE_VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, branchFactory, conn);
            String previousBranchModDate = getModifiedIriValue(ManagerTestConstants.BRANCH_IRI, conn);

            assertFalse(ConnectionUtils.contains(conn, null, null, null, newIRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, headIRI, headCommitIRI, ManagerTestConstants.BRANCH_IRI));

            manager.addCommit(branch, commit, conn);

            assertTrue(branch.getHead_resource().isPresent());
            assertEquals(newIRI, branch.getHead_resource().get());
            assertTrue(ConnectionUtils.contains(conn, null, null, null, newIRI));
            assertTrue(ConnectionUtils.contains(conn, ManagerTestConstants.BRANCH_IRI, headIRI, newIRI, ManagerTestConstants.BRANCH_IRI));
            assertNotSame(getModifiedIriValue(ManagerTestConstants.BRANCH_IRI, conn), previousBranchModDate);
            assertNotSame(getModifiedIriValue(ManagerTestConstants.SIMPLE_VERSIONED_RDF_RECORD_IRI, conn), previousRecordModDate);
        }
    }

    @Test
    public void addCommitWithTakenResourceTest() {
        // Setup:
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        Commit commit = commitFactory.createNew(ManagerTestConstants.COMMIT_IRI);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Commit " + ManagerTestConstants.COMMIT_IRI + " already exists");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.addCommit(branch, commit, conn);
        }
    }

    /* addChanges */

    @Test
    public void addChangesTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource additionId = getAdditionsResource(ManagerTestConstants.COMMIT_IRI);
            Resource deletionId = getDeletionsResource(ManagerTestConstants.COMMIT_IRI);
            Statement statement1 = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/test"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Title"));
            Statement existingAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/add"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
            Statement existingDeleteStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/delete"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
            Model additions = MODEL_FACTORY.createEmptyModel();
            additions.addAll(Stream.of(statement1, existingDeleteStatement).collect(Collectors.toSet()));
            Model expectedAdditions = MODEL_FACTORY.createEmptyModel();
            expectedAdditions.addAll(Stream.of(existingAddStatement, statement1).collect(Collectors.toSet()));

            manager.addChanges(additionId, deletionId, additions, conn);
            conn.getStatements(null, null, null, additionId).forEach(statement ->
                    assertTrue(expectedAdditions.contains(statement.getSubject(), statement.getPredicate(), statement.getObject())));
            assertEquals(0, conn.size(deletionId));
        }
    }

    /* getCommitChain */

    @Test
    public void getCommitChainDescTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");

            List<Resource> result = manager.getCommitChain(commitId, false, conn);
            Assert.assertEquals(expect, result);
        }
    }

    @Test
    public void getCommitChainAscTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");

            List<Resource> result = manager.getCommitChain(commitId, true, conn);
            Assert.assertEquals(expect, result);
        }
    }

    @Test
    public void getCommitChainEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> expect = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
            Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class");

            List<Commit> result = manager.getCommitEntityChain(commitId, entityId, conn);
            Assert.assertEquals(expect, result.stream().map(Thing::getResource).toList());
        }
    }

    @Test
    public void getEmptyCommitChainEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test5a");
            Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/noClass");

            List<Commit> result = manager.getCommitEntityChain(commitId, entityId, conn);
            Assert.assertEquals(0, result.size());
        }
    }

    @Test
    public void getCommitChainMissingCommitTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#error");

            List<Resource> result = manager.getCommitChain(commitId, true, conn);
            Assert.assertEquals(1, result.size());
        }
    }

    @Test
    public void testGetDifferenceChain() {
        // Setup:
        List<Resource> commitChain = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");

        // Expected list should have the first commit removed
        List<Resource> expected = commitChain.subList(1, commitChain.size());
        Collections.reverse(expected);

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = manager.getDifferenceChain(sourceId, targetId, false, conn);

            Assert.assertEquals(expected, actual);
        }
    }

    @Test
    public void testGetDifferenceEntityChain() {
        // Setup:
        List<Resource> expected = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");
        Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class");

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = manager.getCommitEntityChain(sourceId, targetId, entityId, conn)
                    .stream()
                    .map(Thing::getResource)
                    .toList();

            Assert.assertEquals(expected, actual);
        }
    }

    @Test
    public void testGetDifferenceEntityChainEmpty() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test3");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0");
        Resource entityId = VALUE_FACTORY.createIRI("http://mobi.com/test/class5");

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Commit> actual = manager.getCommitEntityChain(sourceId, targetId, entityId, conn);

            Assert.assertEquals(0, actual.size());
        }
    }

    @Test
    public void testGetDifferenceChainCommonParent() {
        // Setup:
        List<Resource> commitChain = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test0"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2"),
                VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b")).collect(Collectors.toList());
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4b");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testLoner");

        // Expected should contain all commits from the source chain
        Collections.reverse(commitChain);

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = manager.getDifferenceChain(sourceId, targetId, false, conn);

            Assert.assertEquals(actual, commitChain);
        }
    }

    @Test
    public void doesDifferenceChainSourceCommitExist() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#fake");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testLoner");
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Commit %s could not be found", sourceId.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = manager.getDifferenceChain(sourceId, targetId, false, conn);
        }
    }

    @Test
    public void doesDifferenceChainTargetCommitExist() {
        // Setup:
        Resource sourceId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test4a");
        Resource targetId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#fake");
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage(String.format("Commit %s could not be found", targetId.stringValue()));

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Resource> actual = manager.getDifferenceChain(sourceId, targetId, false, conn);
        }
    }

    /* getHeadCommitIRI */

    @Test
    public void getHeadCommitIRITest() {
        Branch branch = branchFactory.createNew(ManagerTestConstants.BRANCH_IRI);
        branch.setHead(commitFactory.createNew(ManagerTestConstants.COMMIT_IRI));
        Resource iri = manager.getHeadCommitIRI(branch);
        assertEquals(ManagerTestConstants.COMMIT_IRI, iri);
    }

    @Test
    public void getHeadCommitIRINotSetTest() {
        // Setup:
        thrown.expect(IllegalStateException.class);
        thrown.expectMessage("Branch " + ManagerTestConstants.LONE_BRANCH_IRI + " does not have a head Commit set");
        Branch branch = branchFactory.createNew(ManagerTestConstants.LONE_BRANCH_IRI);

        manager.getHeadCommitIRI(branch);
    }
    private IRI getAdditionsResource(IRI commitId) {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + commitId.getLocalName());
    }

    private IRI getDeletionsResource(IRI commitId) {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + commitId.getLocalName());
    }

    private <T extends Thing> T getThing(Resource thingId, OrmFactory<T> factory, RepositoryConnection conn) {
        Model thingModel = QueryResults.asModel(conn.getStatements(null, null, null, thingId), MODEL_FACTORY);
        return factory.getExisting(thingId, thingModel).get();
    }

    private IRI getQuadAdditionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }

    private IRI getQuadDeletionsResource(IRI commitId, String graph) throws Exception {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }

    private String getModifiedIriValue(IRI entity, RepositoryConnection conn) {
        RepositoryResult<Statement> statements = conn.getStatements(entity,
                getValueFactory().createIRI(_Thing.modified_IRI), null);

        String modifiedIri = statements.next().toString();
        statements.close();
        return modifiedIri;
    }
}
