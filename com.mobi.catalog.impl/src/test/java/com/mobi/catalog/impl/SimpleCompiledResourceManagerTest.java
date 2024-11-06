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

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.util.Models;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.function.Function;

public class SimpleCompiledResourceManagerTest extends OrmEnabledTestCase {
    public static final String BLANK_NODE_GEN_ID = "urn:genId";
    public static final Function<Statement, String> STATEMENT_STRING_FUNCTION = statement -> {
        String sub = statement.getSubject().isBNode() ? BLANK_NODE_GEN_ID : statement.getSubject().stringValue();
        String pred = statement.getPredicate().stringValue();
        String obj = statement.getObject().isBNode() ? BLANK_NODE_GEN_ID : statement.getObject().stringValue();
        String context = statement.getContext() != null ? statement.getContext().stringValue() : null;
        return String.format("%s, %s, %s, %s", sub, pred, obj, context);
    };

    private AutoCloseable closeable;
    private SimpleCompiledResourceManager manager;
    private MemoryRepositoryWrapper repo;
    private Model dcterms;

    private final SimpleThingManager thingManager = spy(new SimpleThingManager());
    private final SimpleCommitManager commitManager = spy(new SimpleCommitManager());
    private final SimpleRevisionManager revisionManager = spy(new SimpleRevisionManager());
    private final SimpleBranchManager branchManager = spy(new SimpleBranchManager());
    private final SimpleRecordManager recordManager = spy(new SimpleRecordManager());

    @Mock
    CatalogConfigProvider configProvider;

    @Before
    public void setUpTest() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        InputStream in = this.getClass().getResourceAsStream("/testCatalogData/ontologyRecord/conflictBranches/dcterms.ttl");
        dcterms = Rio.parse(in, RDFFormat.TURTLE);

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(ManagerTestConstants.CATALOG_IRI);

        recordManager.thingManager = thingManager;
        branchManager.recordManager = recordManager;
        branchManager.thingManager = thingManager;
        commitManager.branchManager = branchManager;
        commitManager.thingManager = thingManager;
        revisionManager.thingManager = thingManager;
        manager = spy(new SimpleCompiledResourceManager());
        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.revisionManager = revisionManager;
        manager.thingManager = thingManager;
        injectOrmFactoryReferencesIntoService(manager);
        injectOrmFactoryReferencesIntoService(commitManager);
        injectOrmFactoryReferencesIntoService(revisionManager);
        injectOrmFactoryReferencesIntoService(branchManager);
    }

    @After
    public void resetTest() throws Exception {
        closeable.close();
        repo.shutDown();
        Mockito.reset(configProvider, thingManager, commitManager, revisionManager, branchManager, recordManager);
    }
    
    /* getCompiledResource - no branch */

    @Test
    public void getCompiledResourceOneCommitInitialTestTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialCommit.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterInitialCommitNoMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterHeadNoMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        validateModel(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceBranchHeadNoMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        updateDcB1Change();
        validateModel(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B1_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceMasterChainCommitNoMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        validateModel(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateFile(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateInvalidPath(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.DIFF_COMMIT_MASTER);
    }

    @Test
    public void getCompiledResourceBranchChainCommitNoMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcB5Change();
        validateModel(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateFile(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateInvalidPath(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
    }

    // FORWARD Merges

    @Test
    public void getCompiledResourceMasterInitialCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterHeadFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        validateModel(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceBranchHeadFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcB1Change();
        validateModel(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B1_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceMasterChainCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        validateModel(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateFile(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateInvalidPath(ManagerTestConstants.DIFF_COMMIT_MASTER);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.DIFF_COMMIT_MASTER);
    }

    @Test
    public void getCompiledResourceBranchChainCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcB5Change();
        validateModel(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateFile(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateInvalidPath(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
    }
    
    // FORWARD MERGE COMMITS

    @Test
    public void getCompiledResourceB2IntoB1MergeCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcB1Change();
        updateDcB2Change();
        updateDcB2IntoB1Resolution();
        validateModel(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateFile(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B2_INTO_B1_SUBPRED);
    }

    @Test
    public void getCompiledResourceMasterIntoB4MergeCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcB4Change();
        updateDcDiffCommitChange();
        // No need to add the below changes since the state at the commit should be just the duplicate adds/dels
        // plus the diff commit change.
        // updateDcMasterCommitChange();
        // updateDcMasterIntoB4Resolution();
        validateModel(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE);
        validateFile(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE);
        validateInvalidPath(ManagerTestConstants.MASTER_INTO_B4_DUPLICATE);
        validateValidPath(ManagerTestConstants.CONFLICT_B4, ManagerTestConstants.MASTER_INTO_B4_DUPLICATE);
    }

    @Test
    public void getCompiledResourceB3IntoB5MergeCommitFwMergesTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.trig", RDFFormat.TRIG);
        updateDcB3Change();
        updateDcDiffCommitChange();
        updateDcB5Change();
        updateDcB3IntoB5Resolution();
        validateModel(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateFile(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateInvalidPath(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B3_INTO_B5_DELETED);
    }

    // b1IntoMaster final merge

    @Test
    public void getCompiledResourceMasterInitialCommitB1BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterHeadCommitB1BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        updateDcB2Change();
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        updateDcB2IntoB1Resolution();
        validateModel(ManagerTestConstants.FINAL_B1_INTO_MASTER);
        validateFile(ManagerTestConstants.FINAL_B1_INTO_MASTER);
        validateInvalidPath(ManagerTestConstants.FINAL_B1_INTO_MASTER);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.FINAL_B1_INTO_MASTER);
    }

    @Test
    public void getCompiledResourceB1Merged_MasterChangeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        validateModel(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB1Merged_B1CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        validateModel(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B1_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB1Merged_B2CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB2Change();
        validateModel(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B2, ManagerTestConstants.B2_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB1Merged_B2B1MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        updateDcB2Change();
        updateDcB2IntoB1Resolution();
        validateModel(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateFile(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B2_INTO_B1_SUBPRED);
    }

    @Test
    public void getCompiledResourceB1Merged_B3CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        validateModel(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateFile(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateInvalidPath(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateValidPath(ManagerTestConstants.CONFLICT_B3, ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
    }

    @Test
    public void getCompiledResourceB1Merged_B4CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_B4, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB1Merged_B5CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcB5Change();
        validateModel(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateFile(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateInvalidPath(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
    }

    @Test
    public void getCompiledResourceB1Merged_B3IntoB5MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        updateDcDiffCommitChange();
        updateDcB5Change();
        updateDcB3IntoB5Resolution();
        validateModel(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateFile(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateInvalidPath(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B3_INTO_B5_DELETED);
    }

    @Test
    public void getCompiledResourceB1Merged_MasterIntoB4MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b1IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_B4, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    // b4IntoMaster final merge

    @Test
    public void getCompiledResourceMasterInitialCommitB4BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterHeadCommitB4BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        updateDcDiffCommitChange();
        // No need to add the below changes since the state at the commit should be just the duplicate adds/dels
        // plus the diff commit change.
        // updateDcMasterCommitChange();
        // updateDcMasterIntoB4Resolution();
        validateModel(ManagerTestConstants.FINAL_B4_INTO_MASTER);
        validateFile(ManagerTestConstants.FINAL_B4_INTO_MASTER);
        validateInvalidPath(ManagerTestConstants.FINAL_B4_INTO_MASTER);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.FINAL_B4_INTO_MASTER);
    }

    @Test
    public void getCompiledResourceB4Merged_MasterChangeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        validateModel(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB4Merged_B1CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        validateModel(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B1_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB4Merged_B2CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB2Change();
        validateModel(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B2, ManagerTestConstants.B2_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB4Merged_B2B1MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        updateDcB2Change();
        updateDcB2IntoB1Resolution();
        validateModel(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateFile(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B2_INTO_B1_SUBPRED);
    }

    @Test
    public void getCompiledResourceB4Merged_B3CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        validateModel(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateFile(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateInvalidPath(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateValidPath(ManagerTestConstants.CONFLICT_B3, ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
    }

    @Test
    public void getCompiledResourceB4Merged_B4CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB4Merged_B5CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcB5Change();
        validateModel(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateFile(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateInvalidPath(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
    }

    @Test
    public void getCompiledResourceB4Merged_B3IntoB5MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        updateDcDiffCommitChange();
        updateDcB5Change();
        updateDcB3IntoB5Resolution();
        validateModel(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateFile(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateInvalidPath(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateValidPath(ManagerTestConstants.CONFLICT_B5, ManagerTestConstants.B3_INTO_B5_DELETED);
    }

    @Test
    public void getCompiledResourceB4Merged_MasterIntoB4MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b4IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    // b5IntoMaster final merge

    @Test
    public void getCompiledResourceMasterInitialCommitB5BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        validateModel(ManagerTestConstants.INITIAL_COMMIT);
        validateFile(ManagerTestConstants.INITIAL_COMMIT);
        validateInvalidPath(ManagerTestConstants.INITIAL_COMMIT);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.INITIAL_COMMIT);
    }

    @Test
    public void getCompiledResourceMasterHeadCommitB5BackIntoMasterTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        updateDcB5Change();
        updateDcB3IntoB5Resolution();
        validateModel(ManagerTestConstants.FINAL_B5_INTO_MASTER);
        validateFile(ManagerTestConstants.FINAL_B5_INTO_MASTER);
        validateInvalidPath(ManagerTestConstants.FINAL_B5_INTO_MASTER);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.FINAL_B5_INTO_MASTER);
    }

    @Test
    public void getCompiledResourceB5Merged_MasterChangeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcMasterCommitChange();
        validateModel(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.MASTER_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB5Merged_B1CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        validateModel(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B1_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B1_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB5Merged_B2CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB2Change();
        validateModel(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateFile(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_CHANGE_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B2, ManagerTestConstants.B2_CHANGE_SUBPRED);
    }

    @Test
    public void getCompiledResourceB5Merged_B2B1MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB1Change();
        updateDcB2Change();
        updateDcB2IntoB1Resolution();
        validateModel(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateFile(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateInvalidPath(ManagerTestConstants.B2_INTO_B1_SUBPRED);
        validateValidPath(ManagerTestConstants.CONFLICT_B1, ManagerTestConstants.B2_INTO_B1_SUBPRED);
    }

    @Test
    public void getCompiledResourceB5Merged_B3CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        validateModel(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateFile(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateInvalidPath(ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
        validateValidPath(ManagerTestConstants.CONFLICT_B3, ManagerTestConstants.B3_CHANGE_DELETED_ENTITIES);
    }

    @Test
    public void getCompiledResourceB5Merged_B4CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_B4, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    @Test
    public void getCompiledResourceB5Merged_B5CommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcDiffCommitChange();
        updateDcB5Change();
        validateModel(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateFile(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateInvalidPath(ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B5_CHANGE_DELETED_ENTITIES_MODIFIED);
    }

    @Test
    public void getCompiledResourceB5Merged_B3IntoB5MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB3Change();
        updateDcDiffCommitChange();
        updateDcB5Change();
        updateDcB3IntoB5Resolution();
        validateModel(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateFile(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateInvalidPath(ManagerTestConstants.B3_INTO_B5_DELETED);
        validateValidPath(ManagerTestConstants.CONFLICT_MASTER, ManagerTestConstants.B3_INTO_B5_DELETED);
    }

    @Test
    public void getCompiledResourceB5Merged_MasterIntoB4MergeCommitTest() throws Exception {
        addData(repo, "/testCatalogData/ontologyRecord/conflictBranches/b5IntoMaster.trig", RDFFormat.TRIG);
        updateDcB4Change();
        validateModel(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateFile(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateInvalidPath(ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
        validateValidPath(ManagerTestConstants.CONFLICT_B4, ManagerTestConstants.B4_CHANGE_DUPLICATE_ADD_DEL);
    }

    private void validateModel(Resource commitId) {
        try (RepositoryConnection conn = repo.getConnection()) {
            Model compiled = manager.getCompiledResource(commitId, conn);
            assertTrue(Models.isomorphic(compiled, dcterms));
        }
    }

    private void validateFile(Resource commitId) throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            File file = manager.getCompiledResourceFile(commitId, RDFFormat.TURTLE, conn);
            Model compiled = Rio.parse(new FileInputStream(file), RDFFormat.TURTLE);
            boolean deleted = file.delete();
            if (!deleted) {
                fail();
            }
            assertTrue(Models.isomorphic(compiled, dcterms));
        }
    }
    
    private void validateInvalidPath(Resource commitId) throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Model compiled = manager.getCompiledResource(VALUE_FACTORY.createIRI("urn:record"), VALUE_FACTORY.createIRI("urn:branch"), commitId, conn);
        } catch (IllegalArgumentException e) {
            assertTrue(true);
        } catch (Exception e) {
            fail();
        }
    }
    
    private void validateValidPath(Resource branchId, Resource commitId) throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Model compiled = manager.getCompiledResource(ManagerTestConstants.CONFLICT_RECORD, branchId, commitId, conn);
            assertTrue(Models.isomorphic(compiled, dcterms));
        }
    }

    // Refer to `/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesSetup.svg` and
    // `/testCatalogData/ontologyRecord/conflictBranches/conflictBranchesInitialMerge.svg` for structure context
    private void updateDcB1Change() {
        // 8240c71405
        dcterms.add(ManagerTestConstants.B1_ADD);
        dcterms.remove(ManagerTestConstants.B1_B2_DEL);
    }

    private void updateDcB2Change() {
        // f61f532171
        dcterms.add(ManagerTestConstants.B2_ADD);
        dcterms.remove(ManagerTestConstants.B1_B2_DEL);
    }

    private void updateDcB3Change() {
        // e51626992b
        dcterms.remove(DCTERMS.BIBLIOGRAPHIC_RESOURCE, null, null);
        dcterms.remove(DCTERMS.FREQUENCY, null, null);
        dcterms.remove(DCTERMS.BIBLIOGRAPHIC_CITATION, RDFS.DOMAIN, DCTERMS.BIBLIOGRAPHIC_RESOURCE);
        dcterms.remove(DCTERMS.ACCRUAL_PERIODICITY, RDFS.RANGE, DCTERMS.FREQUENCY);
    }

    private void updateDcB4Change() {
        // 05532d7199
        dcterms.add(ManagerTestConstants.M_B4_DUP_ADD);
        dcterms.remove(ManagerTestConstants.M_B4_DUP_DEL);
    }

    private void updateDcB5Change() {
        // 9b7dd215de
        dcterms.remove(DCTERMS.FREQUENCY, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A rate at which something recurs.", "en"));
        dcterms.add(DCTERMS.FREQUENCY, RDFS.COMMENT, VALUE_FACTORY.createLiteral("Comment modification (addition/deletion) for full delete conflict", "en"));
        dcterms.add(DCTERMS.BIBLIOGRAPHIC_RESOURCE, DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("Description addition for full delete conflict"));
    }

    private void updateDcDiffCommitChange() {
        // 621a8ade67
        dcterms.add(VALUE_FACTORY.createIRI("http://purl.org/dc/terms/#ExtraClassForDiffCommitCase"), RDF.TYPE, OWL.CLASS);
        dcterms.add(VALUE_FACTORY.createIRI("http://purl.org/dc/terms/#ExtraClassForDiffCommitCase"), DCTERMS.TITLE, VALUE_FACTORY.createLiteral("Extra Class for Diff Commit Case"));
    }

    private void updateDcMasterCommitChange() {
        // 93c7d13a16
        dcterms.add(ManagerTestConstants.M_B4_DUP_ADD);
        dcterms.remove(ManagerTestConstants.M_B4_DUP_DEL);
    }

    private void updateDcB2IntoB1Resolution() {
        // 47d1bc3832
        dcterms.remove(ManagerTestConstants.B1_ADD);
    }

    private void updateDcMasterIntoB4Resolution() {
        // 67c0329bd7
        dcterms.add(ManagerTestConstants.M_B4_DUP_DEL);
        dcterms.remove(ManagerTestConstants.M_B4_DUP_ADD);
    }

    private void updateDcB3IntoB5Resolution() throws Exception {
        // d0ff0ed204f
        dcterms.remove(DCTERMS.BIBLIOGRAPHIC_RESOURCE, DCTERMS.DESCRIPTION, VALUE_FACTORY.createLiteral("Description addition for full delete conflict"));
        InputStream in = this.getClass().getResourceAsStream("/testCatalogData/ontologyRecord/conflictBranches/dcterms.ttl");
        Model dctermsCopy = Rio.parse(in, RDFFormat.TURTLE);
        dcterms.addAll(dctermsCopy.filter(DCTERMS.FREQUENCY, null, null));
        dcterms.remove(DCTERMS.FREQUENCY, RDFS.COMMENT, VALUE_FACTORY.createLiteral("A rate at which something recurs.", "en"));
    }
}
