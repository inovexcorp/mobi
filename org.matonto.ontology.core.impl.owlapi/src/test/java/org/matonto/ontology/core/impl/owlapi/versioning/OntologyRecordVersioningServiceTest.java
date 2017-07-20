package org.matonto.ontology.core.impl.owlapi.versioning;

/*-
 * #%L
 * org.matonto.ontology.api
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

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.matonto.catalog.api.CatalogManager;
import org.matonto.catalog.api.CatalogUtilsService;
import org.matonto.catalog.api.builder.Difference;
import org.matonto.catalog.api.ontologies.mcat.Branch;
import org.matonto.catalog.api.ontologies.mcat.BranchFactory;
import org.matonto.catalog.api.ontologies.mcat.Commit;
import org.matonto.catalog.api.ontologies.mcat.CommitFactory;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommit;
import org.matonto.catalog.api.ontologies.mcat.InProgressCommitFactory;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.ontologies.usermanagement.UserFactory;
import org.matonto.ontologies.dcterms._Thing;
import org.matonto.ontology.core.api.OntologyManager;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import org.matonto.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import org.matonto.ontology.utils.cache.OntologyCache;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.core.impl.sesame.LinkedHashModelFactory;
import org.matonto.rdf.core.impl.sesame.SimpleValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import org.matonto.rdf.orm.conversion.impl.DoubleValueConverter;
import org.matonto.rdf.orm.conversion.impl.FloatValueConverter;
import org.matonto.rdf.orm.conversion.impl.IRIValueConverter;
import org.matonto.rdf.orm.conversion.impl.IntegerValueConverter;
import org.matonto.rdf.orm.conversion.impl.LiteralValueConverter;
import org.matonto.rdf.orm.conversion.impl.ResourceValueConverter;
import org.matonto.rdf.orm.conversion.impl.ShortValueConverter;
import org.matonto.rdf.orm.conversion.impl.StringValueConverter;
import org.matonto.rdf.orm.conversion.impl.ValueValueConverter;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.impl.sesame.SesameRepositoryWrapper;
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

public class OntologyRecordVersioningServiceTest {
    private Repository repo;
    private OntologyRecordVersioningService service;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory = new UserFactory();
    private OntologyRecordFactory ontologyRecordFactory = new OntologyRecordFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();

    private final IRI originalIRI = vf.createIRI("http://test.com/ontology");
    private final IRI newIRI = vf.createIRI("http://test.com/ontology/new");
    private final IRI usedIRI = vf.createIRI("http://test.com/ontology/used");
    private final IRI typeIRI = vf.createIRI(org.matonto.ontologies.rdfs.Resource.type_IRI);
    private final IRI ontologyIRI = vf.createIRI(OWL.ONTOLOGY.stringValue());

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

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(ontologyRecordFactory);

        branchFactory.setModelFactory(mf);
        branchFactory.setValueFactory(vf);
        branchFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(branchFactory);

        commitFactory.setModelFactory(mf);
        commitFactory.setValueFactory(vf);
        commitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(commitFactory);

        inProgressCommitFactory.setModelFactory(mf);
        inProgressCommitFactory.setValueFactory(vf);
        inProgressCommitFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(inProgressCommitFactory);

        vcr.registerValueConverter(new ResourceValueConverter());
        vcr.registerValueConverter(new IRIValueConverter());
        vcr.registerValueConverter(new DoubleValueConverter());
        vcr.registerValueConverter(new IntegerValueConverter());
        vcr.registerValueConverter(new FloatValueConverter());
        vcr.registerValueConverter(new ShortValueConverter());
        vcr.registerValueConverter(new StringValueConverter());
        vcr.registerValueConverter(new ValueValueConverter());
        vcr.registerValueConverter(new LiteralValueConverter());

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/testData.trig");
            conn.add(Values.matontoModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        user = userFactory.createNew(vf.createIRI("http://matonto.org/test/users#user"));
        inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#in-progress-commit"));
        commit = commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#commit"));
        branch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#branch"));
        branch.setHead(commit);
        record = ontologyRecordFactory.createNew(vf.createIRI("http://matonto.org/test/records#ontology-record"));
        record.setOntologyIRI(originalIRI);
        additions = Stream.of(vf.createStatement(newIRI, typeIRI, ontologyIRI));
        additionsUsed = Stream.of(vf.createStatement(usedIRI, typeIRI, ontologyIRI));
        additionsNoIRI = Stream.of(vf.createStatement(originalIRI, vf.createIRI(_Thing.title_IRI), vf.createLiteral("Title")));

        MockitoAnnotations.initMocks(this);

        when(catalogUtils.getBranch(any(OntologyRecord.class), any(Resource.class), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(branch);
        when(catalogUtils.getInProgressCommit(any(Resource.class), any(Resource.class), any(RepositoryConnection.class))).thenReturn(inProgressCommit);
        when(catalogUtils.getObject(any(Resource.class), eq(commitFactory), any(RepositoryConnection.class))).thenReturn(commit);
        when(catalogUtils.getAdditions(eq(commit), any(RepositoryConnection.class))).thenReturn(additions);
        when(catalogUtils.getObject(any(Resource.class), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(record);
        when(catalogUtils.applyDifference(any(Model.class), any(Difference.class))).thenAnswer(i -> i.getArgumentAt(1, Difference.class).getAdditions());
        when(catalogUtils.getCompiledResource(any(Resource.class), any(RepositoryConnection.class))).thenReturn(mf.createModel());

        when(ontologyManager.ontologyIriExists(usedIRI)).thenReturn(true);

        when(catalogManager.createCommit(any(InProgressCommit.class), anyString(), any(Commit.class), any(Commit.class))).thenReturn(commit);
        when(catalogManager.createInProgressCommit(any(User.class))).thenReturn(inProgressCommit);

        service = new OntologyRecordVersioningService();
        service.setOntologyRecordFactory(ontologyRecordFactory);
        service.setBranchFactory(branchFactory);
        service.setCatalogUtils(catalogUtils);
        service.setCommitFactory(commitFactory);
        service.setCatalogManager(catalogManager);
        service.setOntologyManager(ontologyManager);
        service.setOntologyCache(ontologyCache);
        service.setMf(mf);
        service.setVf(vf);
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
            assertEquals(null, service.getBranchHeadCommit(branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new-branch")), conn));
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
            Branch newBranch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));

            service.addCommit(newBranch, commit, conn);
            verify(catalogUtils).addCommit(newBranch, commit, conn);
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(Resource.class));
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
            verify(ontologyCache, times(0)).clearCacheImports(any(Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithCommitWithBaseAndNewOntologyIRITest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            commit.setBaseCommit(commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#new")));

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
            commit.setBaseCommit(commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#new")));
            OntologyRecord newRecord = ontologyRecordFactory.createNew(vf.createIRI("http://matonto.org/test/records#new"));
            when(catalogUtils.getObject(any(Resource.class), eq(ontologyRecordFactory), eq(conn))).thenReturn(newRecord);

            service.addCommit(branch, commit, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            verify(catalogUtils).getAdditions(commit, conn);
            verify(catalogUtils).getObject(any(Resource.class), eq(ontologyRecordFactory), eq(conn));
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
        commit.setBaseCommit(commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#new")));
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
            commit.setBaseCommit(commitFactory.createNew(vf.createIRI("http://matonto.org/test/commits#new")));
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
            Branch newBranch = branchFactory.createNew(vf.createIRI("http://matonto.org/test/branches#new"));
            Model additions = mf.createModel();
            Model deletions = mf.createModel();

            service.addCommit(newBranch, user, "Message", additions, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), eq(conn));
            verify(catalogUtils, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additions, deletions, conn);
            verify(catalogUtils).addCommit(newBranch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndNoBaseTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additions = mf.createModel();
            Model deletions = mf.createModel();

            service.addCommit(branch, user, "Message", additions, deletions, null, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", null, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), eq(conn));
            verify(catalogUtils, times(0)).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils, times(0)).getObject(record.getResource(), ontologyRecordFactory, conn);
            verify(ontologyManager, times(0)).ontologyIriExists(newIRI);
            verify(catalogUtils).updateCommit(commit, additions, deletions, conn);
            verify(catalogUtils).addCommit(branch, commit, conn);
            assertTrue(record.getOntologyIRI().isPresent());
            assertEquals(originalIRI, record.getOntologyIRI().get());
            verify(catalogUtils, times(0)).updateObject(record, conn);
            verify(ontologyCache, times(0)).clearCacheImports(any(Resource.class));
        }
    }

    @Test
    public void addCommitToMasterWithChangesAndBaseAndNoAuxTest() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            // Setup:
            Model additionsModel = mf.createModel(additions.collect(Collectors.toSet()));
            Model deletions = mf.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), eq(conn));
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
            Model additionsModel = mf.createModel(additions.collect(Collectors.toSet()));
            Model deletions = mf.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, commit, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, commit);
            verify(catalogUtils, times(2)).getCommitChain(commit.getResource(), false, conn);
            verify(catalogUtils).getCompiledResource(anyListOf(Resource.class), eq(conn));
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
            OntologyRecord newRecord = ontologyRecordFactory.createNew(vf.createIRI("http://matonto.org/test/records#new"));
            when(catalogUtils.getObject(any(Resource.class), eq(ontologyRecordFactory), eq(conn))).thenReturn(newRecord);
            Model additionsModel = mf.createModel(additions.collect(Collectors.toSet()));
            Model deletions = mf.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), eq(conn));
            verify(catalogUtils).applyDifference(any(Model.class), any(Difference.class));
            verify(catalogUtils).getObject(any(Resource.class), eq(ontologyRecordFactory), eq(conn));
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
        Model additionsModel = mf.createModel(additionsUsed.collect(Collectors.toSet()));
        Model deletions = mf.createModel();
        thrown.expect(IllegalArgumentException.class);
        thrown.expectMessage("Ontology already exists with IRI " + usedIRI);

        try (RepositoryConnection conn = repo.getConnection()) {
            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
        } finally {
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), any(RepositoryConnection.class));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), any(RepositoryConnection.class));
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
            Model additionsModel = mf.createModel(additionsNoIRI.collect(Collectors.toSet()));
            Model deletions = mf.createModel();

            service.addCommit(branch, user, "Message", additionsModel, deletions, commit, null, conn);
            verify(catalogManager).createInProgressCommit(user);
            verify(catalogManager).createCommit(inProgressCommit, "Message", commit, null);
            verify(catalogUtils, times(0)).getCommitChain(any(Resource.class), eq(false), eq(conn));
            verify(catalogUtils, times(0)).getCompiledResource(anyListOf(Resource.class), eq(conn));
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
