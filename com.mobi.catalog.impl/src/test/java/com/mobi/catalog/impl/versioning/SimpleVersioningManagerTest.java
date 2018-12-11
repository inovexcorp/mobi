package com.mobi.catalog.impl.versioning;

/*-
 * #%L
 * com.mobi.catalog.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;

public class SimpleVersioningManagerTest extends OrmEnabledTestCase {
    private Repository repo;
    private SimpleVersioningManager manager;
    private OrmFactory<VersionedRDFRecord> versionedRDFRecordFactory = getRequiredOrmFactory(VersionedRDFRecord.class);
    private OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);

    private final IRI CATALOG_IRI = VALUE_FACTORY.createIRI("http://test.com#catalog");
    private User user;
    private VersionedRDFRecord record;
    private OntologyRecord ontologyRecord;
    private Branch targetBranch;
    private Branch sourceBranch;
    private Commit commit;
    private InProgressCommit inProgressCommit;

    @Mock
    private VersioningService<VersionedRDFRecord> baseService;

    @Mock
    private VersioningService<OntologyRecord> ontologyService;

    @Mock
    private CatalogUtilsService catalogUtils;

    @Mock
    private CatalogConfigProvider config;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testVersioningData.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
        OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);

        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#user"));
        IRI titleIRI = VALUE_FACTORY.createIRI(DCTERMS.TITLE.stringValue());
        record = versionedRDFRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#versioned-rdf-record"));
        ontologyRecord = ontologyRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#ontology-record"));
        sourceBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#source-branch"));
        sourceBranch.addProperty(VALUE_FACTORY.createLiteral("Source"), titleIRI);
        targetBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#target-branch"));
        targetBranch.addProperty(VALUE_FACTORY.createLiteral("Target"), titleIRI);
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#commit"));
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://test.com#in-progress-commit"));

        MockitoAnnotations.initMocks(this);

        when(catalogUtils.getRecord(any(Resource.class), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(catalogUtils.getRecord(any(Resource.class), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class))).thenReturn(ontologyRecord);
        when(catalogUtils.getRecord(any(Resource.class), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(ontologyRecord);

        when(baseService.getTypeIRI()).thenReturn(VersionedRDFRecord.TYPE);
        when(baseService.getTargetBranch(any(VersionedRDFRecord.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(targetBranch);
        when(baseService.getSourceBranch(any(VersionedRDFRecord.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(sourceBranch);
        when(baseService.getBranchHeadCommit(any(Branch.class), any(RepositoryConnection.class))).thenReturn(commit);
        when(baseService.getInProgressCommit(any(Resource.class), any(User.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(baseService.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(baseService.addCommit(any(Branch.class), any(User.class), anyString(), any(Model.class), any(Model.class), any(Commit.class), any(Commit.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());

        when(ontologyService.getTypeIRI()).thenReturn(OntologyRecord.TYPE);
        when(ontologyService.getTargetBranch(any(OntologyRecord.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(targetBranch);
        when(ontologyService.getSourceBranch(any(OntologyRecord.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(sourceBranch);
        when(ontologyService.getBranchHeadCommit(any(Branch.class), any(RepositoryConnection.class))).thenReturn(commit);
        when(ontologyService.getInProgressCommit(any(Resource.class), any(User.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(ontologyService.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(ontologyService.addCommit(any(Branch.class), any(User.class), anyString(), any(Model.class), any(Model.class), any(Commit.class), any(Commit.class), any(RepositoryConnection.class))).thenReturn(commit.getResource());

        when(config.getRepository()).thenReturn(repo);

        manager = new SimpleVersioningManager();
        manager.setConfig(config);
        manager.setCatalogUtils(catalogUtils);
        manager.setVf(VALUE_FACTORY);
        manager.setFactoryRegistry(ORM_FACTORY_REGISTRY);
        manager.addVersioningService(baseService);
        manager.addVersioningService(ontologyService);
    }

    /* commit(Resource, Resource, Resource, User, String) */

    @Test
    public void commitWithInProgressCommitToVersionedRDFRecordTest() throws Exception {
        Resource result = manager.commit(CATALOG_IRI, record.getResource(), targetBranch.getResource(), user, "Message");
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).getInProgressCommit(eq(record.getResource()), eq(user), any(RepositoryConnection.class));
        verify(baseService).createCommit(inProgressCommit, "Message", commit, null);
        verify(baseService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(baseService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithInProgressCommitToOntologyRecordTest() throws Exception {
        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message");
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).getInProgressCommit(eq(ontologyRecord.getResource()), eq(user), any(RepositoryConnection.class));
        verify(ontologyService).createCommit(inProgressCommit, "Message", commit, null);
        verify(ontologyService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(ontologyService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithInProgressCommitToOntologyRecordWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message");
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).getInProgressCommit(eq(ontologyRecord.getResource()), eq(user), any(RepositoryConnection.class));
        verify(baseService).createCommit(inProgressCommit, "Message", commit, null);
        verify(baseService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(baseService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    /* commit(Resource, Resource, Resource, User, String, RepositoryConnection) */

    @Test
    public void commitWithInProgressCommitWithRepoConnToVersionedRDFRecordTest() throws Exception {
        Resource result = manager.commit(CATALOG_IRI, record.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).getInProgressCommit(eq(record.getResource()), eq(user), any(RepositoryConnection.class));
        verify(baseService).createCommit(inProgressCommit, "Message", commit, null);
        verify(baseService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(baseService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithInProgressCommitWithRepoConnToOntologyRecordTest() throws Exception {
        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).getInProgressCommit(eq(ontologyRecord.getResource()), eq(user), any(RepositoryConnection.class));
        verify(ontologyService).createCommit(inProgressCommit, "Message", commit, null);
        verify(ontologyService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(ontologyService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithInProgressCommitWithRepoConnToOntologyRecordWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).getInProgressCommit(eq(ontologyRecord.getResource()), eq(user), any(RepositoryConnection.class));
        verify(baseService).createCommit(inProgressCommit, "Message", commit, null);
        verify(baseService).addCommit(eq(targetBranch), eq(commit), any(RepositoryConnection.class));
        verify(baseService).removeInProgressCommit(eq(inProgressCommit), any(RepositoryConnection.class));
    }


    /* commit(Resource, Resource, Resource, User, String, Model, Model) */

    @Test
    public void commitWithChangesToVersionedRDFRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, record.getResource(), targetBranch.getResource(), user, "Message", additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithChangesToOntologyRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithChangesToOntologyRecordWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    /* commit(Resource, Resource, Resource, User, String, Model, Model, RepositoryConnection) */

    @Test
    public void commitWithChangesWithRepoConnToVersionedRDFRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, record.getResource(), targetBranch.getResource(), user, "Message", additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithChangesWithRepoConnToOntologyRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    @Test
    public void commitWithChangesWithRepoConnToOntologyRecordWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Message"), eq(additions), eq(deletions), eq(commit), eq(null), any(RepositoryConnection.class));
    }

    /* merge(Resource, Resource, Resource, Resource, User, Model, Model) */

    @Test
    public void mergeWithVersionedRDFRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, record.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getSourceBranch(eq(record), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }

    @Test
    public void mergeWithOntologyRecordTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getSourceBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }

    @Test
    public void mergeWithOntologyRecordWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getSourceBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }

    /* merge(Resource, Resource, Resource, Resource, User, Model, Model, RepositoryConnection) */

    @Test
    public void mergeWithVersionedRDFRecordWithRepoConnTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, record.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(record.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getSourceBranch(eq(record), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(record), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }

    @Test
    public void mergeWithOntologyRecordWithRepoConnTest() throws Exception {
        // Setup:
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
        verify(ontologyService).getSourceBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(ontologyService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(ontologyService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }

    @Test
    public void mergeWithOntologyRecordWithRepoConnWithoutServiceTest() throws Exception {
        // Setup:
        manager.removeVersioningService(ontologyService);
        Model additions = MODEL_FACTORY.createModel();
        Model deletions = MODEL_FACTORY.createModel();

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions, repo.getConnection());
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getSourceBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }
}
