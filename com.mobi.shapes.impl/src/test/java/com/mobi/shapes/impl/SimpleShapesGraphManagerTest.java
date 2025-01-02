package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
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
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyCreationService;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
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

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

public class SimpleShapesGraphManagerTest extends OrmEnabledTestCase {
    SimpleShapesGraphManager manager = new SimpleShapesGraphManager();
    MemoryRepositoryWrapper repo;

    private AutoCloseable closeable;
    private final OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private final OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private final OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private final IRI catalogIRI = VALUE_FACTORY.createIRI("http://mobi.com/catalog-local");
    private final IRI testShapeIRI = VALUE_FACTORY.createIRI("http://mobi.com/ontologies/shapes-graph/test-shape-record");
    private final IRI missingIRI = VALUE_FACTORY.createIRI("http://mobi.com/missing");
    private final IRI recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/record");
    private final IRI branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/branch");
    private final IRI commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/commit");
    private final IRI shapesGraphRecordType = VALUE_FACTORY.createIRI(ShapesGraphRecord.TYPE);
    private final String cacheKey = "CACHE-KEY";

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    CommitManager commitManager;
    
    @Mock
    BranchManager branchManager;

    @Mock
    RecordManager recordManager;

    @Mock
    ImportsResolver importsResolver;

    @Mock
    OntologyManager ontologyManager;

    @Mock
    OntologyCache ontologyCache;

    @Mock
    OntologyCreationService ontologyCreationService;

    @Mock
    Ontology ontology;

    @Mock
    InProgressCommit inProgressCommit;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(catalogIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(branchManager).getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(catalogIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(branchManager).getBranchOpt(eq(catalogIRI), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIRI);
        when(configProvider.getRepository()).thenReturn(repo);
        when(importsResolver.getRecordIRIFromOntologyIRI(any(Resource.class))).thenReturn(Optional.empty());
        when(importsResolver.getRecordIRIFromOntologyIRI(testShapeIRI)).thenReturn(Optional.of(VALUE_FACTORY.createIRI("https://mobi.com/records#12556100-696c-4a38-b5ba-646ca0d99f99")));
        when(ontologyCreationService.createOntology(any(Resource.class), any(Resource.class))).thenReturn(ontology);
        when(ontologyCreationService.createOntologyFromCommit(any(Resource.class), any(Resource.class))).thenReturn(ontology);
        when(ontologyCache.generateKey(anyString(), anyString())).thenReturn(cacheKey);

        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.branchManager = branchManager;
        manager.recordManager = recordManager;
        manager.importsResolver = importsResolver;
        manager.ontologyManager = ontologyManager;
        manager.ontologyCache = ontologyCache;
        manager.ontologyCreationService = ontologyCreationService;
    }

    private void trigFile() throws IOException {
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-shape-record.trig");
            conn.add((Rio.parse(testData, "", RDFFormat.TRIG)));
        }
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(configProvider, importsResolver, ontologyCreationService, ontologyCache);
    }

    @Test
    public void checkShapesGraphIriExistsTest() throws Exception {
        trigFile();
        boolean exists = manager.shapesGraphIriExists(testShapeIRI);
        assertTrue(exists);
        verify(importsResolver).getRecordIRIFromOntologyIRI(testShapeIRI);
    }

    @Test
    public void checkShapesGraphIriExistsNewTest() throws Exception {
        trigFile();
        Resource newShapeIri = VALUE_FACTORY.createIRI("urn:testShapeIriThatDoesNotExistInRepo");
        boolean exists = manager.shapesGraphIriExists(newShapeIri);
        assertFalse(exists);
        verify(importsResolver).getRecordIRIFromOntologyIRI(newShapeIri);
    }

    // Testing retrieveShapesGraph(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphWithNonShapesGraphRecord() {
        // Setup
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphWithMissingIdentifier() {
        manager.retrieveShapesGraph(missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphWithMasterBranchNotSet() {
        // Setup:
        doThrow(new IllegalStateException()).when(branchManager).getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphWithHeadCommitNotSet() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test
    public void testRetrieveShapesGraphCacheHit() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(ontologyCache.containsKey(cacheKey)).thenReturn(true);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(branchManager).getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntology(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphCacheMiss() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(ontologyCache.containsKey(cacheKey)).thenReturn(false);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(branchManager).getMasterBranch(eq(catalogIRI), eq(recordIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntologyFromCommit(recordIRI, commitIRI);
    }

    // Testing retrieveShapesGraph(Resource recordId, Resource branchId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingABranchWithNonShapesGraphRecord() {
        // Setup
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingABranchWithMissingIdentifier() throws Exception {
        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphUsingABranchThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(commitManager).getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingABranchCacheHit() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(ontologyCache.containsKey(cacheKey)).thenReturn(true);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntology(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingABranchCacheMiss() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(ontologyCache.containsKey(cacheKey)).thenReturn(false);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).getHeadCommit(eq(catalogIRI), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntologyFromCommit(recordIRI, commitIRI);
    }

    // Testing retrieveShapesGraph(Resource recordId, Resource branchId, Resource commitId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingACommitWithNonShapesGraphRecord() {
        // Setup
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, branchIRI, missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingACommitWithInvalidPath() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(commitManager).validateCommitPath(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingACommitCacheHit() {
        // Setup:
        when(ontologyCache.containsKey(cacheKey)).thenReturn(true);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).validateCommitPath(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntology(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingACommitCacheMiss() {
        // Setup:
        when(ontologyCache.containsKey(cacheKey)).thenReturn(false);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).validateCommitPath(eq(catalogIRI), eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntologyFromCommit(recordIRI, commitIRI);
    }

    // Testing retrieveShapesGraphByCommit(Resource commitId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphByCommitWithNonShapesGraphRecord() {
        // Setup
        doThrow(new IllegalArgumentException()).when(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));

        manager.retrieveShapesGraphByCommit(recordIRI, missingIRI);
    }

    @Test
    public void testRetrieveShapesGraphByCommitNotInRecord() {
        // Setup
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(false);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraphByCommit(recordIRI, missingIRI);
        assertTrue(optionalShapesGraph.isEmpty());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
    }
    
    @Test
    public void testRetrieveShapesGraphByCommitCacheHit() {
        // Setup:
        when(ontologyCache.containsKey(cacheKey)).thenReturn(true);
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(true);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraphByCommit(recordIRI, commitIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntology(recordIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphByCommitCacheMiss() {
        // Setup:
        when(ontologyCache.containsKey(cacheKey)).thenReturn(false);
        when(commitManager.commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class))).thenReturn(true);

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraphByCommit(recordIRI, commitIRI);
        assertTrue(optionalShapesGraph.isPresent());
        verify(recordManager).validateRecord(eq(catalogIRI), eq(recordIRI), eq(shapesGraphRecordType), any(RepositoryConnection.class));
        verify(commitManager).commitInRecord(eq(recordIRI), eq(commitIRI), any(RepositoryConnection.class));
        verify(ontologyCache).generateKey(recordIRI.stringValue(), commitIRI.stringValue());
        verify(ontologyCache).containsKey(cacheKey);
        verify(ontologyCreationService).createOntologyFromCommit(recordIRI, commitIRI);
    }

    // applyChanges(ShapesGraph, InProgressCommit)

    @Test
    public void testApplyChanges() {
        // Setup:
        ShapesGraph shapesGraph = new SimpleShapesGraph(ontology);

        manager.applyChanges(shapesGraph, inProgressCommit);
        verify(ontologyManager).applyChanges(ontology, inProgressCommit);
    }
}
