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
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class LogEntryReaderTest {
    private Path testLogFile;

    @Before
    public void setUp() throws IOException {
        testLogFile = File.createTempFile("test", ".log").toPath();
    }

    @After
    public void tearDown() throws IOException {
        if (Files.exists(testLogFile)) {
            Files.delete(testLogFile);
        }
    }

    @Test
    public void testReadLogEntries_SingleLineEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First log entry
                2024-01-15 10:30:46 ERROR Second log entry
                2024-01-15 10:30:47 DEBUG Third log entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 3);

        assertEquals(3, entries.size());
        assertTrue(entries.get(0).contains("First log entry"));
        assertTrue(entries.get(1).contains("Second log entry"));
        assertTrue(entries.get(2).contains("Third log entry"));
    }

    @Test
    public void testReadLogEntries_MultiLineEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 ERROR Exception occurred
                    at com.example.Class.method(Class.java:123)
                    at com.example.Main.main(Main.java:45)
                2024-01-15 10:30:46 INFO  Normal log entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Exception occurred"));
        assertTrue(entries.get(0).contains("at com.example.Class.method"));
        assertTrue(entries.get(0).contains("at com.example.Main.main"));
        assertTrue(entries.get(1).contains("Normal log entry"));
    }

    @Test
    public void testReadLogEntries_WithStartEntry() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                2024-01-15 10:30:46 INFO  Second entry
                2024-01-15 10:30:47 INFO  Third entry
                2024-01-15 10:30:48 INFO  Fourth entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 2, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Third entry"));
        assertTrue(entries.get(1).contains("Fourth entry"));
    }

    @Test
    public void testReadLogEntries_WithCount() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                2024-01-15 10:30:46 INFO  Second entry
                2024-01-15 10:30:47 INFO  Third entry
                2024-01-15 10:30:48 INFO  Fourth entry
                2024-01-15 10:30:49 INFO  Fifth entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 3);

        assertEquals(3, entries.size());
        assertTrue(entries.get(0).contains("First entry"));
        assertTrue(entries.get(1).contains("Second entry"));
        assertTrue(entries.get(2).contains("Third entry"));
    }

    @Test
    public void testReadLogEntries_BracketedDateFormat() throws IOException {
        String logContent = """
                [2024-01-15 10:30:45] INFO  Bracketed date entry
                [2024-01-15 10:30:46] ERROR Another bracketed entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Bracketed date entry"));
        assertTrue(entries.get(1).contains("Another bracketed entry"));
    }

    @Test
    public void testReadLogEntries_ISOFormat() throws IOException {
        String logContent = """
                2024-01-15T10:30:45.123Z INFO  ISO format entry
                2024-01-15T10:30:46.456Z ERROR Another ISO entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("ISO format entry"));
        assertTrue(entries.get(1).contains("Another ISO entry"));
    }

    @Test
    public void testReadLogEntries_TimeOnlyFormat() throws IOException {
        String logContent = """
                10:30:45 INFO  Time only entry
                10:30:46 ERROR Another time entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Time only entry"));
        assertTrue(entries.get(1).contains("Another time entry"));
    }

    @Test
    public void testReadLogEntries_ThreadFormat() throws IOException {
        String logContent = """
                123 [main] INFO  Thread format entry
                124 [worker-1] ERROR Another thread entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Thread format entry"));
        assertTrue(entries.get(1).contains("Another thread entry"));
    }

    @Test
    public void testReadLogEntries_EmptyFile() throws IOException {
        Files.writeString(testLogFile, "");

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 10);

        assertTrue(entries.isEmpty());
    }

    @Test
    public void testReadLogEntries_EscapedNewlines() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  Message with\\nescaped\\nnewlines
                2024-01-15 10:30:46 INFO  Normal entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Message with"));
        assertTrue(entries.get(0).contains("escaped"));
        assertTrue(entries.get(0).contains("newlines"));
    }

    @Test
    public void testReadTailLogEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                2024-01-15 10:30:46 INFO  Second entry
                2024-01-15 10:30:47 INFO  Third entry
                2024-01-15 10:30:48 INFO  Fourth entry
                2024-01-15 10:30:49 INFO  Fifth entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readTailLogEntries(testLogFile, 3);

        assertEquals(3, entries.size());
        assertTrue(entries.get(0).contains("Third entry"));
        assertTrue(entries.get(1).contains("Fourth entry"));
        assertTrue(entries.get(2).contains("Fifth entry"));
    }

    @Test
    public void testReadTailLogEntries_RequestMoreThanExists() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                2024-01-15 10:30:46 INFO  Second entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readTailLogEntries(testLogFile, 10);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("First entry"));
        assertTrue(entries.get(1).contains("Second entry"));
    }

    @Test
    public void testReadTailLogEntries_WithMultiLineEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 ERROR Exception in first
                    at com.example.First.method(First.java:10)
                2024-01-15 10:30:46 ERROR Exception in second
                    at com.example.Second.method(Second.java:20)
                2024-01-15 10:30:47 INFO  Third entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readTailLogEntries(testLogFile, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Exception in second"));
        assertTrue(entries.get(0).contains("at com.example.Second"));
        assertTrue(entries.get(1).contains("Third entry"));
    }

    @Test
    public void testCountLogEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                2024-01-15 10:30:46 ERROR Second entry
                    with continuation
                2024-01-15 10:30:47 DEBUG Third entry
                """;
        Files.writeString(testLogFile, logContent);

        long count = LogEntryReader.countLogEntries(testLogFile);

        assertEquals(3, count);
    }

    @Test
    public void testCountLogEntries_EmptyFile() throws IOException {
        Files.writeString(testLogFile, "");

        long count = LogEntryReader.countLogEntries(testLogFile);

        assertEquals(0, count);
    }

    @Test
    public void testCountLogEntries_SingleEntry() throws IOException {
        String logContent = "2024-01-15 10:30:45 INFO  Single entry\n";
        Files.writeString(testLogFile, logContent);

        long count = LogEntryReader.countLogEntries(testLogFile);

        assertEquals(1, count);
    }

    @Test
    public void testReadLogEntries_Truncation() throws IOException {
        // Create a very long log entry
        String longEntry = "2024-01-15 10:30:45 ERROR Long entry: " + "X".repeat(15000) +
                "\n";
        Files.writeString(testLogFile, longEntry);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 1);

        assertEquals(1, entries.size());
        assertTrue(entries.get(0).contains("[truncated]"));
        assertTrue(entries.get(0).length() < 15000);
    }

    @Test
    public void testReadLogEntries_ComplexStackTrace() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 ERROR NullPointerException
                java.lang.NullPointerException: Cannot invoke method on null object
                    at com.example.Service.process(Service.java:123)
                    at com.example.Controller.handle(Controller.java:45)
                    at com.example.Servlet.doPost(Servlet.java:78)
                Caused by: java.lang.IllegalStateException: Invalid state
                    at com.example.Helper.validate(Helper.java:90)
                    ... 3 more
                2024-01-15 10:30:46 INFO  Recovery completed
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("NullPointerException"));
        assertTrue(entries.get(0).contains("Caused by:"));
        assertTrue(entries.get(0).contains("... 3 more"));
        assertTrue(entries.get(1).contains("Recovery completed"));
    }

    @Test
    public void testReadLogEntries_MonthDayYearFormat() throws IOException {
        String logContent = """
                Jan 15, 2024 INFO  Month day format entry
                Feb 01, 2024 ERROR Another month day entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 2);

        assertEquals(2, entries.size());
        assertTrue(entries.get(0).contains("Month day format entry"));
        assertTrue(entries.get(1).contains("Another month day entry"));
    }

    @Test
    public void testReadLogEntries_BlankLinesBetweenEntries() throws IOException {
        String logContent = """
                2024-01-15 10:30:45 INFO  First entry
                
                2024-01-15 10:30:46 INFO  Second entry
                
                
                2024-01-15 10:30:47 INFO  Third entry
                """;
        Files.writeString(testLogFile, logContent);

        List<String> entries = LogEntryReader.readLogEntries(testLogFile, 0, 3);

        assertEquals(3, entries.size());
        assertTrue(entries.get(0).contains("First entry"));
        assertTrue(entries.get(1).contains("Second entry"));
        assertTrue(entries.get(2).contains("Third entry"));
    }
}
