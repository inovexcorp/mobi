package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.impl.SimpleDatasetRepositoryConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.repository.api.OsgiRepository;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import org.apache.commons.lang.NotImplementedException;
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
import javax.cache.Cache;

public class SimpleOntologyManagerTest extends OrmEnabledTestCase {

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogUtilsService catalogUtilsService;

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
    private Cache<String, Ontology> mockCache;

    @Mock
    private RepositoryManager mockRepoManager;

    @Mock
    private BNodeService bNodeService;

    @Mock
    private ImportsResolver importsResolver;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private RDFImportService importService;

    private AutoCloseable closeable;
    private SimpleOntologyManager manager;
    private OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);
    private IRI missingIRI;
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private IRI versionIRI;
    private OntologyRecord record;
    private Difference difference;
    private InProgressCommit inProgressCommit;
    private Model ontologyModel;
    private Model model;
    private RepositoryManager repoManager = new SimpleRepositoryManager();
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
        versionIRI = VALUE_FACTORY.createIRI("http://mobi.com/ontology/1.0");

        record = ontologyRecordFactory.createNew(recordIRI);
        closeable = MockitoAnnotations.openMocks(this);

        difference = new Difference.Builder().build();
        inProgressCommit = inProgressCommitFactory.createNew(VALUE_FACTORY.createIRI("urn:inprogresscommit"));

        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
        Catalog catalog = catalogFactory.createNew(catalogIRI);
        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.removeRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(record);
        when(catalogManager.removeBranch(catalogIRI, recordIRI, branchIRI)).thenReturn(Collections.singletonList(commitIRI));
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.of(inProgressCommit));
        doThrow(new IllegalArgumentException()).when(catalogManager).getMasterBranch(catalogIRI, missingIRI);
        doThrow(new IllegalArgumentException()).when(catalogManager).getBranch(catalogIRI, recordIRI, missingIRI, branchFactory);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommit(catalogIRI, recordIRI, branchIRI, missingIRI);

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

        model = MODEL_FACTORY.createEmptyModel();
        model.add(VALUE_FACTORY.createIRI("urn:ontologyIRI"), VALUE_FACTORY.createIRI(RDF.TYPE.stringValue()), VALUE_FACTORY.createIRI(OWL.ONTOLOGY.stringValue()));
        Path path = Files.createTempFile(null, null);
        Rio.write(model, Files.newOutputStream(path), RDFFormat.RDFXML);
        file = path.toFile();
        file.deleteOnExit();

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        when(vocabulary.asModel()).thenReturn(Rio.parse(testVocabulary, "", RDFFormat.TURTLE));
        when(vocabulary.getImportsClosure()).thenReturn(Collections.singleton(vocabulary));

        when(catalogUtilsService.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(catalogUtilsService.applyDifference(any(Model.class), any(Difference.class))).thenReturn(ontologyModel);

        when(mockCache.containsKey(anyString())).thenReturn(false);

        when(ontologyCache.getOntologyCache()).thenReturn(Optional.of(mockCache));
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

        doNothing().when(datasetManager).safeDeleteDataset(any(Resource.class), anyString(), anyBoolean());
        ArgumentCaptor<String> datasetIRIStr = ArgumentCaptor.forClass(String.class);
        when(datasetManager.createDataset(datasetIRIStr.capture(), anyString())).thenAnswer(invocation -> {
            try (RepositoryConnection conn = repo.getConnection()) {
                Resource datasetIRI = VALUE_FACTORY.createIRI(datasetIRIStr.getValue());
                Dataset dataset = datasetFactory.createNew(datasetIRI);
                dataset.setSystemDefaultNamedGraph(VALUE_FACTORY.createIRI(datasetIRIStr.getValue() + SYSTEM_DEFAULT_NG_SUFFIX));
                conn.add(dataset.getModel(), datasetIRI);
            }
            return true;
        });
        ArgumentCaptor<Resource> resource = ArgumentCaptor.forClass(Resource.class);
        when(datasetManager.getConnection(resource.capture(), anyString(), anyBoolean())).thenAnswer(invocation -> {
            datasetManager.createDataset(resource.getValue().stringValue(), "ontologyCache");
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
        manager.setConfigProvider(configProvider);
        manager.setCatalogManager(catalogManager);
        manager.setUtilsService(catalogUtilsService);
        manager.setRepositoryManager(mockRepoManager);
        manager.addOntologyCache(ontologyCache);
        manager.setbNodeService(bNodeService);
        manager.setImportsResolver(importsResolver);
        manager.setDatasetManager(datasetManager);
        manager.setRDFImportService(importService);
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
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        manager.applyChanges(ontology, difference);
        verify(ontology).setDifference(eq(difference));
    }

    @Test
    public void testApplyChangesInProgressCommit() {
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);

        manager.applyChanges(ontology, inProgressCommit);
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(ontology).setDifference(eq(difference));
    }

    @Test(expected = MobiException.class)
    public void testApplyChangesDifferenceNotSimpleOntologyInstance() {
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        manager.applyChanges(nonSimpleOntology, difference);
    }

    @Test(expected = IllegalStateException.class)
    public void testApplyChangesInProgressCommitDifferenceNotFoundCommit() {
        when(catalogUtilsService.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenThrow(new IllegalStateException());
        manager.applyChanges(ontology, inProgressCommit);
    }

    @Test
    public void testApplyChangesInProgressCommitId() {
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);

        manager.applyChanges(ontology, inProgressCommit.getResource());
        verify(ontologyId).getOntologyIRI();
        verify(ontologyId).getOntologyIdentifier();
        verify(catalogManager).getInProgressCommit(eq(catalogIRI), eq(recordIRI), eq(inProgressCommit.getResource()));
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(ontology).setDifference(eq(difference));
    }

    @Test
    public void testApplyChangesInProgressCommitIdOntologyIRINotSet() {
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);

        when(ontologyId.getOntologyIRI()).thenReturn(Optional.empty());
        manager.applyChanges(ontology, inProgressCommit.getResource());
        verify(ontologyId).getOntologyIRI();
        verify(ontologyId).getOntologyIdentifier();
        verify(catalogManager).getInProgressCommit(eq(catalogIRI), eq(recordIRI), eq(inProgressCommit.getResource()));
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(ontology).setDifference(eq(difference));
    }

    @Test(expected = MobiException.class)
    public void testApplyChangesInProgressCommitIdNotSimpleOntology() {
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);

        when(ontologyId.getOntologyIRI()).thenReturn(Optional.empty());
        manager.applyChanges(nonSimpleOntology, inProgressCommit.getResource());
    }

    @Test(expected = IllegalStateException.class)
    public void testApplyChangesInProgressCommitIdRecordNotFound() {
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(versionIRI));
        manager.applyChanges(ontology, inProgressCommit.getResource());
    }

    @Test(expected = IllegalStateException.class)
    public void testApplyChangesInProgressCommitIdInProgressCommitNotFound() {
        when(catalogManager.getInProgressCommit(any(Resource.class), any(Resource.class), any(Resource.class))).thenReturn(Optional.empty());
        manager.applyChanges(ontology, inProgressCommit.getResource());
    }

    // Testing retrieveOntologyByIRI

    @Test
    public void testRetrieveOntologyByIRIThatDoesNotExist() {
        Optional<Ontology> result = manager.retrieveOntologyByIRI(missingIRI);
        assertFalse(result.isPresent());
    }

    @Test
    public void testRetrieveOntologyByIRIWithCacheMiss() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResourceFile(commitIRI)).thenReturn(file);

        Optional<Ontology> result = manager.retrieveOntologyByIRI(ontologyIRI);
        assertTrue(result.isPresent());
        assertNotNull(result.get());
        assertNotEquals(ontology, result.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyByIRIWithCacheHit() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(mockCache.containsKey(key)).thenReturn(true);

        Optional<Ontology> result = manager.retrieveOntologyByIRI(ontologyIRI);
        assertTrue(result.isPresent());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache, times(0)).put(eq(key), eq(result.get()));
    }

    // Testing retrieveOntology(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyWithMissingIdentifier() {
        manager.retrieveOntology(missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithMasterBranchNotSet() {
        // Setup:
        doThrow(new IllegalStateException()).when(catalogManager).getMasterBranch(catalogIRI, recordIRI);

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyWithHeadCommitNotSet() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);

        manager.retrieveOntology(recordIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyWhenCompiledResourceCannotBeFound() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResourceFile(commitIRI);

        manager.retrieveOntology(recordIRI);
    }

    @Test
    public void testRetrieveOntologyWithCacheMiss() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResourceFile(commitIRI)).thenReturn(file);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyWithCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWithMissingIdentifier() throws Exception {
        manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(catalogManager).getBranch(catalogIRI, recordIRI, missingIRI, branchFactory);

        manager.retrieveOntology(recordIRI, missingIRI);
    }

    @Test
    public void testRetrieveOntologyUsingAMissingBranch() {
        // Setup:
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.empty());

        Optional<Ontology> result = manager.retrieveOntology(recordIRI, branchIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingABranchWithHeadCommitNotSet() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingABranchWhenCompiledResourceCannotBeFound() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResourceFile(commitIRI);

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheMiss() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResourceFile(commitIRI)).thenReturn(file);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    // Testing retrieveOntology(Resource recordId, Resource branchId, Resource commitId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWithMissingIdentifier() throws Exception {
        manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyUsingACommitThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(catalogManager).getCommit(catalogIRI,recordIRI, branchIRI, missingIRI);

        manager.retrieveOntology(recordIRI, branchIRI, missingIRI);
    }

    @Test
    public void testRetrieveOntologyUsingAMissingCommit() {
        // Setup:
        when(catalogManager.getCommit(catalogIRI,recordIRI, branchIRI, commitIRI)).thenReturn(Optional.empty());

        Optional<Ontology> result = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertFalse(result.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveOntologyUsingACommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(catalogManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI)).thenReturn(Optional.of(commit));
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResourceFile(commitIRI);

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheMiss() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(catalogManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResourceFile(commitIRI)).thenReturn(file);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheHit() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createEmptyModel());
        when(mockCache.containsKey(key)).thenReturn(true);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        verify(mockCache, times(0)).put(eq(key), eq(optionalOntology.get()));
    }

    /* Testing deleteOntologyBranch(Resource recordId, Resource branchId) */

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteOntologyBranchWithMissingIdentifier() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).removeBranch(catalogIRI, recordIRI, missingIRI);

        manager.deleteOntologyBranch(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testDeleteOntologyBranchWithInvalidCommit() {
        // Setup:
        doThrow(new IllegalStateException()).when(catalogManager).removeBranch(catalogIRI, recordIRI, missingIRI);

        manager.deleteOntologyBranch(recordIRI, missingIRI);
    }

    @Test
    public void testDeleteOntologyBranch() throws Exception {
        manager.deleteOntologyBranch(recordIRI, branchIRI);
        verify(catalogManager).removeBranch(catalogIRI, recordIRI, branchIRI);
        verify(ontologyCache).removeFromCache(recordIRI.stringValue(), commitIRI.stringValue());
    }

    /* createOntology */

    @Test(expected = NotImplementedException.class)
    public void testCreateOntologyWithModel() throws Exception {
        manager.createOntology(model);
    }

    @Test(expected = NotImplementedException.class)
    public void testCreateOntologyWithStream() throws Exception {
        manager.createOntology(getClass().getResourceAsStream("/test-ontology.ttl"), false);
    }
}
