package com.mobi.utils.cli.operations.pre;

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

import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.utils.cli.CliTestUtils;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import org.apache.commons.io.FileUtils;
import org.apache.maven.artifact.versioning.InvalidVersionSpecificationException;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.sail.memory.MemoryStore;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.FrameworkUtil;
import org.osgi.framework.ServiceReference;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CopyDataDirectoryTest {
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir");
    private static final String BASE_PATH;
    private static String tempDataFileLocation;
    private static String tempPolicyDir;
    private static String finalDataDir;
    private static String finalPolicyDir;
    private static File karafData;
    private static VirtualFilesystem vfs;

    static {
        StringBuilder builder = new StringBuilder(TEMP_DIR);
        if (!TEMP_DIR.endsWith("/")) {
            builder.append("/");
        }
        BASE_PATH = builder.toString();
    }

    private AutoCloseable closeable;

    @Rule
    public ExpectedException thrown = ExpectedException.none();

    @Mock
    protected CatalogConfigProvider config;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private ServiceReference<XACMLPolicyManager> xacmlServiceRef;

    @Mock
    private Bundle bundle;

    private CopyDataDirectory operation;

    @Before
    public void setupMocks() throws Exception {
        System.setProperty("karaf.etc", Objects.requireNonNull(CopyDataDirectoryTest.class.getResource("/"))
                .getPath());

        System.setProperty("karaf.data", TEMP_DIR.replaceFirst("/$", ""));

        tempDataFileLocation = BASE_PATH + "restoreZip/data";
        tempPolicyDir = BASE_PATH + "restoreZip/policies";
        finalDataDir = BASE_PATH + "virtualFiles";
        finalPolicyDir = finalDataDir + "test-location/policies";

        File POLICY_FILES;
        try {
            URL url = Objects.requireNonNull(CopyDataDirectoryTest.class.getResource("/karaf_data/data/policies"));
            POLICY_FILES = new File(url.toURI());

            url = Objects.requireNonNull(CopyDataDirectoryTest.class.getResource("/karaf_data/data/dagu"));
            karafData = new File(url.toURI());
        } catch (URISyntaxException e) {
            throw new MobiException(e);
        }

        closeable = MockitoAnnotations.openMocks(this);

        MemoryRepositoryWrapper repo = new MemoryRepositoryWrapper();
        repo.setDelegate(new SailRepository(new MemoryStore()));

        Mockito.when(config.getRepository()).thenReturn(repo);

        // Setup VirtualFileSystem
        vfs = new SimpleVirtualFilesystem();
        SimpleVirtualFilesystemConfig fileConfig = mock(SimpleVirtualFilesystemConfig.class);
        when(fileConfig.maxNumberOfTempFiles()).thenReturn(10000);
        when(fileConfig.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(fileConfig.defaultRootDirectory()).thenReturn(tempDataFileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, fileConfig);

        FileUtils.copyDirectory(karafData, new File(tempDataFileLocation + "/dagu"));
        FileUtils.copyDirectory(POLICY_FILES, new File(tempPolicyDir));

        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(finalPolicyDir);

        operation = new CopyDataDirectory();
    }

    @After
    public void resetMocks() throws Exception {
        List<String> directoryList = new ArrayList<>(
                Arrays.asList(tempDataFileLocation, tempPolicyDir, finalPolicyDir));
        for (String dirName : directoryList) {
            File filePath = new File(dirName);

            if (filePath.exists()) {
                VirtualFile directory = vfs.resolveVirtualFile(dirName);
                for (VirtualFile child : directory.getChildren()) {
                    child.deleteAll();
                }
            }

        }
        Mockito.reset(config, bundleContext, xacmlServiceRef);
        closeable.close();
    }

    @Test
    public void getVersionRangeTest() throws InvalidVersionSpecificationException {
        List<String> expectedVersions = Stream.of("1.12;false",
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
        ).toList();
        List<String> actualVersionCheck = CliTestUtils.runVersionCheck(operation, expectedVersions);
        Assert.assertEquals(expectedVersions, actualVersionCheck);
    }

    @Test
    public void copyPolicySeparateDirectoryTest() {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            FileUtils.forceMkdir(new File(finalPolicyDir));

            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            operation.execute();

            VirtualFile dataDir = vfs.resolveVirtualFile(URI.create(finalDataDir));
            VirtualFile daguDir = dataDir.getChildren().stream().findFirst().orElseThrow(AssertionError::new);
            VirtualFile daguLogs = daguDir.getChildren().stream().findFirst().orElseThrow(AssertionError::new);
            VirtualFile policyDir = vfs.resolveVirtualFile(URI.create(finalPolicyDir));
            assertEquals(1, dataDir.getChildren().size());
            assertEquals(1, daguDir.getChildren().size());
            assertEquals(3, daguLogs.getChildren().size());
            assertEquals(9, policyDir.getChildren().size());
        } catch (IOException ex) {
            fail();
        }
    }

    @Test
    public void copyDataSameDirectoryTest() {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            finalPolicyDir = finalDataDir + "/policies";
            when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(finalPolicyDir);
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            try {
                URL url = Objects.requireNonNull(CopyDataDirectoryTest.class.getResource("/karaf_data/data/"));
                karafData = new File(url.toURI());
                FileUtils.copyDirectory(karafData, new File(tempDataFileLocation));
            } catch (IOException | URISyntaxException e) {
                throw new MobiException(e);
            }

            operation.execute();

            VirtualFile dataDir = vfs.resolveVirtualFile(URI.create(finalDataDir));
            assertEquals(2, dataDir.getChildren().size());

            for (VirtualFile file: dataDir.getChildren()) {
                if (file.getIdentifier().contains("dagu")) {
                    assertEquals(1, file.getChildren().size());
                    VirtualFile daguLogs = file.getChildren().stream().findFirst().orElseThrow(AssertionError::new);
                    assertEquals(3, daguLogs.getChildren().size());
                } else {
                    assertEquals(9, file.getChildren().size());
                }
            }
        } catch (VirtualFilesystemException ex) {
            fail();
        }
    }

    @Test
    public void copyDataNoPolicyFileExistsTest() {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            //setup
            // Setup:
            thrown.expect(IllegalStateException.class);
            thrown.expectMessage("Could not find policy directory");

            finalPolicyDir = finalDataDir + "/test/nonexistent";
            when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(finalPolicyDir);
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            operation.execute();
        }
    }

}
