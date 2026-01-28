package com.mobi.server.rest;

/*-
 * #%L
 * com.mobi.server.rest
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.rest.test.util.MobiRestTestCXF;
import com.mobi.rest.util.UsernameTestFilter;
import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import com.mobi.server.api.logs.LogViewerService;
import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.ws.rs.client.Entity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class LogViewerRestTest extends MobiRestTestCXF {
    private AutoCloseable closeable;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static LogViewerService logViewerService;

    @BeforeClass
    public static void startServer() {
        logViewerService = Mockito.mock(LogViewerService.class);

        LogViewerRest rest = new LogViewerRest();
        rest.logViewerService = logViewerService;

        configureServer(rest, new UsernameTestFilter());
    }

    @Before
    public void setUpMocks() throws Exception {
        closeable = MockitoAnnotations.openMocks(this);
        reset(logViewerService);
    }

    @After
    public void resetMocks() throws Exception {
        closeable.close();
    }

    // getLogFiles Tests

    @Test
    public void getLogFilesSuccessTest() throws Exception {
        // Setup
        List<String> mockFiles = List.of("app.log", "error.log", "debug.log");
        when(logViewerService.getAvailableLogFiles()).thenReturn(mockFiles);

        Response response = target().path("logs/files").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAvailableLogFiles();

        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(3, result.size());
            assertEquals("app.log", result.get(0).asText());
            assertEquals("error.log", result.get(1).asText());
            assertEquals("debug.log", result.get(2).asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLogFilesEmptyTest() throws Exception {
        // Setup
        when(logViewerService.getAvailableLogFiles()).thenReturn(Collections.emptyList());

        Response response = target().path("logs/files").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAvailableLogFiles();

        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertEquals(0, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLogFilesWithErrorTest() throws Exception {
        // Setup
        doThrow(new IOException("Error reading directory")).when(logViewerService).getAvailableLogFiles();

        Response response = target().path("logs/files").request().get();

        assertEquals(500, response.getStatus());
        verify(logViewerService).getAvailableLogFiles();
    }

    // getLogFileMetadata Tests

    @Test
    public void getLogFileMetadataSuccessTest() throws Exception {
        // Setup
        LogFileMetadata mockMetadata = new LogFileMetadata("app.log", 1024L, System.currentTimeMillis(), 100L);
        when(logViewerService.getLogFileMetadata("app.log")).thenReturn(mockMetadata);

        Response response = target().path("logs/files/app.log/metadata").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getLogFileMetadata("app.log");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("app.log", result.get("fileName").asText());
            assertEquals(1024L, result.get("sizeBytes").asLong());
            assertEquals(100L, result.get("lineCount").asLong());
            assertTrue(result.has("lastModified"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLogFileMetadataFileNotFoundTest() throws Exception {
        // Setup
        doThrow(new IOException("File not found")).when(logViewerService).getLogFileMetadata("nonexistent.log");

        Response response = target().path("logs/files/nonexistent.log/metadata").request().get();

        assertEquals(400, response.getStatus());
        verify(logViewerService).getLogFileMetadata("nonexistent.log");
    }

    @Test
    public void getLogFileMetadataWithSpecialCharactersTest() throws Exception {
        // Setup
        String fileName = "app.log.1";
        LogFileMetadata mockMetadata = new LogFileMetadata(fileName, 2048L, System.currentTimeMillis(), 50L);
        when(logViewerService.getLogFileMetadata(fileName)).thenReturn(mockMetadata);

        Response response = target().path("logs/files/" + fileName + "/metadata").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getLogFileMetadata(fileName);
    }

    // readLogFile Tests

    @Test
    public void readLogFileSuccessTest() throws Exception {
        // Setup
        List<String> lines = List.of(
                "2024-01-15 10:30:45 INFO First entry",
                "2024-01-15 10:30:46 ERROR Second entry",
                "2024-01-15 10:30:47 DEBUG Third entry"
        );
        LogPage mockPage = new LogPage(lines, 0, 1, 3L, "app.log");
        when(logViewerService.readLogFile(eq("app.log"), eq(0), eq(100))).thenReturn(mockPage);

        Response response = target().path("logs/files/app.log").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).readLogFile("app.log", 0, 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("app.log", result.get("fileName").asText());
            assertEquals(0, result.get("currentPage").asInt());
            assertEquals(1, result.get("totalPages").asInt());
            assertEquals(3, result.get("totalLines").asLong());
            assertTrue(result.has("lines"));
            ArrayNode linesNode = (ArrayNode) result.get("lines");
            assertEquals(3, linesNode.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void readLogFileWithPaginationTest() throws Exception {
        // Setup
        List<String> lines = List.of(
                "2024-01-15 10:30:50 INFO Entry 11",
                "2024-01-15 10:30:51 INFO Entry 12"
        );
        LogPage mockPage = new LogPage(lines, 2, 5, 50L, "app.log");
        when(logViewerService.readLogFile(eq("app.log"), eq(2), eq(10))).thenReturn(mockPage);

        Response response = target().path("logs/files/app.log")
                .queryParam("page", 2)
                .queryParam("pageSize", 10)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).readLogFile("app.log", 2, 10);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(2, result.get("currentPage").asInt());
            assertEquals(5, result.get("totalPages").asInt());
            assertEquals(50, result.get("totalLines").asLong());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void readLogFileWithDefaultParametersTest() throws Exception {
        // Setup
        List<String> lines = List.of("Entry 1");
        LogPage mockPage = new LogPage(lines, 0, 1, 1L, "app.log");
        when(logViewerService.readLogFile(eq("app.log"), eq(0), eq(100))).thenReturn(mockPage);

        Response response = target().path("logs/files/app.log").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).readLogFile("app.log", 0, 100);
    }

    @Test
    public void readLogFileWithCustomPageSizeTest() throws Exception {
        // Setup
        List<String> lines = List.of("Entry 1", "Entry 2");
        LogPage mockPage = new LogPage(lines, 0, 1, 2L, "app.log");
        when(logViewerService.readLogFile(eq("app.log"), eq(0), eq(50))).thenReturn(mockPage);

        Response response = target().path("logs/files/app.log")
                .queryParam("pageSize", 50)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).readLogFile("app.log", 0, 50);
    }

    @Test
    public void readLogFileNotFoundTest() throws Exception {
        // Setup
        doThrow(new IOException("File not found")).when(logViewerService)
                .readLogFile(eq("nonexistent.log"), anyInt(), anyInt());

        Response response = target().path("logs/files/nonexistent.log").request().get();

        assertEquals(400, response.getStatus());
        verify(logViewerService).readLogFile(eq("nonexistent.log"), anyInt(), anyInt());
    }

    @Test
    public void readLogFileEmptyTest() throws Exception {
        // Setup
        LogPage mockPage = new LogPage(Collections.emptyList(), 0, 0, 0L, "empty.log");
        when(logViewerService.readLogFile(eq("empty.log"), eq(0), eq(100))).thenReturn(mockPage);

        Response response = target().path("logs/files/empty.log").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).readLogFile("empty.log", 0, 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(0, result.get("totalLines").asLong());
            ArrayNode linesNode = (ArrayNode) result.get("lines");
            assertEquals(0, linesNode.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // tailLogFile Tests

    @Test
    public void tailLogFileSuccessTest() throws Exception {
        // Setup
        List<String> mockLines = List.of(
                "2024-01-15 10:30:58 INFO Line 98",
                "2024-01-15 10:30:59 INFO Line 99",
                "2024-01-15 10:31:00 INFO Line 100"
        );
        when(logViewerService.tailLogFile(eq("app.log"), eq(100))).thenReturn(mockLines);

        Response response = target().path("logs/files/app.log/tail").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).tailLogFile("app.log", 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("app.log", result.get("fileName").asText());
            assertEquals(3, result.get("count").asInt());
            assertTrue(result.has("lines"));
            ArrayNode linesNode = (ArrayNode) result.get("lines");
            assertEquals(3, linesNode.size());
            assertEquals("2024-01-15 10:30:58 INFO Line 98", linesNode.get(0).asText());
            assertEquals("2024-01-15 10:30:59 INFO Line 99", linesNode.get(1).asText());
            assertEquals("2024-01-15 10:31:00 INFO Line 100", linesNode.get(2).asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void tailLogFileWithCustomLineLimitTest() throws Exception {
        // Setup
        List<String> mockLines = List.of(
                "2024-01-15 10:30:49 INFO Line 48",
                "2024-01-15 10:30:50 INFO Line 49",
                "2024-01-15 10:30:51 INFO Line 50"
        );
        when(logViewerService.tailLogFile(eq("app.log"), eq(50))).thenReturn(mockLines);

        Response response = target().path("logs/files/app.log/tail")
                .queryParam("lines", 50)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).tailLogFile("app.log", 50);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(3, result.get("count").asInt());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void tailLogFileDefaultParametersTest() throws Exception {
        // Setup
        List<String> mockLines = List.of("Last line");
        when(logViewerService.tailLogFile(eq("app.log"), eq(100))).thenReturn(mockLines);

        Response response = target().path("logs/files/app.log/tail").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).tailLogFile("app.log", 100);
    }

    @Test
    public void tailLogFileEmptyTest() throws Exception {
        // Setup
        when(logViewerService.tailLogFile(eq("empty.log"), eq(100))).thenReturn(Collections.emptyList());

        Response response = target().path("logs/files/empty.log/tail").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).tailLogFile("empty.log", 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(0, result.get("count").asInt());
            ArrayNode linesNode = (ArrayNode) result.get("lines");
            assertEquals(0, linesNode.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void tailLogFileNotFoundTest() throws Exception {
        // Setup
        doThrow(new IOException("File not found")).when(logViewerService)
                .tailLogFile(eq("nonexistent.log"), anyInt());

        Response response = target().path("logs/files/nonexistent.log/tail").request().get();

        assertEquals(400, response.getStatus());
        verify(logViewerService).tailLogFile(eq("nonexistent.log"), anyInt());
    }

    // searchLogFile Tests

    @Test
    public void searchLogFileSuccessTest() throws Exception {
        // Setup
        List<LogEntry> mockResults = List.of(
                new LogEntry(5L, "2024-01-15 10:30:45 ERROR Something went wrong"),
                new LogEntry(10L, "2024-01-15 10:30:50 ERROR Another error occurred")
        );
        when(logViewerService.searchLogFile(eq("app.log"), eq("ERROR"), eq(100)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "ERROR")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "ERROR", 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("app.log", result.get("fileName").asText());
            assertEquals("ERROR", result.get("searchTerm").asText());
            assertEquals(2, result.get("count").asInt());
            assertTrue(result.has("results"));
            ArrayNode resultsNode = (ArrayNode) result.get("results");
            assertEquals(2, resultsNode.size());

            ObjectNode firstResult = (ObjectNode) resultsNode.get(0);
            assertEquals(5, firstResult.get("lineNumber").asLong());
            assertTrue(firstResult.get("content").asText().contains("ERROR"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void searchLogFileNoResultsTest() throws Exception {
        // Setup
        when(logViewerService.searchLogFile(eq("app.log"), eq("NOTFOUND"), eq(100)))
                .thenReturn(Collections.emptyList());

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "NOTFOUND")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "NOTFOUND", 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(0, result.get("count").asInt());
            ArrayNode resultsNode = (ArrayNode) result.get("results");
            assertEquals(0, resultsNode.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void searchLogFileWithMaxResultsTest() throws Exception {
        // Setup
        List<LogEntry> mockResults = List.of(
                new LogEntry(1L, "ERROR 1"),
                new LogEntry(2L, "ERROR 2")
        );
        when(logViewerService.searchLogFile(eq("app.log"), eq("ERROR"), eq(50)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "ERROR")
                .queryParam("maxResults", 50)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "ERROR", 50);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(2, result.get("count").asInt());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void searchLogFileEmptySearchTermTest() throws Exception {
        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "")
                .request()
                .get();

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).searchLogFile(anyString(), anyString(), anyInt());
    }

    @Test
    public void searchLogFileMissingSearchTermTest() throws Exception {
        Response response = target().path("logs/files/app.log/search").request().get();

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).searchLogFile(anyString(), anyString(), anyInt());
    }

    @Test
    public void searchLogFileNotFoundTest() throws Exception {
        // Setup
        doThrow(new IOException("File not found")).when(logViewerService)
                .searchLogFile(eq("nonexistent.log"), anyString(), anyInt());

        Response response = target().path("logs/files/nonexistent.log/search")
                .queryParam("term", "ERROR")
                .request()
                .get();

        assertEquals(400, response.getStatus());
        verify(logViewerService).searchLogFile(eq("nonexistent.log"), eq("ERROR"), anyInt());
    }

    @Test
    public void searchLogFileCaseInsensitiveTest() throws Exception {
        // Setup
        List<LogEntry> mockResults = List.of(
                new LogEntry(3L, "2024-01-15 10:30:45 ERROR Error message")
        );
        when(logViewerService.searchLogFile(eq("app.log"), eq("error"), eq(100)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "error")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "error", 100);
    }

    @Test
    public void searchLogFileWithMultipleMatchesTest() throws Exception {
        // Setup
        List<LogEntry> mockResults = List.of(
                new LogEntry(1L, "ERROR 1"),
                new LogEntry(5L, "ERROR 2"),
                new LogEntry(10L, "ERROR 3"),
                new LogEntry(15L, "ERROR 4"),
                new LogEntry(20L, "ERROR 5")
        );
        when(logViewerService.searchLogFile(eq("app.log"), eq("ERROR"), eq(100)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "ERROR")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "ERROR", 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(5, result.get("count").asInt());
            ArrayNode resultsNode = (ArrayNode) result.get("results");
            assertEquals(5, resultsNode.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void searchLogFileWithSpecialCharactersInTermTest() throws Exception {
        // Setup
        String searchTerm = "NullPointerException";
        List<LogEntry> mockResults = List.of(
                new LogEntry(7L, "java.lang.NullPointerException at line 123")
        );
        when(logViewerService.searchLogFile(eq("app.log"), eq(searchTerm), eq(100)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", searchTerm)
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", searchTerm, 100);

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(1, result.get("count").asInt());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void searchLogFileDefaultMaxResultsTest() throws Exception {
        // Setup
        List<LogEntry> mockResults = List.of(new LogEntry(1L, "ERROR"));
        when(logViewerService.searchLogFile(eq("app.log"), eq("ERROR"), eq(100)))
                .thenReturn(mockResults);

        Response response = target().path("logs/files/app.log/search")
                .queryParam("term", "ERROR")
                .request()
                .get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).searchLogFile("app.log", "ERROR", 100);
    }

    // downloadLogFile Tests

    @Test
    public void downloadLogFileTest() throws IOException {
        // Setup
        when(logViewerService.getLogFileInputStream(eq("app.log")))
                .thenReturn(new ByteArrayInputStream("Content".getBytes(StandardCharsets.UTF_8)));

        Response response = target().path("logs/files/app.log").request()
                .accept(MediaType.APPLICATION_OCTET_STREAM_TYPE).get();
        assertEquals(200, response.getStatus());
        verify(logViewerService).getLogFileInputStream("app.log");
    }

    // Files Integration Tests

    @Test
    public void fullWorkflowTest() throws Exception {
        // 1. Get available files
        List<String> mockFiles = List.of("app.log", "error.log");
        when(logViewerService.getAvailableLogFiles()).thenReturn(mockFiles);

        Response filesResponse = target().path("logs/files").request().get();
        assertEquals(200, filesResponse.getStatus());

        // 2. Get metadata for a file
        LogFileMetadata mockMetadata = new LogFileMetadata("app.log", 1024L, System.currentTimeMillis(), 100L);
        when(logViewerService.getLogFileMetadata("app.log")).thenReturn(mockMetadata);

        Response metadataResponse = target().path("logs/files/app.log/metadata").request().get();
        assertEquals(200, metadataResponse.getStatus());

        // 3. Read log file
        List<String> lines = List.of("Entry 1", "Entry 2");
        LogPage mockPage = new LogPage(lines, 0, 1, 2L, "app.log");
        when(logViewerService.readLogFile(eq("app.log"), eq(0), eq(100))).thenReturn(mockPage);

        Response readResponse = target().path("logs/files/app.log").request().get();
        assertEquals(200, readResponse.getStatus());

        // 4. Search log file
        List<LogEntry> mockResults = List.of(new LogEntry(1L, "ERROR entry"));
        when(logViewerService.searchLogFile(eq("app.log"), eq("ERROR"), eq(100)))
                .thenReturn(mockResults);

        Response searchResponse = target().path("logs/files/app.log/search")
                .queryParam("term", "ERROR")
                .request()
                .get();
        assertEquals(200, searchResponse.getStatus());

        // 5. Tail log file
        List<String> mockLines = List.of("Last line");
        when(logViewerService.tailLogFile(eq("app.log"), eq(100))).thenReturn(mockLines);

        Response tailResponse = target().path("logs/files/app.log/tail").request().get();
        assertEquals(200, tailResponse.getStatus());

        // Verify all calls were made
        verify(logViewerService).getAvailableLogFiles();
        verify(logViewerService).getLogFileMetadata("app.log");
        verify(logViewerService).readLogFile("app.log", 0, 100);
        verify(logViewerService).searchLogFile("app.log", "ERROR", 100);
        verify(logViewerService).tailLogFile("app.log", 100);
    }

    // getAllLoggers Tests

    @Test
    public void getAllLoggersSuccessTest() throws Exception {
        // Setup
        Map<String, String> mockLoggers = new java.util.HashMap<>();
        mockLoggers.put("com.mobi", "DEBUG");
        mockLoggers.put("org.apache.karaf", "INFO");
        mockLoggers.put("ROOT", "WARN");

        when(logViewerService.getAllLoggerLevels()).thenReturn(mockLoggers);

        Response response = target().path("logs/levels").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAllLoggerLevels();

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("DEBUG", result.get("com.mobi").asText());
            assertEquals("INFO", result.get("org.apache.karaf").asText());
            assertEquals("WARN", result.get("ROOT").asText());
            assertEquals(3, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAllLoggersEmptyTest() throws Exception {
        // Setup
        when(logViewerService.getAllLoggerLevels()).thenReturn(Collections.emptyMap());

        Response response = target().path("logs/levels").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAllLoggerLevels();

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals(0, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAllLoggersWithErrorTest() throws Exception {
        // Setup
        when(logViewerService.getAllLoggerLevels()).thenThrow(new RuntimeException("Database error"));

        Response response = target().path("logs/levels").request().get();

        assertEquals(500, response.getStatus());
        verify(logViewerService).getAllLoggerLevels();
    }

    @Test
    public void getAllLoggersOnlyRootLoggerTest() throws Exception {
        // Setup
        Map<String, String> mockLoggers = new java.util.HashMap<>();
        mockLoggers.put("ROOT", "INFO");

        when(logViewerService.getAllLoggerLevels()).thenReturn(mockLoggers);

        Response response = target().path("logs/levels").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAllLoggerLevels();

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(1, result.size());
            assertEquals("INFO", result.get("ROOT").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAllLoggersWithMultipleLoggersTest() throws Exception {
        // Setup
        Map<String, String> mockLoggers = new java.util.HashMap<>();
        mockLoggers.put("com.mobi.server.impl", "TRACE");
        mockLoggers.put("com.mobi.rest", "DEBUG");
        mockLoggers.put("org.apache.cxf", "WARN");
        mockLoggers.put("org.eclipse.rdf4j", "ERROR");
        mockLoggers.put("ROOT", "INFO");

        when(logViewerService.getAllLoggerLevels()).thenReturn(mockLoggers);

        Response response = target().path("logs/levels").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getAllLoggerLevels();

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals(5, result.size());
            assertEquals("TRACE", result.get("com.mobi.server.impl").asText());
            assertEquals("DEBUG", result.get("com.mobi.rest").asText());
            assertEquals("WARN", result.get("org.apache.cxf").asText());
            assertEquals("ERROR", result.get("org.eclipse.rdf4j").asText());
            assertEquals("INFO", result.get("ROOT").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // getLoggerLevel Tests

    @Test
    public void getLoggerLevelSuccessTest() throws Exception {
        // Setup
        when(logViewerService.getLoggerLevel("com.mobi")).thenReturn("DEBUG");

        Response response = target().path("logs/levels/com.mobi").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getLoggerLevel("com.mobi");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("com.mobi", result.get("loggerName").asText());
            assertEquals("DEBUG", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLoggerLevelRootLoggerTest() throws Exception {
        // Setup
        when(logViewerService.getLoggerLevel("ROOT")).thenReturn("INFO");

        Response response = target().path("logs/levels/ROOT").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getLoggerLevel("ROOT");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("ROOT", result.get("loggerName").asText());
            assertEquals("INFO", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLoggerLevelNotFoundTest() throws Exception {
        // Setup
        when(logViewerService.getLoggerLevel("com.nonexistent")).thenReturn(null);

        Response response = target().path("logs/levels/com.nonexistent").request().get();

        assertEquals(404, response.getStatus());
        verify(logViewerService).getLoggerLevel("com.nonexistent");
    }

    @Test
    public void getLoggerLevelWithDotsTest() throws Exception {
        // Setup
        when(logViewerService.getLoggerLevel("com.mobi.server.impl.logs")).thenReturn("TRACE");

        Response response = target().path("logs/levels/com.mobi.server.impl.logs").request().get();

        assertEquals(200, response.getStatus());
        verify(logViewerService).getLoggerLevel("com.mobi.server.impl.logs");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("com.mobi.server.impl.logs", result.get("loggerName").asText());
            assertEquals("TRACE", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getLoggerLevelWithErrorTest() throws Exception {
        // Setup
        when(logViewerService.getLoggerLevel("com.mobi")).thenThrow(new RuntimeException("Configuration error"));

        Response response = target().path("logs/levels/com.mobi").request().get();

        assertEquals(500, response.getStatus());
        verify(logViewerService).getLoggerLevel("com.mobi");
    }

    @Test
    public void getLoggerLevelDifferentLevelsTest() throws Exception {
        // Test different log levels
        String[] loggers = {"logger.trace", "logger.debug", "logger.info", "logger.warn", "logger.error", "logger.off"};
        String[] levels = {"TRACE", "DEBUG", "INFO", "WARN", "ERROR", "OFF"};

        for (int i = 0; i < loggers.length; i++) {
            when(logViewerService.getLoggerLevel(loggers[i])).thenReturn(levels[i]);

            Response response = target().path("logs/levels/" + loggers[i]).request().get();

            assertEquals(200, response.getStatus());

            try {
                ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                assertEquals(levels[i], result.get("level").asText());
            } catch (Exception e) {
                fail("Expected no exception, but got: " + e.getMessage());
            }
        }

        verify(logViewerService, times(6)).getLoggerLevel(anyString());
    }

    // setLoggerLevel Tests

    @Test
    public void setLoggerLevelSuccessTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "DEBUG");

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(200, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi", "DEBUG");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("com.mobi", result.get("loggerName").asText());
            assertEquals("DEBUG", result.get("level").asText());
            assertTrue(result.has("message"));
            assertEquals("Logger level updated successfully", result.get("message").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void setLoggerLevelRootLoggerTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "WARN");

        Response response = target().path("logs/levels/ROOT")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(200, response.getStatus());
        verify(logViewerService).setLoggerLevel("ROOT", "WARN");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("ROOT", result.get("loggerName").asText());
            assertEquals("WARN", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void setLoggerLevelLowercaseLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "debug");

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(200, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi", "DEBUG");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("DEBUG", result.get("level").asText()); // Should be uppercase in response
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void setLoggerLevelMissingLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        // No level provided

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void setLoggerLevelEmptyLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "");

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void setLoggerLevelInvalidLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "INVALID");

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void setLoggerLevelAllValidLevelsTest() throws Exception {
        // Test all valid log levels
        String[] levels = {"OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"};

        for (String level : levels) {
            reset(logViewerService); // Reset mock for each iteration

            ObjectNode request = mapper.createObjectNode();
            request.put("level", level);

            Response response = target().path("logs/levels/com.mobi")
                    .request()
                    .put(Entity.json(request.toString()));

            assertEquals(200, response.getStatus());
            verify(logViewerService).setLoggerLevel("com.mobi", level);
        }
    }

    @Test
    public void setLoggerLevelComplexPackageNameTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "TRACE");

        Response response = target().path("logs/levels/com.mobi.server.impl.logs")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(200, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.server.impl.logs", "TRACE");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("com.mobi.server.impl.logs", result.get("loggerName").asText());
            assertEquals("TRACE", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void setLoggerLevelWithErrorTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "DEBUG");

        Mockito.doThrow(new RuntimeException("Configuration error"))
                .when(logViewerService).setLoggerLevel("com.mobi", "DEBUG");

        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.json(request.toString()));

        assertEquals(500, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi", "DEBUG");
    }

    @Test
    public void setLoggerLevelNullRequestTest() throws Exception {
        Response response = target().path("logs/levels/com.mobi")
                .request()
                .put(Entity.entity("", MediaType.APPLICATION_JSON_TYPE));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    // createLogger Tests

    @Test
    public void createLoggerSuccessTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        request.put("level", "DEBUG");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(201, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.new", "DEBUG");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertEquals("com.mobi.new", result.get("loggerName").asText());
            assertEquals("DEBUG", result.get("level").asText());
            assertTrue(result.has("message"));
            assertEquals("Logger created successfully", result.get("message").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createLoggerMissingLoggerNameTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("level", "DEBUG");
        // Missing loggerName

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerEmptyLoggerNameTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "");
        request.put("level", "DEBUG");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerMissingLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        // Missing level

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerEmptyLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        request.put("level", "");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerInvalidLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        request.put("level", "INVALID");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerLowercaseLevelTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        request.put("level", "debug");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(201, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.new", "debug");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("DEBUG", result.get("level").asText()); // Should be uppercase
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createLoggerComplexPackageNameTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "org.apache.cxf.jaxrs.impl");
        request.put("level", "TRACE");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(201, response.getStatus());
        verify(logViewerService).setLoggerLevel("org.apache.cxf.jaxrs.impl", "TRACE");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("org.apache.cxf.jaxrs.impl", result.get("loggerName").asText());
            assertEquals("TRACE", result.get("level").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void createLoggerWithErrorTest() throws Exception {
        // Setup
        ObjectNode request = mapper.createObjectNode();
        request.put("loggerName", "com.mobi.new");
        request.put("level", "DEBUG");

        Mockito.doThrow(new RuntimeException("Configuration error"))
                .when(logViewerService).setLoggerLevel("com.mobi.new", "DEBUG");

        Response response = target().path("logs/levels")
                .request()
                .post(Entity.json(request.toString()));

        assertEquals(500, response.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.new", "DEBUG");
    }

    @Test
    public void createLoggerNullRequestTest() throws Exception {
        Response response = target().path("logs/levels")
                .request()
                .post(Entity.entity("", MediaType.APPLICATION_JSON_TYPE));

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }

    @Test
    public void createLoggerAllValidLevelsTest() throws Exception {
        // Test all valid log levels
        String[] levels = {"OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"};

        for (int i = 0; i < levels.length; i++) {
            reset(logViewerService); // Reset mock for each iteration

            ObjectNode request = mapper.createObjectNode();
            request.put("loggerName", "com.mobi.logger" + i);
            request.put("level", levels[i]);

            Response response = target().path("logs/levels")
                    .request()
                    .post(Entity.json(request.toString()));

            assertEquals(201, response.getStatus());
            verify(logViewerService).setLoggerLevel("com.mobi.logger" + i, levels[i]);
        }
    }

    // deleteLogger Tests

    @Test
    public void deleteLoggerSuccessTest() throws Exception {
        Response response = target().path("logs/levels/com.mobi.test").request().delete();

        assertEquals(200, response.getStatus());
        verify(logViewerService).deleteLogger("com.mobi.test");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertNotNull(result);
            assertTrue(result.has("message"));
            assertEquals("Logger deleted successfully", result.get("message").asText());
            assertEquals("com.mobi.test", result.get("loggerName").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void deleteLoggerRootLoggerTest() throws Exception {
        Response response = target().path("logs/levels/ROOT").request().delete();

        assertEquals(400, response.getStatus());
        verify(logViewerService, times(0)).deleteLogger(anyString());
    }

    @Test
    public void deleteLoggerComplexPackageNameTest() throws Exception {
        Response response = target().path("logs/levels/com.mobi.server.impl.logs").request().delete();

        assertEquals(200, response.getStatus());
        verify(logViewerService).deleteLogger("com.mobi.server.impl.logs");

        try {
            ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
            assertEquals("com.mobi.server.impl.logs", result.get("loggerName").asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void deleteLoggerWithErrorTest() throws Exception {
        // Setup
        Mockito.doThrow(new RuntimeException("Configuration error"))
                .when(logViewerService).deleteLogger("com.mobi.test");

        Response response = target().path("logs/levels/com.mobi.test").request().delete();

        assertEquals(500, response.getStatus());
        verify(logViewerService).deleteLogger("com.mobi.test");
    }

    @Test
    public void deleteLoggerMultipleLoggersTest() throws Exception {
        // Delete multiple different loggers
        String[] loggers = {"com.mobi.one", "com.mobi.two", "org.apache.karaf"};

        for (String logger : loggers) {
            reset(logViewerService); // Reset mock for each iteration

            Response response = target().path("logs/levels/" + logger).request().delete();

            assertEquals(200, response.getStatus());
            verify(logViewerService).deleteLogger(logger);
        }
    }

    @Test
    public void deleteLoggerNonExistentLoggerTest() throws Exception {
        // The service doesn't throw an error for non-existent loggers, just does nothing
        Response response = target().path("logs/levels/com.nonexistent").request().delete();

        assertEquals(200, response.getStatus());
        verify(logViewerService).deleteLogger("com.nonexistent");
    }

    // getAvailableLevels Tests

    @Test
    public void getAvailableLevelsSuccessTest() throws Exception {
        Response response = target().path("logs/levels/available").request().get();

        assertEquals(200, response.getStatus());

        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);
            assertNotNull(result);
            assertEquals(6, result.size());

            // Verify all expected levels are present
            List<String> levels = new java.util.ArrayList<>();
            for (int i = 0; i < result.size(); i++) {
                levels.add(result.get(i).asText());
            }

            assertTrue(levels.contains("OFF"));
            assertTrue(levels.contains("ERROR"));
            assertTrue(levels.contains("WARN"));
            assertTrue(levels.contains("INFO"));
            assertTrue(levels.contains("DEBUG"));
            assertTrue(levels.contains("TRACE"));
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAvailableLevelsOrderTest() throws Exception {
        Response response = target().path("logs/levels/available").request().get();

        assertEquals(200, response.getStatus());

        try {
            ArrayNode result = mapper.readValue(response.readEntity(String.class), ArrayNode.class);

            // Verify the order of levels
            assertEquals("OFF", result.get(0).asText());
            assertEquals("ERROR", result.get(1).asText());
            assertEquals("WARN", result.get(2).asText());
            assertEquals("INFO", result.get(3).asText());
            assertEquals("DEBUG", result.get(4).asText());
            assertEquals("TRACE", result.get(5).asText());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void getAvailableLevelsMultipleCallsTest() throws Exception {
        // Verify the endpoint returns consistent results across multiple calls
        Response response1 = target().path("logs/levels/available").request().get();
        Response response2 = target().path("logs/levels/available").request().get();

        assertEquals(200, response1.getStatus());
        assertEquals(200, response2.getStatus());

        try {
            ArrayNode result1 = mapper.readValue(response1.readEntity(String.class), ArrayNode.class);
            ArrayNode result2 = mapper.readValue(response2.readEntity(String.class), ArrayNode.class);

            assertEquals(result1.size(), result2.size());
            assertEquals(result1.toString(), result2.toString());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    // Loggers Integration Tests

    @Test
    public void loggerManagementWorkflowTest() throws Exception {
        // 1. Get all loggers initially
        Map<String, String> initialLoggers = new java.util.HashMap<>();
        initialLoggers.put("ROOT", "INFO");
        when(logViewerService.getAllLoggerLevels()).thenReturn(initialLoggers);

        Response getAllResponse = target().path("logs/levels").request().get();
        assertEquals(200, getAllResponse.getStatus());
        verify(logViewerService).getAllLoggerLevels();

        // 2. Get available levels
        Response availableLevelsResponse = target().path("logs/levels/available").request().get();
        assertEquals(200, availableLevelsResponse.getStatus());

        // 3. Create a new logger
        ObjectNode createRequest = mapper.createObjectNode();
        createRequest.put("loggerName", "com.mobi.workflow");
        createRequest.put("level", "DEBUG");

        Response createResponse = target().path("logs/levels")
                .request()
                .post(Entity.json(createRequest.toString()));
        assertEquals(201, createResponse.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.workflow", "DEBUG");

        // 4. Get the specific logger level
        when(logViewerService.getLoggerLevel("com.mobi.workflow")).thenReturn("DEBUG");
        Response getResponse = target().path("logs/levels/com.mobi.workflow").request().get();
        assertEquals(200, getResponse.getStatus());
        verify(logViewerService).getLoggerLevel("com.mobi.workflow");

        // 5. Update the logger level
        ObjectNode updateRequest = mapper.createObjectNode();
        updateRequest.put("level", "TRACE");

        Response updateResponse = target().path("logs/levels/com.mobi.workflow")
                .request()
                .put(Entity.json(updateRequest.toString()));
        assertEquals(200, updateResponse.getStatus());
        verify(logViewerService).setLoggerLevel("com.mobi.workflow", "TRACE");

        // 6. Delete the logger
        Response deleteResponse = target().path("logs/levels/com.mobi.workflow").request().delete();
        assertEquals(200, deleteResponse.getStatus());
        verify(logViewerService).deleteLogger("com.mobi.workflow");

        // Verify all operations were called
        verify(logViewerService, times(1)).getAllLoggerLevels();
        verify(logViewerService, times(1)).setLoggerLevel("com.mobi.workflow", "DEBUG");
        verify(logViewerService, times(1)).getLoggerLevel("com.mobi.workflow");
        verify(logViewerService, times(1)).setLoggerLevel("com.mobi.workflow", "TRACE");
        verify(logViewerService, times(1)).deleteLogger("com.mobi.workflow");
    }

    @Test
    public void multipleLoggersManagementTest() throws Exception {
        // Create multiple loggers with different levels
        String[] loggerNames = {"com.mobi.one", "com.mobi.two", "com.mobi.three"};
        String[] levels = {"DEBUG", "INFO", "WARN"};

        for (int i = 0; i < loggerNames.length; i++) {
            ObjectNode request = mapper.createObjectNode();
            request.put("loggerName", loggerNames[i]);
            request.put("level", levels[i]);

            Response response = target().path("logs/levels")
                    .request()
                    .post(Entity.json(request.toString()));
            assertEquals(201, response.getStatus());
        }

        // Verify all were created
        verify(logViewerService).setLoggerLevel("com.mobi.one", "DEBUG");
        verify(logViewerService).setLoggerLevel("com.mobi.two", "INFO");
        verify(logViewerService).setLoggerLevel("com.mobi.three", "WARN");

        // Get all loggers
        Map<String, String> allLoggers = new java.util.HashMap<>();
        allLoggers.put("com.mobi.one", "DEBUG");
        allLoggers.put("com.mobi.two", "INFO");
        allLoggers.put("com.mobi.three", "WARN");
        allLoggers.put("ROOT", "INFO");

        when(logViewerService.getAllLoggerLevels()).thenReturn(allLoggers);

        Response getAllResponse = target().path("logs/levels").request().get();
        assertEquals(200, getAllResponse.getStatus());

        try {
            ObjectNode result = mapper.readValue(getAllResponse.readEntity(String.class), ObjectNode.class);
            assertEquals(4, result.size());
        } catch (Exception e) {
            fail("Expected no exception, but got: " + e.getMessage());
        }
    }

    @Test
    public void loggerLevelCaseInsensitivityTest() throws Exception {
        // Test that the API handles different cases for log levels
        String[][] testCases = {
                {"debug", "DEBUG"},
                {"DEBUG", "DEBUG"},
                {"DeBuG", "DEBUG"},
                {"info", "INFO"},
                {"trace", "TRACE"}
        };

        for (String[] testCase : testCases) {
            reset(logViewerService);
            when(logViewerService.getLoggerLevel(anyString())).thenReturn(testCase[1]);

            ObjectNode request = mapper.createObjectNode();
            request.put("level", testCase[0]);

            Response response = target().path("logs/levels/com.mobi.test")
                    .request()
                    .put(Entity.json(request.toString()));

            assertEquals(200, response.getStatus());

            try {
                ObjectNode result = mapper.readValue(response.readEntity(String.class), ObjectNode.class);
                assertEquals(testCase[1], result.get("level").asText());
            } catch (Exception e) {
                fail("Expected no exception, but got: " + e.getMessage());
            }
        }
    }

    @Test
    public void rootLoggerSpecialHandlingTest() throws Exception {
        // 1. Get ROOT logger level
        when(logViewerService.getLoggerLevel("ROOT")).thenReturn("INFO");
        Response getResponse = target().path("logs/levels/ROOT").request().get();
        assertEquals(200, getResponse.getStatus());
        verify(logViewerService).getLoggerLevel("ROOT");

        // 2. Update ROOT logger level
        ObjectNode updateRequest = mapper.createObjectNode();
        updateRequest.put("level", "WARN");

        Response updateResponse = target().path("logs/levels/ROOT")
                .request()
                .put(Entity.json(updateRequest.toString()));
        assertEquals(200, updateResponse.getStatus());
        verify(logViewerService).setLoggerLevel("ROOT", "WARN");

        // 3. Try to delete ROOT logger (should fail)
        Response deleteResponse = target().path("logs/levels/ROOT").request().delete();
        assertEquals(400, deleteResponse.getStatus());
        verify(logViewerService, times(0)).deleteLogger("ROOT");
    }

    @Test
    public void invalidLogLevelValidationTest() throws Exception {
        // Test various invalid log levels
        String[] invalidLevels = {
                "INVALID", "VERBOSE", "FINEST", "ALL", "SEVERE",
                "123", "true", "null", "undefined"
        };

        for (String invalidLevel : invalidLevels) {
            ObjectNode request = mapper.createObjectNode();
            request.put("level", invalidLevel);

            Response response = target().path("logs/levels/com.mobi.test")
                    .request()
                    .put(Entity.json(request.toString()));

            assertEquals(400, response.getStatus());
        }

        verify(logViewerService, times(0)).setLoggerLevel(anyString(), anyString());
    }
}
