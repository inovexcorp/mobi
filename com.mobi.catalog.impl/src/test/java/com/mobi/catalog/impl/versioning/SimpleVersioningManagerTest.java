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
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecordFactory;
import org.junit.Before;
import org.junit.Test;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.BranchFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.VersioningService;
import com.mobi.etl.api.ontologies.delimited.MappingRecordFactory;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecordFactory;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.LinkedHashModelFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DefaultValueConverterRegistry;
import com.mobi.rdf.orm.conversion.impl.DoubleValueConverter;
import com.mobi.rdf.orm.conversion.impl.FloatValueConverter;
import com.mobi.rdf.orm.conversion.impl.IRIValueConverter;
import com.mobi.rdf.orm.conversion.impl.IntegerValueConverter;
import com.mobi.rdf.orm.conversion.impl.LiteralValueConverter;
import com.mobi.rdf.orm.conversion.impl.ResourceValueConverter;
import com.mobi.rdf.orm.conversion.impl.ShortValueConverter;
import com.mobi.rdf.orm.conversion.impl.StringValueConverter;
import com.mobi.rdf.orm.conversion.impl.ValueValueConverter;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.openrdf.model.vocabulary.DCTERMS;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.openrdf.sail.memory.MemoryStore;

import java.io.InputStream;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class SimpleVersioningManagerTest {
    private Repository repo;
    private SimpleVersioningManager manager;
    private ValueFactory vf = SimpleValueFactory.getInstance();
    private ModelFactory mf = LinkedHashModelFactory.getInstance();
    private ValueConverterRegistry vcr = new DefaultValueConverterRegistry();
    private UserFactory userFactory = new UserFactory();
    private VersionedRDFRecordFactory versionedRDFRecordFactory = new VersionedRDFRecordFactory();
    private OntologyRecordFactory ontologyRecordFactory = new OntologyRecordFactory();
    private MappingRecordFactory mappingRecordFactory = new MappingRecordFactory();
    private BranchFactory branchFactory = new BranchFactory();
    private CommitFactory commitFactory = new CommitFactory();
    private InProgressCommitFactory inProgressCommitFactory = new InProgressCommitFactory();

    private final IRI CATALOG_IRI = vf.createIRI("http://test.com#catalog");
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
    private OrmFactoryRegistry registry;

    @Mock
    private CatalogUtilsService catalogUtils;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private RepositoryManager repositoryManager;

    @Before
    public void setUp() throws Exception {
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        userFactory.setModelFactory(mf);
        userFactory.setValueFactory(vf);
        userFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(userFactory);

        versionedRDFRecordFactory.setModelFactory(mf);
        versionedRDFRecordFactory.setValueFactory(vf);
        versionedRDFRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(versionedRDFRecordFactory);

        ontologyRecordFactory.setModelFactory(mf);
        ontologyRecordFactory.setValueFactory(vf);
        ontologyRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(ontologyRecordFactory);

        mappingRecordFactory.setModelFactory(mf);
        mappingRecordFactory.setValueFactory(vf);
        mappingRecordFactory.setValueConverterRegistry(vcr);
        vcr.registerValueConverter(mappingRecordFactory);

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
            InputStream testData = getClass().getResourceAsStream("/testVersioningData.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        user = userFactory.createNew(vf.createIRI("http://test.com#user"));
        IRI titleIRI = vf.createIRI(DCTERMS.TITLE.stringValue());
        record = versionedRDFRecordFactory.createNew(vf.createIRI("http://mobi.com/test/records#versioned-rdf-record"));
        ontologyRecord = ontologyRecordFactory.createNew(vf.createIRI("http://mobi.com/test/records#ontology-record"));
        sourceBranch = branchFactory.createNew(vf.createIRI("http://test.com#source-branch"));
        sourceBranch.addProperty(vf.createLiteral("Source"), titleIRI);
        targetBranch = branchFactory.createNew(vf.createIRI("http://test.com#target-branch"));
        targetBranch.addProperty(vf.createLiteral("Target"), titleIRI);
        commit = commitFactory.createNew(vf.createIRI("http://test.com#commit"));
        inProgressCommit = inProgressCommitFactory.createNew(vf.createIRI("http://test.com#in-progress-commit"));

        MockitoAnnotations.initMocks(this);

        when(registry.getSortedFactoriesOfType(VersionedRDFRecord.class)).thenReturn(Stream.of(mappingRecordFactory, ontologyRecordFactory, versionedRDFRecordFactory).collect(Collectors.toList()));

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

        when(catalogManager.getRepositoryId()).thenReturn("system");

        when(repositoryManager.getRepository("system")).thenReturn(Optional.of(repo));

        manager = new SimpleVersioningManager();
        manager.setRepositoryManager(repositoryManager);
        manager.setCatalogManager(catalogManager);
        manager.setCatalogUtils(catalogUtils);
        manager.setVf(vf);
        manager.setFactoryRegistry(registry);
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

    /* commit(Resource, Resource, Resource, User, String, Model, Model) */

    @Test
    public void commitWithChangesToVersionedRDFRecordTest() throws Exception {
        // Setup:
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

        Resource result = manager.commit(CATALOG_IRI, ontologyRecord.getResource(), targetBranch.getResource(), user, "Message", additions, deletions);
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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

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
        Model additions = mf.createModel();
        Model deletions = mf.createModel();

        Resource result = manager.merge(CATALOG_IRI, ontologyRecord.getResource(), sourceBranch.getResource(), targetBranch.getResource(), user, additions, deletions);
        assertEquals(commit.getResource(), result);
        verify(catalogUtils).getRecord(eq(CATALOG_IRI), eq(ontologyRecord.getResource()), eq(versionedRDFRecordFactory), any(RepositoryConnection.class));
        verify(baseService).getSourceBranch(eq(ontologyRecord), eq(sourceBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getTargetBranch(eq(ontologyRecord), eq(targetBranch.getResource()), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(sourceBranch), any(RepositoryConnection.class));
        verify(baseService).getBranchHeadCommit(eq(targetBranch), any(RepositoryConnection.class));
        verify(baseService).addCommit(eq(targetBranch), eq(user), eq("Merge of Source into Target"), eq(additions), eq(deletions), eq(commit), eq(commit), any(RepositoryConnection.class));
    }
}
