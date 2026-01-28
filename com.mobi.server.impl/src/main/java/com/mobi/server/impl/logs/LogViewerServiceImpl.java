package com.mobi.server.impl.logs;

/*-
 * #%L
 * com.mobi.server.impl
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

import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import com.mobi.server.api.logs.LogViewerService;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
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
import java.util.Dictionary;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

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
    private static final String LOG_CONFIG_PID = "org.ops4j.pax.logging";
    private static final String ROOT_LOGGER = "ROOT";

    private Path logDirectory;

    @Reference
    private ConfigurationAdmin configAdmin;

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

    @Override
    public Map<String, String> getAllLoggerLevels() {
        Map<String, String> loggers = new TreeMap<>();

        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props != null) {
                // Helper maps to deal with split logger names and levels
                Map<String, String> keyToLoggerMap = new HashMap<>();
                Map<String, String> keyToLevelMap = new HashMap<>();

                Enumeration<String> keys = props.keys();
                while (keys.hasMoreElements()) {
                    String key = keys.nextElement();
                    // Logger levels are stored as two keys: log4j2.logger.<name>.name and log4j2.logger.<name>.level
                    if (key.startsWith("log4j2.logger.")) {
                        if (key.endsWith(".name")) {
                            String loggerName = extractLoggerName(key);
                            String logger = (String) props.get(key);
                            keyToLoggerMap.put(loggerName, logger);
                            if (keyToLevelMap.containsKey(loggerName)) {
                                loggers.put(logger, keyToLevelMap.get(loggerName));
                            }
                        } else if (key.endsWith(".level")) {
                            String loggerName = extractLoggerName(key);
                            String level = (String) props.get(key);
                            keyToLevelMap.put(loggerName, level);
                            if (keyToLoggerMap.containsKey(loggerName)) {
                                loggers.put(keyToLoggerMap.get(loggerName), level);
                            }
                        }
                    }
                }
            }

            // Always include root logger
            String rootLevel = getRootLoggerLevel();
            if (rootLevel != null) {
                loggers.put(ROOT_LOGGER, rootLevel);
            }

        } catch (IOException e) {
            logger.error("Failed to retrieve logger levels", e);
        }

        return loggers;
    }

    @Override
    public String getLoggerLevel(String packageName) {
        if (ROOT_LOGGER.equals(packageName)) {
            return getRootLoggerLevel();
        }

        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props != null) {
                Optional<String> nameKey = retrieveLoggerNameKey(packageName, props);
                if (nameKey.isEmpty()) {
                    logger.debug("Could not find a logger configuration for {}", packageName);
                    return null;
                }
                return (String) props.get(createLevelKey(nameKey.get()));
            }
        } catch (IOException e) {
            logger.error("Failed to get logger level for: {}", packageName, e);
        }

        return null;
    }

    @Override
    public void setLoggerLevel(String packageName, String level) {
        if (ROOT_LOGGER.equals(packageName)) {
            setRootLoggerLevel(level);
            return;
        }

        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props == null) {
                props = new Hashtable<>();
            }

            Optional<String> nameKeyOpt = retrieveLoggerNameKey(packageName, props);
            String nameKey;
            if (nameKeyOpt.isEmpty()) {
                logger.debug("Could not find a logger configuration for {}. Generating new one", packageName);
                nameKey = "log4j2.logger." + sanitizeLoggerName(packageName) + ".name";
            } else {
                nameKey = nameKeyOpt.get();
            }
            String levelKey = createLevelKey(nameKey);

            props.put(nameKey, packageName);
            props.put(levelKey, level.toUpperCase());

            config.update(props);
            logger.info("Set logger level: {} = {}", packageName, level);

        } catch (IOException e) {
            logger.error("Failed to set logger level for: {}", packageName, e);
        }
    }

    @Override
    public void deleteLogger(String packageName) {
        if (ROOT_LOGGER.equals(packageName)) {
            logger.warn("Cannot delete ROOT logger");
            return;
        }

        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props != null) {
                Optional<String> nameKeyOpt = retrieveLoggerNameKey(packageName, props);
                if (nameKeyOpt.isEmpty()) {
                    logger.debug("Could not find a logger configuration for {}", packageName);
                    return;
                }
                String nameKey = nameKeyOpt.get();
                String levelKey = createLevelKey(nameKey);

                props.remove(nameKey);
                props.remove(levelKey);

                config.update(props);
                logger.info("Deleted logger: {}", packageName);
            }
        } catch (IOException e) {
            logger.error("Failed to delete logger: {}", packageName, e);
        }
    }

    @Override
    public String getRootLoggerLevel() {
        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props != null) {
                Object level = props.get("log4j2.rootLogger.level");
                return level != null ? level.toString() : "INFO";
            }
        } catch (IOException e) {
            logger.error("Failed to get root logger level", e);
        }

        return "INFO";
    }

    @Override
    public void setRootLoggerLevel(String level) {
        try {
            Configuration config = configAdmin.getConfiguration(LOG_CONFIG_PID, null);
            Dictionary<String, Object> props = config.getProperties();

            if (props == null) {
                props = new Hashtable<>();
            }

            props.put("log4j2.rootLogger.level", level.toUpperCase());
            config.update(props);
            logger.info("Set root logger level: {}", level);

        } catch (IOException e) {
            logger.error("Failed to set root logger level", e);
        }
    }

    /**
     * Extract logger name from configuration key
     * Example: log4j2.logger.karaf.level -> karaf
     */
    private String extractLoggerName(String key) {
        String[] parts = key.split("\\.");
        if (parts.length >= 4) {
            // Reconstruct logger name (may contain dots)
            StringBuilder name = new StringBuilder();
            for (int i = 2; i < parts.length - 1; i++) {
                if (name.length() > 0) {
                    name.append(".");
                }
                name.append(parts[i]);
            }
            return name.toString();
        }
        return key;
    }


    // Helper methods

    /**
     * Sanitize logger name for use as configuration key. Replace dots with underscores to avoid key conflicts.
     */
    private String sanitizeLoggerName(String loggerName) {
        return loggerName.replace(".", "_");
    }

    private Optional<String> retrieveLoggerNameKey(String loggerName, Dictionary<String, Object> props) {
        String finalKey = null;
        Enumeration<String> keys = props.keys();
        while (keys.hasMoreElements()) {
            String key = keys.nextElement();
            if (key.endsWith(".name") && props.get(key).equals(loggerName)) {
                finalKey = key;
                break;
            }
        }
        return Optional.ofNullable(finalKey);
    }

    private String createLevelKey(String nameKey) {
        return nameKey.replace(".name", ".level");
    }

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
