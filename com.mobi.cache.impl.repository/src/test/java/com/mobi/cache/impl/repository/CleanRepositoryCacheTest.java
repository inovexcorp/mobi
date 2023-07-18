package com.mobi.cache.impl.repository;

/*-
 * #%L
 * com.mobi.cache.impl.repository
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.dataset.api.DatasetUtilsService;
import com.mobi.ontology.utils.cache.repository.OntologyDatasets;
import com.mobi.rdf.orm.test.OrmEnabledTestCase;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import org.apache.karaf.scheduler.JobContext;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.OffsetDateTime;
import java.util.Optional;

public class CleanRepositoryCacheTest extends OrmEnabledTestCase {
    private AutoCloseable closeable;
    private CleanRepositoryCache cleanJob;
    private MemoryRepositoryWrapper repo;
    private ValueFactory vf;
    private IRI dataset1;
    private IRI dataset2;

    @Mock
    private CleanRepositoryCacheConfig config;

    @Mock
    private DatasetUtilsService dsUtilsService;

    @Mock
    private RepositoryManager repoManager;

    @Mock
    private JobContext jobContext;

    @Before
    public void setUp() {
        vf = getValueFactory();

        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        dataset1 = vf.createIRI("urn:dataset1");
        dataset2 = vf.createIRI("urn:dataset2");

        when(config.expiry()).thenReturn((long) 1800);
        when(repoManager.getRepository("ontologyCache")).thenReturn(Optional.of(repo));
        doNothing().when(dsUtilsService).safeDeleteDataset(any(Resource.class), anyString());

        cleanJob = new CleanRepositoryCache();
        cleanJob.dsUtilsService = dsUtilsService;
        cleanJob.repositoryManager = repoManager;
        cleanJob.start(config);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void executeNothingExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().plusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().plusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset1, "ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset2, "ontologyCache");
    }

    @Test
    public void executeOneExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().minusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().plusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(dsUtilsService).safeDeleteDataset(dataset1, "ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset2, "ontologyCache");
    }

    @Test
    public void executeAllExpiredTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().minusSeconds(10000).toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().minusSeconds(10000).toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(dsUtilsService).safeDeleteDataset(dataset1, "ontologyCache");
        verify(dsUtilsService).safeDeleteDataset(dataset2, "ontologyCache");
    }

    @Test
    public void executeEmptyRepoTest() {
        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(any(Resource.class), anyString());
    }

    @Test
    public void executeNothingExpiredLongExpiryTest() {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.add(dataset1, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().toString()));
            conn.add(dataset2, vf.createIRI(OntologyDatasets.TIMESTAMP_IRI_STRING), vf.createLiteral(OffsetDateTime.now().toString()));
        }

        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset1, "ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset2, "ontologyCache");

        when(config.expiry()).thenReturn((long) 1000000000);
        cleanJob.start(config);
        cleanJob.execute(jobContext);
        verify(repoManager, times(2)).getRepository("ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset1, "ontologyCache");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset2, "ontologyCache");
    }

    @Test (expected = IllegalStateException.class)
    public void executeRepoNotFoundTest() {
        when(repoManager.getRepository("otherRepo")).thenReturn(Optional.empty());
        when(config.repoId()).thenReturn("otherRepo");
        cleanJob.start(config);
        cleanJob.execute(jobContext);
    }

    @Test
    public void executeNonDefaultRepoTest() {
        when(repoManager.getRepository("otherRepo")).thenReturn(Optional.of(repo));
        when(config.repoId()).thenReturn("otherRepo");
        cleanJob.start(config);
        cleanJob.execute(jobContext);
        verify(repoManager).getRepository("otherRepo");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset1, "otherRepo");
        verify(dsUtilsService, never()).safeDeleteDataset(dataset2, "otherRepo");
    }
}
