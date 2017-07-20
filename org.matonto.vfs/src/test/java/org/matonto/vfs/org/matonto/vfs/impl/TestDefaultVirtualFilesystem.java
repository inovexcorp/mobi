package org.matonto.vfs.org.matonto.vfs.impl;

/*-
 * #%L
 * org.matonto.vfs
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

import junit.framework.TestCase;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import org.matonto.vfs.api.AbstractVirtualFile;
import org.matonto.vfs.api.VirtualFile;
import org.matonto.vfs.basic.BasicVirtualFilesystem;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.URI;
import java.nio.charset.Charset;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.TimeUnit;


@RunWith(BlockJUnit4ClassRunner.class)
public class TestDefaultVirtualFilesystem extends TestCase {

    private static URI testFile;

    private static URI testResources;

    private static URI targetDirectory;

    private static URI writeFile;

    private static BasicVirtualFilesystem fs;


    @BeforeClass
    public static void initializeUri() {
        try {
            testFile = new java.io.File("src/test/resources/test.txt").toURI();
            assertNotNull(testFile);
            testResources = new java.io.File("src/test/resources").toURI();
            assertNotNull(testResources);
            targetDirectory = new java.io.File("target").toURI();
            assertNotNull(targetDirectory);
            writeFile = new java.io.File(new java.io.File(targetDirectory).getAbsolutePath() + "/testFile").toURI();
            assertNotNull(writeFile);
            fs = new BasicVirtualFilesystem();
            Method m = fs.getClass().getDeclaredMethod("activate");
            m.setAccessible(true);
            m.invoke(fs);
            assertNotNull(fs);
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }

    @Test
    public void testReadFile() {
        try {
            VirtualFile vf = fs.resolveVirtualFile(testFile);
            assertTrue(vf.exists());
            assertTrue(vf.isFile());
            assertFalse(vf.isFolder());
            String content;
            try (InputStream is = vf.readContent()) {
                content = org.apache.commons.io.IOUtils.toString(is, Charset.defaultCharset());
            }
            assertEquals("This is a simple test text file.", content);
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFile() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            VirtualFile file = fs.resolveVirtualFile(writeFile);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());
            file.create();
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (OutputStream os = file.writeContent()) {
                os.write(testString.getBytes());
            }
            try (InputStream is = file.readContent()) {
                final String content = org.apache.commons.io.IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }

    @Test
    public void testReadFolder() {
        try {
            final VirtualFile targetDir = fs.resolveVirtualFile(testResources);
            assertTrue(targetDir.exists());
            assertFalse(targetDir.isFile());
            assertTrue(targetDir.isFolder());
            assertNotNull(targetDir.getChildren());
            assertFalse(targetDir.getChildren().isEmpty());
            final String[] data = new File(testResources).list();
            assertNotNull(data);
            assertEquals(data.length, targetDir.getChildren().size());
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }

    @Test
    public void testStreamFolder() {
        try {
            fs.resolveVirtualFile(testResources).streamChildren()
                    .forEach(vf -> {
                        try {
                            if (vf.getIdentifier().endsWith("test.txt")) {
                                assertTrue(vf.isFile());
                            } else if (vf.getIdentifier().endsWith("testDirectory")) {
                                assertTrue(vf.isFolder());
                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                            fail(e.getMessage());
                        }
                    });
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }

    @Test
    public void testProcessAllFiles() {
        try {
            ForkJoinPool pool = new ForkJoinPool(2);
            Set<Throwable> issues = new HashSet<>();
            VirtualFile f = fs.resolveVirtualFile("zip://" + new File("src/test/resources/test.zip").getAbsolutePath());
            Set<VirtualFile> files = new HashSet<>();
            AbstractVirtualFile.asynchronouslyProcessAllFiles(pool, vf -> {
                assertNotNull(vf);
                files.add(vf);
            }, f, issues, true);
            pool.shutdown();
            pool.awaitTermination(3, TimeUnit.SECONDS);
            assertTrue(pool.isShutdown());
            assertTrue(pool.isQuiescent());
            assertEquals(2, files.size());
            assertTrue(issues.isEmpty());
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }


    @Test
    public void testZip() {
        try {
            VirtualFile f = fs.resolveVirtualFile("zip://" + new File("src/test/resources/test.zip").getAbsolutePath());
            assertTrue(f.isFolder());
            assertEquals(2, f.getChildren().size());
        } catch (Exception e) {
            e.printStackTrace();
            fail(e.getMessage());
        }
    }


}
