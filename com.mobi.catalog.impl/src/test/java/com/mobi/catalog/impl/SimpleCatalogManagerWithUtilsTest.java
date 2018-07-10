package com.mobi.catalog.impl;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
import static junit.framework.TestCase.assertTrue;

import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.Catalogs;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.provo.Activity;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class SimpleCatalogManagerWithUtilsTest extends OrmEnabledTestCase{

    private Repository repo;
    private SimpleCatalogManager manager;
    private SimpleCatalogUtilsService utilsService;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);

    private Statement initialComment;
    private Statement commentA;
    private Statement commentB;

    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#user");
    private final IRI TYPE_IRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI PROV_AT_TIME = VALUE_FACTORY.createIRI("http://www.w3.org/ns/prov#atTime");

    private static final String COMMITS = "http://mobi.com/test/commits#";

    @Before
    public void setUp() throws Exception {
        SesameRepositoryWrapper repositoryWrapper = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        Map<String, Object> repoProps = new HashMap<>();
        repoProps.put("id", "system");
        RepositoryConfig config = Configurable.createConfigurable(RepositoryConfig.class, repoProps);
        repositoryWrapper.setConfig(config);
        repo = repositoryWrapper;
        repo.initialize();

        MockitoAnnotations.initMocks(this);
        manager = new SimpleCatalogManager();
        injectOrmFactoryReferencesIntoService(manager);
        manager.setRepository(repo);
        manager.setValueFactory(VALUE_FACTORY);
        manager.setModelFactory(MODEL_FACTORY);
        manager.setUtils(utilsService);

        utilsService = new SimpleCatalogUtilsService();
        injectOrmFactoryReferencesIntoService(utilsService);
        utilsService.setMf(MODEL_FACTORY);
        utilsService.setVf(VALUE_FACTORY);

        InputStream testData = getClass().getResourceAsStream("/testCommitChainData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        Map<String, Object> props = new HashMap<>();
        props.put("title", "Mobi Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://mobi.com/test/catalogs#catalog");

        manager.start(props);

        initialComment = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment"));
        commentA = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment A"));
        commentB = VALUE_FACTORY.createStatement(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                VALUE_FACTORY.createLiteral("Comment B"));
    }

    @Test
    public void testDuplicateChangeMergeSameBaseCase1() throws Exception {
        //  Commit  Left Branch                      Right Branch
        //      A       + Comment                       + Comment
        //      B       - Comment + Comment B
        //      C                                       - Comment + Comment B
        //      D       - Comment B + Comment A

        // Setup:
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitCIri = VALUE_FACTORY.createIRI(COMMITS + "commit-c");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch1");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitCIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitCIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createModel();
            deletions.add(commentB);
            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), deletions, conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

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
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitEIri = VALUE_FACTORY.createIRI(COMMITS + "commit-e");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitEIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitEIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createModel();
            deletions.add(commentB);
            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), deletions, conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

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
        IRI commitDIri = VALUE_FACTORY.createIRI(COMMITS + "commit-d");
        IRI commitFIri = VALUE_FACTORY.createIRI(COMMITS + "commit-f");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitDIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitFIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitDIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitFIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            Model deletions = MODEL_FACTORY.createModel();
            deletions.add(commentB);
            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), deletions, conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

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
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitIIri = VALUE_FACTORY.createIRI(COMMITS + "commit-i");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch1");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitIIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitIIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
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
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitKIri = VALUE_FACTORY.createIRI(COMMITS + "commit-k");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch2");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitKIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitKIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

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
        IRI commitJIri = VALUE_FACTORY.createIRI(COMMITS + "commit-j");
        IRI commitLIri = VALUE_FACTORY.createIRI(COMMITS + "commit-l");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch3");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitJIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitLIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitJIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitLIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);

            assertTrue(branchCompiled.contains(commentA));
            assertTrue(branchCompiled.contains(commentB));
        }
    }

    @Test
    public void getCompiledResourceTiming() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup
            IRI revisionTypeIRI = VALUE_FACTORY.createIRI(Revision.TYPE);
            IRI additionsTypeIRI = VALUE_FACTORY.createIRI(Revision.additions_IRI);
            IRI deletionsTypeIRI = VALUE_FACTORY.createIRI(Revision.deletions_IRI);

            // Need dates to have an ordered commit list
            DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'");
            long dayInMs = 86400000;
            long timeMillis = System.currentTimeMillis();
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(timeMillis);

            // Build out large commit chain
            Branch branch = branchFactory.createNew(VALUE_FACTORY.createIRI("urn:testBranch"));
            utilsService.addObject(branch, conn);
            Commit previousCommit = null;
            Model statementsToDelete = getModelFactory().createModel();
            int numberOfCommits = 1000;
            for (int i = 0; i < numberOfCommits; i++) {
                IRI commitIRI = VALUE_FACTORY.createIRI("urn:commit" + i);
                Commit commit = commitFactory.createNew(commitIRI);
                if (i != 0) {
                    commit.setBaseCommit(previousCommit);
                }

                IRI revisionIRI = VALUE_FACTORY.createIRI("urn:revision" + i);
                IRI additionsIRI = VALUE_FACTORY.createIRI(Catalogs.ADDITIONS_NAMESPACE + "addition" + i);
                IRI deletionsIRI = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "deletion" + i);
                IRI nextDeletionsIRI = VALUE_FACTORY.createIRI(Catalogs.DELETIONS_NAMESPACE + "deletion" + (i + 1));

                Revision revision = revisionFactory.createNew(revisionIRI, commit.getModel());
                revision.setAdditions(additionsIRI);
                revision.setDeletions(deletionsIRI);

                commit.setProperty(revisionIRI, VALUE_FACTORY.createIRI(Activity.generated_IRI));
                commit.setProperty(VALUE_FACTORY.createLiteral(df.format(calendar.getTime())), PROV_AT_TIME);

                Model additions = MODEL_FACTORY.createModel();
                Model currentDeletions = MODEL_FACTORY.createModel(statementsToDelete);
                statementsToDelete.clear();

                for (int j = 0; j < 10; j++) {
                    String uuid = UUID.randomUUID().toString();
                    if (j == 0 || j == 1) {
                        // Keep track of statements to delete in next commit
                        statementsToDelete.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                                VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                                VALUE_FACTORY.createLiteral(uuid), nextDeletionsIRI);
                    }
                    additions.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"),
                            VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"),
                            VALUE_FACTORY.createLiteral(uuid), additionsIRI);
                }
                conn.add(additions);
                conn.add(currentDeletions);

                utilsService.addCommit(branch, commit, conn);
                previousCommit = commit;
                timeMillis = timeMillis + dayInMs;
                calendar.setTimeInMillis(timeMillis);
            }

            List<Resource> commitChain = utilsService.getCommitChain(previousCommit.getResource(), true, conn);

            long start = System.nanoTime();
            Model branchCompiled = utilsService.getCompiledResource(commitChain, conn);
            long end = System.nanoTime();
            long opTime = (end - start) / 1000000;
            System.out.println("CatalogUtilsService getCompiledResource operation time (ms): " + opTime);

            assertEquals(numberOfCommits, commitChain.size());
            assertEquals(numberOfCommits * 8 + 2, branchCompiled.size());
        }
    }
}
