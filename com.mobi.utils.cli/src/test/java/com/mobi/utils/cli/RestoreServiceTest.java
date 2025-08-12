package com.mobi.utils.cli;
/*-
 * #%L
 * com.mobi.sparql.rest
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.record.DatasetRecordService;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.http.HTTPRepositoryConfig;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
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
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class RestoreServiceTest {
    private static final String POLICY_FILE_LOCATION = "testLocation";
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;
    private MemoryRepositoryWrapper provRepo;
    private ValueFactory vf;
    private RestoreService restore;

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private StateManager stateManager;

    @Mock
    private RDFImportService importService;

    @Mock
    private CatalogConfigProvider catalogConfigProvider;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private VirtualFilesystem vfs;

    @Mock
    private ServiceReference<VirtualFilesystem> vfsServiceRef;

    @Mock
    private VirtualFile virtualFile;

    @Mock
    private ServiceReference<XACMLPolicyManager> xacmlServiceRef;

    @Mock
    private ServiceReference<DatasetManager> datasetManagerRef;

    @Mock
    private DatasetManager datasetManager;

    @Mock
    private ServiceReference<DatasetRecordService> datasetRecordServiceRef;

    @Mock
    private DatasetRecordService datasetRecordService;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();

        restore = new RestoreService();
        restore.repositoryManager = repositoryManager;
        restore.importService = importService;
        restore.config = catalogConfigProvider;

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));
        provRepo = new MemoryRepositoryWrapper();
        provRepo.setDelegate(new SailRepository(new MemoryStore()));
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));
        when(catalogConfigProvider.getRepository()).thenReturn(repo);

        when(bundleContext.getServiceReference(eq(VirtualFilesystem.class))).thenReturn(vfsServiceRef);
        when(bundleContext.getService(eq(vfsServiceRef))).thenReturn(vfs);
        when(vfs.resolveVirtualFile(anyString())).thenReturn(virtualFile);
        when(virtualFile.exists()).thenReturn(true);

        when(bundleContext.getServiceReference(eq(DatasetRecordService.class))).thenReturn(datasetRecordServiceRef);
        when(bundleContext.getService(eq(datasetRecordServiceRef))).thenReturn(datasetRecordService);

        when(bundleContext.getServiceReference(eq(DatasetManager.class))).thenReturn(datasetManagerRef);
        when(bundleContext.getService(eq(datasetManagerRef))).thenReturn(datasetManager);
        DatasetRecord datasetRecordMock = mock(DatasetRecord.class);
        when(datasetManager.getDatasetRecord(any(Resource.class))).thenReturn(Optional.of(datasetRecordMock));

        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(POLICY_FILE_LOCATION);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(repositoryManager);
    }

    private OsgiRepository mockRepo(Class configClassToMock) {
        OsgiRepository nativeRepo = Mockito.mock(OsgiRepository.class);
        when(nativeRepo.getConfigType()).thenReturn(configClassToMock);
        when(nativeRepo.getConnection()).thenReturn(Mockito.mock(RepositoryConnection.class));
        return nativeRepo;
    }

    @Test
    public void clearAllReposTest() {
        // Setup:
        OsgiRepository nativeRepo = mockRepo(NativeRepositoryConfig.class);
        OsgiRepository memoryRepo = mockRepo(MemoryRepositoryConfig.class);
        OsgiRepository httpRepo = mockRepo(HTTPRepositoryConfig.class);

        Map<String, OsgiRepository> repos = new LinkedHashMap<>();
        repos.put("nativeRepo", nativeRepo);
        repos.put("memoryRepo", memoryRepo);
        repos.put("httpRepo", httpRepo);

        // verify
        when(repositoryManager.getAllRepositories()).thenReturn(repos);
        Assert.assertEquals(restore.clearAllRepos(repositoryManager).toString(), "[httpRepo]");

        Mockito.verify(nativeRepo.getConnection(), times(1)).clear();
        Mockito.verify(memoryRepo.getConnection(), times(1)).clear();
        Mockito.verify(httpRepo.getConnection(), times(0)).clear();
    }

}
