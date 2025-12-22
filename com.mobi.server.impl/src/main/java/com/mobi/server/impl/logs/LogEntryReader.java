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

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Helper class for reading log entries, properly handling multi-line entries
 * like stack traces and continuation lines.
 */
public class LogEntryReader {

    // Pattern to detect the start of a new log entry
    // Matches common patterns like:
    // 2024-01-15 10:30:45
    // [2024-01-15 10:30:45]
    // 2024-01-15T10:30:45.123Z
    // etc.
    private static final Pattern LOG_ENTRY_START_PATTERN = Pattern.compile(
            "^\\d{4}-\\d{2}-\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2}|" // ISO format
                    + "^\\[?\\d{4}-\\d{2}-\\d{2}|" // Bracketed date
                    + "^\\d{2}:\\d{2}:\\d{2}|" // Time only
                    + "^\\w{3}\\s+\\d{1,2},\\s+\\d{4}|" // Jan 01, 2024
                    + "^\\d+\\s+\\[.*?\\]" // Thread format: 123 [main]
    );

    private static final int MAX_LINE_LENGTH = 10000;

    /**
     * Read log entries from a file, properly grouping multi-line entries.
     *
     * @param file The log file to read
     * @param startEntry Starting entry index (0-based)
     * @param count Number of entries to read
     * @return List of complete log entries
     */
    public static List<String> readLogEntries(Path file, long startEntry, int count) throws IOException {
        List<String> entries = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            String line;
            long currentEntry = 0;
            StringBuilder currentLogEntry = new StringBuilder();
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                // Clean the line
                line = cleanLine(line);

                // Check if this is the start of a new log entry
                boolean isNewEntry = isFirstLine || isLogEntryStart(line);

                if (isNewEntry) {
                    // Save the previous entry if we're in the reading range
                    if (!isFirstLine && currentLogEntry.length() > 0) {
                        if (currentEntry >= startEntry && entries.size() < count) {
                            entries.add(truncate(currentLogEntry.toString()));
                        }
                        currentEntry++;

                        // Stop if we've read enough entries
                        if (entries.size() >= count) {
                            break;
                        }
                    }

                    // Start new entry
                    currentLogEntry = new StringBuilder(line);
                    isFirstLine = false;
                } else {
                    // Continuation line (e.g., stack trace)
                    if (currentLogEntry.length() > 0) {
                        currentLogEntry.append("\n").append(line);
                    }
                }
            }

            // Don't forget the last entry
            if (currentLogEntry.length() > 0 && currentEntry >= startEntry && entries.size() < count) {
                entries.add(truncate(currentLogEntry.toString()));
            }
        }

        return entries;
    }

    /**
     * Read the last N log entries from a file.
     */
    public static List<String> readTailLogEntries(Path file, int count) throws IOException {
        List<String> allEntries = new ArrayList<>();

        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            String line;
            StringBuilder currentLogEntry = new StringBuilder();
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                line = cleanLine(line);
                boolean isNewEntry = isFirstLine || isLogEntryStart(line);

                if (isNewEntry) {
                    if (!isFirstLine && currentLogEntry.length() > 0) {
                        allEntries.add(truncate(currentLogEntry.toString()));
                    }
                    currentLogEntry = new StringBuilder(line);
                    isFirstLine = false;
                } else {
                    if (currentLogEntry.length() > 0) {
                        currentLogEntry.append("\n").append(line);
                    }
                }
            }

            // Add last entry
            if (currentLogEntry.length() > 0) {
                allEntries.add(truncate(currentLogEntry.toString()));
            }
        }

        // Return only the last N entries
        int start = Math.max(0, allEntries.size() - count);
        return allEntries.subList(start, allEntries.size());
    }

    /**
     * Count the number of log entries (not lines) in a file.
     */
    public static long countLogEntries(Path file) throws IOException {
        long count = 0;

        try (BufferedReader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            String line;
            boolean isFirstLine = true;

            while ((line = reader.readLine()) != null) {
                if (isFirstLine || isLogEntryStart(line)) {
                    count++;
                    isFirstLine = false;
                }
            }
        }

        return count;
    }

    /**
     * Determine if a line is the start of a new log entry.
     */
    private static boolean isLogEntryStart(String line) {
        if (line == null || line.trim().isEmpty()) {
            return false;
        }

        // Check against the pattern
        return LOG_ENTRY_START_PATTERN.matcher(line.trim()).find();
    }

    /**
     * Clean a line by handling escaped characters.
     */
    private static String cleanLine(String line) {
        if (line == null) {
            return "";
        }

        // Only replace literal \n and \r if they appear to be escaped in the log
        // (not actual newlines, which BufferedReader already handles)
        // This is for cases where the log framework escaped them
        if (line.contains("\\n") || line.contains("\\r")) {
            line = line.replace("\\r\\n", "\n")
                    .replace("\\n", "\n")
                    .replace("\\r", "");
        }

        return line;
    }

    /**
     * Truncate a log entry if it's too long.
     */
    private static String truncate(String entry) {
        if (entry.length() > MAX_LINE_LENGTH) {
            return entry.substring(0, MAX_LINE_LENGTH) + "\n... [truncated]";
        }
        return entry;
    }
}
