package com.mobi.shapes.impl;

/*-
 * #%L
 * com.mobi.shapes.impl
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
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.shapes.api.ShapesGraph;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Optional;

public class SimpleShapesGraphManagerTest extends OrmEnabledTestCase {
    SimpleShapesGraphManager manager = new SimpleShapesGraphManager();
    private OrmFactory<Branch> branchFactory = getRequiredOrmFactory(Branch.class);
    private OrmFactory<Commit> commitFactory = getRequiredOrmFactory(Commit.class);
    Repository repo;
    IRI catalogIri;
    IRI testShapeIri;
    IRI missingIRI;
    private IRI recordIRI;
    private IRI branchIRI;
    private IRI commitIRI;
    ValueFactory vf;

    @Mock
    CatalogConfigProvider configProvider;

    @Mock
    CatalogManager catalogManager;

    @Before
    public void setUp() throws Exception {
        MockitoAnnotations.initMocks(this);
        missingIRI = VALUE_FACTORY.createIRI("http://mobi.com/missing");
        recordIRI = VALUE_FACTORY.createIRI("http://mobi.com/record");
        branchIRI = VALUE_FACTORY.createIRI("http://mobi.com/branch");
        commitIRI = VALUE_FACTORY.createIRI("http://mobi.com/commit");
        vf = VALUE_FACTORY;
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        catalogIri = vf.createIRI("http://mobi.com/catalog-local");
        testShapeIri = vf.createIRI("http://mobi.com/ontologies/shapes-graph/test-shape-record");

        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-shape-record.trig");
            conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
        }

        doThrow(new IllegalArgumentException()).when(catalogManager).getMasterBranch(catalogIri, missingIRI);
        doThrow(new IllegalArgumentException()).when(catalogManager).getBranch(catalogIri, recordIRI, missingIRI, branchFactory);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCommit(catalogIri, recordIRI, branchIRI, missingIRI);
        doThrow(new IllegalArgumentException()).when(catalogManager).getHeadCommit(catalogIri, recordIRI, missingIRI);

        when(configProvider.getLocalCatalogIRI()).thenReturn(catalogIri);
        when(configProvider.getRepository()).thenReturn(repo);
        manager.configProvider = configProvider;
        manager.catalogManager = catalogManager;
    }

    @Test
    public void checkShapesGraphIriExistsTest() throws Exception {
        boolean exists = manager.shapesGraphIriExists(testShapeIri);
        assertTrue(exists);
        verify(configProvider).getRepository();
        verify(configProvider).getLocalCatalogIRI();
    }

    @Test
    public void checkShapesGraphIriExistsNewTest() throws Exception {
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
        doThrow(new IllegalStateException()).when(catalogManager).getMasterBranch(catalogIri, recordIRI);

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test(expected = IllegalStateException.class)
    public void testRetrieveShapesGraphWithHeadCommitNotSet() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        when(catalogManager.getMasterBranch(catalogIri, recordIRI)).thenReturn(branch);

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphWhenCompiledResourceCannotBeFound() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIri, recordIRI)).thenReturn(branch);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveShapesGraph(recordIRI);
    }

    @Test
    public void testRetrieveShapesGraphSuccess() {
        // Setup:
        Branch branch = branchFactory.createNew(branchIRI);
        branch.setHead(commitFactory.createNew(commitIRI));
        when(catalogManager.getMasterBranch(catalogIri, recordIRI)).thenReturn(branch);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

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
        doThrow(new IllegalStateException()).when(catalogManager).getHeadCommit(catalogIri, recordIRI, missingIRI);

        manager.retrieveShapesGraph(recordIRI, missingIRI);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingABranchWhenCompiledResourceCannotBeFound() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(catalogManager.getHeadCommit(catalogIri, recordIRI, branchIRI)).thenReturn(commit);
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveShapesGraph(recordIRI, branchIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingABranchSuccess() {
        // Setup:
        Commit commit = commitFactory.createNew(commitIRI);
        when(catalogManager.getHeadCommit(catalogIri, recordIRI, branchIRI)).thenReturn(commit);
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<ShapesGraph> optionalShapesGraph = manager.retrieveShapesGraph(recordIRI, branchIRI);
        assertTrue(optionalShapesGraph.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphUsingACommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(recordIRI, branchIRI, commitIRI);

        manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
    }

    @Test
    public void testRetrieveShapesGraphUsingACommitSuccess() {
        // Setup:
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<ShapesGraph> optionalOntology = manager.retrieveShapesGraph(recordIRI, branchIRI, commitIRI);
        assertTrue(optionalOntology.isPresent());
    }

    // Testing retrieveShapesGraphByCommit(Resource commitId)

    @Test
    public void testRetrieveShapesGraphByCommit() {
        // Setup:
        when(catalogManager.getCompiledResource(commitIRI)).thenReturn(MODEL_FACTORY.createModel());

        Optional<ShapesGraph> optionalOntology = manager.retrieveShapesGraphByCommit(commitIRI);
        assertTrue(optionalOntology.isPresent());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRetrieveShapesGraphByCommitWhenCompiledResourceCannotBeFound() {
        // Setup:
        doThrow(new IllegalArgumentException()).when(catalogManager).getCompiledResource(commitIRI);

        manager.retrieveShapesGraphByCommit(commitIRI);
    }
}