package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.DatasetRecordService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.utils.cli.CliTestUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class DatasetNoPoliciesTest {
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private ValueFactory vf;

    @Mock
    protected CatalogConfigProvider config;
    
    @Mock
    protected StateManager stateManager;

    @Mock
    private DatasetRecordService datasetRecordService;

    @Mock
    private DatasetManager datasetManager;

    private DatasetNoPolicies operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        vf = new ValidatingValueFactory();

        Mockito.when(config.getRepository()).thenReturn(repo);

        when(datasetManager.getDatasetRecord(any(Resource.class))).thenAnswer((Answer<Optional<DatasetRecord>>) invocation -> {
            Resource argResource = (Resource) invocation.getArguments()[0];
            DatasetRecord datasetRecordMock = mock(DatasetRecord.class);
            when(datasetRecordMock.getResource()).thenReturn(argResource);
            when(datasetRecordMock.toString()).thenReturn(String.format("DatasetRecord(%s)", argResource.toString()));
            return Optional.ofNullable(datasetRecordMock);
        });
        operation = new DatasetNoPolicies();
        operation.config = config;
        operation.datasetManager = datasetManager;
        operation.datasetRecordService = datasetRecordService;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(config, stateManager, datasetRecordService, datasetManager);
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of("1.12;true",
                "1.13;true",
                "1.14;true",
                "1.15;true",
                "1.16;true",
                "1.17;true",
                "1.18;true",
                "1.19;true",
                "1.20;true",
                "1.21;true",
                "1.22;true",
                "2.0;true",
                "2.1;true",
                "2.2;true",
                "2.3;true",
                "2.4;true",
                "2.5;true"
        ).collect(Collectors.toUnmodifiableList());
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void getDatasetNoPolicyResourcesTest() {
        CliTestUtils.loadFiles(repo,"/systemState.trig");

        List<Resource> datasetResources;
        try (RepositoryConnection conn = repo.getConnection()) {
            datasetResources = operation.getDatasetNoPolicyResources(conn);
        }
        List<Resource> datasetResourcesExpect = Stream.of(vf.createIRI("https://mobi.com/records#89d40d76-8d49-4af7-8782-ada078b09aa7"),
                vf.createIRI("https://mobi.com/records#a1341aca-0a3c-4048-9b8c-64821dacdf0e"),
                vf.createIRI("https://mobi.com/records#25bb9187-0a21-4c95-8b36-90b9b0e985ba")).collect(Collectors.toList());

        List<Resource> datasetActual = datasetResources.stream().collect(Collectors.toList());
        Assert.assertEquals(datasetResourcesExpect, datasetActual);
    }

    @Test
    public void createDatesetPoliciesTest(){
        CliTestUtils.loadFiles(repo,"/systemState.trig");

        operation.createDatesetPolicies();

        verify(datasetManager, times(3)).getDatasetRecord(any(Resource.class));
        verify(datasetManager).getDatasetRecord(eq(vf.createIRI("https://mobi.com/records#89d40d76-8d49-4af7-8782-ada078b09aa7")));
        verify(datasetManager).getDatasetRecord(eq(vf.createIRI("https://mobi.com/records#a1341aca-0a3c-4048-9b8c-64821dacdf0e")));
        verify(datasetManager).getDatasetRecord(eq(vf.createIRI("https://mobi.com/records#25bb9187-0a21-4c95-8b36-90b9b0e985ba")));

        verify(datasetRecordService, times(3)).overwritePolicyDefault(any(DatasetRecord.class));
    }

}
