package com.mobi.catalog.impl;

import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Revision;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UnversionedRecord;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mcat.VersionedRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;

public class SimpleCatalogManagerWithUtilsTest extends OrmEnabledTestCase{

    private Repository repo;
    private SimpleCatalogManager manager;
    private SimpleCatalogUtilsService utilsService;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Revision> revisionFactory = getRequiredOrmFactory(Revision.class);
    private OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);

    private final IRI USER_IRI = VALUE_FACTORY.createIRI("http://mobi.com/test#user");

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

        InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");

        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        Map<String, Object> props = new HashMap<>();
        props.put("title", "Mobi Test Catalog");
        props.put("description", "This is a test catalog");
        props.put("iri", "http://mobi.com/test/catalogs#catalog");

        manager.start(props);
    }

    @Test
    public void testDuplicateChangeInBranchMerge() throws Exception {
        // Setup:
        IRI commitAIri = VALUE_FACTORY.createIRI(COMMITS + "commit-a");
        IRI commitCIri = VALUE_FACTORY.createIRI(COMMITS + "commit-c");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch");
        IRI additionIri = VALUE_FACTORY.createIRI("https://mobi.com/additions#commit-a");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model additions = RepositoryResults.asModel(conn.getStatements(null, null, null, additionIri), MODEL_FACTORY);
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitAIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitCIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.createNew(commitAIri, sourceCommitModel);
            Commit targetHead = commitFactory.createNew(commitCIri, targetCommitModel);
            Branch rightBranch = branchFactory.createNew(rightBranchIri, rightBranchModel);

            List<Resource> sourceCommits = utilsService.getCommitChain(sourceHead.getResource(), true, conn);
            Difference sourceBranchDiff = utilsService.getCommitDifference(sourceCommits, conn);
            List<Resource> targetCommits = utilsService.getCommitChain(targetHead.getResource(), true, conn);
            Difference targetBranchDiff = utilsService.getCommitDifference(targetCommits, conn);

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            utilsService.addCommit(rightBranch, mergeCommit, conn);
//            rightBranch.setHead(mergeCommit);
//            conn.remove((Resource) null, null, null, rightBranchIri);
//            conn.add(rightBranch.getModel(), rightBranchIri);
//            conn.add(mergeCommit.getModel(), mergeCommit.getResource());
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), MODEL_FACTORY.createModel(), conn);
//            Resource resource = mergeCommit.getGenerated_resource().stream().findFirst().get();
//            Revision revision = revisionFactory.getExisting(resource, mergeCommit.getModel()).get();
//
//            IRI additionsGraph = revision.getAdditions().get();
//=           additions.forEach(statement -> conn.add(statement, additionsGraph));

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), true, conn);
            Difference branchDiff = utilsService.getCommitDifference(commitsFromMerge, conn);
            branchDiff.getAdditions();


        }

    }
}
