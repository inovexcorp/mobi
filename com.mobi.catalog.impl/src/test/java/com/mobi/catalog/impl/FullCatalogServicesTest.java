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

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.catalog.impl.versioning.SimpleVersioningService;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class FullCatalogServicesTest extends OrmEnabledTestCase{
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);

    private Statement initialComment;
    private Statement commentA;
    private Statement commentB;

    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#user");
    private final IRI PROV_AT_TIME = VALUE_FACTORY.createIRI("http://www.w3.org/ns/prov#atTime");
    private final String COMMITS = "http://mobi.com/test/commits#";
    private final IRI CATALOG_ID = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");

    private final SimpleThingManager thingManager = new SimpleThingManager();
    private final SimpleRecordManager recordManager = new SimpleRecordManager();
    private final SimpleBranchManager branchManager = new SimpleBranchManager();
    private final SimpleCommitManager commitManager = new SimpleCommitManager();
    private final SimpleCompiledResourceManager compiledResourceManager = new SimpleCompiledResourceManager();
    private final SimpleRevisionManager revisionManager = new SimpleRevisionManager();
    private final SimpleDifferenceManager differenceManager = new SimpleDifferenceManager();
    private final SimpleVersionManager versionManager = new SimpleVersionManager();
    private final SimpleVersioningService versioningService = new SimpleVersioningService();


    @Mock
    private CatalogConfigProvider configProvider;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        closeable = MockitoAnnotations.openMocks(this);

        when(configProvider.getRepository()).thenReturn(repo);

        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(compiledResourceManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(versioningService);
        injectOrmFactoryReferencesIntoService(differenceManager);
        injectOrmFactoryReferencesIntoService(recordManager);
        commitManager.recordManager = recordManager;
        commitManager.revisionManager = revisionManager;
        commitManager.branchManager = branchManager;
        commitManager.thingManager = thingManager;
        commitManager.versionManager = versionManager;
        compiledResourceManager.thingManager = thingManager;
        compiledResourceManager.commitManager = commitManager;
        compiledResourceManager.revisionManager = revisionManager;
        compiledResourceManager.configProvider = configProvider;
        revisionManager.thingManager = thingManager;
        recordManager.thingManager = thingManager;

        versioningService.revisionManager = revisionManager;
        versioningService.commitManager = commitManager;
        versioningService.branchManager = branchManager;
        versioningService.thingManager = thingManager;
        versioningService.compiledResourceManager = compiledResourceManager;
        versioningService.configProvider = configProvider;
        versioningService.differenceManager = differenceManager;
        differenceManager.revisionManager = revisionManager;
        differenceManager.commitManager = commitManager;
        differenceManager.thingManager = thingManager;
        differenceManager.compiledResourceManager = compiledResourceManager;
        differenceManager.configProvider = configProvider;

        InputStream testData = getClass().getResourceAsStream("/testCommitChainData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        recordManager.start();

        initialComment = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/ontologies/ClassA#Comment"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/terms/title"),
                VALUE_FACTORY.createLiteral("Comment"));
        commentA = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/ontologies/ClassA#Comment"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/terms/title"),
                VALUE_FACTORY.createLiteral("Comment A"));
        commentB = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("https://mobi.com/ontologies/ClassA#Comment"),
                VALUE_FACTORY.createIRI("http://purl.org/dc/terms/title"),
                VALUE_FACTORY.createLiteral("Comment B"));
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase1() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      B       - Comment + Comment B
        //      C                                       - Comment + Comment B
        //      D       - Comment B + Comment A

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#left-branch1");
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch1");
        IRI commitCIri = VALUE_FACTORY.createIRI(COMMITS + "commit-c");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitDIri, commitCIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), deletions, conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase2() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      B       - Comment + Comment B
        //      D       - Comment B + Comment A
        //      E                                       - Comment + Comment B

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#left-branch1");
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch2");
        IRI commitEIri = VALUE_FACTORY.createIRI(COMMITS + "commit-e");


        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitDIri, commitEIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), deletions, conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase3() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      F                                       - Comment + Comment B
        //      B       - Comment + Comment B
        //      D       - Comment B + Comment A

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#left-branch1");
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch3");
        IRI commitFIri = VALUE_FACTORY.createIRI(COMMITS + "commit-f");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createEmptyModel();
            deletions.add(commentB);
            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitDIri, commitFIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), deletions, conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertFalse(branchCompiled.contains(initialComment));
            assertTrue(branchCompiled.contains(commentA));
            assertFalse(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase1() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      H       + Comment B
        //      I                                       + Comment B
        //      J       - Comment B + Comment A

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2");
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch3");
        IRI commitIIri = VALUE_FACTORY.createIRI(COMMITS + "commit-i");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record-diff-base"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitJIri, commitIIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertTrue(branchCompiled.contains(commentA));
//            assertTrue(branchCompiled.contains(commentB));
            // TODO: Investigate why this statement is not present in results. Should it be a conflict?
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase2() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      H       + Comment B
        //      J       - Comment B + Comment A
        //      K                                       + Comment B

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2");
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch4");
        IRI commitKIri = VALUE_FACTORY.createIRI(COMMITS + "commit-k");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record-diff-base"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitJIri, commitKIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void testDuplicateChangeMergeDiffBaseCase3() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      G
        //      L                                       + Comment B
        //      H       + Comment B
        //      J       - Comment B + Comment A

        // Setup:
        IRI leftBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch2");
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch1");
        IRI commitLIri = VALUE_FACTORY.createIRI(COMMITS + "commit-l");

        try (RepositoryConnection conn = repo.getConnection()) {
            VersionedRDFRecord record = recordManager.getRecord(CATALOG_ID, VALUE_FACTORY.createIRI("http://mobi.com/test/records#duplicate-change-record-diff-base"), versionedRDFRecordFactory, conn);

            Model leftBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, leftBranchIri), MODEL_FACTORY);
            Branch leftBranch = branchFactory.getExisting(leftBranchIri, leftBranchModel).get();
            Model rightBranchModel = QueryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Map<Resource, Conflict> conflicts = createConflictMap(differenceManager.getConflicts(commitJIri, commitLIri, conn));
            Resource mergeCommitResource = versioningService.mergeIntoBranch(record, leftBranch, rightBranch, userFactory.createNew(USER_IRI), MODEL_FACTORY.createEmptyModel(), MODEL_FACTORY.createEmptyModel(), conflicts, conn);

            List<Resource> commitsFromMerge = commitManager.getCommitChain(mergeCommitResource, true, conn);
            Model branchCompiled = compiledResourceManager.getCompiledResource(mergeCommitResource, conn);

            assertTrue(branchCompiled.contains(commentA));
//            assertTrue(branchCompiled.contains(commentB));
            // TODO: Investigate why this statement is not present in results. Should it be a conflict?
        }
    }

    private Map<Resource, Conflict> createConflictMap(Set<Conflict> conflicts) {
        Map<Resource, Conflict> conflictMap = new HashMap<>();
        conflicts.forEach(conflict -> conflictMap.put(conflict.getIRI(), conflict));
        return conflictMap;
    }
}
