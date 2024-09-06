package com.mobi.catalog.impl.versioning;

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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
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


public class SimpleVersioningManagerTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private SimpleVersioningManager manager;
    // OrmFactory
    private final OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private final OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private final OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);

    private final IRI CATALOG_IRI = VALUE_FACTORY.createIRI("http://test.com#catalog");
    private User user;
    private VersionedRDFRecord record;
    private OntologyRecord ontologyRecord;
    private Branch targetBranch;
    private Branch sourceBranch;
    private Commit commit;

    @Mock
    private VersioningService<VersionedRDFRecord> baseService;

    @Mock
    private VersioningService<OntologyRecord> ontologyService;

    @Mock
    private RecordManager recordManager;

    @Mock
    private CatalogConfigProvider config;

    @Mock
    private BranchManager branchManager;

    @Before
    public void setUp() throws Exception {
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testVersioningData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));
        IRI titleIRI = VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue());
        record = versionedRDFRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record"));
        ontologyRecord = ontologyRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#ontology-record"));
        sourceBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#source-branch"));
        sourceBranch.addProperty(VALUE_FACTORY.createLiteral("Source"), titleIRI);
        targetBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#target-branch"));
        targetBranch.addProperty(VALUE_FACTORY.createLiteral("Target"), titleIRI);
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#commit"));
        sourceBranch.setHead(commit);
        targetBranch.setHead(commit);
//        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#in-progress-commit"));

        closeable = MockitoAnnotations.openMocks(this);

        when(config.getRepository()).thenReturn(repo);
        when(baseService.getTypeIRI()).thenReturn(VersionedRDFRecord.TYPE);
        when(ontologyService.getTypeIRI()).thenReturn(OntologyRecord.TYPE);

        when(recordManager.getRecord(any(Resource.class), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(recordManager.getRecord(any(Resource.class), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenReturn(ontologyRecord);
        when(recordManager.getRecord(any(Resource.class), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(ontologyRecord);

        when(branchManager.getBranch(any(VersionedRDFRecord.class), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class))).thenReturn(targetBranch);
        when(branchManager.getBranch(any(VersionedRDFRecord.class), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class))).thenReturn(sourceBranch);
        when(branchManager.getBranch(any(OntologyRecord.class), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class))).thenReturn(targetBranch);
        when(branchManager.getBranch(any(OntologyRecord.class), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class))).thenReturn(sourceBranch);

        manager = new SimpleVersioningManager();
        manager.recordManager = recordManager;
        manager.factoryRegistry = ORM_FACTORY_REGISTRY;
        manager.branchManager = branchManager;
        manager.addVersioningService(baseService);
        manager.addVersioningService(ontologyService);
        injectOrmFactoryReferencesIntoService(manager);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    /* commit(Resource, Resource, Resource, User, String) */

    @Test
    public void commitWithInProgressCommitToVersionedRDFRecordTest() throws Exception {
        MasterBranch masterBranch = masterBranchFactory.createNew(targetBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(record.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.addMasterCommit(eq(record), eq(masterBranch), eq(user),  eq("Message"), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // setup:
        Resource result = manager.commit(CATALOG_IRI, record.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());

        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(record), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).addMasterCommit(eq(record), eq(masterBranch), eq(user),  eq("Message"), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void commitWithInProgressCommitToOntologyRecordTest() throws Exception {
        MasterBranch masterBranch = masterBranchFactory.createNew(sourceBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(ontologyService.addBranchCommit(eq(ontologyRecord), eq(targetBranch), eq(user),  eq("Message"), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // setup:
        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService, never()).addBranchCommit(any(VersionedRDFRecord.class), any(Branch.class), any(User.class), any(String.class), any(RepositoryConnection.class));
        verify(ontologyService).addBranchCommit(eq(ontologyRecord), eq(targetBranch), eq(user),  eq("Message"), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void commitWithInProgressCommitToOntologyRecordWithoutServiceTest() throws Exception {
        MasterBranch masterBranch = masterBranchFactory.createNew(targetBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.addMasterCommit(eq(ontologyRecord), eq(masterBranch), eq(user),  eq("Message"), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // setup:
        manager.removeVersioningService(ontologyService);

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).addMasterCommit(eq(ontologyRecord), eq(masterBranch), eq(user),  eq("Message"), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    // TODO addBranchCommit

    /* merge(Resource, Resource, Resource, Resource, User, Model, Model) */

    @Test
    public void mergeWithVersionedRDFRecordMergeIntoMasterTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(targetBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(record.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.mergeIntoMaster(eq(record), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        Resource result = manager.merge(CATALOG_IRI, record.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(record), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(record), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).mergeIntoMaster(eq(record), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void mergeWithVersionedRDFRecordMergeIntoBranchTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(sourceBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(record.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.mergeIntoBranch(eq(record), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        Resource result = manager.merge(CATALOG_IRI, record.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(record), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(record), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).mergeIntoBranch(eq(record), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void mergeWithOntologyRecordMergeIntoMasterTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(targetBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(ontologyService.mergeIntoMaster(eq(ontologyRecord), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(ontologyService).mergeIntoMaster(eq(ontologyRecord), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void mergeWithOntologyRecordMergeIntoBranchTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(sourceBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(ontologyService.mergeIntoBranch(eq(ontologyRecord), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(ontologyService).mergeIntoBranch(eq(ontologyRecord), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void mergeWithOntologyRecordWithoutServiceMergeIntoMasterTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(targetBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.mergeIntoMaster(eq(ontologyRecord), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        manager.removeVersioningService(ontologyService);

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).mergeIntoMaster(eq(ontologyRecord), eq(sourceBranch), eq(masterBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

    @Test
    public void mergeWithOntologyRecordWithoutServiceMergeIntoBranchTest() throws Exception {
        Model additions = MODEL_FACTORY.createEmptyModel();
        Model deletions = MODEL_FACTORY.createEmptyModel();

        MasterBranch masterBranch = masterBranchFactory.createNew(sourceBranch.getResource());
        when(branchManager.getMasterBranch(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), any(RepositoryConnection.class))).thenReturn(masterBranch);
        when(baseService.mergeIntoBranch(eq(ontologyRecord), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());
        // Setup:
        manager.removeVersioningService(ontologyService);

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, new HashMap<>(), repo.getConnection());
        verify(recordManager).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(branchManager).getBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(BranchFactory.class), any(RepositoryConnection.class));
        verify(baseService).mergeIntoBranch(eq(ontologyRecord), eq(sourceBranch), eq(targetBranch), eq(user), eq(additions), eq(deletions), any(HashMap.class), any(RepositoryConnection.class));
        assertEquals(commit.getResource(), result);
    }

}
