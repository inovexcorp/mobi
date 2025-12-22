package com.mobi.server.impl.logs;

/*-
 * #%L
 * com.mobi.server.impl
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
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;

import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LogViewerServiceImplTest {

    @Rule
    public TemporaryFolder tempFolder = new TemporaryFolder();

    private LogViewerServiceImpl service;
    private Path logDirectory;
    private MockedStatic<LogEntryReader> mockedLogEntryReader;
    private AutoCloseable closeable;

    @Before
    public void setUp() throws IOException {
        closeable = MockitoAnnotations.openMocks(this);

        // Create temporary log directory
        logDirectory = tempFolder.newFolder("logs").toPath();

        // Initialize the service
        service = new LogViewerServiceImpl();

        // Activate with test log directory
        Map<String, Object> properties = new HashMap<>();
        properties.put("log.directory", logDirectory.toString());
        service.activate(properties);

        // Mock the static LogEntryReader methods
        mockedLogEntryReader = mockStatic(LogEntryReader.class);
    }

    @After
    public void tearDown() throws Exception {
        if (mockedLogEntryReader != null) {
            mockedLogEntryReader.close();
        }
        if (closeable != null) {
            closeable.close();
        }
    }

    @Test
    public void testGetAvailableLogFiles_ReturnsLogFiles() throws IOException {
        // Create test log files
        Files.createFile(logDirectory.resolve("app.log"));
        Files.createFile(logDirectory.resolve("error.log"));
        Files.createFile(logDirectory.resolve("debug.log.1"));
        Files.createFile(logDirectory.resolve("notes.txt")); // Should be excluded

        List<String> logFiles = service.getAvailableLogFiles();

        assertEquals(3, logFiles.size());
        assertTrue(logFiles.contains("app.log"));
        assertTrue(logFiles.contains("error.log"));
        assertTrue(logFiles.contains("debug.log.1"));
        assertFalse(logFiles.contains("notes.txt"));
    }

    @Test
    public void testGetAvailableLogFiles_EmptyDirectory() throws IOException {
        List<String> logFiles = service.getAvailableLogFiles();

        assertTrue(logFiles.isEmpty());
    }

    @Test(expected = IOException.class)
    public void testGetAvailableLogFiles_DirectoryDoesNotExist() throws IOException {
        // Create service with non-existent directory
        LogViewerServiceImpl testService = new LogViewerServiceImpl();
        Map<String, Object> properties = new HashMap<>();
        properties.put("log.directory", "/nonexistent/path");
        testService.activate(properties);

        testService.getAvailableLogFiles();
    }

    @Test
    public void testReadLogFile_ValidRequest() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = Arrays.asList("Entry 1", "Entry 2", "Entry 3");
        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(10L);
        mockedLogEntryReader.when(() -> LogEntryReader.readLogEntries(logFile, 0L, 100))
                .thenReturn(mockEntries);

        LogPage result = service.readLogFile("test.log", 0, 100);

        assertNotNull(result);
        assertEquals(3, result.getLines().size());
        assertEquals(0, result.getCurrentPage());
        assertEquals(1, result.getTotalPages());
        assertEquals(10L, result.getTotalLines());
        assertEquals("test.log", result.getFileName());
    }

    @Test
    public void testReadLogFile_Pagination() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = Arrays.asList("Entry 6", "Entry 7", "Entry 8");
        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(25L);
        mockedLogEntryReader.when(() -> LogEntryReader.readLogEntries(logFile, 10L, 5))
                .thenReturn(mockEntries);

        LogPage result = service.readLogFile("test.log", 2, 5);

        assertNotNull(result);
        assertEquals(3, result.getLines().size());
        assertEquals(2, result.getCurrentPage());
        assertEquals(5, result.getTotalPages());
    }

    @Test
    public void testReadLogFile_InvalidPageSize() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = List.of("Entry 1");
        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(1L);
        mockedLogEntryReader.when(() -> LogEntryReader.readLogEntries(eq(logFile), anyLong(), eq(100)))
                .thenReturn(mockEntries);

        // Test negative page size - should default to 100
        LogPage result = service.readLogFile("test.log", 0, -1);
        assertNotNull(result);

        // Test zero page size - should default to 100
        result = service.readLogFile("test.log", 0, 0);
        assertNotNull(result);

        // Test excessive page size - should default to 100
        result = service.readLogFile("test.log", 0, 5000);
        assertNotNull(result);
    }

    @Test
    public void testReadLogFile_InvalidPage() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = List.of("Entry 1");
        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(10L);
        mockedLogEntryReader.when(() -> LogEntryReader.readLogEntries(eq(logFile), anyLong(), anyInt()))
                .thenReturn(mockEntries);

        // Test negative page - should default to 0
        LogPage result = service.readLogFile("test.log", -5, 10);
        assertEquals(0, result.getCurrentPage());

        // Test page beyond total - should be adjusted
        result = service.readLogFile("test.log", 100, 10);
        assertTrue(result.getCurrentPage() < 100);
    }

    @Test(expected = IOException.class)
    public void testReadLogFile_FileDoesNotExist() throws IOException {
        service.readLogFile("nonexistent.log", 0, 100);
    }

    @Test(expected = IOException.class)
    public void testReadLogFile_NullFileName() throws IOException {
        service.readLogFile(null, 0, 100);
    }

    @Test(expected = IOException.class)
    public void testReadLogFile_EmptyFileName() throws IOException {
        service.readLogFile("", 0, 100);
    }

    @Test(expected = IOException.class)
    public void testReadLogFile_DirectoryTraversal() throws IOException {
        Files.createFile(logDirectory.resolve("test.log"));
        service.readLogFile("../test.log", 0, 100);
    }

    @Test(expected = IOException.class)
    public void testReadLogFile_PathWithSlash() throws IOException {
        service.readLogFile("subdir/test.log", 0, 100);
    }

    @Test
    public void testSearchLogFile_FindsMatches() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = """
                2024-01-15 10:30:45 ERROR Something went wrong
                2024-01-15 10:30:46 INFO All is well
                2024-01-15 10:30:47 ERROR Another error
                """;
        Files.writeString(logFile, logContent);

        List<LogEntry> results = service.searchLogFile("test.log", "ERROR", 100);

        assertEquals(2, results.size());
        assertTrue(results.get(0).getContent().contains("ERROR"));
        assertTrue(results.get(1).getContent().contains("ERROR"));
    }

    @Test
    public void testSearchLogFile_CaseInsensitive() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = "2024-01-15 10:30:45 ERROR Something went wrong\n";
        Files.writeString(logFile, logContent);

        List<LogEntry> results = service.searchLogFile("test.log", "error", 100);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getContent().contains("ERROR"));
    }

    @Test
    public void testSearchLogFile_NoMatches() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = "2024-01-15 10:30:45 INFO Everything is fine\n";
        Files.writeString(logFile, logContent);

        List<LogEntry> results = service.searchLogFile("test.log", "ERROR", 100);

        assertTrue(results.isEmpty());
    }

    @Test
    public void testSearchLogFile_EmptySearchTerm() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        Files.writeString(logFile, "Some content\n");

        List<LogEntry> results = service.searchLogFile("test.log", "", 100);

        assertTrue(results.isEmpty());
    }

    @Test
    public void testSearchLogFile_NullSearchTerm() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        Files.writeString(logFile, "Some content\n");

        List<LogEntry> results = service.searchLogFile("test.log", null, 100);

        assertTrue(results.isEmpty());
    }

    @Test
    public void testSearchLogFile_MaxResultsLimit() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        StringBuilder content = new StringBuilder();
        for (int i = 0; i < 200; i++) {
            content.append("2024-01-15 10:30:").append(String.format("%02d", i % 60))
                    .append(" ERROR Error message ").append(i).append("\n");
        }
        Files.writeString(logFile, content.toString());

        List<LogEntry> results = service.searchLogFile("test.log", "ERROR", 50);

        assertEquals(50, results.size());
    }

    @Test
    public void testSearchLogFile_InvalidMaxResults() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = "2024-01-15 10:30:45 ERROR Something went wrong\n";
        Files.writeString(logFile, logContent);

        // Test negative max results - should default to 100
        List<LogEntry> results = service.searchLogFile("test.log", "ERROR", -1);
        assertNotNull(results);

        // Test zero max results - should default to 100
        results = service.searchLogFile("test.log", "ERROR", 0);
        assertNotNull(results);

        // Test excessive max results - should cap at 100
        results = service.searchLogFile("test.log", "ERROR", 1000);
        assertNotNull(results);
    }

    @Test(expected = IOException.class)
    public void testSearchLogFile_FileDoesNotExist() throws IOException {
        service.searchLogFile("nonexistent.log", "ERROR", 100);
    }

    @Test
    public void testTailLogFile_ReturnsLastLines() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = Arrays.asList("Entry 8", "Entry 9", "Entry 10");
        mockedLogEntryReader.when(() -> LogEntryReader.readTailLogEntries(logFile, 3))
                .thenReturn(mockEntries);

        List<String> results = service.tailLogFile("test.log", 3);

        assertEquals(3, results.size());
        assertEquals("Entry 8", results.get(0));
        assertEquals("Entry 9", results.get(1));
        assertEquals("Entry 10", results.get(2));
    }

    @Test
    public void testTailLogFile_InvalidLineCount() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        List<String> mockEntries = List.of("Entry 1");
        mockedLogEntryReader.when(() -> LogEntryReader.readTailLogEntries(eq(logFile), eq(100)))
                .thenReturn(mockEntries);

        // Test negative lines - should default to 100
        List<String> results = service.tailLogFile("test.log", -1);
        assertNotNull(results);

        // Test zero lines - should default to 100
        results = service.tailLogFile("test.log", 0);
        assertNotNull(results);

        // Test excessive lines - should cap at 100
        results = service.tailLogFile("test.log", 5000);
        assertNotNull(results);
    }

    @Test(expected = IOException.class)
    public void testTailLogFile_FileDoesNotExist() throws IOException {
        service.tailLogFile("nonexistent.log", 10);
    }

    @Test(expected = IOException.class)
    public void testTailLogFile_DirectoryTraversal() throws IOException {
        service.tailLogFile("../test.log", 10);
    }

    @Test
    public void testGetLogFileMetadata_ReturnsMetadata() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        Files.writeString(logFile, "Some log content");

        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(5L);

        LogFileMetadata metadata = service.getLogFileMetadata("test.log");

        assertNotNull(metadata);
        assertEquals("test.log", metadata.getFileName());
        assertTrue(metadata.getSizeBytes() > 0);
        assertTrue(metadata.getLastModified() > 0);
        assertEquals(5L, metadata.getLineCount());
    }

    @Test(expected = IOException.class)
    public void testGetLogFileMetadata_FileDoesNotExist() throws IOException {
        service.getLogFileMetadata("nonexistent.log");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileMetadata_NullFileName() throws IOException {
        service.getLogFileMetadata(null);
    }

    @Test(expected = IOException.class)
    public void testGetLogFileMetadata_EmptyFileName() throws IOException {
        service.getLogFileMetadata("");
    }

    @Test
    public void testActivate_DefaultLogDirectory() {
        LogViewerServiceImpl testService = new LogViewerServiceImpl();
        Map<String, Object> properties = new HashMap<>();

        // Should not throw exception
        testService.activate(properties);
    }

    @Test
    public void testActivate_CustomLogDirectory() throws IOException {
        Path customDir = tempFolder.newFolder("custom-logs").toPath();
        LogViewerServiceImpl testService = new LogViewerServiceImpl();
        Map<String, Object> properties = new HashMap<>();
        properties.put("log.directory", customDir.toString());

        testService.activate(properties);

        // Verify it uses the custom directory by checking available files
        List<String> files = testService.getAvailableLogFiles();
        assertNotNull(files);
    }

    @Test
    public void testSearchLogFile_MultiLineEntry() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = """
                2024-01-15 10:30:45 ERROR NullPointerException
                    at com.example.Class.method(Class.java:123)
                    at com.example.Main.main(Main.java:45)
                2024-01-15 10:30:46 INFO Normal entry
                """;
        Files.writeString(logFile, logContent);

        List<LogEntry> results = service.searchLogFile("test.log", "NullPointerException", 100);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getContent().contains("NullPointerException"));
        assertTrue(results.get(0).getContent().contains("at com.example.Class.method"));
    }

    @Test
    public void testSearchLogFile_SearchInStackTrace() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String logContent = """
                2024-01-15 10:30:45 ERROR Exception occurred
                    at com.example.SpecificClass.method(SpecificClass.java:123)
                2024-01-15 10:30:46 INFO Normal entry
                """;
        Files.writeString(logFile, logContent);

        List<LogEntry> results = service.searchLogFile("test.log", "SpecificClass", 100);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getContent().contains("SpecificClass"));
    }

    @Test
    public void testReadLogFile_EmptyFile() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));

        mockedLogEntryReader.when(() -> LogEntryReader.countLogEntries(logFile))
                .thenReturn(0L);
        mockedLogEntryReader.when(() -> LogEntryReader.readLogEntries(eq(logFile), anyLong(), anyInt()))
                .thenReturn(List.of());

        LogPage result = service.readLogFile("test.log", 0, 100);

        assertNotNull(result);
        assertTrue(result.getLines().isEmpty());
        assertEquals(0L, result.getTotalLines());
        assertEquals(0, result.getTotalPages());
    }

    @Test
    public void testGetAvailableLogFiles_SortedReverseOrder() throws IOException {
        Files.createFile(logDirectory.resolve("app.log"));
        Files.createFile(logDirectory.resolve("error.log"));
        Files.createFile(logDirectory.resolve("debug.log"));

        List<String> logFiles = service.getAvailableLogFiles();

        assertEquals(3, logFiles.size());
        // Should be sorted in reverse order
        assertEquals("error.log", logFiles.get(0));
        assertEquals("debug.log", logFiles.get(1));
        assertEquals("app.log", logFiles.get(2));
    }

    @Test
    public void testSearchLogFile_VeryLongLine() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String longLine = "2024-01-15 10:30:45 ERROR " + "X".repeat(15000) +
                "\n";
        Files.writeString(logFile, longLine);

        List<LogEntry> results = service.searchLogFile("test.log", "ERROR", 100);

        assertEquals(1, results.size());
        assertTrue(results.get(0).getContent().contains("[truncated]"));
        assertTrue(results.get(0).getContent().length() < 15000);
    }

    @Test(expected = IOException.class)
    public void testValidateFileName_BackslashPath() throws IOException {
        service.readLogFile("subdir\\test.log", 0, 100);
    }

    @Test
    public void testModified_UpdatesLogDirectory() throws IOException {
        Path newDir = tempFolder.newFolder("new-logs").toPath();
        Files.createFile(newDir.resolve("new.log"));

        Map<String, Object> properties = new HashMap<>();
        properties.put("log.directory", newDir.toString());
        service.activate(properties);

        List<String> files = service.getAvailableLogFiles();
        assertEquals(1, files.size());
        assertEquals("new.log", files.get(0));
    }

    // getLogFileInputStream Tests

    @Test
    public void testGetLogFileInputStream_Success() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("test.log"));
        String content = "Test log content\nLine 2\nLine 3";
        Files.writeString(logFile, content);

        java.io.InputStream inputStream = service.getLogFileInputStream("test.log");

        assertNotNull(inputStream);

        // Read and verify content
        java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(inputStream, java.nio.charset.StandardCharsets.UTF_8)
        );
        String firstLine = reader.readLine();
        assertEquals("Test log content", firstLine);

        inputStream.close();
    }

    @Test
    public void testGetLogFileInputStream_ReadFullContent() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("full-test.log"));
        String expectedContent = "Line 1\nLine 2\nLine 3\nLine 4";
        Files.writeString(logFile, expectedContent);

        java.io.InputStream inputStream = service.getLogFileInputStream("full-test.log");

        assertNotNull(inputStream);

        // Read entire content
        String actualContent = new String(inputStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        assertEquals(expectedContent, actualContent);

        inputStream.close();
    }

    @Test
    public void testGetLogFileInputStream_EmptyFile() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("empty.log"));

        java.io.InputStream inputStream = service.getLogFileInputStream("empty.log");

        assertNotNull(inputStream);
        assertEquals(-1, inputStream.read()); // Should be end of stream
        inputStream.close();
    }

    @Test
    public void testGetLogFileInputStream_LargeFile() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("large.log"));
        StringBuilder largeContent = new StringBuilder();
        for (int i = 0; i < 10000; i++) {
            largeContent.append("2024-01-15 10:30:").append(String.format("%02d", i % 60))
                    .append(" INFO Log entry number ").append(i).append("\n");
        }
        Files.writeString(logFile, largeContent.toString());

        java.io.InputStream inputStream = service.getLogFileInputStream("large.log");

        assertNotNull(inputStream);

        // Verify we can read from it
        byte[] buffer = new byte[1024];
        int bytesRead = inputStream.read(buffer);
        assertTrue(bytesRead > 0);

        inputStream.close();
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_FileDoesNotExist() throws IOException {
        service.getLogFileInputStream("nonexistent.log");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_NullFileName() throws IOException {
        service.getLogFileInputStream(null);
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_EmptyFileName() throws IOException {
        service.getLogFileInputStream("");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_DirectoryTraversal() throws IOException {
        Files.createFile(logDirectory.resolve("test.log"));
        service.getLogFileInputStream("../test.log");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_PathWithSlash() throws IOException {
        service.getLogFileInputStream("subdir/test.log");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_PathWithBackslash() throws IOException {
        service.getLogFileInputStream("subdir\\test.log");
    }

    @Test(expected = IOException.class)
    public void testGetLogFileInputStream_Directory() throws IOException {
        Path subdir = Files.createDirectory(logDirectory.resolve("subdir.log"));

        service.getLogFileInputStream("subdir.log");
    }

    @Test
    public void testGetLogFileInputStream_BinaryContent() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("binary.log"));
        byte[] binaryData = new byte[]{0x00, 0x01, 0x02, (byte) 0xFF, (byte) 0xFE};
        Files.write(logFile, binaryData);

        java.io.InputStream inputStream = service.getLogFileInputStream("binary.log");

        assertNotNull(inputStream);

        byte[] readData = inputStream.readAllBytes();
        assertEquals(binaryData.length, readData.length);
        for (int i = 0; i < binaryData.length; i++) {
            assertEquals(binaryData[i], readData[i]);
        }

        inputStream.close();
    }

    @Test
    public void testGetLogFileInputStream_SpecialCharactersInFileName() throws IOException {
        String fileName = "app.log.1";
        Path logFile = Files.createFile(logDirectory.resolve(fileName));
        Files.writeString(logFile, "Test content");

        java.io.InputStream inputStream = service.getLogFileInputStream(fileName);

        assertNotNull(inputStream);
        inputStream.close();
    }

    @Test
    public void testGetLogFileInputStream_MultipleReads() throws IOException {
        Path logFile = Files.createFile(logDirectory.resolve("multi.log"));
        Files.writeString(logFile, "Test content for multiple reads");

        // First read
        java.io.InputStream inputStream1 = service.getLogFileInputStream("multi.log");
        assertNotNull(inputStream1);
        String content1 = new String(inputStream1.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        inputStream1.close();

        // Second read - should work independently
        java.io.InputStream inputStream2 = service.getLogFileInputStream("multi.log");
        assertNotNull(inputStream2);
        String content2 = new String(inputStream2.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        inputStream2.close();

        assertEquals(content1, content2);
        assertEquals("Test content for multiple reads", content1);
    }
}
