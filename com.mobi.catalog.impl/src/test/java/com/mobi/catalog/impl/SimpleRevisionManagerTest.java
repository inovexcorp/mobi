package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.spy;

import com.mobi.catalog.api.RevisionChain;
import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class SimpleRevisionManagerTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleRevisionManager manager;
    private final ThingManager thingManager = spy(new SimpleThingManager());
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    @Before
    public void setup() {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);

        manager = new SimpleRevisionManager();
        manager.thingManager = thingManager;
        injectOrmFactoryReferencesIntoService(manager);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        closeable.close();
    }

    /*  createRevision(UUID) */

    @Test
    public void createRevisionTest() {
        UUID uuid = UUID.nameUUIDFromBytes("newRevision".getBytes(StandardCharsets.UTF_8));
        Revision newRevision = manager.createRevision(uuid);
        assertEquals("https://mobi.com/revisions#8f3d9829-eff6-38a7-8727-27fc4ac5802c", newRevision.getResource().stringValue());
        assertEquals("https://mobi.com/deltas#8f3d9829-eff6-38a7-8727-27fc4ac5802c-A", newRevision.getAdditions().orElseThrow().stringValue());
        assertEquals("https://mobi.com/deltas#8f3d9829-eff6-38a7-8727-27fc4ac5802c-B", newRevision.getDeletions().orElseThrow().stringValue());
    }

    /*  getRevision(Resource revisionId, RepositoryConnection) */

    @Test
    public void getRevisionGeneratedTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getRevision(ManagerTestConstants.INITIAL_COMMIT_GENERATED, conn);
            assertEquals(ManagerTestConstants.INITIAL_COMMIT_GENERATED, revision.getResource());
            assertTrue(revision.getAdditions().isPresent());
            assertTrue(revision.getDeletions().isPresent());
            assertTrue(revision.getHadPrimarySource_resource().isEmpty());
        }
    }

    @Test
    public void getRevisionInProgressCommitGeneratedTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI revisionId = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "in-progress-commit");
            Revision revision = manager.getRevision(revisionId, conn);
            assertEquals(revisionId, revision.getResource());
            assertTrue(revision.getAdditions().isPresent());
            assertTrue(revision.getDeletions().isPresent());
            assertTrue(revision.getHadPrimarySource_resource().isEmpty());
        }
    }

    @Test(expected = MobiException.class)
    public void getRevisionDoesNotExistTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI revisionId = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "dne");
            manager.getRevision(revisionId, conn);
        }
    }

    /*  getRevisionFromCommitId(Resource commitId, RepositoryConnection) */

    @Test
    public void getRevisionFromCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getRevisionFromCommitId(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(ManagerTestConstants.INITIAL_COMMIT_GENERATED, revision.getResource());
            assertTrue(revision.getAdditions().isPresent());
            assertTrue(revision.getDeletions().isPresent());
            assertTrue(revision.getHadPrimarySource_resource().isEmpty());
        }
    }

    @Test
    public void getRevisionFromCommitIdMultipleRevisionsTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "in-progress-commit");
            IRI revisionId = VALUE_FACTORY.createIRI(ManagerTestConstants.REVISIONS + "in-progress-commit");
            Revision revision = manager.getRevisionFromCommitId(commitId, conn);
            assertEquals(revisionId, revision.getResource());
            assertTrue(revision.getAdditions().isPresent());
            assertTrue(revision.getDeletions().isPresent());
            assertTrue(revision.getHadPrimarySource_resource().isEmpty());
        }
    }

    @Test(expected = IllegalArgumentException.class)
    public void getRevisionFromCommitIdDoesNotExistTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "dne");
            manager.getRevisionFromCommitId(commitId, conn);
        }
    }

    /*  getAllRevisionsFromCommitId(Resource commitId, RepositoryConnection) */

    @Test
    public void getAllRevisionsFromCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(4, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromInProgressCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "in-progress-commit");
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(commitId, conn);
            assertEquals(1, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromCommitIdForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.B1_CHANGE_SUBPRED, conn);
            assertEquals(1, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromCommitIdOnlyGeneratedMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.DIFF_COMMIT_MASTER, conn);
            assertEquals(1, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromCommitIdMasterMergeDisplayTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(2, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromCommitIdForwardMergeTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(4, revisions.size());
        }
    }

    @Test
    public void getAllRevisionsFromCommitIdMasterMergedIntoForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Revision> revisions = manager.getAllRevisionsFromCommitId(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, conn);
            assertEquals(4, revisions.size());
        }
    }

    /* getDisplayRevisionFromCommitId(Resource commitId, RepositoryConnection conn) */

    @Test
    public void getDisplayRevisionFromCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(ManagerTestConstants.INITIAL_COMMIT_INITIAL_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getDisplayRevisionsFromInProgressCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "in-progress-commit");
            Revision revision = manager.getDisplayRevisionFromCommitId(commitId, conn);
            assertEquals(ManagerTestConstants.REVISIONS + "in-progress-commit", revision.getResource().stringValue());
        }
    }

    @Test
    public void getDisplayRevisionsFromCommitIdForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.B1_CHANGE_SUBPRED, conn);
            assertEquals(ManagerTestConstants.B1_CHANGE_SUBPRED_FW_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getDisplayRevisionsFromCommitIdMasterChainTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(ManagerTestConstants.DIFF_COMMIT_MASTER_REV.stringValue(), revision.getResource().stringValue());

            // Should equal the previous commit's generated commit since it is a master revision that has been pushed down
            Revision previousCommitRev = manager.getRevisionFromCommitId(ManagerTestConstants.DIFF_COMMIT_MASTER, conn);
            assertEquals(ManagerTestConstants.DIFF_COMMIT_MASTER_REV, previousCommitRev.getResource());
        }
    }

    @Test
    public void getDisplayRevisionsFromCommitIdMasterMergeDisplayTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.FINAL_B1_INTO_MASTER, conn);
            assertEquals(ManagerTestConstants.FINAL_B1_INTO_MASTER_DISPLAY_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getDisplayRevisionsFromCommitIdForwardMergeTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(ManagerTestConstants.B2_INTO_B1_SUBPRED_DISPLAY_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getDisplayRevisionsFromCommitIdMasterMergedIntoForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getDisplayRevisionFromCommitId(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, conn);
            assertEquals(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE_DISPLAY_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    /*  getGeneratedRevision(Commit commit) */

    @Test
    public void getGeneratedRevisionTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Commit commit = thingManager.getObject(ManagerTestConstants.INITIAL_COMMIT, commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals(ManagerTestConstants.INITIAL_COMMIT_GENERATED.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getGeneratedRevisionInProgressCommitIdTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            IRI commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "in-progress-commit");
            Commit commit = thingManager.getObject(commitId, commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals(ManagerTestConstants.REVISIONS + "in-progress-commit", revision.getResource().stringValue());
        }
    }

    @Test
    public void getGeneratedRevisionForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Commit commit = thingManager.getObject(ManagerTestConstants.B1_CHANGE_SUBPRED, commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals(ManagerTestConstants.B1_CHANGE_SUBPRED_FW_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getGeneratedRevisionForwardMergeTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Commit commit = thingManager.getObject(ManagerTestConstants.B2_INTO_B1_SUBPRED, commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals(ManagerTestConstants.B2_INTO_B1_SUBPRED_GENERATED_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    @Test
    public void getGeneratedRevisionMasterMergedIntoForwardTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            Commit commit = thingManager.getObject(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE_GENERATED_REV.stringValue(), revision.getResource().stringValue());
        }
    }

    /*  getInfluencedRevisions(Resource commitId, RepositoryConnection) */

    @Test
    public void getInfluencedRevisionsNoInfluencedTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Revision> revision = manager.getInfluencedRevisions(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(0, revision.size());
        }
    }

    @Test
    public void getInfluencedRevisionsMultipleInfluencedTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Revision> revision = manager.getInfluencedRevisions(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(2, revision.size());
        }
    }

    @Test
    public void getInfluencedRevisionsInProgressCommitIdTest() {
        // Will never have any
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            List<Revision> revision = manager.getInfluencedRevisions(VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "in-progress-commit"), conn);
            assertEquals(0, revision.size());
        }
    }

    /*  getRevisionChain(Resource commitId, RepositoryConnection) */

    /* conflictBranchesSetup.trig - Tests simple chain for master with forward branches off of it*/

    @Test
    public void getRevisionChainSetupMasterHeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(1, chain.fullDeltas().size());
            assertEquals(1, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainSetupB1HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B1_CHANGE_SUBPRED, conn);
            assertEquals(4, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainSetupB2HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_CHANGE_SUBPRED, conn);
            assertEquals(4, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainSetupB3HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES, conn);
            assertEquals(4, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainSetupB4HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(4, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainSetupB5HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED, conn);
            assertEquals(3, chain.fullDeltas().size());
            assertEquals(2, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    /* b1IntoMaster.trig - tests combination of reverse and forward deltas */

    @Test
    public void getRevisionChainComplexB1MasterHeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.FINAL_B1_INTO_MASTER, conn);
            assertEquals(1, chain.fullDeltas().size());
            assertEquals(1, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1MasterChangeDuplicateTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(7, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1DiffCommitMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.DIFF_COMMIT_MASTER, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(8, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1InitialMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(9, chain.fullDeltas().size());
            assertEquals(9, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1_B2IntoB1_B1HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(5, chain.fullDeltas().size());
            assertEquals(5, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1_B2Head_InMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_CHANGE_SUBPRED, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(8, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1_B3HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES, conn);
            assertEquals(10, chain.fullDeltas().size());
            assertEquals(9, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1_MasterIntoB4_B4HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, conn);
            assertEquals(9, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(2, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB1_B3IntoB5_B5HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_INTO_B5_DELETED, conn);
            assertEquals(11, chain.fullDeltas().size());
            assertEquals(8, chain.reverseDeltas().size());
            assertEquals(3, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#846dd150-c2b0-4254-87d3-5075d40e6a5d",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#cd320831-23e3-4857-a197-8002cbc376c9",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#2d7273c7-186d-428b-8440-9c64a355ea4c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    /* b4IntoMaster.trig - tests combination of reverse and forward deltas */

    @Test
    public void getRevisionChainComplexB4MasterHeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.FINAL_B4_INTO_MASTER, conn);
            assertEquals(1, chain.fullDeltas().size());
            assertEquals(1, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4MasterChangeDuplicateTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(3, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#93c52dfc-5dea-447b-ba5f-5439a9015605");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4DiffCommitMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.DIFF_COMMIT_MASTER, conn);
            assertEquals(7, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#93c52dfc-5dea-447b-ba5f-5439a9015605",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4InitialMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(7, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4_B2IntoB1_B1HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(10, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(3, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4_B2HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_CHANGE_SUBPRED, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4_B3HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4_MasterIntoB4_B4Head_InMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, conn);
            assertEquals(3, chain.fullDeltas().size());
            assertEquals(3, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB4_B3IntoB5_B5HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_INTO_B5_DELETED, conn);
            assertEquals(10, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(3, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#156f6824-ab46-4a5c-ac6d-c7bcf3e57e1e",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466",
                    "https://mobi.com/test/revisions#93c52dfc-5dea-447b-ba5f-5439a9015605",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#7dda49f6-eaee-49fc-b0b5-8128976ffd75",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    /* b5IntoMaster.trig - tests combination of reverse and forward deltas */

    @Test
    public void getRevisionChainComplexB5MasterHeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.FINAL_B5_INTO_MASTER, conn);
            assertEquals(1, chain.fullDeltas().size());
            assertEquals(1, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5MasterChangeDuplicateTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL, conn);
            assertEquals(7, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5DiffCommitMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.DIFF_COMMIT_MASTER, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(8, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5InitialMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.INITIAL_COMMIT, conn);
            assertEquals(9, chain.fullDeltas().size());
            assertEquals(9, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5_B2IntoB1_B1HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_INTO_B1_SUBPRED, conn);
            assertEquals(12, chain.fullDeltas().size());
            assertEquals(9, chain.reverseDeltas().size());
            assertEquals(3, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#5cd1173a-e663-452a-bf4e-b12a0713e209",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902",
                    "https://mobi.com/test/revisions#1bb43ed9-4de5-405f-9468-3dc52686f64f");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5_B2HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B2_CHANGE_SUBPRED, conn);
            assertEquals(10, chain.fullDeltas().size());
            assertEquals(9, chain.reverseDeltas().size());
            assertEquals(1, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc",
                    "https://mobi.com/test/revisions#6a948b60-17dc-44ae-a6b1-a6f4d6813902");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5_B3Head_InMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES, conn);
            assertEquals(8, chain.fullDeltas().size());
            assertEquals(8, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#576c1f58-e4b3-474a-a02b-8d2d166eecbc");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5_MasterIntoB5_B4HeadTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE, conn);
            assertEquals(9, chain.fullDeltas().size());
            assertEquals(7, chain.reverseDeltas().size());
            assertEquals(2, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c",
                    "https://mobi.com/test/revisions#5727c9a9-1824-4d38-948f-2864c16bc857",
                    "https://mobi.com/test/revisions#e5de2cc6-1b01-4944-ad40-46ba36f0a76c",
                    "https://mobi.com/test/revisions#33791146-e9dd-4d1f-96e5-2dd3de233840",
                    "https://mobi.com/test/revisions#192622d8-3b6c-4206-b019-5df34b78eaa2",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#382dbd05-12ae-43d3-b9db-3c83d48341f4",
                    "https://mobi.com/test/revisions#216df887-17bd-41ac-9e58-630da941a466");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    @Test
    public void getRevisionChainComplexB5_B3IntoB5_B5Head_InMasterTest() {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            RevisionChain chain = manager.getRevisionChain(ManagerTestConstants.B3_INTO_B5_DELETED, conn);
            assertEquals(4, chain.fullDeltas().size());
            assertEquals(4, chain.reverseDeltas().size());
            assertEquals(0, chain.forwardDeltas().size());

            Revision revision = chain.fullDeltas().get(0);
            assertRevisionEmpty(revision, conn);

            List<String> expected = List.of("https://mobi.com/test/revisions#23ede6e3-8848-40eb-a52f-5988f638f001",
                    "https://mobi.com/test/revisions#6552bbfe-cd0c-41c5-9b20-3463bb91701b",
                    "https://mobi.com/test/revisions#3e3cef92-42af-4f25-8463-1def1e404880",
                    "https://mobi.com/test/revisions#4adeb26f-4116-429e-954b-7516ed40355c");
            assertRevisionIRIList(chain.fullDeltas(), expected);
        }
    }

    private void assertRevisionEmpty(Revision revision, RepositoryConnection conn) {
        assertTrue(revision.getAdditions().isPresent());
        assertTrue(revision.getDeletions().isPresent());

        Model adds = QueryResults.asModel(conn.getStatements(null, null, null, revision.getAdditions().get()));
        Model dels = QueryResults.asModel(conn.getStatements(null, null, null, revision.getDeletions().get()));
        assertTrue(adds.isEmpty());
        assertTrue(dels.isEmpty());
    }

    private void assertRevisionIRIList(List<Revision> revisions, List<String> expected) {
        List<String> revResources = revisions.stream()
                .map(Thing::getResource)
                .map(Resource::stringValue)
                .toList();
        assertEquals(expected, revResources);
    }
}
