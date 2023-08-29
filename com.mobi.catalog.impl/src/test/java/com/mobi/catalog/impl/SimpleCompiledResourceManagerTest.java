package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
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

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.persistence.utils.Models;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
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

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleCompiledResourceManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private SimpleCompiledResourceManager manager;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    private static final String[] COMMIT_IRIS = new String[] {
            "http://mobi.com/commits/0",
            "http://mobi.com/commits/1",
            "http://mobi.com/commits/2"
    };
    
    private List<Commit> testCommits;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    SimpleThingManager thingManager = spy(new SimpleThingManager());
    SimpleCommitManager commitManager = spy(new SimpleCommitManager());

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

        testCommits = Arrays.stream(COMMIT_IRIS)
                .map(s -> commitFactory.createNew(VALUE_FACTORY.createIRI(s)))
                .collect(Collectors.toList());

        SimpleBranchManager branchManager = new SimpleBranchManager();
        SimpleRecordManager recordManager = new SimpleRecordManager();
        recordManager.thingManager = thingManager;
        branchManager.recordManager = recordManager;
        commitManager.branchManager = branchManager;
        commitManager.thingManager = thingManager;
        manager = spy(new SimpleCompiledResourceManager());
        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.thingManager = thingManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(branchManager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
        repo.shutDown();
    }
    
    /* getCompiledResource */

    @Test
    public void testGetCompiledResourceWithList() throws Exception {
        // Setup:
        List<Resource> commitIds = testCommits.stream().map(Thing::getResource).toList();
        Model expected = MODEL_FACTORY.createEmptyModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(manager).getCompiledResource(eq(commitIds), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.getCompiledResource(commitIds, conn);
            verify(manager).getCompiledResource(eq(commitIds), any(RepositoryConnection.class));
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    @Test
    public void testGetCompiledResourceWithListEmpty() throws Exception {
        // Setup:
        List<Resource> emptyList = new ArrayList<>();
        Model expected = MODEL_FACTORY.createEmptyModel();
        doReturn(expected).when(manager).getCompiledResource(eq(emptyList), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.getCompiledResource(emptyList, conn);
            verify(manager).getCompiledResource(eq(emptyList), any(RepositoryConnection.class));
            assertTrue(result.isEmpty());
        }
    }

    @Test
    public void testGetCompiledResourceWithUnmergedPast() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "test0");
        Model expected = MODEL_FACTORY.createEmptyModel();
        expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
        doReturn(expected).when(manager).getCompiledResource(eq(commitId), any(RepositoryConnection.class));

        try (RepositoryConnection conn = repo.getConnection()) {
            Model result = manager.getCompiledResource(commitId, conn);
            verify(manager).getCompiledResource(eq(commitId), any(RepositoryConnection.class));
            result.forEach(statement -> assertTrue(expected.contains(statement)));
        }
    }

    @Test
    public void testGetCompiledResourceWithPathAndUnmergedPast() throws Exception {
        // Setup:
        Resource commitId = VALUE_FACTORY.createIRI(ManagerTestConstants.COMMITS + "commitA1");

        try (RepositoryConnection conn = repo.getConnection()) {
            manager.getCompiledResource(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI, ManagerTestConstants.BRANCH_IRI, commitId, conn);
            verify(commitManager).validateCommitPath(eq(ManagerTestConstants.CATALOG_IRI), eq(ManagerTestConstants.VERSIONED_RDF_RECORD_IRI), eq(ManagerTestConstants.BRANCH_IRI), eq(commitId), any(RepositoryConnection.class));
            verify(manager).getCompiledResource(anyList(), any(RepositoryConnection.class));
        }
    }

    /* getCompiledResource(Resource, RepositoryConnection) */

    @Test
    public void getCompiledResourceWithIdTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"));
            expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/class0"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));

            Model result = manager.getCompiledResource(commitId, conn);
            expected.forEach(statement -> assertTrue(result.contains(statement)));
        }
    }

    @Test
    public void getCompiledResourceWithIdChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testRename1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            Model result = manager.getCompiledResource(commitId, conn);
            expected.forEach(statement -> assertTrue(result.contains(statement)));
            assertEquals(expected.size(), result.size());
        }
    }

    @Test
    public void getCompiledResourceWithIdBlankNodeTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testBlank1");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            Model model = manager.getCompiledResource(commitId, conn);
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getCompiledResourceFile(Resource, RepositoryConnection) */

    @Test
    public void getCompiledResourceFileWithIdTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#test1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 1 Title"));
            expected.add(VALUE_FACTORY.createIRI("http://mobi.com/test/class0"), RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));

            File file = manager.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            assertEquals(expected.size(), model.size());
            expected.forEach(statement -> assertTrue(model.contains(statement)));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithIdChangeEntityTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testRename1");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            File file = manager.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            assertEquals(expected.size(), model.size());
            expected.forEach(statement -> assertTrue(model.contains(statement)));
            file.delete();
        }
    }

    @Test
    public void getCompiledResourceFileWithIdBlankNodeTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Resource commitId = VALUE_FACTORY.createIRI("http://mobi.com/test/commits#testBlank1");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            File file = manager.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model model = Models.createModel(new FileInputStream(file));
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getCompiledResource(List<Resource>, RepositoryConnection, Resource... subjectIds) */

    @Test
    public void getCompiledResourceWithListTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 2 Title")));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            Model result = manager.getCompiledResource(commits, conn);
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListSubjectIdTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(
                    VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test 2 Title")));
            Statement classStmt = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/class"), DCTERMS.TITLE,
                    VALUE_FACTORY.createLiteral("Class Title 2"));
            expected.add(classStmt);

            Model result = manager.getCompiledResource(commits, conn, VALUE_FACTORY.createIRI("http://mobi.com/test/class"));
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");
            Resource ontologyId = VALUE_FACTORY.createIRI("http://mobi.com/test/ontology1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(ontologyId, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Ontology"));
            expected.add(ontologyId, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Rename 0 Title"));

            Model result = manager.getCompiledResource(commits, conn);
            assertEquals(modelAssertHelper(expected), modelAssertHelper(result));
        }
    }

    @Test
    public void getCompiledResourceWithListBlankNodeTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testBlank1", "http://mobi.com/test/commits#testBlank0");
            Resource blankNode = VALUE_FACTORY.createBNode("genid1");
            Model expected = MODEL_FACTORY.createEmptyModel();
            expected.add(blankNode, RDF.TYPE, VALUE_FACTORY.createIRI("http://www.w3.org/2002/07/owl#Class"));
            expected.add(blankNode, DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Test Blank 1 Title"));

            Model model = manager.getCompiledResource(commits, conn);
            model.forEach(statement -> {
                assertTrue(statement.getSubject() instanceof BNode);
                Statement temp = VALUE_FACTORY.createStatement(blankNode, statement.getPredicate(), statement.getObject());
                assertTrue(expected.contains(temp));
            });
            assertEquals(expected.size(), model.size());
        }
    }

    /* getDeletionSubjects */

    @Test
    public void getDeletionSubjectsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology", "http://mobi.com/test/class")),
                    manager.getDeletionSubjects(commits, conn));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/ontology", "http://mobi.com/test/class")),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
        }
    }

    @Test
    public void getDeletionSubjectsWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    manager.getDeletionSubjects(commits, conn));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/ontology")),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    manager.getDeletionSubjects(commits, conn,  VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
        }
    }

    /* getCommitWithSubjects */

    @Test
    public void getCommitWithSubjectsTest() {
        try (RepositoryConnection conn = repo.getConnection()) {

            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1");
            Set<Resource> deletionSubjects = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/tests")).collect(Collectors.toSet());

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/commits#test2", "http://mobi.com/test/commits#test1")),
                    manager.getCommitsWithSubjects(commits, conn,  deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectIds Non-exist", Collections.emptySet(),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist2")));
        }
    }

    @Test
    public void getCommitWithSubjectsWithListChangeEntityTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            List<Resource> commits = buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0");

            Set<Resource> deletionSubjects = Stream.of(VALUE_FACTORY.createIRI("http://mobi.com/test/tests")).collect(Collectors.toSet());

            assertEquals("Without SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects));
            assertEquals("With SubjectId", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology")));
            assertEquals("With SubjectIds", new HashSet<>(buildResources("http://mobi.com/test/commits#testRename1", "http://mobi.com/test/commits#testRename0")),
                    manager.getCommitsWithSubjects(commits, conn,  deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontology"), VALUE_FACTORY.createIRI("http://mobi.com/test/class")));
            assertEquals("With SubjectId Non-exist", Collections.emptySet(),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist")));
            assertEquals("With SubjectIds Non-exist", Collections.emptySet(),
                    manager.getCommitsWithSubjects(commits, conn, deletionSubjects, VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist"), VALUE_FACTORY.createIRI("http://mobi.com/test/ontologyNonExist2")));
        }
    }

    private List<Resource> buildResources(String... resources) {
        return Stream.of(resources).map(VALUE_FACTORY::createIRI).collect(Collectors.toList());
    }

    private String modelAssertHelper(Model model){
        Set<String> statements = new TreeSet<>();
        model.forEach(statement -> statements.add("(" + statement.getSubject().stringValue() + ", " + statement.getPredicate().stringValue() + ", " + statement.getObject().toString()));
        return String.join("\n", statements);
    }
}
