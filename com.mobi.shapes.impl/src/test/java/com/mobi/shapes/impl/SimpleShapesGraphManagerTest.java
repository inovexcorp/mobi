package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.shapes.api.ShapesGraph;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
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
    IRI catalogIri;
    IRI testShapeIri;
    IRI missingIRI;

    private AutoCloseable closeable;
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<MasterBranch> masterBranchFactory = getRequiredOrmFactory(MasterBranch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    ValueFactory vf;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    CommitManager commitManager;
    
    @Mock
    BranchManager branchManager;
    
    @Mock
    CompiledResourceManager compiledResourceManager;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        missingIRI = VALUE_FACTORY.createIRI("http://mobi.com/missing");
        recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/record");
        branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/branch");
        commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/commit");
        vf = VALUE_FACTORY;
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        catalogIri = vf.createIRI("http://mobi.com/catalog-local");
        testShapeIri = vf.createIRI("http://mobi.com/ontologies/shapes-graph/test-shape-record");

        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(catalogIri), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(branchManager).getBranchOpt(eq(catalogIri), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(eq(catalogIri), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(eq(catalogIri), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        doThrow(new IllegalArgumentException()).when(branchManager).getMasterBranch(eq(catalogIri), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(branchManager).getBranchOpt(eq(catalogIri), eq(recordIRI), eq(missingIRI), eq(branchFactory), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getCommit(eq(catalogIri), eq(recordIRI), eq(branchIRI), eq(missingIRI), any(RepositoryConnection.class));
        doThrow(new IllegalArgumentException()).when(commitManager).getHeadCommit(eq(catalogIri), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);
        when(configProvider.getRepository()).thenReturn(repo);
        manager.configProvider = configProvider;
        manager.commitManager = commitManager;
        manager.branchManager = branchManager;
        manager.compiledResourceManager = compiledResourceManager;
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
        Mockito.reset(compiledResourceManager);
    }

    @Test
    public void checkShapesGraphIriExistsTest() throws Exception {
        trigFile();
        boolean exists = manager.shapesGraphIriExists(testShapeIri);
        assertTrue(exists);
        verify(configProvider).getRepository();
        verify(configProvider).getLocalCatalogIRI();
    }

    @Test
    public void checkShapesGraphIriExistsNewTest() throws Exception {
        trigFile();
        Resource newShapeIri = vf.createIRI("urn:testShapeIriThatDoesNotExistInRepo");
        boolean exists = manager.shapesGraphIriExists(newShapeIri);
        assertFalse(exists);
        verify(configProvider).getRepository();
        verify(configProvider).getLocalCatalogIRI();
    }

    // Testing retrieveShapesGraph(Resource recordId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphWithMissingIdentifier() {
        manager.retrieveShapesGraph(missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphWithMasterBranchNotSet() {
        // Setup:
        doThrow(new IllegalStateException()).when(branchManager).getMasterBranch(eq(catalogIri), eq(recordIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphWithHeadCommitNotSet() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        when(branchManager.getMasterBranch(eq(catalogIri), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphWhenCompiledResourceCannotBeFound() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIri), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        doThrow(new IllegalArgumentException()).when(compiledResourceManager).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test
    public void testRetrieveShapesGraphSuccess() {
        // Setup:
        MasterBranch branch = masterBranchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(branchManager.getMasterBranch(eq(catalogIri), eq(recordIRI), any(RepositoryConnection.class))).thenReturn(branch);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createEmptyModel());

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI);
        assertTrue(optionalShapesGraph.isPresent());
    }

    // Testing retrieveShapesGraph(Resource recordId, Resource branchId)

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingABranchWithMissingIdentifier() throws Exception {
        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphUsingABranchThatCannotBeRetrieved() {
        // Setup:
        doThrow(new IllegalStateException()).when(commitManager).getHeadCommit(eq(catalogIri), eq(recordIRI), eq(missingIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingABranchWhenCompiledResourceCannotBeFound() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getHeadCommit(eq(catalogIri), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        doThrow(new IllegalArgumentException()).when(compiledResourceManager).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraph(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingABranchSuccess() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(commitManager.getHeadCommit(eq(catalogIri), eq(recordIRI), eq(branchIRI), any(RepositoryConnection.class))).thenReturn(commit);
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createEmptyModel());

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI);
        assertTrue(optionalShapesGraph.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingACommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(compiledResourceManager).getCompiledResource(eq(recordIRI), eq(branchIRI), eq(commitIRI), any(RepositoryConnection.class));
        manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingACommitSuccess() {
        // Setup:
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createEmptyModel());

        Optional<ShapesGraph> optionalOntology = manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
    }

    // Testing retrieveShapesGraphByCommit(Resource commitId)

    @Test
    public void testRetrieveShapesGraphByCommit() {
        // Setup:
        when(compiledResourceManager.getCompiledResource(eq(commitIRI), any(RepositoryConnection.class))).thenReturn(MODEL_FACTORY.createEmptyModel());

        Optional<ShapesGraph> optionalOntology = manager.retrieveShapesGraphByCommit(commitIRI);
        assertTrue(optionalOntology.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphByCommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(compiledResourceManager).getCompiledResource(eq(commitIRI), any(RepositoryConnection.class));

        manager.retrieveShapesGraphByCommit(commitIRI);
    }
}
