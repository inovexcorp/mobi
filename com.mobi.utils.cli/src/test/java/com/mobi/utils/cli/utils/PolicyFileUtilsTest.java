package com.mobi.utils.cli.utils;

/*-
 * #%L
 * com.mobi.utils.cli
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

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.CliTestUtils;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
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
import org.slf4j.Logger;

import java.util.Collections;
import java.util.List;

public class PolicyFileUtilsTest {
    private static final String POLICY_FILE_LOCATION = "testLocation";
    private AutoCloseable closeable;
    private ValueFactory vf;
    private MemoryRepositoryWrapper repo;

    @Mock
    protected CatalogConfigProvider config;

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

    @Mock
    private Logger logger;

    @Before
    public void setupMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        vf = new ValidatingValueFactory();

        repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(config.getRepository()).thenReturn(repo);

        when(bundleContext.getServiceReference(eq(VirtualFilesystem.class))).thenReturn(vfsServiceRef);
        when(bundleContext.getService(eq(vfsServiceRef))).thenReturn(vfs);
        when(vfs.resolveVirtualFile(anyString())).thenReturn(virtualFile);
        when(virtualFile.exists()).thenReturn(true);

        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(POLICY_FILE_LOCATION);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
        Mockito.reset(config, bundleContext, vfs, vfsServiceRef, virtualFile,  xacmlServiceRef);
    }

    @Test
    public void removePolicyFileTest() throws Exception {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            CliTestUtils.loadFiles(repo, "/systemPolicyFiles.trig");
            List<Resource> resources = Collections.singletonList(vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"));
            try (RepositoryConnection conn = repo.getConnection()) {
                PolicyFileUtils.removePolicyFiles(conn, vfs, resources, logger);
            }
            verify(vfs).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
            verify(virtualFile).exists();
            verify(virtualFile).delete();
        }
    }

    @Test
    public void removePolicyFileDoesntExistTest() throws Exception {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            when(virtualFile.exists()).thenReturn(false);
            CliTestUtils.loadFiles(repo, "/systemPolicyFiles.trig");
            List<Resource> resources = Collections.singletonList(vf.createIRI("http://mobi.com/policies/all-access-versioned-rdf-record"));
            try (RepositoryConnection conn = repo.getConnection()) {
                PolicyFileUtils.removePolicyFiles(conn, vfs, resources, logger);
            }
            verify(vfs).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
            verify(virtualFile).exists();
            verify(virtualFile, never()).delete();
        }
    }

    @Test
    public void removePolicyFileIRIDoesntExistTest() throws Exception {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            when(virtualFile.exists()).thenReturn(false);
            CliTestUtils.loadFiles(repo, "/systemPolicyFiles.trig");
            List<Resource> resources = Collections.singletonList(vf.createIRI("urn:nothing"));
            try (RepositoryConnection conn = repo.getConnection()) {
                PolicyFileUtils.removePolicyFiles(conn, vfs, resources, logger);
            }
            verify(vfs, never()).resolveVirtualFile(eq(POLICY_FILE_LOCATION + "3a/5f/b3766aac44f6"));
            verify(virtualFile, never()).exists();
            verify(virtualFile, never()).delete();
        }
    }
}
