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

    // Integration Tests

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
}
