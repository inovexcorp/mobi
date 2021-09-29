package com.mobi.utils.cli;
/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.core.impl.sesame.SimpleValueFactory;
import com.mobi.rdf.core.utils.Values;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.config.RepositoryConfig;
import com.mobi.repository.impl.sesame.SesameRepositoryWrapper;
import com.mobi.repository.impl.sesame.http.HTTPRepositoryConfig;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryConfig;
import com.mobi.repository.impl.sesame.nativestore.NativeRepositoryConfig;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.BundleContext;
import org.osgi.framework.ServiceReference;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class RestoreTest {

    private static final String POLICY_FILE_LOCATION = "testLocation";
    private Repository repo;
    private ValueFactory vf;
    private Restore restore;

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

    @Before
    public void setupMocks() throws Exception {
        MockitoAnnotations.initMocks(this);
        vf = SimpleValueFactory.getInstance();

        restore = new Restore();
        restore.setVf(vf);
        restore.setStateManager(stateManager);
        restore.setRepositoryManager(repositoryManager);
        restore.setImportService(importService);
        restore.setConfig(catalogConfigProvider);

        Mockito.reset(repositoryManager, stateManager);
        repo = new SesameRepositoryWrapper(new SailRepository(new MemoryStore()));
        repo.initialize();
        when(repositoryManager.getRepository(anyString())).thenReturn(Optional.of(repo));
        when(catalogConfigProvider.getRepository()).thenReturn(repo);

        when(bundleContext.getServiceReference(eq(VirtualFilesystem.class))).thenReturn(vfsServiceRef);
        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(bundleContext.getService(eq(vfsServiceRef))).thenReturn(vfs);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(POLICY_FILE_LOCATION);
        when(vfs.resolveVirtualFile(anyString())).thenReturn(virtualFile);
        when(virtualFile.exists()).thenReturn(true);
    }

    private Repository mockRepo(Class<? extends RepositoryConfig> configClassToMock) {
        Repository nativeRepo = Mockito.mock(Repository.class);
        when(nativeRepo.getConfig()).thenReturn(Mockito.mock(configClassToMock));
        when(nativeRepo.getConnection()).thenReturn(Mockito.mock(RepositoryConnection.class));
        return nativeRepo;
    }

    private void loadFiles(String... files) {
        try (RepositoryConnection conn = repo.getConnection()) {
            conn.begin();
            for(String name : files){
                InputStream testData = RestoreTest.class.getResourceAsStream(name);
                conn.add(Values.mobiModel(Rio.parse(testData, "", RDFFormat.TRIG)));
            }
            conn.commit();
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
    }

    private List<String> queryResource(String path, String... bindings){
        List<String> results = new ArrayList<>();
        List<String> bindingValues = new ArrayList<>();

        try (RepositoryConnection conn = repo.getConnection()) {
            String query = IOUtils.toString(Restore.class.getResourceAsStream(path), StandardCharsets.UTF_8);
            TupleQuery tupleQuery = conn.prepareTupleQuery(query);
            TupleQueryResult result = tupleQuery.evaluate();
            while (result.hasNext()) {  // iterate over the result
                bindingValues.clear();
                BindingSet bindingSet = result.next();

                for(String binding : bindings){
                    if(bindingSet.getValue(binding).isPresent()){
                        bindingValues.add(bindingSet.getValue(binding).get().toString());
                    }else{
                        bindingValues.add("NULL");
                    }
                }
                results.add(String.join(";", bindingValues));
            }
        } catch (IOException e) {
            Assert.fail(e.getMessage());
        }
        return results;
    }

    @Test
    public void clearAllReposTest() {
        // Setup:
        Repository nativeRepo = mockRepo(NativeRepositoryConfig.class);
        Repository memoryRepo = mockRepo(MemoryRepositoryConfig.class);
        Repository httpRepo = mockRepo(HTTPRepositoryConfig.class);

        Map<String, Repository> repos = new LinkedHashMap<>();
        repos.put("nativeRepo", nativeRepo);
        repos.put("memoryRepo", memoryRepo);
        repos.put("httpRepo", httpRepo);

        // verify
        when(repositoryManager.getAllRepositories()).thenReturn(repos);
        Assert.assertEquals(restore.clearAllRepos(repositoryManager).toString(), "[httpRepo]");

        Mockito.verify(nativeRepo.getConnection(), Mockito.times(1)).clear();
        Mockito.verify(memoryRepo.getConnection(), Mockito.times(1)).clear();
        Mockito.verify(httpRepo.getConnection(), Mockito.times(0)).clear();
    }
    
    @Test
    public void cleanGraphStateInProgressCommitsNoUserTest() {
        loadFiles("/systemCommitNoUser.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/in-progress-commits#R3U28I3;https://mobi.com/additions#R3U28I3A2",
                "https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource("/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));

        restore.cleanCatalogRepo("2", bundleContext);

        graphExpect = Stream.of("https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource("/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));
    }

    @Test
    public void cleanGraphStateInProgressCommitsNoRecordTest() {
        loadFiles("/systemCommitNoRecord.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/in-progress-commits#R3U28I3;https://mobi.com/additions#R3U28I3A2",
                "https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource("/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));

        restore.cleanCatalogRepo("2", bundleContext);

        graphExpect = Stream.of("https://mobi.com/in-progress-commits#R5U29I1;https://mobi.com/additions#R5U29I1A1").collect(Collectors.toList());

        Assert.assertEquals(graphExpect, queryResource("/queries/searchInProgressCommits.rq", "inProgressCommit", "diffGraph"));
    }

    @Test
    public void cleanGraphStateDanglingAdditionsDeletionsTest() {
        loadFiles("/systemState.trig");
        List<String> graphExpect = Stream.of("https://mobi.com/additions#hasNoRevision",
                "https://mobi.com/deletions#hasNoRevision").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource("/queries/searchDanglingAdditionsDeletions.rq", "diffGraph"));
        restore.cleanCatalogRepo("2", bundleContext);
        Assert.assertEquals(0, queryResource("/queries/searchDanglingAdditionsDeletions.rq", "diffGraph").size());
        // ensure it did not delete good graphs
        graphExpect = Stream.of("https://mobi.com/additions#hasRevision001",
                "https://mobi.com/additions#hasRevision002").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource("/queries/searchAdditionsDeletions.rq", "diffGraph"));
    }

    @Test
    public void cleanGraphStateInstanceNoUserTest() {
        loadFiles("/systemState.trig");
        List<String> graphExpect = Stream.of("http://mobi.com/states#0001",
                "http://mobi.com/states#0002").collect(Collectors.toList());
        Assert.assertEquals(graphExpect, queryResource("/queries/searchStateInstanceNoUser.rq", "state"));
        restore.cleanCatalogRepo("1.20", bundleContext);

        Mockito.verify(stateManager).deleteState(vf.createIRI("http://mobi.com/states#0002"));
        Mockito.verify(stateManager).deleteState(vf.createIRI("http://mobi.com/states#0001"));
        Assert.assertEquals(2, Mockito.mockingDetails(stateManager).getInvocations().size());
    }

    @Test
    public void cleanGraphStatePolicyFileStatementsTest() {
        loadFiles("/systemState.trig");
        Assert.assertEquals(16, queryResource("/queries/searchPolicy.rq", "policyGraph", "policy").size());
        restore.cleanCatalogRepo("2", bundleContext);
        Assert.assertEquals(0, queryResource("/queries/searchPolicy.rq", "policyGraph", "policy").size());
        Assert.assertEquals(8, Mockito.mockingDetails(stateManager).getInvocations().size());
    }

    @Test
    public void removePolicyFileTest() throws Exception {
        loadFiles("/systemPolicyFiles.trig");
        List<Resource> resources = Collections.singletonList(vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"));
        try (RepositoryConnection conn = repo.getConnection()) {
            restore.removePolicyFiles(bundleContext, conn, POLICY_FILE_LOCATION, resources);
        }
        verify(bundleContext).getServiceReference(eq(VirtualFilesystem.class));
        verify(bundleContext).getService(eq(vfsServiceRef));
        verify(vfs).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
        verify(virtualFile).exists();
        verify(virtualFile).delete();
    }

    @Test
    public void removePolicyFileDoesntExistTest() throws Exception {
        when(virtualFile.exists()).thenReturn(false);
        loadFiles("/systemPolicyFiles.trig");
        List<Resource> resources = Collections.singletonList(vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"));
        try (RepositoryConnection conn = repo.getConnection()) {
            restore.removePolicyFiles(bundleContext, conn, POLICY_FILE_LOCATION, resources);
        }
        verify(bundleContext).getServiceReference(eq(VirtualFilesystem.class));
        verify(bundleContext).getService(eq(vfsServiceRef));
        verify(vfs).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
        verify(virtualFile).exists();
        verify(virtualFile, never()).delete();
    }

    @Test
    public void removePolicyFileIRIDoesntExistTest() throws Exception {
        when(virtualFile.exists()).thenReturn(false);
        loadFiles("/systemPolicyFiles.trig");
        List<Resource> resources = Collections.singletonList(vf.createIRI("urn:nothing"));
        try (RepositoryConnection conn = repo.getConnection()) {
            restore.removePolicyFiles(bundleContext, conn, POLICY_FILE_LOCATION, resources);
        }
        verify(bundleContext).getServiceReference(eq(VirtualFilesystem.class));
        verify(bundleContext).getService(eq(vfsServiceRef));
        verify(vfs, never()).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
        verify(virtualFile, never()).exists();
        verify(virtualFile, never()).delete();
    }
}
