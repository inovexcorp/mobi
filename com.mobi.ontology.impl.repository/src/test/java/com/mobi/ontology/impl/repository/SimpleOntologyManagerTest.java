package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.*;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Optional;

public class SimpleOntologyManagerTest extends OrmEnabledTestCase {

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private RecordManager recordManager;

    @Mock
    private BranchManager branchManager;

    @Mock
    private CommitManager commitManager;

    @Mock
    private DifferenceManager differenceManager;

    @Mock
    private CompiledResourceManager compiledResourceManager;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private SimpleOntology ontology;

    @Mock
    private Ontology nonSimpleOntology;

    @Mock
    private Ontology vocabulary;

    @Mock
    private OntologyCache ontologyCache;

    @Mock
    private RepositoryManager mockRepoManager;

    @Mock
    private DatasetUtilsService dsUtilsService;

    @Mock
    private RDFImportService importService;

    @Mock
    private OntologyCreationService ontologyCreationService;

    private AutoCloseable closeable;
    private SimpleOntologyManager manager;
    private final OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private final OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private final OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);
    private IRI missingIRI;
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private OntologyRecord record;
    private Difference difference;
    private InProgressCommit inProgressCommit;
    private Model ontologyModel;
    private Model model;
    private final RepositoryManager repoManager = new SimpleRepositoryManager();
    private OsgiRepository repo;
    private OsgiRepository vocabRepo;
    private OsgiRepository cacheRepo;
    private File file;

    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";

    @Before
    public void setUp() throws Exception {
        missingIRI = VALUE_FACTORY.createIRI("http://mobi.com/missing");
        recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/record");
        branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/branch");
        commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/commit");
        catalogIRI = VALUE_FACTORY.createIRI("http://mobi.com/catalog");
        ontologyIRI = VALUE_FACTORY.createIRI("http://mobi.com/ontology");

        record = ontologyRecordFactory.createNew(recordIRI);
        closeable = MockitoAnnotations.openMocks(this);

        difference = new Difference.Builder().build();
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("urn:inprogresscommit"));

        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
        Catalog catalog = catalogFactory.createNew(catalogIRI);
        when(catalogManager.getLocalCatalog(any(RepositoryConnection.class))).thenReturn(catalog);
        when(recordManager.getRecordOpt(eq(catalogIRI), eq(recordIRI), eq(ontologyRecordFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(record));
        when(branchManager.removeBranch(eq(catalogIRI), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(Collections.singletonList(commitIRI));
        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(catalogIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(branchManager).getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));

        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = Rio.parse(testOntology, "", RDFFormat.TURTLE);
        when(ontology.asModel()).thenReturn(ontologyModel);
        when(ontology.getImportsClosure()).thenReturn(Collections.singleton(ontology));
        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);

        when(nonSimpleOntology.asModel()).thenReturn(ontologyModel);
        when(nonSimpleOntology.getImportsClosure()).thenReturn(Collections.singleton(nonSimpleOntology));
        when(nonSimpleOntology.getOntologyId()).thenReturn(ontologyId);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);
        when(ontologyCreationService.createOntology(any(), any())).thenReturn(ontology);
        when(ontologyCreationService.createOntologyFromCommit(any(), any())).thenReturn(nonSimpleOntology);

        model = MODEL_FACTORY.createEmptyModel();
        model.add(VALUE_FACTORY.createIRI("urn:ontologyIRI"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue()));
        Path path = Files.createTempFile(null, null);
        Rio.write(model, Files.newOutputStream(path), RDFFormat.RDFXML);
        file = path.toFile();
        file.deleteOnExit();

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        when(vocabulary.asModel()).thenReturn(Rio.parse(testVocabulary, "", RDFFormat.TURTLE));
        when(vocabulary.getImportsClosure()).thenReturn(Collections.singleton(vocabulary));

        when(differenceManager.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(differenceManager.applyDifference(any(Model.class), any(Difference.class))).thenReturn(ontologyModel);

        when(ontologyCache.containsKey(anyString())).thenReturn(false);

        when(ontologyCache.generateKey(anyString(), anyString())).thenReturn("test");

        repo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.begin();
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
            conn.add(ontology.asModel());
            conn.commit();
        }
        vocabRepo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = vocabRepo.getConnection()) {
            conn.add(vocabulary.asModel());
        }
        cacheRepo = spy(repoManager.createMemoryRepository());
        when(cacheRepo.getRepositoryID()).thenReturn("ontologyCache");

        when(mockRepoManager.getRepository("ontologyCache")).thenReturn(Optional.of(cacheRepo));

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);

        doNothing().when(dsUtilsService).safeDeleteDataset(any(Resource.class), anyString());
        ArgumentCaptor<Resource> datasetIRICapture = ArgumentCaptor.forClass(Resource.class);
        when(dsUtilsService.createDataset(datasetIRICapture.capture(), anyString())).thenAnswer(invocation -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                Resource datasetIRI = datasetIRICapture.getValue();
                Dataset dataset = datasetFactory.createNew(datasetIRI);
                dataset.setSystemDefaultNamedGraph(VALUE_FACTORY.createIRI(datasetIRICapture.getValue().stringValue() + SYSTEM_DEFAULT_NG_SUFFIX));
                conn.add(dataset.getModel(), datasetIRI);
            }
            return true;
        });
        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(dsUtilsService.getConnection(resource.capture(), anyString())).thenAnswer(invocation -> {
            dsUtilsService.createDataset(resource.getValue(), "ontologyCache");
            return new SimpleDatasetRepositoryConnection(repo.getConnection(), resource.getValue(), "ontologyCache", VALUE_FACTORY);
        });

        doAnswer(invocation -> {
            Resource graph = invocation.getArgument(2, Resource.class);
            try (RepositoryConnection conn = cacheRepo.getConnection()) {
                conn.add(model, graph);
            }
            return null;
        }).when(importService).importFile(any(ImportServiceConfig.class), any(File.class), any(Resource.class));

        manager = Mockito.spy(new SimpleOntologyManager());
        injectOrmFactoryReferencesIntoService(manager);
        manager.configProvider = configProvider;
        manager.catalogManager = catalogManager;
        manager.recordManager = recordManager;
        manager.branchManager = branchManager;
        manager.commitManager = commitManager;
        manager.differenceManager = differenceManager;
        manager.compiledResourceManager = compiledResourceManager;
        manager.ontologyCache = ontologyCache;
        manager.ontologyCreationService = ontologyCreationService;
        manager.activate();
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        vocabRepo.shutDown();
        cacheRepo.shutDown();
        closeable.close();
    }

    /* applyChanges */

    @Test
    public void testApplyChangesDifference() {
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        manager.applyChanges(ontology, difference);
        verify(ontology).setDifference(eq(difference));
    }

    @Test
    public void testApplyChangesInProgressCommit() {
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);

        manager.applyChanges(ontology, inProgressCommit);
        verify(differenceManager).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(ontology).setDifference(eq(difference));
    }

    @Test(expected = MobiException.class)
    public void testApplyChangesDifferenceNotSimpleOntologyInstance() {
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        manager.applyChanges(nonSimpleOntology, difference);
    }

    @Test(expected = IllegalStateException.class)
    public void testApplyChangesInProgressCommitDifferenceNotFoundCommit() {
        when(differenceManager.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenThrow(new IllegalStateException());
        manager.applyChanges(ontology, inProgressCommit);
    }

    // Testing retrieveOntology(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyWithNonOntologyRecord() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(any(Resource.class), any(Resource.class), any(IRI.class), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyWithMissingIdentifier() {
        manager.retrieveOntology(missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithMasterBranchNotSet() {
        // Setup:
        doThrow(new IllegalStateException()).when(branchManager).getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithHeadCommitNotSet() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyWhenCompiledResourceCannotBeFound() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        doThrow(new IllegalArgumentException()).when(ontologyCreationService).createOntologyFromCommit(any(), any());

        manager.retrieveOntology(recordIRI);
    }

    @Test
    public void testRetrieveOntologyWithCacheMiss() {
        // Setup
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyWithCacheHit() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(ontologyCache.containsKey(key)).thenReturn(true);
        when(ontologyCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        verify(ontologyCache).containsKey(eq(key));
        verify(ontologyCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWithNonOntologyRecord() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(any(Resource.class), any(Resource.class), any(IRI.class), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWithMissingIdentifier() throws Exception {
        manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(branchManager).getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test
    public void testRetrieveOntologyUsingAMissingBranch() {
        // Setup:
        when(branchManager.getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Optional<Ontology> result = manager.retrieveOntology(recordIRI, branchIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchWithHeadCommitNotSet() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        when(branchManager.getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(branch));

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWhenCompiledResourceCannotBeFound() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(branch));
        doThrow(new IllegalArgumentException()).when(ontologyCreationService).createOntologyFromCommit(any(), any());

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheMiss() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(branch));

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(branchManager.getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(branchFactory), any(RepositoryConnection.class))).thenReturn(Optional.of(branch));
        when(ontologyCache.containsKey(key)).thenReturn(true);
        when(ontologyCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        verify(ontologyCache).containsKey(eq(key));
        verify(ontologyCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId, Resource commitId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWithNonOntologyRecord() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(any(Resource.class), any(Resource.class), any(IRI.class), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWithMissingIdentifier() throws Exception {
        manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(commitManager).getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));

        manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
    }

    @Test
    public void testRetrieveOntologyUsingAMissingCommit() {
        // Setup:
        when(commitManager.getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(Optional.empty());

        Optional<Ontology> result = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(Optional.of(commit));
        doThrow(new IllegalArgumentException()).when(ontologyCreationService).createOntologyFromCommit(any(), any());

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheMiss() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(Optional.of(commit));

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheHit() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(commitManager.getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(Optional.of(commit));
        when(ontologyCache.containsKey(key)).thenReturn(true);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        verify(ontologyCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    // Testing retrieveOntologyByCommit(Resource recordId, Resource commitId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyByCommitWithNonOntologyRecord() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(any(Resource.class), any(Resource.class), any(IRI.class), any(RepositoryConnection.class));

        manager.retrieveOntologyByCommit(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyByCommitThatDoesNotBelong() {
        // Setup:
        when(commitManager.commitInRecord(eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class))).thenReturn(false);

        Optional<Ontology> result = manager.retrieveOntologyByCommit(recordIRI, missingIRI);
        assertTrue(result.isEmpty());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyByCommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(true);
        doThrow(new IllegalArgumentException()).when(ontologyCreationService).createOntologyFromCommit(any(), any());

        manager.retrieveOntologyByCommit(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyByCommitCacheMiss() {
        // Setup:
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(true);

        Optional<Ontology> optionalOntology = manager.retrieveOntologyByCommit(recordIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyByCommitCacheHit() {
        // Setup:
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(true);
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(ontologyCache.containsKey(key)).thenReturn(true);

        Optional<Ontology> optionalOntology = manager.retrieveOntologyByCommit(recordIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        verify(ontologyCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }
}
