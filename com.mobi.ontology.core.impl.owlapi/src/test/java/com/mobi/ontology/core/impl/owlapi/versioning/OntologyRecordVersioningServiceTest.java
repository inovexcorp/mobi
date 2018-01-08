package com.mobi.ontology.core.impl.owlapi.versioning;

/*-
 * #%L
 * com.mobi.ontology.api
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


import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.anyListOf;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.OWL;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class OntologyRecordVersioningServiceTest extends OrmEnabledTestCase {
    private Repository repo;
    private OntologyRecordVersioningService service;
    private OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);

    private final IRI originalIRI = VALUE_FACTORY.createIRI("http://test.com/ontology");
    private final IRI newIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/new");
    private final IRI usedIRI = VALUE_FACTORY.createIRI("http://test.com/ontology/used");
    private final IRI typeIRI = VALUE_FACTORY.createIRI(com.mobi.ontologies.rdfs.Resource.type_IRI);
    private final IRI ontologyIRI = VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue());

    private User user;
    private OntologyRecord record;
    private Branch branch;
    private Commit commit;
    private InProgressCommit inProgressCommit;
    private Stream<Statement> additions;
    private Stream<Statement> additionsUsed;
    private Stream<Statement> additionsNoIRI;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private OntologyManager ontologyManager;

    @Mock
    private OntologyCache ontologyCache;
    
    @Mock
    private CatalogUtilsService catalogUtils;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        OrmFactory<User> userFactory = getRequiredOrmFactory(User.class);
        OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
        user = userFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/users#user"));
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#in-progress-commit"));
        commit = commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#commit"));
        branch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#branch"));
        branch.setHead(commit);
        record = ontologyRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#ontology-record"));
        record.setOntologyIRI(originalIRI);
        additions = Stream.of(VALUE_FACTORY.createStatement(newIRI, typeIRI, ontologyIRI));
        additionsUsed = Stream.of(VALUE_FACTORY.createStatement(usedIRI, typeIRI, ontologyIRI));
        additionsNoIRI = Stream.of(VALUE_FACTORY.createStatement(originalIRI, VALUE_FACTORY.createIRI(_Thing.title_IRI), VALUE_FACTORY.createLiteral("Title")));

        MockitoAnnotations.initMocks(this);

        when(catalogUtils.getBranch(any(OntologyRecord.class), any(com.mobi.rdf.api.Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(catalogUtils.getInProgressCommit(any(com.mobi.rdf.api.Resource.class), any(com.mobi.rdf.api.Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(catalogUtils.getObject(any(com.mobi.rdf.api.Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(catalogUtils.getAdditions(eq(commit), any(RepositoryConnection.class))).thenReturn(additions);
        when(catalogUtils.getObject(any(com.mobi.rdf.api.Resource.class), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(catalogUtils.applyDifference(any(Model.class), any(Difference.class))).thenAnswer(i -> i.getArgumentAt(1, Difference.class).getAdditions());
        when(catalogUtils.getCompiledResource(any(com.mobi.rdf.api.Resource.class), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createModel());

        when(ontologyManager.ontologyIriExists(usedIRI)).thenReturn(true);

        when(catalogManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        service = new OntologyRecordVersioningService();
        injectOrmFactoryReferencesIntoService(service);
        service.setCatalogUtils(catalogUtils);
        service.setCatalogManager(catalogManager);
        service.setOntologyManager(ontologyManager);
        service.setOntologyCache(ontologyCache);
        service.setMf(MODEL_FACTORY);
        service.setVf(VALUE_FACTORY);
    }

    @Test
    public void getTypeIRITest() throws Exception {
        assertEquals(OntologyRecord.TYPE, service.getTypeIRI());
    }

    @Test
    public void getSourceBranchTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(branch, service.getSourceBranch(record, branch.getResource(), conn));
            verify(catalogUtils).getBranch(record, branch.getResource(), branchFactory, conn);
        }
    }

    @Test
    public void getTargetBranchTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(branch, service.getTargetBranch(record, branch.getResource(), conn));
            verify(catalogUtils).getBranch(record, branch.getResource(), branchFactory, conn);
        }
    }

    @Test
    public void getInProgressCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(inProgressCommit, service.getInProgressCommit(record.getResource(), user, conn));
            verify(catalogUtils).getInProgressCommit(record.getResource(), user.getResource(), conn);
        }
    }

    @Test
    public void getBranchHeadCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(commit, service.getBranchHeadCommit(branch, conn));
            verify(catalogUtils).getObject(commit.getResource(), commitFactory, conn);
        }
    }

    @Test
    public void getBranchHeadCommitNotSetTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            assertEquals(null, service.getBranchHeadCommit(branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#new-branch")), conn));
            verify(catalogUtils, times(0)).getObject(commit.getResource(), commitFactory, conn);
        }
    }

    @Test
    public void removeInProgressCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            service.removeInProgressCommit(inProgressCommit, conn);
            verify(catalogUtils).removeInProgressCommit(inProgressCommit, conn);
        }
    }

    @Test
    public void createCommitTest() throws Exception {
        assertEquals(commit, service.createCommit(inProgressCommit, "Message", commit, null));
        verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
    }

    /* addCommit(Branch, Commit, RepositoryConnection) */

    @Test
    public void addCommitToOtherBranchWithCommitTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch newBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#new"));

            service.addCommit(newBranch, commit, conn);
            verify(catalogUtils).addCommit(newBranch, commit, conn);
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(com.mobi.rdf.api.Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithNoBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, commit, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(catalogUtils, times(0)).getAdditions(commit, conn);
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(com.mobi.rdf.api.Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndNewOntologyIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));

            service.addCommit(branch, commit, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(catalogUtils).getAdditions(commit, conn);
            verify(catalogUtils).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager).ontologyIriExists(newIRI);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(newIRI, record.getOntologyIRI().get());
            verify(catalogUtils).updateObject(record, conn);
            verify(ontologyCache).clearCacheImports(originalIRI);
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }

    @Test
    public void addCommitToMasterOfRecordWithoutIRIWithCommitWithBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
            OntologyRecord newRecord = ontologyRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#new"));
            when(catalogUtils.getObject(any(com.mobi.rdf.api.Resource.class), eq(ontologyRecordFactory), eq(conn))).thenReturn(newRecord);

            service.addCommit(branch, commit, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(catalogUtils).getAdditions(commit, conn);
            verify(catalogUtils).getObject(any(com.mobi.rdf.api.Resource.class), eq(ontologyRecordFactory), eq(conn));
            verify(ontologyManager).ontologyIriExists(newIRI);
            assertTrue(newRecord.getOntologyIRI().isPresent());
            assertEquals(newIRI, newRecord.getOntologyIRI().get());
            verify(catalogUtils).updateObject(newRecord, conn);
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndUsedOntologyIRITest() throws Exception {
        // Setup:
        commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
        when(catalogUtils.getAdditions(eq(commit), any(RepositoryConnection.class))).thenReturn(additionsUsed);
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Ontology already exists with IRI " + usedIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, commit, conn);
        } finally {
            verify(catalogUtils).getAdditions(eq(commit), any(RepositoryConnection.class));
            verify(catalogUtils).getObject(eq(record.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
            verify(catalogUtils, times(0)).addCommit(eq(branch), eq(commit), any(RepositoryConnection.class));
            verify(ontologyManager).ontologyIriExists(usedIRI);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(eq(record), any(RepositoryConnection.class));
            verify(ontologyCache).clearCacheImports(originalIRI);
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndNoIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/commits#new")));
            when(catalogUtils.getAdditions(commit, conn)).thenReturn(additionsNoIRI);

            service.addCommit(branch, commit, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(catalogUtils).getAdditions(commit, conn);
            verify(catalogUtils).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(any(IRI.class));
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache).clearCacheImports(originalIRI);
        }
    }

    /* addCommit(Branch, User, String, Model, Model, Commit, Commit, RepositoryConnection)*/

    @Test
    public void addCommitToOtherBranchWithChangesTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Branch newBranch = branchFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/branches#new"));
            Model additions = MODEL_FACTORY.createModel();
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(newBranch, user, "Message", additions, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additions, deletions, conn);
            verify(catalogUtils).addCommit(newBranch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(com.mobi.rdf.api.Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndNoBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additions = MODEL_FACTORY.createModel();
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(branch, user, "Message", additions, deletions, null, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", null, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additions, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(com.mobi.rdf.api.Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndBaseAndNoAuxTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createModel(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additionsModel, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(newIRI, record.getOntologyIRI().get());
            verify(catalogUtils).updateObject(record, conn);
            verify(ontologyCache).clearCacheImports(originalIRI);
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndBaseAndAuxTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createModel(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, commit, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, commit);
            verify(catalogUtils, times(2)).getCommitChain(commit.getResource(), false, conn);
            verify(catalogUtils).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additionsModel, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(newIRI, record.getOntologyIRI().get());
            verify(catalogUtils).updateObject(record, conn);
            verify(ontologyCache).clearCacheImports(originalIRI);
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }

    @Test
    public void addCommitToMasterOfRecordWithoutIRIWithChangesAndBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            OntologyRecord newRecord = ontologyRecordFactory.createNew(VALUE_FACTORY.createIRI("http://mobi.com/test/records#new"));
            when(catalogUtils.getObject(any(com.mobi.rdf.api.Resource.class), eq(ontologyRecordFactory), eq(conn))).thenReturn(newRecord);
            Model additionsModel = MODEL_FACTORY.createModel(additions.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(any(com.mobi.rdf.api.Resource.class), eq(ontologyRecordFactory), eq(conn));
            verify(ontologyManager).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additionsModel, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            assertTrue(newRecord.getOntologyIRI().isPresent());
            assertEquals(newIRI, newRecord.getOntologyIRI().get());
            verify(catalogUtils).updateObject(newRecord, conn);
            verify(ontologyCache).clearCacheImports(newIRI);
        }
    }

    @Test
    public void addCommitToMasterWithChangesWithBaseAndUsedOntologyIRITest() throws Exception {
        // Setup:
        Model additionsModel = MODEL_FACTORY.createModel(additionsUsed.collect(Collectors.toSet()));
        Model deletions = MODEL_FACTORY.createModel();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Ontology already exists with IRI " + usedIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
        } finally {
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), any(RepositoryConnection.class));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), any(RepositoryConnection.class));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(eq(record.getResource()), eq(ontologyRecordFactory), any(RepositoryConnection.class));
            verify(ontologyManager).ontologyIriExists(usedIRI);
            verify(catalogUtils, times(0)).updateCommit(eq(commit), eq(additionsModel), eq(deletions), any(RepositoryConnection.class));
            verify(catalogUtils, times(0)).addCommit(eq(branch), eq(commit), any(RepositoryConnection.class));
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(eq(record), any(RepositoryConnection.class));
            verify(ontologyCache).clearCacheImports(originalIRI);
        }
    }

    @Test
    public void addCommitToMasterWithChangesWithBaseAndNoIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = MODEL_FACTORY.createModel(additionsNoIRI.collect(Collectors.toSet()));
            Model deletions = MODEL_FACTORY.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(com.mobi.rdf.api.Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(com.mobi.rdf.api.Resource.class), eq(conn));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additionsModel, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(any(IRI.class));
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache).clearCacheImports(originalIRI);
        }
    }
}
