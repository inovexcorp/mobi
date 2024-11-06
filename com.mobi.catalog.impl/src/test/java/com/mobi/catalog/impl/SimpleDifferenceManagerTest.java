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
import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleDifferenceManagerTest extends OrmEnabledTestCase {

    private AutoCloseable closeable;
    private SimpleDifferenceManager manager;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());
    private final SimpleVersionManager versionManager = spy(new SimpleVersionManager());
    private final SimpleCommitManager commitManager = spy(new SimpleCommitManager());
    private final SimpleBranchManager branchManager = spy(new SimpleBranchManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());
    private final SimpleCompiledResourceManager compiledResourceManager = spy(new SimpleCompiledResourceManager());
    private final SimpleThingManager thingManager = spy(new SimpleThingManager());

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        addData(repo, "/testCatalogData/differenceData.trig", RDFFormat.TRIG);

        branchManager.recordManager = recordManager;
        branchManager.thingManager = thingManager;
        recordManager.thingManager = thingManager;
        revisionManager.thingManager = thingManager;
        versionManager.recordManager = recordManager;
        compiledResourceManager.thingManager = thingManager;
        compiledResourceManager.revisionManager = revisionManager;
        compiledResourceManager.configProvider = configProvider;
        commitManager.thingManager = thingManager;
        manager = spy(new SimpleDifferenceManager());
        manager.thingManager = thingManager;
        manager.commitManager = commitManager;
        manager.revisionManager = revisionManager;
        manager.compiledResourceManager = compiledResourceManager;
        manager.configProvider = configProvider;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(versionManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(recordManager);
        injectOrmFactoryReferencesIntoService(branchManager);
        injectOrmFactoryReferencesIntoService(compiledResourceManager);
        injectOrmFactoryReferencesIntoService(commitManager);

        when(configProvider.getRepository()).thenReturn(repo);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }

    /* applyInProgressCommit */

    @Test
    public void testApplyInProgressCommit() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);

        // Setup:
        Difference diff = new Difference.Builder().build();
        Model entity = MODEL_FACTORY.createEmptyModel();
        Model expected = MODEL_FACTORY.createEmptyModel();
        doReturn(diff).when(manager).getCommitDifference(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
        doReturn(expected).when(manager).applyDifference(entity, diff);

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.applyInProgressCommit(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI, entity, conn);
            assertEquals(expected, result);
            verify(thingManager).validateResource(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), eq(inProgressCommitFactory.getTypeIRI()), any(RepositoryConnection.class));
            verify(manager).getCommitDifference(eq(ManagerTestConstants.IN_PROGRESS_COMMIT_IRI), any(RepositoryConnection.class));
            verify(manager).applyDifference(entity, diff);
        }
    }

    /* getDifference */

    @Test
    public void testGetDifference() throws Exception {
        Difference expected = new Difference.Builder()
                .additions(ManagerTestConstants.getModelFromStatements(MODEL_FACTORY, ManagerTestConstants.B1_ADD))
                .deletions(ManagerTestConstants.getModelFromStatements(MODEL_FACTORY, ManagerTestConstants.B1_B2_DEL))
                .build();

        try (RepositoryConnection conn = repo.getConnection()) {
            addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
            Difference diff = manager.getDifference(ManagerTestConstants.B1_CHANGE_SUBPRED, ManagerTestConstants.B2_CHANGE_SUBPRED, conn);
            assertDiffModels(expected, diff);
        }
    }

    @Test
    public void testGetDifferenceInverted() throws Exception {
        Difference expected = new Difference.Builder()
                .additions(ManagerTestConstants.getModelFromStatements(MODEL_FACTORY, ManagerTestConstants.B2_ADD))
                .deletions(ManagerTestConstants.getModelFromStatements(MODEL_FACTORY, ManagerTestConstants.B1_B2_DEL))
                .build();

        try (RepositoryConnection conn = repo.getConnection()) {
            addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
            Difference diff = manager.getDifference(ManagerTestConstants.B2_CHANGE_SUBPRED, ManagerTestConstants.B1_CHANGE_SUBPRED, conn);
            assertDiffModels(expected, diff);
        }
    }

    /* getDiff */

    @Test
    public void testGetDiff() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model original = QueryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff1")), MODEL_FACTORY);
            Model changed = QueryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);
            Model additions = MODEL_FACTORY.createEmptyModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/additions"))
                    .forEach(additions::add);
            Model deletions = MODEL_FACTORY.createEmptyModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/deletions"))
                    .forEach(deletions::add);

            Difference diff = manager.getDiff(original, changed);
            assertEquals(additions.size(), diff.getAdditions().size());
            diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
            assertEquals(deletions.size(), diff.getDeletions().size());
            diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
        }
    }

    @Test
    public void testGetDiffOppositeOfPrevious() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model changed = QueryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff1")), MODEL_FACTORY);
            Model original = QueryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);
            Model deletions = MODEL_FACTORY.createEmptyModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/additions"))
                    .forEach(deletions::add);
            Model additions = MODEL_FACTORY.createEmptyModel();
            conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff/deletions"))
                    .forEach(additions::add);

            Difference diff = manager.getDiff(original, changed);
            assertEquals(deletions.size(), diff.getDeletions().size());
            diff.getDeletions().forEach(s -> assertTrue(deletions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
            assertEquals(additions.size(), diff.getAdditions().size());
            diff.getAdditions().forEach(s -> assertTrue(additions.contains(s.getSubject(), s.getPredicate(),
                    s.getObject())));
        }
    }

    @Test
    public void testGetDiffOfSameModel() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model original = QueryResults.asModel(conn.getStatements(null, null, null, VALUE_FACTORY.createIRI("http://mobi.com/test/diff2")), MODEL_FACTORY);

            Difference diff = manager.getDiff(original, original);
            assertEquals(0, diff.getAdditions().size());
            assertEquals(0, diff.getDeletions().size());
        }
    }

    /* getCommitDifferencePaged(List<Resource>, RepositoryConnection) */

    @Test
    public void getPagedRevisionChangesWithListTest() {
        addData(repo, "/testCatalogData/ontologyRecord/simpleVersionedRdfRecord.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource ontologySub = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            List<Resource> commits = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1"),
                    VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2")).collect(Collectors.toList());

            Statement ontologyAddStmt = VALUE_FACTORY.createStatement(ontologySub, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 2 Title"));
            Statement classAddStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            Statement ontologyDelStmt = VALUE_FACTORY.createStatement(ontologySub, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 0 Title"));
            Statement classDelStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 1"));

            PagedDifference firstPage = manager.getCommitDifferencePaged(commits, 1, 0, conn);
            assertTrue(firstPage.getDifference().getAdditions().contains(classAddStmt));
            assertTrue(firstPage.getDifference().getDeletions().contains(classDelStmt));
            assertFalse(firstPage.getDifference().getAdditions().contains(ontologyAddStmt));
            assertFalse(firstPage.getDifference().getDeletions().contains(ontologyDelStmt));
            assertTrue(firstPage.hasMoreResults());

            PagedDifference secondPage = manager.getCommitDifferencePaged(commits, 1, 1, conn);
            assertFalse(secondPage.getDifference().getAdditions().contains(classAddStmt));
            assertFalse(secondPage.getDifference().getDeletions().contains(classDelStmt));
            assertTrue(secondPage.getDifference().getAdditions().contains(ontologyAddStmt));
            assertTrue(secondPage.getDifference().getDeletions().contains(ontologyDelStmt));
            assertFalse(secondPage.hasMoreResults());

        }
    }

    /* getCommitDifference */

    @Test
    public void getCommitDifferenceTest() {
        addData(repo, "/testCatalogData/ontologyRecord/simpleVersionedRdfRecord.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Statement addStatement = VALUE_FACTORY.createStatement(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"));
            Statement delStatement = VALUE_FACTORY.createStatement(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 0 Title"));

            Difference diff = manager.getCommitDifference(commitId, conn);
            assertTrue(diff.getAdditions().contains(addStatement));
            assertTrue(diff.getDeletions().contains(delStatement));
        }
    }

    /* getCommitDifferencePaged */
    @Test
    public void getCommitDifferencePagedTest() {
        addData(repo, "/testCatalogData/ontologyRecord/simpleVersionedRdfRecord.trig", RDFFormat.TRIG);
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test2");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Statement firstAddStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            Statement firstDelStatement = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 1"));
            Statement secondAddStatement = VALUE_FACTORY.createStatement(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 2 Title"));
            Statement secondDelStatement = VALUE_FACTORY.createStatement(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"));

            PagedDifference firstPageDiff = manager.getCommitDifferencePaged(commitId, 1, 0, conn);
            assertTrue(firstPageDiff.getDifference().getAdditions().contains(firstAddStatement));
            assertTrue(firstPageDiff.getDifference().getDeletions().contains(firstDelStatement));
            assertFalse(firstPageDiff.getDifference().getAdditions().contains(secondAddStatement));
            assertFalse(firstPageDiff.getDifference().getDeletions().contains(secondDelStatement));
            assertTrue(firstPageDiff.hasMoreResults());

            PagedDifference secondPageDiff = manager.getCommitDifferencePaged(commitId, 1, 1, conn);
            assertTrue(secondPageDiff.getDifference().getAdditions().contains(secondAddStatement));
            assertTrue(secondPageDiff.getDifference().getDeletions().contains(secondDelStatement));
            assertFalse(secondPageDiff.getDifference().getAdditions().contains(firstAddStatement));
            assertFalse(secondPageDiff.getDifference().getDeletions().contains(firstDelStatement));
            assertFalse(secondPageDiff.hasMoreResults());
        }
    }

    /* applyDifference */

    @Test
    public void applyDifferenceTest() {
        // Setup:
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Statement existing = VALUE_FACTORY.createStatement(sub, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Existing"));
        Statement toDelete = VALUE_FACTORY.createStatement(sub, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Delete"));
        Statement toAdd = VALUE_FACTORY.createStatement(sub, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Add"));
        Model adds = MODEL_FACTORY.createEmptyModel();
        adds.add(toAdd);
        Model dels = MODEL_FACTORY.createEmptyModel();
        dels.add(toDelete);
        Difference diff = new Difference.Builder()
                .additions(adds)
                .deletions(dels).build();
        Model model = MODEL_FACTORY.createEmptyModel();
        model.addAll(Stream.of(existing, toDelete).toList());

        Model result = manager.applyDifference(model, diff);
        assertTrue(result.contains(existing));
        assertTrue(result.contains(toAdd));
        assertFalse(result.contains(toDelete));
    }

    /* getConflicts */

    @Test
    public void testGetConflictsFullDeletionWithAddition() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialCommit.trig", RDFFormat.TRIG);

        // Setup:
        // Scenario 1: One branch fully deletes a subject while the other adds to it
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict1-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict1-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());

            List<Resource> validIRIs = Arrays.asList(RDF.TYPE, DCTERMS.DESCRIPTION);
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(0, left.getAdditions().size());
                assertEquals(1, right.getAdditions().size());
                assertEquals(0, right.getDeletions().size());
                assertEquals(1, left.getDeletions().size());
                Stream.of(left.getDeletions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertTrue(validIRIs.contains(statement.getPredicate()));
                }));
            });
        }
    }

    @Test
    public void testGetConflictsFullDeletionWithModification() throws Exception {
        // Setup:
        // Scenario 2: One branch fully deletes a subject while the other modifies something on it
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict2-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict2-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(1, left.getAdditions().size());
                assertEquals(0, right.getAdditions().size());
                assertEquals(1, left.getDeletions().size());
                assertEquals(2, right.getDeletions().size());

                Stream.of(left.getAdditions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertEquals(DCTERMS.TITLE, statement.getPredicate());
                }));
            });
        }
    }

    @Test
    public void testGetConflictsSamePropertyAltered() throws Exception {
        // Setup:
        // Scenario 3: Both branches change the same property
        IRI sub = VALUE_FACTORY.createIRI("http://test.com#sub");
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict3-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict3-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(1, result.size());
            result.forEach(conflict -> {
                Difference left = conflict.getLeftDifference();
                Difference right = conflict.getRightDifference();
                assertEquals(1, left.getAdditions().size());
                assertEquals(1, right.getAdditions().size());
                assertEquals(1, right.getDeletions().size());
                assertEquals(1, left.getDeletions().size());

                Stream.of(left.getAdditions(), right.getAdditions()).forEach(model -> model.forEach(statement -> {
                    assertEquals(sub, statement.getSubject());
                    assertEquals(DCTERMS.TITLE, statement.getPredicate());
                }));
            });
        }
    }

    @Test
    public void testGetConflictsChainAddsAndRemovesStatement() throws Exception {
        // Setup:
        // Scenario 4: Second chain has two commits which adds then removes something
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict4-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict4-3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> results = manager.getConflicts(leftId, rightId, conn);
            assertEquals(0, results.size());
        }
    }

    @Test
    public void testGetConflictsPropertyChangeOnSingleBranch() throws Exception {
        // Setup:
        // Scenario 5: Change a property on one branch
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict5-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict5-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsOneRemovesOtherAddsToProperty() throws Exception {
        // Setup:
        // Scenario 6: One branch removes property while other adds another to it
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict6-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict6-2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    @Test
    public void testGetConflictsWithOnlyOneCommit() throws Exception {
        // Setup:
        // Scenario 7: The right is the base commit of the left
        Resource leftId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict7-1");
        Resource rightId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "conflict7-0");

        try (RepositoryConnection conn = repo.getConnection()) {
            Set<Conflict> result = manager.getConflicts(leftId, rightId, conn);
            assertEquals(0, result.size());
        }
    }

    private void assertDiffModels(Difference d1, Difference d2) {
        assertEquals(d1.getAdditions().size(), d2.getAdditions().size());
        assertEquals(d1.getDeletions().size(), d2.getDeletions().size());
        assertTrue(Models.isomorphic(d1.getAdditions(), d2.getAdditions()));
        assertTrue(Models.isomorphic(d1.getDeletions(), d2.getDeletions()));
    }
}
