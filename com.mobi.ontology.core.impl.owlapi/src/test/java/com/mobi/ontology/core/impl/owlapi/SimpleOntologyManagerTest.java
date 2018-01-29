package com.mobi.ontology.core.impl.owlapi;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.builder.OntologyRecordConfig;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.core.SimpleRepositoryManager;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.Rio;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;
import org.semanticweb.owlapi.model.OWLOntology;

import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.cache.Cache;

@RunWith(PowerMockRunner.class)
@PrepareForTest(SimpleOntologyValues.class)
public class SimpleOntologyManagerTest extends OrmEnabledTestCase {

    @Mock
    private CatalogManager catalogManager;

    @Mock
    private SesameTransformer sesameTransformer;

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

        OrmFactory<Catalog> catalogFactory = getRequiredOrmFactory(Catalog.class);
        Catalog catalog = catalogFactory.createNew(catalogIRI);
        when(catalogManager.getRepositoryId()).thenReturn("system");
        when(catalogManager.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(catalogManager.getLocalCatalog()).thenReturn(catalog);
        when(catalogManager.createRecord(any(RecordConfig.class), eq(ontologyRecordFactory))).thenReturn(record);
        when(catalogManager.getRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(Optional.of(record));
        when(catalogManager.removeRecord(catalogIRI, recordIRI, ontologyRecordFactory)).thenReturn(record);
        doThrow(new IllegalArgumentException()).when(catalogManager).getMasterBranch(catalogIRI, missingIRI);
        doThrow(new IllegalArgumentException()).when(catalogManager).getBranch(catalogIRI, recordIRI, missingIRI, branchFactory);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommit(catalogIRI, recordIRI, branchIRI, missingIRI);

        when(sesameTransformer.sesameModel(any(Model.class))).thenReturn(new org.openrdf.model.impl.LinkedHashModel());

        InputStream testOntology = getClass().getResourceAsStream("/test-ontology.ttl");
        when(ontology.asModel(MODEL_FACTORY)).thenReturn(Values.mobiModel(Rio.parse(testOntology, "", RDFFormat.TURTLE)));
        when(ontology.getImportsClosure()).thenReturn(Collections.singleton(ontology));

        InputStream testVocabulary = getClass().getResourceAsStream("/test-vocabulary.ttl");
        when(vocabulary.asModel(MODEL_FACTORY)).thenReturn(Values.mobiModel(Rio.parse(testVocabulary, "", RDFFormat.TURTLE)));
        when(vocabulary.getImportsClosure()).thenReturn(Collections.singleton(vocabulary));

        PowerMockito.mockStatic(SimpleOntologyValues.class);
        when(SimpleOntologyValues.owlapiIRI(ontologyIRI)).thenReturn(owlOntologyIRI);
        when(SimpleOntologyValues.owlapiIRI(versionIRI)).thenReturn(owlVersionIRI);
        when(SimpleOntologyValues.mobiIRI(owlOntologyIRI)).thenReturn(ontologyIRI);
        when(SimpleOntologyValues.mobiIRI(owlVersionIRI)).thenReturn(versionIRI);
        when(SimpleOntologyValues.mobiOntology(any(OWLOntology.class))).thenReturn(ontology);

        when(mockCache.containsKey(anyString())).thenReturn(false);

        when(ontologyCache.getOntologyCache()).thenReturn(Optional.of(mockCache));
        when(ontologyCache.generateKey(anyString(), anyString(), anyString())).thenReturn("test");

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
        when(mockRepoManager.getRepository("system")).thenReturn(Optional.of(repo));

        manager = Mockito.spy(new SimpleOntologyManager());
        injectOrmFactoryReferencesIntoService(manager);
        manager.setValueFactory(VALUE_FACTORY);
        manager.setModelFactory(MODEL_FACTORY);
        manager.setSesameTransformer(sesameTransformer);
        manager.setCatalogManager(catalogManager);
        manager.setRepositoryManager(mockRepoManager);
        manager.setOntologyCache(ontologyCache);
        manager.setbNodeService(bNodeService);
    }

    @After
    public void tearDown() throws Exception {
        repo.shutDown();
        vocabRepo.shutDown();
    }

    @Test
    public void testCreateOntologyRecordWithOntologyIRI() throws Exception {
        IRI ontologyIRI = VALUE_FACTORY.createIRI("http://test.com/ontology");
        OntologyRecordConfig config = new OntologyRecordConfig.OntologyRecordBuilder("title", Collections.emptySet())
                .ontologyIRI(ontologyIRI).build();

        OntologyRecord result = manager.createOntologyRecord(config);
        assertTrue(result.getOntologyIRI().isPresent());
        assertEquals(ontologyIRI, result.getOntologyIRI().get());
    }

    @Test
    public void testCreateOntologyRecordWithoutOntologyIRI() throws Exception {
        OntologyRecordConfig config = new OntologyRecordConfig.OntologyRecordBuilder("title", Collections.emptySet())
                .build();

        OntologyRecord record = manager.createOntologyRecord(config);
        assertFalse(record.getOntologyIRI().isPresent());
    }

    // Testing retrieveOntologyByIRI

    @Test(expected = IllegalStateException.class)
    public void testRetrieveOntologyByIRIWithMissingRepo() {
        // Setup:
        doReturn(Optional.empty()).when(mockRepoManager).getRepository(anyString());

        manager.retrieveOntologyByIRI(ontologyIRI);
    }

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
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(result.get()));
    }

    @Test
    public void testRetrieveOntologyByIRIWithCacheHit() {
        // Setup
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
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
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyWithCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
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
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingABranchCacheHit() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
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
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
        verify(mockCache, times(2)).containsKey(eq(key));
        verify(mockCache).put(eq(key), eq(optionalOntology.get()));
    }

    @Test
    public void testRetrieveOntologyUsingACommitCacheHit() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        String key = ontologyCache.generateKey(recordIRI.stringValue(), branchIRI.stringValue(), commitIRI.stringValue());
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

    // Testing deleteOntology(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testDeleteOntologyRecordWithMissingIdentifier() {
        doThrow(new IllegalArgumentException()).when(catalogManager).removeRecord(catalogIRI, missingIRI, ontologyRecordFactory);

        manager.deleteOntology(missingIRI);
    }

    @Test
    public void testDeleteOntology() throws Exception {
        // Setup:
        IRI ontologyIRI = VALUE_FACTORY.createIRI("http://test.com/test-ontology");
        record.setOntologyIRI(ontologyIRI);

        OntologyRecord result = manager.deleteOntology(recordIRI);
        assertEquals(result, record);
        verify(catalogManager).removeRecord(catalogIRI, recordIRI, ontologyRecordFactory);
        verify(ontologyCache).clearCache(recordIRI, null);
        verify(ontologyCache).clearCacheImports(ontologyIRI);
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
        verify(ontologyCache).clearCache(recordIRI, branchIRI);
    }

    /* Testing getSubClassesOf(Ontology ontology) */

    @Test
    public void testGetSubClassesOf() throws Exception {
        verifyGetSubClassesOf(manager.getSubClassesOf(ontology));
    }

    @Test
    public void testGetSubClassesOfWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetSubClassesOf(manager.getSubClassesOf(conn));
        }
    }

    private void verifyGetSubClassesOf(TupleQueryResult result) {
        Set<String> parents = Stream.of("http://mobi.com/ontology#Class2a", "http://mobi.com/ontology#Class2b",
                "http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c",
                "http://mobi.com/ontology#Class1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c");
        children.put("http://mobi.com/ontology#Class1a", "http://mobi.com/ontology#Class1b");
        children.put("http://mobi.com/ontology#Class2a", "http://mobi.com/ontology#Class2b");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSubDatatypePropertiesOf() throws Exception {
        verifySubDatatypePropertiesOf(manager.getSubDatatypePropertiesOf(ontology));
    }

    @Test
    public void testGetSubDatatypePropertiesOfWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifySubDatatypePropertiesOf(manager.getSubDatatypePropertiesOf(conn));
        }
    }

    private void verifySubDatatypePropertiesOf(TupleQueryResult result) {
        Set<String> parents = Stream.of("http://mobi.com/ontology#dataProperty1b",
                "http://mobi.com/ontology#dataProperty1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://mobi.com/ontology#dataProperty1a", "http://mobi.com/ontology#dataProperty1b");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSubAnnotationPropertiesOf() throws Exception {
        verifyGetSubAnnotationPropertiesOf(manager.getSubAnnotationPropertiesOf(ontology));
    }

    @Test
    public void testGetSubAnnotationPropertiesOfWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetSubAnnotationPropertiesOf(manager.getSubAnnotationPropertiesOf(conn));
        }
    }

    private void verifyGetSubAnnotationPropertiesOf(TupleQueryResult result) {
        Set<String> parents = Stream.of("http://mobi.com/ontology#annotationProperty1b",
                "http://mobi.com/ontology#annotationProperty1a", "http://purl.org/dc/terms/title")
                .collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://mobi.com/ontology#annotationProperty1a",
                "http://mobi.com/ontology#annotationProperty1b");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());

    }

    @Test
    public void testGetSubObjectPropertiesOf() throws Exception {
        verifyGetSubObjectPropertiesOf(manager.getSubObjectPropertiesOf(ontology));
    }

    @Test
    public void testGetSubObjectPropertiesOfWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetSubObjectPropertiesOf(manager.getSubObjectPropertiesOf(conn));
        }
    }

    private void verifyGetSubObjectPropertiesOf(TupleQueryResult result) {
        Set<String> parents = Stream.of("http://mobi.com/ontology#objectProperty1b",
                "http://mobi.com/ontology#objectProperty1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://mobi.com/ontology#objectProperty1a", "http://mobi.com/ontology#objectProperty1b");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetClassesWithIndividuals() throws Exception {
        verifyGetClassesWithIndividuals(manager.getClassesWithIndividuals(ontology));
    }

    @Test
    public void testGetClassesWithIndividualsWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetClassesWithIndividuals(manager.getClassesWithIndividuals(conn));
        }
    }

    private void verifyGetClassesWithIndividuals(TupleQueryResult result) {
        Set<String> parents = Stream.of("http://mobi.com/ontology#Class2a", "http://mobi.com/ontology#Class2b",
                "http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c",
                "http://mobi.com/ontology#Class1a").collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("http://mobi.com/ontology#Class1a", "http://mobi.com/ontology#Individual1a");
        children.put("http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Individual1b");
        children.put("http://mobi.com/ontology#Class1c", "http://mobi.com/ontology#Individual1c");
        children.put("http://mobi.com/ontology#Class2a", "http://mobi.com/ontology#Individual2a");
        children.put("http://mobi.com/ontology#Class2b", "http://mobi.com/ontology#Individual2b");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("individual");
            if (child.isPresent()) {
                String lclChild = children.get(parent);
                String individual = child.get().getValue().stringValue();
                assertEquals(lclChild, individual);
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetEntityUsages() throws Exception {
        verifyGetEntityUsages(manager.getEntityUsages(ontology, VALUE_FACTORY.createIRI("http://mobi.com/ontology#Class1a")));
    }

    @Test
    public void testGetEntityUsagesWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetEntityUsages(manager.getEntityUsages(VALUE_FACTORY.createIRI("http://mobi.com/ontology#Class1a"), conn));
        }
    }

    private void verifyGetEntityUsages(TupleQueryResult result) {
        Set<String> subjects = Stream.of("http://mobi.com/ontology#Class1b",
                "http://mobi.com/ontology#Individual1a").collect(Collectors.toSet());
        Set<String> predicates = Stream.of("http://www.w3.org/2000/01/rdf-schema#subClassOf",
                "http://www.w3.org/1999/02/22-rdf-syntax-ns#type").collect(Collectors.toSet());

        assertTrue(result.hasNext());
        result.forEach(b -> {
            Optional<Binding> optionalSubject = b.getBinding("s");
            if (optionalSubject.isPresent()) {
                String subject = optionalSubject.get().getValue().stringValue();
                assertTrue(subjects.contains(subject));
                subjects.remove(subject);
            }
            Optional<Binding> optionalPredicate = b.getBinding("p");
            if (optionalPredicate.isPresent()) {
                String predicate = optionalPredicate.get().getValue().stringValue();
                assertTrue(predicates.contains(predicate));
                predicates.remove(predicate);
            }
        });
        assertEquals(0, subjects.size());
        assertEquals(0, predicates.size());
    }

    @Test
    public void testConstructEntityUsages() throws Exception {
        Resource class1a = VALUE_FACTORY.createIRI("http://mobi.com/ontology#Class1a");
        verifyConstructEntityUsages(manager.constructEntityUsages(ontology, class1a), class1a);
    }

    @Test
    public void testConstructEntityUsagesWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            Resource class1a = VALUE_FACTORY.createIRI("http://mobi.com/ontology#Class1a");
            verifyConstructEntityUsages(manager.constructEntityUsages(class1a, conn), class1a);
        }
    }

    private void verifyConstructEntityUsages(Model result, Resource class1a) throws Exception {
        Resource class1b = VALUE_FACTORY.createIRI("http://mobi.com/ontology#Class1b");
        IRI subClassOf = VALUE_FACTORY.createIRI("http://www.w3.org/2000/01/rdf-schema#subClassOf");
        Resource individual1a = VALUE_FACTORY.createIRI("http://mobi.com/ontology#Individual1a");
        IRI type = VALUE_FACTORY.createIRI("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
        Model expected = MODEL_FACTORY.createModel(Stream.of(VALUE_FACTORY.createStatement(class1b, subClassOf,
                class1a), VALUE_FACTORY.createStatement(individual1a, type, class1a)).collect(Collectors.toSet()));

        assertTrue(result.equals(expected));
    }

    @Test
    public void testGetConceptRelationships() throws Exception {
        verifyGetConceptRelationships(manager.getConceptRelationships(vocabulary));
    }

    @Test
    public void testGetConceptRelationshipsWithConnection() throws Exception {
        try (RepositoryConnection conn = vocabRepo.getConnection()) {
            verifyGetConceptRelationships(manager.getConceptRelationships(conn));
        }
    }

    private void verifyGetConceptRelationships(TupleQueryResult result) {
        Map<String, Boolean> parentMap = new HashMap<>();
        Stream.of("https://mobi.com/vocabulary#Concept1",
                "https://mobi.com/vocabulary#Concept2","https://mobi.com/vocabulary#Concept3",
                "https://mobi.com/vocabulary#Concept4").forEach(parent -> parentMap.put(parent, false));
        Map<String, Set<String>> children = new HashMap<>();
        children.put("https://mobi.com/vocabulary#Concept1", Stream.of("https://mobi.com/vocabulary#Concept2", "https://mobi.com/vocabulary#Concept3").collect(Collectors.toSet()));

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parentMap.keySet().contains(parent));
            parentMap.put(parent, true);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                String childStr = child.get().getValue().stringValue();
                assertTrue(children.get(parent).contains(childStr));
                children.get(parent).remove(childStr);
            }
        });
        parentMap.values().forEach(Assert::assertTrue);
        children.values().forEach(set -> assertEquals(0, set.size()));
    }

    @Test
    public void testGetConceptSchemeRelationships() throws Exception {
        verifyGetConceptSchemeRelationships(manager.getConceptSchemeRelationships(vocabulary));
    }

    @Test
    public void testGetConceptSchemeRelationshipsWithConnection() throws Exception {
        try (RepositoryConnection conn = vocabRepo.getConnection()) {
            verifyGetConceptSchemeRelationships(manager.getConceptSchemeRelationships(conn));
        }
    }

    private void verifyGetConceptSchemeRelationships(TupleQueryResult result) {
        Set<String> parents = Stream.of("https://mobi.com/vocabulary#ConceptScheme1",
                "https://mobi.com/vocabulary#ConceptScheme2","https://mobi.com/vocabulary#ConceptScheme3")
                .collect(Collectors.toSet());
        Map<String, String> children = new HashMap<>();
        children.put("https://mobi.com/vocabulary#ConceptScheme1", "https://mobi.com/vocabulary#Concept1");
        children.put("https://mobi.com/vocabulary#ConceptScheme2", "https://mobi.com/vocabulary#Concept2");
        children.put("https://mobi.com/vocabulary#ConceptScheme3", "https://mobi.com/vocabulary#Concept3");

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "parent").stringValue();
            assertTrue(parents.contains(parent));
            parents.remove(parent);
            Optional<Binding> child = b.getBinding("child");
            if (child.isPresent()) {
                assertEquals(children.get(parent), child.get().getValue().stringValue());
                children.remove(parent);
            }
        });
        assertEquals(0, parents.size());
        assertEquals(0, children.size());
    }

    @Test
    public void testGetSearchResults() throws Exception {
        verifyGetSearchResults(manager.getSearchResults(ontology, "class"));
    }

    @Test
    public void testGetSearchResultsWithConnection() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            verifyGetSearchResults(manager.getSearchResults("class", conn));
        }
    }

    private void verifyGetSearchResults(TupleQueryResult result) throws Exception {
        Set<String> entities = Stream.of("http://mobi.com/ontology#Class2a", "http://mobi.com/ontology#Class2b",
                "http://mobi.com/ontology#Class1b", "http://mobi.com/ontology#Class1c",
                "http://mobi.com/ontology#Class1a").collect(Collectors.toSet());

        assertTrue(result.hasNext());
        result.forEach(b -> {
            String parent = Bindings.requiredResource(b, "entity").stringValue();
            assertTrue(entities.contains(parent));
            entities.remove(parent);
            assertEquals("http://www.w3.org/2002/07/owl#Class", Bindings.requiredResource(b, "type").stringValue());
        });
        assertEquals(0, entities.size());
    }
}
