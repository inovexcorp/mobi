package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.ontologies.rdfs.Resource;
import com.mobi.persistence.utils.ConnectionUtils;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.InputStream;
import java.util.Optional;

public class DatasetUtilsServiceImplTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private DatasetUtilsServiceImpl service;
    private MemoryRepositoryWrapper repo;
    private final OrmFactory<Dataset> datasetFactory = getRequiredOrmFactory(Dataset.class);

    private static final IRI DATASET_IRI = VALUE_FACTORY.createIRI("http://test.com/dataset");
    private static final IRI DATASET_SDNG = VALUE_FACTORY.createIRI("http://test.com/dataset_system_dng");
    private static final IRI GRAPH1 = VALUE_FACTORY.createIRI("http://test.com/dataset/graph1");
    private static final IRI GRAPH2 = VALUE_FACTORY.createIRI("http://test.com/dataset/graph2");
    private static final IRI GRAPH3 = VALUE_FACTORY.createIRI("http://test.com/dataset/graph3");
    private static final String REPO_ID = "test-repo";

    @Mock
    RepositoryManager repoManager;

    @Before
    public void setUp() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.of(repo));

        service = new DatasetUtilsServiceImpl();
        injectOrmFactoryReferencesIntoService(service);
        service.repoManager = repoManager;
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    // createDataset(String, String)

    @Test
    public void createDatasetRepoMissing() {
        // Setup:
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
    }

    @Test
    public void createDatasetDatasetExists() {
        // Setup:
        Dataset dataset = datasetFactory.createNew(DATASET_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset.getModel(), dataset.getResource());
        }

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset already exists in the specified repository.");
        verify(repoManager).getRepository(REPO_ID);
    }

    @Test
    public void createDataset() {
        boolean result = service.createDataset(DATASET_IRI, REPO_ID);
        assertTrue(result);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, DATASET_IRI,
                    VALUE_FACTORY.createIRI(Dataset.systemDefaultNamedGraph_IRI),
                    DATASET_SDNG, DATASET_IRI));
            assertTrue(ConnectionUtils.contains(conn, DATASET_IRI,
                    VALUE_FACTORY.createIRI(Resource.type_IRI),
                    VALUE_FACTORY.createIRI(Dataset.TYPE),
                    DATASET_IRI));
        }
    }

    // createDataset(String, String, PreCreateSteps)
    @Test
    public void createDatasetWithStepsRepoMissing() {
        // Setup:
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createDataset(DATASET_IRI, REPO_ID, (iri1) -> true));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
    }

    @Test
    public void createDatasetWithStepsDatasetExists() {
        // Setup:
        Dataset dataset = datasetFactory.createNew(DATASET_IRI);
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset.getModel(), dataset.getResource());
        }

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.createDataset(DATASET_IRI, REPO_ID, (iri1) -> true));
        assertEquals(ex.getMessage(), "Dataset already exists in the specified repository.");
        verify(repoManager).getRepository(REPO_ID);
    }

    @Test
    public void createDatasetWithStepsSuccess() {
        boolean result = service.createDataset(DATASET_IRI, REPO_ID, (iri1) -> true);
        assertTrue(result);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.contains(conn, DATASET_IRI,
                    VALUE_FACTORY.createIRI(Dataset.systemDefaultNamedGraph_IRI),
                    DATASET_SDNG,
                    DATASET_IRI));
            assertTrue(ConnectionUtils.contains(conn, DATASET_IRI,
                    VALUE_FACTORY.createIRI(Resource.type_IRI),
                    VALUE_FACTORY.createIRI(Dataset.TYPE),
                    DATASET_IRI));
        }
    }

    @Test
    public void createDatasetWithStepsFailure() {
        boolean result = service.createDataset(DATASET_IRI, REPO_ID, (iri1) -> false);
        assertFalse(result);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_IRI));
        }
    }

    // deleteDataset

    @Test
    public void deleteDatasetRepositoryMissing() throws Exception {
        // Setup:
        setupRepository();
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.deleteDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH2));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    @Test
    public void deleteDataset() throws Exception {
        // Setup:
        setupRepository();

        service.deleteDataset(DATASET_IRI, REPO_ID);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH1));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH2));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    // safeDeleteDataset

    @Test
    public void safeDeleteDatasetRepositoryMissing() throws Exception {
        // Setup:
        setupRepository();
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.safeDeleteDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH2));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    @Test
    public void safeDeleteDataset() throws Exception {
        // Setup:
        setupRepository();

        service.safeDeleteDataset(DATASET_IRI, REPO_ID);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH2));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    // clearDataset

    @Test
    public void clearDatasetRepositoryMissing() throws Exception {
        // Setup:
        setupRepository();
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.clearDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH2));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    @Test
    public void clearDataset() throws Exception {
        // Setup:
        setupRepository();

        service.clearDataset(DATASET_IRI, REPO_ID);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH1));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH2));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    // safeClearDataset

    @Test
    public void safeClearDatasetRepositoryMissing() throws Exception {
        // Setup:
        setupRepository();
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.safeClearDataset(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH2));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    @Test
    public void safeClearDataset() throws Exception {
        // Setup:
        setupRepository();

        service.safeClearDataset(DATASET_IRI, REPO_ID);
        verify(repoManager).getRepository(REPO_ID);
        try (RepositoryConnection conn = repo.getConnection()) {
            assertTrue(ConnectionUtils.containsContext(conn, DATASET_IRI));
            assertFalse(ConnectionUtils.containsContext(conn, DATASET_SDNG));
            assertTrue(ConnectionUtils.containsContext(conn, GRAPH1));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH2));
            assertFalse(ConnectionUtils.containsContext(conn, GRAPH3));
        }
    }

    // getConnection

    @Test
    public void getConnectionRepositoryMissing() throws Exception {
        // Setup:
        when(repoManager.getRepository(REPO_ID)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.getConnection(DATASET_IRI, REPO_ID));
        assertEquals(ex.getMessage(), "Dataset target repository does not exist.");
        verify(repoManager).getRepository(REPO_ID);
    }

    @Test
    public void getConnection() throws Exception {
        // Setup:
        setupRepository();

        try (DatasetConnection conn = service.getConnection(DATASET_IRI, REPO_ID)) {
            assertEquals(REPO_ID, conn.getRepositoryId());
            assertEquals(DATASET_IRI, conn.getDataset());
            assertEquals(DATASET_SDNG, conn.getSystemDefaultNamedGraph());
        }
    }

    private void setupRepository() throws Exception {
        try (RepositoryConnection conn = repo.getConnection()) {
            InputStream testData = getClass().getResourceAsStream("/test-dataset-data.trig");
            conn.add(Rio.parse(testData, "", RDFFormat.TRIG));
        }
    }
}
