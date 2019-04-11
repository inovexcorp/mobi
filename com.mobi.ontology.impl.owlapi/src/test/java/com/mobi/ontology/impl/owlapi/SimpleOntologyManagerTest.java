package com.mobi.ontology.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
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
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.core.impl.sesame.SimpleIRI;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.io.InputStream;
import java.util.Collections;
import java.util.Optional;
import javax.cache.Cache;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyManagerTest extends OrmEnabledTestCase {

    @Mock
    private CatalogConfigProvider configProvider;

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private CatalogUtilsService catalogUtilsService;

    @Mock
    private SesameTransformer sesameTransformer;

    @Mock
    private OntologyId ontologyId;

    @Mock
    private Ontology ontology;

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

    private SimpleOntologyManager manager;
    private OrmFactory<OntologyRecord> ontologyRecordFactory = getRequiredOrmFactory(OntologyRecord.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<InProgressCommit> inProgressCommitFactory = getRequiredOrmFactory(InProgressCommit.class);
    private IRI missingIRI;
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    private IRI catalogIRI;
    private IRI ontologyIRI;
    private IRI versionIRI;
    private OntologyRecord record;
    private org.semanticweb.owlapi.model.IRI owlOntologyIRI;
    private org.semanticweb.owlapi.model.IRI owlVersionIRI;
    private Difference difference;
    private InProgressCommit inProgressCommit;
    private Model ontologyModel;
    private RepositoryManager repoManager = new SimpleRepositoryManager();
    private Repository repo;
    private Repository vocabRepo;

    @Before
    public void setUp() throws Exception {
        missingIRI = VALUE_FACTORY.createIRI("http://mobi.com/missing");
        recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/record");
        branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/branch");
        commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/commit");
        catalogIRI = VALUE_FACTORY.createIRI("http://mobi.com/catalog");
        ontologyIRI = VALUE_FACTORY.createIRI("http://mobi.com/ontology");
        versionIRI = VALUE_FACTORY.createIRI("http://mobi.com/ontology/1.0");
        owlOntologyIRI = org.semanticweb.owlapi.model.IRI.create("http://mobi.com/ontology");
        owlVersionIRI = org.semanticweb.owlapi.model.IRI.create("http://mobi.com/ontology/1.0");

        record = ontologyRecordFactory.createNew(recordIRI);
        MockitoAnnotations.initMocks(this);

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

        when(sesameTransformer.sesameModel(any(Model.class))).thenReturn(new org.eclipse.rdf4j.model.impl.LinkedHashModel());

        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        ontologyModel = Values.mobiModel(Rio.parse(testOntology, "", RDFFormat.TURTLE));
        when(ontology.asModel(MODEL_FACTORY)).thenReturn(ontologyModel);
        when(ontology.getImportsClosure()).thenReturn(Collections.singleton(ontology));
        when(ontology.getOntologyId()).thenReturn(ontologyId);
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.of(ontologyIRI));
        when(ontologyId.getOntologyIdentifier()).thenReturn(ontologyIRI);

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        when(vocabulary.asModel(MODEL_FACTORY)).thenReturn(Values.mobiModel(Rio.parse(testVocabulary, "", RDFFormat.TURTLE)));
        when(vocabulary.getImportsClosure()).thenReturn(Collections.singleton(vocabulary));

        when(catalogUtilsService.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenReturn(difference);
        when(catalogUtilsService.applyDifference(any(Model.class), any(Difference.class))).thenReturn(ontologyModel);

        PowerMockito.mockStatic(SimpleOntologyValues.class);
        when(SimpleOntologyValues.owlapiIRI(ontologyIRI)).thenReturn(owlOntologyIRI);
        when(SimpleOntologyValues.owlapiIRI(versionIRI)).thenReturn(owlVersionIRI);
        when(SimpleOntologyValues.mobiIRI(owlOntologyIRI)).thenReturn(ontologyIRI);
        when(SimpleOntologyValues.mobiIRI(owlVersionIRI)).thenReturn(versionIRI);

        when(mockCache.containsKey(anyString())).thenReturn(false);

        when(ontologyCache.getOntologyCache()).thenReturn(Optional.of(mockCache));
        when(ontologyCache.generateKey(anyString(), anyString())).thenReturn("test");

        repo = repoManager.createMemoryRepository();
        repo.initialize();
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.begin();
            InputStream testData = getClass().getResourceAsStream("/testCatalogData.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
            conn.add(ontology.asModel(MODEL_FACTORY));
            conn.commit();
        }
        vocabRepo = repoManager.createMemoryRepository();
        vocabRepo.initialize();
        try (RepositoryConnection conn = vocabRepo.getConnection()) {
            conn.add(vocabulary.asModel(MODEL_FACTORY));
        }
        when(mockRepoManager.createMemoryRepository()).thenReturn(repoManager.createMemoryRepository());

        when(configProvider.getRepository()).thenReturn(repo);
        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(sesameTransformer.sesameResource(any(Resource.class))).thenReturn(new SimpleIRI("http://test.com/ontology1"));

        manager = Mockito.spy(new SimpleOntologyManager());
        injectOrmFactoryReferencesIntoService(manager);
        manager.setValueFactory(VALUE_FACTORY);
        manager.setModelFactory(MODEL_FACTORY);
        manager.setSesameTransformer(sesameTransformer);
        manager.setConfigProvider(configProvider);
        manager.setCatalogManager(catalogManager);
        manager.setUtilsService(catalogUtilsService);
        manager.setRepositoryManager(mockRepoManager);
        manager.setOntologyCache(ontologyCache);
        manager.setbNodeService(bNodeService);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        vocabRepo.shutDown();
    }

    /* applyChanges */

    @Test
    public void testApplyChangesDifference() {
        manager.applyChanges(ontology, difference);
        verify(catalogUtilsService).applyDifference(eq(ontologyModel), eq(difference));
    }

    @Test
    public void testApplyChangesInProgressCommit() {
        manager.applyChanges(ontology, inProgressCommit);
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(catalogUtilsService).applyDifference(eq(ontologyModel), eq(difference));
    }

    @Test(expected = IllegalStateException.class)
    public void testApplyChangesInProgressCommitDifferenceNotFoundCommit() {
        when(catalogUtilsService.getCommitDifference(any(Resource.class), any(RepositoryConnection.class))).thenThrow(new IllegalStateException());
        manager.applyChanges(ontology, inProgressCommit);
    }

    @Test
    public void testApplyChangesInProgressCommitId() {
        manager.applyChanges(ontology, inProgressCommit.getResource());
        verify(catalogManager).getInProgressCommit(eq(catalogIRI), eq(recordIRI), eq(inProgressCommit.getResource()));
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(catalogUtilsService).applyDifference(eq(ontologyModel), eq(difference));
    }

    @Test
    public void testApplyChangesInProgressCommitIdOntologyIRINotSet() {
        when(ontologyId.getOntologyIRI()).thenReturn(Optional.empty());
        manager.applyChanges(ontology, inProgressCommit.getResource());
        verify(catalogManager).getInProgressCommit(eq(catalogIRI), eq(recordIRI), eq(inProgressCommit.getResource()));
        verify(catalogUtilsService).getCommitDifference(eq(inProgressCommit.getResource()), any(RepositoryConnection.class));
        verify(catalogUtilsService).applyDifference(eq(ontologyModel), eq(difference));
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
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<Ontology> result = manager.retrieveOntologyByIRI(ontologyIRI);
        assertTrue(result.isPresent());
        assertNotNull(result.get());
        assertNotEquals(ontology, result.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(result.get()));
    }

    @Test
    public void testRetrieveOntologyByIRIWithCacheHit() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> result = manager.retrieveOntologyByIRI(ontologyIRI);
        assertTrue(result.isPresent());
        assertEquals(ontology, result.get());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).get(eq(key));
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
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveOntology(recordIRI);
    }

    @Test
    public void testRetrieveOntologyWithCacheMiss() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyWithCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getMasterBranch(catalogIRI, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).get(eq(key));
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
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveOntology(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheMiss() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getBranch(catalogIRI, recordIRI, branchIRI, branchFactory)).thenReturn(Optional.of(branch));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).get(eq(key));
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
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheMiss() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(catalogManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertNotNull(optionalOntology.get());
        assertNotEquals(ontology, optionalOntology.get());
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache, times(2)).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheHit() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        String key = ontologyCache.generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        when(catalogManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI)).thenReturn(Optional.of(commit));
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());
        when(mockCache.containsKey(key)).thenReturn(true);
        when(mockCache.get(key)).thenReturn(ontology);

        Optional<Ontology> optionalOntology = manager.retrieveOntology(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
        assertEquals(ontology, optionalOntology.get());
        verify(mockCache).get(eq(key));
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
}
