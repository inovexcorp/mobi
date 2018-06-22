package com.mobi.vfs.impl.commons;

/*-
 * #%L
 * com.mobi.vfs
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
import net.openhft.hashing.LongHashFunction;
import org.apache.commons.io.IOUtils;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.BlockJUnit4ClassRunner;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFileUtilities;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.URI;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.TimeUnit;


@RunWith(BlockJUnit4ClassRunner.class)
public class DefaultVirtualFilesystemTest extends TestCase {

    private static URI testFile;

    private static URI testResources;

    private static URI writeFile;

    private static String testFileRelative;

    private static String testResourcesRelative;

    private static String writeFileRelative;

    private static String writeFileNestedRelative;

    private static InputStream testFileInputStream;

    private static String fileContents;

    private static SimpleVirtualFilesystem fs;

    @BeforeClass
    public static void initializeUri() throws Exception {
        testFile = DefaultVirtualFilesystemTest.class.getResource("/test.txt").toURI();
        testResources = DefaultVirtualFilesystemTest.class.getResource("/").toURI();
        writeFile = new File(testResources.toString() + "testFile").toURI();
        testFileRelative = "./test.txt";
        testResourcesRelative = "../test-classes/";
        writeFileRelative = "./testFile.txt";
        writeFileNestedRelative = "./test/nested/directory/testFile.txt";
        testFileInputStream = DefaultVirtualFilesystemTest.class.getResourceAsStream("/test.txt");
        fileContents = IOUtils.toString(DefaultVirtualFilesystemTest.class.getResourceAsStream("/test.txt"), "UTF-8");
        fs = new SimpleVirtualFilesystem();

        Map<String, Object> config = new HashMap<>();
        config.put("maxNumberOfTempFiles", 10000);
        config.put("secondsBetweenTempCleanup", 60000);
        config.put("defaultRootDirectory", testResources.getRawPath());

        Method m = fs.getClass().getDeclaredMethod("activate", Map.class);
        m.setAccessible(true);
        m.invoke(fs, config);
        assertNotNull(fs);
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
                content = IOUtils.toString(is, Charset.defaultCharset());
            }
            assertEquals("This is a simple test text file.", content);
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testReadFileRelative() {
        try {
            VirtualFile vf = fs.resolveVirtualFile(testFileRelative);
            assertTrue(vf.exists());
            assertTrue(vf.isFile());
            assertFalse(vf.isFolder());
            String content;
            try (InputStream is = vf.readContent()) {
                content = IOUtils.toString(is, Charset.defaultCharset());
            }
            assertEquals("This is a simple test text file.", content);
        } catch (Exception e) {
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
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileRelative() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            VirtualFile file = fs.resolveVirtualFile(writeFileRelative);
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
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileNestedRelative() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            VirtualFile file = fs.resolveVirtualFile(writeFileNestedRelative);
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
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytes() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());
            file.create();
            file.writeToContent(testString.getBytes());
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesNoDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(testString.getBytes(), "");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesNullDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(testString.getBytes(), null);
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesWithDirectoryNoSlash() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(testString.getBytes(), "directory");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith("directory/" + hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesWithDirectorySlash() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(testString.getBytes(), "directory/");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith("directory/" + hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesAbsoluteDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(testString.getBytes());
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(testString.getBytes(), testResources.toString());
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertEquals(testResources.getPath().replaceFirst("/", "///") + hash, file.getUrl().getPath());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileBytesFileExists() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            VirtualFile file = fs.resolveVirtualFile(testString.getBytes(), "");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());

            VirtualFile sameFile = fs.resolveVirtualFile(testString.getBytes(), "");
            assertFalse(sameFile.isFolder());
            assertTrue(sameFile.exists());
            assertTrue(sameFile.isFile());

            assertEquals(file.getUrl(), sameFile.getUrl());
            assertEquals(file.getSize(), sameFile.getSize());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            try (InputStream is = sameFile.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(sameFile.exists());
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertFalse(sameFile.exists());
            assertFalse(sameFile.delete());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamNoDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), "");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamNullDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), null);
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamWithDirectoryNoSlash() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), "directory");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith("directory/" + hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamWithDirectorySlash() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), "directory/");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith("directory/" + hash));
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamAbsoluteDirectory() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());

            file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), testResources.toString());
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertEquals(testResources.toString().replaceFirst("/", "///") + hash, file.getUrl().toString());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamFileExists() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            VirtualFile file = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), "");
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());

            VirtualFile sameFile = fs.resolveVirtualFile(new ByteArrayInputStream(testString.getBytes()), "");
            assertFalse(sameFile.isFolder());
            assertTrue(sameFile.exists());
            assertTrue(sameFile.isFile());

            assertEquals(file.getUrl(), sameFile.getUrl());
            assertEquals(file.getSize(), sameFile.getSize());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            try (InputStream is = sameFile.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(sameFile.exists());
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertFalse(sameFile.exists());
            assertFalse(sameFile.delete());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testWriteFileStreamIndividual() {
        String testString = "WHOA, THIS ABSTRACT FILE SYSTEM IS COOL";
        try {
            String hash = fs.contentHashFilePath(new ByteArrayInputStream(testString.getBytes()));
            VirtualFile file = fs.resolveVirtualFile(hash);
            assertFalse(file.exists());
            assertFalse(file.isFile());
            assertFalse(file.isFolder());
            file.create();
            InputStream testInputStream = new ByteArrayInputStream(testString.getBytes());
            file.writeToContent(testInputStream);
            assertFalse(file.isFolder());
            assertTrue(file.exists());
            assertTrue(file.isFile());
            try (InputStream is = file.readContent()) {
                final String content = IOUtils.toString(is, Charset.defaultCharset());
                assertEquals(testString, content);
            }
            assertTrue(file.delete());
            assertFalse(file.delete());
            assertTrue(file.getUrl().toString().endsWith(hash));
        } catch (Exception e) {
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
            fail(e.getMessage());
        }
    }

    @Test
    public void testReadFolderRelative() {
        try {
            final VirtualFile targetDir = fs.resolveVirtualFile(testResourcesRelative);
            assertTrue(targetDir.exists());
            assertFalse(targetDir.isFile());
            assertTrue(targetDir.isFolder());
            assertNotNull(targetDir.getChildren());
            assertFalse(targetDir.getChildren().isEmpty());
            final String[] data = new File(testResources).list();
            assertNotNull(data);
            assertEquals(data.length, targetDir.getChildren().size());
        } catch (Exception e) {
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
                            fail(e.getMessage());
                        }
                    });
        } catch (Exception e) {
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
            VirtualFileUtilities.asynchronouslyProcessAllFiles(pool, vf -> {
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
            fail(e.getMessage());
        }
    }

    @Test
    public void testGetBaseFile() {
        try {
            VirtualFile testResourceFile = fs.resolveVirtualFile(testResources);
            VirtualFile baseFile = fs.getBaseFile();
            assertEquals(testResourceFile.getUrl(), baseFile.getUrl());
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testGetBaseFilePath() {
        try {
            VirtualFile testResourceFile = fs.resolveVirtualFile(testResources);
            String baseFilePath = fs.getBaseFilePath();
            assertEquals(testResourceFile.getIdentifier(), baseFilePath);
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testContentHashFilePathStream() {
        try {
            String hash = fs.contentHashFilePath(testFileInputStream);
            String otherHashLib = Long.toHexString(LongHashFunction.xx().hashBytes(fileContents.getBytes()));
            String expectedHash = otherHashLib.substring(0, 2) + "/" + otherHashLib.substring(2, 4) + "/" + otherHashLib.substring(4, otherHashLib.length());
            assertEquals(expectedHash, hash);
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }

    @Test
    public void testContentHashFilePathBytes() {
        try {
            String hash = fs.contentHashFilePath(fileContents.getBytes());
            String otherHashLib = Long.toHexString(LongHashFunction.xx().hashBytes(fileContents.getBytes()));
            String expectedHash = otherHashLib.substring(0, 2) + "/" + otherHashLib.substring(2, 4) + "/" + otherHashLib.substring(4, otherHashLib.length());
            assertEquals(expectedHash, hash);
        } catch (Exception e) {
            fail(e.getMessage());
        }
    }
}
