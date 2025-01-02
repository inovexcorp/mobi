package com.mobi.utils.cli;

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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mobi.etl.api.config.rdf.export.RDFExportConfig;
import com.mobi.etl.api.rdf.export.RDFExportService;
import com.mobi.exception.MobiException;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.repository.impl.sesame.memory.MemoryRepositoryWrapper;
import com.mobi.security.policy.api.xacml.XACMLPolicyManager;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystem;
import com.mobi.vfs.impl.commons.SimpleVirtualFilesystemConfig;
import org.apache.commons.io.FileUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.sail.SailRepository;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class BackupTest {
    private static final String BASE_PATH;
    private static final String REPO_ID = "test-repo";
    private static final ValueFactory vf = new ValidatingValueFactory();
    private static VirtualFilesystem vfs;
    private static String tempDataFileLocation;
    private static File policyData;
    private static String dataDir;


    private Backup backup;
    private AutoCloseable closeable;
    private MemoryRepositoryWrapper provRepo;

    static {
        String temp_dir = System.getProperty("java.io.tmpdir");
        StringBuilder builder = new StringBuilder(temp_dir);
        if (!temp_dir.endsWith("/")) {
            builder.append("/");
        }
        BASE_PATH = builder.append("mobi").toString();
        File mobiDir = new File(BASE_PATH);
        mobiDir.mkdir();
    }

    @Mock
    private RepositoryManager repositoryManager;

    @Mock
    private RDFExportService exportService;

    @Mock
    private BundleContext bundleContext;

    @Mock
    private ServiceReference<XACMLPolicyManager> xacmlServiceRef;

    @Mock
    private Bundle bundle;

    @Before
    public void setUp() throws Exception {
        File karafData;
        File configData;
        try {
            URL daguUrl = Objects.requireNonNull(BackupTest.class.getResource("/karaf_data/data/dagu"));
            karafData = new File(daguUrl.toURI());

            URL policyUrl = Objects.requireNonNull(BackupTest.class.getResource("/karaf_data/data/policies"));
            policyData = new File(policyUrl.toURI());

            URL configUrl = Objects.requireNonNull(BackupTest.class.getResource("/karaf_data/configurations"));
            configData = new File(configUrl.toURI());
        } catch (URISyntaxException e) {
            throw new MobiException(e);
        }

        tempDataFileLocation = BASE_PATH + "/testLocation";
        dataDir = BASE_PATH + "/data/virtualFiles";
        String configPath = BASE_PATH + "/config";

        File configDir = new File(configPath);
        configDir.mkdir();

        FileUtils.copyDirectory(karafData, new File(dataDir));
        FileUtils.copyDirectory(configData, new File(configPath));

        System.setProperty("karaf.home", BASE_PATH);
        System.setProperty("karaf.etc", configPath);

        closeable = MockitoAnnotations.openMocks(this);

        backup = new Backup();
        backup.setExportService(exportService);
        backup.setRepoManager(repositoryManager);

        provRepo = new MemoryRepositoryWrapper();
        provRepo.setDelegate(new SailRepository(new MemoryStore()));

        vfs = new SimpleVirtualFilesystem();
        SimpleVirtualFilesystemConfig fileConfig = mock(SimpleVirtualFilesystemConfig.class);
        when(fileConfig.maxNumberOfTempFiles()).thenReturn(10000);
        when(fileConfig.secondsBetweenTempCleanup()).thenReturn((long) 60000);
        when(fileConfig.defaultRootDirectory()).thenReturn(tempDataFileLocation);
        Method m = vfs.getClass().getDeclaredMethod("activate", SimpleVirtualFilesystemConfig.class);
        m.setAccessible(true);
        m.invoke(vfs, fileConfig);

        when(bundleContext.getServiceReference(eq(XACMLPolicyManager.class))).thenReturn(xacmlServiceRef);
        when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(dataDir + "/policies");
        when(repositoryManager.getAllRepositories()).thenReturn(Map.of(REPO_ID, provRepo));

    }

    @After
    public void tearDown() throws Exception {
        VirtualFile directory = vfs.resolveVirtualFile(BASE_PATH);
        for (VirtualFile child : directory.getChildren()) {
            child.deleteAll();
        }
        closeable.close();
    }

    @Test
    public void testBackup() throws Exception {
        FileUtils.copyDirectory(policyData, new File(dataDir));

        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            backup.filePath = tempDataFileLocation + "/backup.zip";
            backup.execute();

            String outputFolderPath = tempDataFileLocation + "/unzippedBackup";
            VirtualFile backupFile = vfs.resolveVirtualFile(URI.create(tempDataFileLocation + "/backup.zip"));
            unzipTestFiles(backupFile.getUrl().getPath(), outputFolderPath);
            VirtualFile unzippedBackup = vfs.resolveVirtualFile(URI.create(outputFolderPath));
            Collection<VirtualFile> childFiles = unzippedBackup.getChildren();
            for (VirtualFile child : childFiles) {
                String path = child.getUrl().getPath();
                if (path.contains(".zip")) {
                    String childName = path.substring(0, path.lastIndexOf('.'));
                    if (childName.contains("data") || childName.contains("policies") || childName.contains("configurations")) {
                        unzipTestFiles(child.getUrl().getPath(), childName);
                    }
                }
            }

            assertTrue(backupFile.exists());
            assertEquals(4, childFiles.size());

        } catch (VirtualFilesystemException ex) {
            fail();
        }
    }

    @Test
    public void testNewBasePath() throws Exception {
        Statement retrievalStmnt = vf.createStatement(
                vf.createIRI("https://mobi.solutions/workflows/log-files/agent_4a142ab4b7b6051b3c160f0e77e9e50617e97225.20240424.16:22:26.280.3c55f4f3.log"),
                vf.createIRI("http://mobi.com/ontologies/documents#retrievalURL"),
                vf.createLiteral(BASE_PATH + "/test.log"));

        Model expectedModel = Rio.parse(getClass().getResourceAsStream("/expectedModel.ttl"), "",
                RDFFormat.TRIG);

        expectedModel.add(
                vf.createIRI("https://mobi.solutions/workflows/log-files/agent_4a142ab4b7b6051b3c160f0e77e9e50617e97225.20240424.16:22:26.280.3c55f4f3.log"),
                vf.createIRI("http://mobi.com/ontologies/documents#retrievalURL"),
                vf.createIRI("file://" + tempDataFileLocation + "/newBasePath/test.log"));

        try (RepositoryConnection conn = provRepo.getConnection()) {
            Model trigData = Rio.parse(getClass().getResourceAsStream("/prov.trig"), "", RDFFormat.TRIG);
            conn.add(trigData);
            conn.add(retrievalStmnt);
            conn.commit();
        }

        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            backup.filePath = tempDataFileLocation + "/backup.zip";
            backup.basePath = tempDataFileLocation + "/newBasePath";
            backup.execute();

            String outputFolderPath = tempDataFileLocation + "/unzippedBackup";
            VirtualFile backupFile = vfs.resolveVirtualFile(URI.create(tempDataFileLocation + "/backup.zip"));
            unzipTestFiles(backupFile.getUrl().getPath(), outputFolderPath);
            VirtualFile unzippedBackup = vfs.resolveVirtualFile(URI.create(outputFolderPath));
            Collection<VirtualFile> childFiles = unzippedBackup.getChildren();
            for (VirtualFile child : childFiles) {
                String path = child.getUrl().getPath();
                if (path.contains(".zip")) {
                    String childName = path.substring(0, path.lastIndexOf('.'));
                    if (childName.contains("data") || childName.contains("policies") ||
                            childName.contains("configurations")) {
                        unzipTestFiles(child.getUrl().getPath(), childName);
                    }
                }
            }

            assertTrue(backupFile.exists());
            assertEquals(4, childFiles.size());
            verify(exportService).export(any(RDFExportConfig.class), eq(expectedModel));
            try (RepositoryConnection conn = provRepo.getConnection()) {
                assertTrue(conn.hasStatement(retrievalStmnt.getSubject(), retrievalStmnt.getPredicate(),
                        retrievalStmnt.getObject(), false));
            }
        } catch (VirtualFilesystemException ex) {
            fail();
        }
    }

    @Test
    public void testDiffPolicyDir() throws Exception {
        try (MockedStatic<FrameworkUtil> frameworkUtil = Mockito.mockStatic(FrameworkUtil.class)) {
            String newPolicyDir = BASE_PATH + "/extra/policies";
            FileUtils.copyDirectory(policyData, new File(newPolicyDir));

            when(xacmlServiceRef.getProperty(eq("policyFileLocation"))).thenReturn(newPolicyDir);
            when(bundle.getBundleContext()).thenReturn(bundleContext);
            frameworkUtil.when(() -> FrameworkUtil.getBundle(eq(XACMLPolicyManager.class))).thenReturn(bundle);

            backup.filePath = tempDataFileLocation + "/backup.zip";
            backup.execute();

            String outputFolderPath = tempDataFileLocation + "/unzippedBackup";
            VirtualFile backupFile = vfs.resolveVirtualFile(URI.create(tempDataFileLocation + "/backup.zip"));
            unzipTestFiles(backupFile.getUrl().getPath(), outputFolderPath);
            VirtualFile unzippedBackup = vfs.resolveVirtualFile(URI.create(outputFolderPath));
            Collection<VirtualFile> childFiles = unzippedBackup.getChildren();
            for (VirtualFile child : childFiles) {
                String path = child.getUrl().getPath();
                if (path.contains(".zip")) {
                    String childName = path.substring(0, path.lastIndexOf('.'));
                    if (childName.contains("data") || childName.contains("policies")
                            || childName.contains("configurations")) {
                        unzipTestFiles(child.getUrl().getPath(), childName);
                    }
                }
            }

            assertTrue(backupFile.exists());
            assertEquals(5, childFiles.size());
        } catch (VirtualFilesystemException ex) {
            fail();
        }
    }

    private void unzipTestFiles(String sourceZipFile, String outputFolderPath) {
        byte[] buffer = new byte[1024];
        try {
            // Create input stream from the source zip file
            FileInputStream fis = new FileInputStream(sourceZipFile);
            ZipInputStream zis = new ZipInputStream(fis);

            ZipEntry zipEntry = zis.getNextEntry();

            while(zipEntry != null) {
                String fileName = zipEntry.getName();
                File newFile = new File(outputFolderPath + File.separator + fileName);

                new File(newFile.getParent()).mkdirs();

                FileOutputStream fos = new FileOutputStream(newFile);

                int len;
                while ((len = zis.read(buffer)) > 0) {
                    fos.write(buffer, 0, len);
                }

                fos.close();

                // Close current entry and get the next one
                zis.closeEntry();
                zipEntry = zis.getNextEntry();
            }

            // Close the last entry and the zip input stream
            zis.closeEntry();
            zis.close();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
