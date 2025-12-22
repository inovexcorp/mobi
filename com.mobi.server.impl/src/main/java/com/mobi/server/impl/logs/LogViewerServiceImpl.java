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

import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import com.mobi.server.api.logs.LogViewerService;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Implementation of LogViewerService using OSGi Declarative Services.
 */
@Component(
        immediate = true,
        service = LogViewerService.class
)
public class LogViewerServiceImpl implements LogViewerService {
    private static final Logger logger = LoggerFactory.getLogger(LogViewerServiceImpl.class);
    private static final int MAX_LINE_LENGTH = 10000; // Prevent memory issues with extremely long lines

    private Path logDirectory;

    @Activate
    @Modified
    public void activate(Map<String, Object> properties) {
        String logDirPath = (String) properties.getOrDefault("log.directory",
                System.getProperty("karaf.data", ".") + "/log");

        this.logDirectory = Paths.get(logDirPath);

        if (!Files.exists(logDirectory)) {
            logger.warn("Log directory does not exist: {}", logDirectory);
        } else if (!Files.isDirectory(logDirectory)) {
            logger.error("Log path is not a directory: {}", logDirectory);
        } else {
            logger.info("LogViewerService activated with log directory: {}", logDirectory);
        }
    }

    @Override
    public List<String> getAvailableLogFiles() throws IOException {
        validateLogDirectory();

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(logDirectory, "*.log*")) {
            List<String> files = new ArrayList<>();
            for (Path entry : stream) {
                if (Files.isRegularFile(entry)) {
                    files.add(entry.getFileName().toString());
                }
            }
            // Sort with most recent first
            files.sort(Collections.reverseOrder());
            return files;
        }
    }

    @Override
    public LogPage readLogFile(String fileName, int page, int pageSize) throws IOException {
        validateFileName(fileName);
        Path logFile = logDirectory.resolve(fileName);
        validateLogFile(logFile);

        if (pageSize <= 0 || pageSize > 1000) {
            pageSize = 100; // Default and max page size
        }
        if (page < 0) {
            page = 0;
        }

        long totalEntries = LogEntryReader.countLogEntries(logFile);
        int totalPages = (int) Math.ceil((double) totalEntries / pageSize);

        if (page >= totalPages && totalPages > 0) {
            page = totalPages - 1;
        }

        List<String> entries = LogEntryReader.readLogEntries(logFile, (long) page * pageSize, pageSize);

        return new LogPage(entries, page, totalPages, totalEntries, fileName);
    }

    @Override
    public List<LogEntry> searchLogFile(String fileName, String searchTerm, int maxResults) throws IOException {
        validateFileName(fileName);
        Path logFile = logDirectory.resolve(fileName);
        validateLogFile(logFile);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Collections.emptyList();
        }

        if (maxResults <= 0 || maxResults > 500) {
            maxResults = 100;
        }

        List<LogEntry> results = new ArrayList<>();
        String lowerSearchTerm = searchTerm.toLowerCase();

        try (BufferedReader reader = Files.newBufferedReader(logFile, StandardCharsets.UTF_8)) {
            String line;
            long entryNumber = 0;
            StringBuilder currentLogEntry = new StringBuilder();
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null && results.size() < maxResults) {
                line = cleanLogLine(line);
                boolean isNewEntry = isFirstLine || isLogEntryStart(line);

                if (isNewEntry) {
                    // Check previous entry for search term
                    if (!isFirstLine && currentLogEntry.length() > 0) {
                        String entry = currentLogEntry.toString();
                        if (entry.toLowerCase().contains(lowerSearchTerm)) {
                            results.add(new LogEntry(entryNumber, truncateLine(entry)));
                        }
                        entryNumber++;
                    }

                    currentLogEntry = new StringBuilder(line);
                    isFirstLine = false;
                } else {
                    if (currentLogEntry.length() > 0) {
                        currentLogEntry.append("\n").append(line);
                    }
                }
            }

            // Check last entry
            if (currentLogEntry.length() > 0 && results.size() < maxResults) {
                String entry = currentLogEntry.toString();
                if (entry.toLowerCase().contains(lowerSearchTerm)) {
                    results.add(new LogEntry(entryNumber, truncateLine(entry)));
                }
            }
        }

        return results;
    }

    @Override
    public List<String> tailLogFile(String fileName, int lines) throws IOException {
        validateFileName(fileName);
        Path logFile = logDirectory.resolve(fileName);
        validateLogFile(logFile);

        if (lines <= 0 || lines > 1000) {
            lines = 100;
        }

        return LogEntryReader.readTailLogEntries(logFile, lines);
    }

    @Override
    public LogFileMetadata getLogFileMetadata(String fileName) throws IOException {
        validateFileName(fileName);
        Path logFile = logDirectory.resolve(fileName);
        validateLogFile(logFile);

        long size = Files.size(logFile);
        long lastModified = Files.getLastModifiedTime(logFile).toMillis();
        long entryCount = LogEntryReader.countLogEntries(logFile);

        return new LogFileMetadata(fileName, size, lastModified, entryCount);
    }

    @Override
    public InputStream getLogFileInputStream(String fileName) throws IOException {
        validateFileName(fileName);
        Path logFile = logDirectory.resolve(fileName);
        validateLogFile(logFile);

        return Files.newInputStream(logFile);
    }

    // Helper methods

    private void validateLogDirectory() throws IOException {
        if (!Files.exists(logDirectory)) {
            throw new IOException("Log directory does not exist: " + logDirectory);
        }
        if (!Files.isDirectory(logDirectory)) {
            throw new IOException("Log path is not a directory: " + logDirectory);
        }
    }

    private void validateFileName(String fileName) throws IOException {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new IOException("File name cannot be null or empty");
        }

        // Prevent directory traversal attacks
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new IOException("Invalid file name: " + fileName);
        }
    }

    private void validateLogFile(Path logFile) throws IOException {
        if (!Files.exists(logFile)) {
            throw new IOException("Log file does not exist: " + logFile.getFileName());
        }
        if (!Files.isRegularFile(logFile)) {
            throw new IOException("Path is not a regular file: " + logFile.getFileName());
        }
        // Security check: ensure file is within log directory
        if (!logFile.normalize().startsWith(logDirectory.normalize())) {
            throw new IOException("Access denied: file is outside log directory");
        }
    }

    private String truncateLine(String line) {
        if (line.length() > MAX_LINE_LENGTH) {
            return line.substring(0, MAX_LINE_LENGTH) + "... [truncated]";
        }
        return line;
    }

    private boolean isLogEntryStart(String line) {
        if (line == null || line.trim().isEmpty()) {
            return false;
        }
        // Simple pattern matching for common log formats
        String trimmed = line.trim();
        return trimmed.matches("^\\d{4}-\\d{2}-\\d{2}.*") // 2024-01-15
                || trimmed.matches("^\\[?\\d{4}-\\d{2}-\\d{2}.*") // [2024-01-15
                || trimmed.matches("^\\d{2}:\\d{2}:\\d{2}.*") // 10:30:45
                || trimmed.matches("^\\d+\\s+\\[.*") // 123 [thread]
                || trimmed.matches("^\\w{3}\\s+\\d{1,2},\\s+\\d{4}.*"); // Jan 01, 2024
    }

    private String cleanLogLine(String line) {
        if (line == null) {
            return "";
        }
        // Handle literal escaped newlines
        if (line.contains("\\n") || line.contains("\\r")) {
            line = line.replace("\\r\\n", "\n")
                    .replace("\\n", "\n")
                    .replace("\\r", "");
        }
        return line;
    }
}
