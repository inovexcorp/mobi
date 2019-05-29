package com.mobi.cache.impl.repository;

import static org.mockito.Matchers.any;
import static org.mockito.Matchers.anyBoolean;
import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.dataset.api.DatasetManager;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import org.apache.karaf.scheduler.JobContext;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class CleanRepositoryCacheTest extends OrmEnabledTestCase {

    private CleanRepositoryCache cleanJob;
    private Repository repo;
    private ValueFactory vf;
    private IRI dataset1;
    private IRI dataset2;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private RepositoryManager repoManager;

    @Mock
    private JobContext jobContext;

    @Before
    public void setUp() {
        vf = getValueFactory();

        MockitoAnnotations.initMocks(this);
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();

        dataset1 = vf.createIRI("urn:dataset1");
        dataset2 = vf.createIRI("urn:dataset2");

        when(repoManager.getRepository("ontologyCache")).thenReturn(Optional.of(repo));
        doNothing().when(datasetManager).safeDeleteDataset(any(Resource.class), anyString(), anyBoolean());

        cleanJob = new CleanRepositoryCache();
        cleanJob.setDatasetManager(datasetManager);
        cleanJob.setRepositoryManager(repoManager);
        cleanJob.setValueFactory(vf);
        cleanJob.start(new HashMap<>());
    }

    @Test
    public void executeNothingExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().plusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().plusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(datasetManager, never()).safeDeleteDataset(dataset1, "ontologyCache", false);
        verify(datasetManager, never()).safeDeleteDataset(dataset2, "ontologyCache", false);
    }

    @Test
    public void executeOneExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().minusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().plusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(datasetManager).safeDeleteDataset(dataset1, "ontologyCache", false);
        verify(datasetManager, never()).safeDeleteDataset(dataset2, "ontologyCache", false);
    }

    @Test
    public void executeAllExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().minusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().minusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(datasetManager).safeDeleteDataset(dataset1, "ontologyCache", false);
        verify(datasetManager).safeDeleteDataset(dataset2, "ontologyCache", false);
    }

    @Test
    public void executeEmptyRepoTest() {
        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(datasetManager, never()).safeDeleteDataset(any(Resource.class), anyString(), anyBoolean());
    }

    @Test
    public void executeNothingExpiredLongExpiryTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createIRI(OffsetDateTime.now().toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(datasetManager, never()).safeDeleteDataset(dataset1, "ontologyCache", false);
        verify(datasetManager, never()).safeDeleteDataset(dataset2, "ontologyCache", false);

        Map<String, Object> config = new HashMap<>();
        config.put("expiry", 1000000000);
        cleanJob.modified(config);
        cleanJob.execute(jobContext);
    }

    @Test (expected = IllegalStateException.class)
    public void executeRepoNotFoundTest() {
        when(repoManager.getRepository("otherRepo")).thenReturn(Optional.empty());
        Map<String, Object> config = new HashMap<>();
        config.put("repoId", "otherRepo");
        cleanJob.modified(config);
        cleanJob.execute(jobContext);
    }

    @Test
    public void executeNonDefaultRepoTest() {
        when(repoManager.getRepository("otherRepo")).thenReturn(Optional.of(repo));
        Map<String, Object> config = new HashMap<>();
        config.put("repoId", "otherRepo");
        cleanJob.modified(config);
        cleanJob.execute(jobContext);
    }
}