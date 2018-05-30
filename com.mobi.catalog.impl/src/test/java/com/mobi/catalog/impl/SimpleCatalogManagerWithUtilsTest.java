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
        IRI commitBIri = VALUE_FACTORY.createIRI(COMMITS + "commit-b");
        IRI rightBranchIri = VALUE_FACTORY.createIRI("http://mobi.com/test/branches#right-branch");

        try (RepositoryConnection conn = repo.getConnection()) {
            Model sourceCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitAIri), MODEL_FACTORY);
            Model targetCommitModel = RepositoryResults.asModel(conn.getStatements(null, null, null, commitBIri), MODEL_FACTORY);
            Model rightBranchModel = RepositoryResults.asModel(conn.getStatements(null, null, null, rightBranchIri), MODEL_FACTORY);
            Commit sourceHead = commitFactory.getExisting(commitAIri, sourceCommitModel).get();
            Commit targetHead = commitFactory.getExisting(commitBIri, targetCommitModel).get();
            Branch rightBranch = branchFactory.getExisting(rightBranchIri, rightBranchModel).get();

            List<Resource> sourceCommits = utilsService.getCommitChain(sourceHead.getResource(), true, conn);
            Difference sourceBranchDiff = utilsService.getCommitDifference(sourceCommits, conn);
            Model sourceCompiled = utilsService.getCompiledResource(sourceCommits, conn);
            List<Resource> targetCommits = utilsService.getCommitChain(targetHead.getResource(), true, conn);
            Difference targetBranchDiff = utilsService.getCommitDifference(targetCommits, conn);
            Model targetCompiled = utilsService.getCompiledResource(targetCommits, conn);

            Commit mergeCommit = manager.createCommit(manager.createInProgressCommit(userFactory.createNew(USER_IRI)), "Left into Right", targetHead, sourceHead);

            // Resolve conflict and delete statement
            //<http://mobi.com/test/ClassA> rdfs:comment "This is a duplicate comment." .
            Model deletions = MODEL_FACTORY.createModel();
            deletions.add(VALUE_FACTORY.createIRI("http://mobi.com/test/ClassA"), VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#comment"), VALUE_FACTORY.createLiteral("Comment B"));
            utilsService.addCommit(rightBranch, mergeCommit, conn);
            utilsService.updateCommit(mergeCommit, MODEL_FACTORY.createModel(), deletions, conn);

            List<Resource> commitsFromMerge = utilsService.getCommitChain(mergeCommit.getResource(), false, conn);
            Difference branchDiff = utilsService.getCommitDifference(commitsFromMerge, conn);
            Model branchCompiled = utilsService.getCompiledResource(commitsFromMerge, conn);
            branchDiff.getAdditions();


        }

    }
}
