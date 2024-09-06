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

import static com.mobi.catalog.impl.TestResourceUtils.trigRequired;
import static org.junit.Assert.*;
import static org.mockito.Mockito.spy;

import com.mobi.catalog.api.ThingManager;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.exception.MobiException;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import org.mockito.MockitoAnnotations;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class SimpleRevisionManagerTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleRevisionManager manager;

    @Before
    public void setup() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        closeable = MockitoAnnotations.openMocks(this);

        ThingManager thingManager = spy(new SimpleThingManager());
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
    public void testCreateRevision() {
        UUID uuid = UUID.nameUUIDFromBytes("newRevision".getBytes(StandardCharsets.UTF_8));
        Revision newRevision = manager.createRevision(uuid);
        assertEquals("https://mobi.com/revisions#8f3d9829-eff6-38a7-8727-27fc4ac5802c", newRevision.getResource().stringValue());
        assertEquals("https://mobi.com/deltas#8f3d9829-eff6-38a7-8727-27fc4ac5802c-A", newRevision.getAdditions().orElseThrow().stringValue());
        assertEquals("https://mobi.com/deltas#8f3d9829-eff6-38a7-8727-27fc4ac5802c-B", newRevision.getDeletions().orElseThrow().stringValue());
        // revision.getGraphRevision() -> Deprecated
    }

    /*  getRevision(Resource revisionId, RepositoryConnection) */

    @Test
    public void testGetRevisionWithPrimarySource() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI inProgressRevision = getValueFactory().createIRI("https://mobi.com/revisions#78ae26fb-4ea6-4237-b1c4-ac8416498eeb");
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getRevision(inProgressRevision, conn);
            assertEquals("https://mobi.com/revisions#78ae26fb-4ea6-4237-b1c4-ac8416498eeb", revision.getResource().stringValue());
            assertEquals("https://mobi.com/deltas#83f82787-6c67-4fd4-8701-5cfcdd573435-A", revision.getAdditions().orElseThrow().stringValue());
            assertEquals("https://mobi.com/deltas#83f82787-6c67-4fd4-8701-5cfcdd573435-B", revision.getDeletions().orElseThrow().stringValue());
            assertEquals("[https://mobi.com/revisions#801574b9-406b-490c-8191-e503db14f060]", revision.getHadPrimarySource_resource().toString());
        }
    }

    @Test
    public void testGetRevisionInProgress() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI inProgressRevision = getValueFactory().createIRI("https://mobi.com/revisions#a37d48eb-e4f9-445f-8f11-71f86a814f62");
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getRevision(inProgressRevision, conn);
            assertEquals("https://mobi.com/revisions#a37d48eb-e4f9-445f-8f11-71f86a814f62", revision.getResource().stringValue());
            assertEquals("https://mobi.com/deltas#a37d48eb-e4f9-445f-8f11-71f86a814f62-A", revision.getAdditions().orElseThrow().stringValue());
            assertEquals("https://mobi.com/deltas#a37d48eb-e4f9-445f-8f11-71f86a814f62-B", revision.getDeletions().orElseThrow().stringValue());
        }
    }

    @Test
    public void testGetRevisionNotExist() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI inProgressRevision = getValueFactory().createIRI("https://mobi.com/revisions#NotExist");
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRevision(inProgressRevision, conn);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof MobiException);
            assertEquals("java.lang.IllegalArgumentException: Revision https://mobi.com/revisions#NotExist could not be found", e.getMessage());
        }
    }

    /*  getRevisionFromCommitId(Resource commitId, RepositoryConnection) */


    @Test
    public void testGetRevisionFromCommitIdNotExist() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#NotExist");
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRevisionFromCommitId(commitIri, conn);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof IllegalArgumentException);
            assertEquals("Commit https://mobi.com/commits#NotExist could not be found", e.getMessage());
        }
    }

    @Test
    public void testGetRevisionFromCommitIdGeneratedInfluenced() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");
        try (RepositoryConnection conn = repo.getConnection()) {
            Revision revision = manager.getRevisionFromCommitId(commitIri, conn);
            assertEquals("https://mobi.com/revisions#d0377518-dbbb-454f-95b7-d93a5f632705", revision.getResource().stringValue());
            assertEquals("https://mobi.com/deltas#e289609c-b6fc-4e23-8b1f-8f898fa7fbbb-B", revision.getAdditions().orElseThrow().stringValue());
            assertEquals("https://mobi.com/deltas#e289609c-b6fc-4e23-8b1f-8f898fa7fbbb-A", revision.getDeletions().orElseThrow().stringValue());
            assertEquals("[https://mobi.com/revisions#02b0ae5b-400b-406e-81ea-6de23533073f]", revision.getHadPrimarySource_resource().toString());
        }
    }

    /*  getAllRevisionsFromCommitId(Resource commitId, RepositoryConnection) */

    @Test
    public void testAllRevisionsFromCommitIdNotExist() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#NotExist");
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getRevisionFromCommitId(commitIri, conn);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof IllegalArgumentException);
            assertEquals("Commit https://mobi.com/commits#NotExist could not be found", e.getMessage());
        }
    }

    @Test
    public void testGetAllRevisionsFromCommitId() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");
        try (RepositoryConnection conn = repo.getConnection()) {
            Set <Resource> revisions = manager.getAllRevisionsFromCommitId(commitIri, conn)
                    .stream().map(Thing::getResource).collect(Collectors.toSet());;
            assertEquals(2, revisions.size());
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#a73cc3b0-5cda-49c6-8f95-987d605598ef"))); // Influenced
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#d0377518-dbbb-454f-95b7-d93a5f632705"))); // Generated
        }
    }

    @Test
    public void testGetDisplayRevisionFromCommitIdNotExist() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#NotExist");
        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getDisplayRevisionFromCommitId(commitIri, conn);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof IllegalArgumentException);
            assertEquals("Commit https://mobi.com/commits#NotExist could not be found", e.getMessage());
        }
    }

    @Test
    public void testGetAllRevisionsFromCommitId_4a75e9b0() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#4a75e9b0-70b0-465a-ae82-4e98a77e4aa1");
        try (RepositoryConnection conn = repo.getConnection()) {
            Set <Resource> revisions = manager.getAllRevisionsFromCommitId(commitIri, conn)
                    .stream().map(Thing::getResource).collect(Collectors.toSet());;
            assertEquals(1, revisions.size());
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#17df93f0-9386-4e45-a187-e417dd2b1454"))); // Generated
        }
    }

    @Test
    public void testGetAllRevisionsFromCommitId_df690842() {
        // Commit with initialRevision/generated/influenced
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#df690842-19a2-463d-810e-8eed8df78b60");
        try (RepositoryConnection conn = repo.getConnection()) {
            Set <Resource> revisions = manager.getAllRevisionsFromCommitId(commitIri, conn)
                    .stream().map(Thing::getResource).collect(Collectors.toSet());
            assertEquals(3, revisions.size());
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#2b0acbda-0c02-4997-be85-de4cb557d4f3"))); // Generated
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#84afbcd6-56d2-4291-a895-357707b165ee"))); // Influenced
            assertTrue(revisions.contains(VALUE_FACTORY.createIRI("https://mobi.com/revisions#8fde5b93-7613-4bc4-b6b3-3d7bfcfaa5cb"))); // initialRevision
        }
    }

    // TODO Add getForwardMergeAuxRevision/getForwardMergeBaseRevision/getMergeDisplayRevision coverage

    /*  getDisplayRevisionFromCommitId(Resource commitId, RepositoryConnection) */
    // getMergeDisplayRevision Case
    // getBranchCommit_resource Case
    // getHadPrimarySource_resource Case
    // Not getHadPrimarySource_resource

    /*  getGeneratedRevision(Commit commit) */

    @Test
    public void testGetDisplayRevisionFromCommitIdGeneratedNotExist() {
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");
        Commit commit = spy(manager.commitFactory.createNew(commitIri));
        try {
            manager.getGeneratedRevision(commit);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof IllegalStateException);
            assertEquals("Commit does not have a Revision", e.getMessage());
        }
    }

    @Test
    public void testGetDisplayRevisionFromCommitIdGeneratedExistNoRevision() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");
        Commit commit = spy(manager.commitFactory.createNew(commitIri));
        commit.setProperty(getValueFactory().createIRI("https://rev#1"), PROV.GENERATED);
        try {
            manager.getGeneratedRevision(commit);
            Assert.fail("Should of thrown exception");
        } catch (Exception e) {
            assertTrue(e instanceof IllegalStateException);
            assertEquals("Could not retrieve revision from Commit.", e.getMessage());
        }
    }

    @Test
    public void testGetDisplayRevisionFromCommitIdGeneratedExistRevision() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");

        try (RepositoryConnection conn = repo.getConnection()) {
            Commit commit = manager.thingManager.getObject(commitIri, manager.commitFactory, conn);
            Revision revision = manager.getGeneratedRevision(commit);
            assertEquals("https://mobi.com/revisions#d0377518-dbbb-454f-95b7-d93a5f632705", revision.getResource().stringValue());
            assertEquals("https://mobi.com/deltas#e289609c-b6fc-4e23-8b1f-8f898fa7fbbb-B", revision.getAdditions().orElseThrow().stringValue());
            assertEquals("https://mobi.com/deltas#e289609c-b6fc-4e23-8b1f-8f898fa7fbbb-A", revision.getDeletions().orElseThrow().stringValue());
            assertEquals("[https://mobi.com/revisions#02b0ae5b-400b-406e-81ea-6de23533073f]", revision.getHadPrimarySource_resource().toString());
        }
    }

    /*  getInfluencedRevisions(Resource commitId, RepositoryConnection) */

    @Test
    public void testGetInfluencedRevisions() {
        trigRequired(repo, "/systemRepo/differenceSimple001.trig");
        IRI commitIri = getValueFactory().createIRI("https://mobi.com/commits#9dfbdc23-f74e-402a-88e0-a2a98a414686");

        try (RepositoryConnection conn = repo.getConnection()) {
            List<Revision> revisions = manager.getInfluencedRevisions(commitIri, conn);
            Assert.assertEquals(1, revisions.size());
            Revision revision = revisions.get(0);
            assertEquals("https://mobi.com/revisions#a73cc3b0-5cda-49c6-8f95-987d605598ef", revision.getResource().stringValue());
            assertEquals("https://mobi.com/deltas#d16ca4c5-ff9a-44b9-ad0b-d2da38f7f6c4-B", revision.getAdditions().orElseThrow().stringValue());
            assertEquals("https://mobi.com/deltas#d16ca4c5-ff9a-44b9-ad0b-d2da38f7f6c4-A", revision.getDeletions().orElseThrow().stringValue());
            assertEquals("[]", revision.getHadPrimarySource_resource().toString());
        }
    }

    // TODO Case with prov:influenced with more two Revisions

    /*
    Anytime there is a merge the originating branching commit that the auxiliary branch came from will have an added prov:influenced revision
    so if multiple branches started from the same commit and eventually get merged into master they can have multiple
    */

    /*  getRevisionChain(Resource commitId, RepositoryConnection) */
    // TODO Wait

    @Test
    public void testGetRevisionChain01() throws Exception {
        trigRequired(repo, "/twoBranchesMergedIntoMaster.trig"); // has outdated structure?
        try (RepositoryConnection conn = repo.getConnection()) {
            Resource commit = VALUE_FACTORY.createIRI("https://mobi.com/commits#b158b0b6-c119-4e09-8270-5e775d6b9703");
            List<Revision> revisions = manager.getRevisionChain(commit, conn);
            revisions.forEach(rev -> System.out.println(rev.getResource().stringValue()));
        }
    }

    /*  Helper methods */

    private IRI getQuadAdditionsResource(IRI commitId, String graph) {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.ADDITIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }

    private IRI getQuadDeletionsResource(IRI commitId, String graph) {
        return VALUE_FACTORY.createIRI(ManagerTestConstants.DELETIONS + commitId.getLocalName() + "%00" + URLEncoder.encode(graph, StandardCharsets.UTF_8));
    }


}