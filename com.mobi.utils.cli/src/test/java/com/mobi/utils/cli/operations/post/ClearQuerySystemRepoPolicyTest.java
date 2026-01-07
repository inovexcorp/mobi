package com.mobi.utils.cli.operations.post;

/*-
 * #%L
 * com.mobi.utils.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.CliTestUtils;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class ClearQuerySystemRepoPolicyTest {
    private static final String POLICY_FILE_LOCATION = "testLocation";
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper repo;

    @Mock
    protected CatalogConfigProvider config;

    @Mock
    protected StateManager stateManager;

    @Mock
    private Bundle bundle;

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

    private ClearQuerySystemRepoPolicy operation;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(config.getRepository()).thenReturn(repo);

        when(bundleContext.getServiceReference(eq(VirtualFilesystem.class))).thenReturn(vfsServiceRef);
        when(bundleContext.getService(eq(vfsServiceRef))).thenReturn(vfs);
        when(vfs.resolveVirtualFile(anyString())).thenReturn(virtualFile);
        when(virtualFile.exists()).thenReturn(true);

        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(POLICY_FILE_LOCATION);

        operation = new ClearQuerySystemRepoPolicy();
        operation.config = config;
        operation.vfs = vfs;
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(config, stateManager, bundle, bundleContext, vfs, vfsServiceRef, virtualFile,  xacmlServiceRef);
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
                "2.5;true",
                "3.0;true",
                "3.1;true",
                "4.0;true",
                "4.1;false"
        ).collect(Collectors.toUnmodifiableList());
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }
    
    @Test()
    public void cleanGraphStatePolicyFileStatementsTest() {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            CliTestUtils.loadFiles(repo,"/systemState.trig");
            List<String> policies = CliTestUtils.queryResource(repo, "/queries/searchPolicy.rq", "policyGraph", "policy");
            Assert.assertEquals(policies.size(), new HashSet<>(policies).size());
            Assert.assertEquals(28, policies.size());

            operation.execute();

            Assert.assertEquals(1, Mockito.mockingDetails(vfs).getInvocations().size());
        }
    }
}
