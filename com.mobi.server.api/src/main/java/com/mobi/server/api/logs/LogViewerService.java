package com.mobi.server.api.logs;

/*-
 * #%L
 * com.mobi.server.api
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

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * OSGi service for viewing and managing log files.
 */
public interface LogViewerService {

    /**
     * Available log levels in order of verbosity
     */
    enum LogLevel {
        OFF, ERROR, WARN, INFO, DEBUG, TRACE;
    }

    /**
     * Get list of available log files in the log directory.
     *
     * @return List of log file names
     */
    List<String> getAvailableLogFiles() throws IOException;

    /**
     * Read log file with pagination support.
     *
     * @param fileName Name of the log file
     * @param page Page number (0-based)
     * @param pageSize Number of lines per page
     * @return LogPage containing the requested lines
     */
    LogPage readLogFile(String fileName, int page, int pageSize) throws IOException;

    /**
     * Search log file for a specific term.
     *
     * @param fileName Name of the log file
     * @param searchTerm Term to search for
     * @param maxResults Maximum number of results to return
     * @return List of matching log entries with line numbers
     */
    List<LogEntry> searchLogFile(String fileName, String searchTerm, int maxResults) throws IOException;

    /**
     * Get the tail of a log file (most recent entries).
     *
     * @param fileName Name of the log file
     * @param lines Number of lines to retrieve from the end
     * @return List of log entries
     */
    List<String> tailLogFile(String fileName, int lines) throws IOException;

    /**
     * Get log file metadata.
     *
     * @param fileName Name of the log file
     * @return Metadata about the log file
     */
    LogFileMetadata getLogFileMetadata(String fileName) throws IOException;

    /**
     * Get an InputStream for downloading a log file.
     *
     * @param fileName Name of the log file
     * @return InputStream for reading the file
     */
    InputStream getLogFileInputStream(String fileName) throws IOException;

    /**
     * Get all configured package names and their levels.
     *
     * @return Map of package name to log level
     */
    Map<String, String> getAllLoggerLevels();

    /**
     * Get the log level for the logger of a specific package (or the ROOT logger).
     *
     * @param packageName Name of the package associated with a logger (e.g., "org.apache.karaf") or the ROOT logger
     * @return Current log level, or null if not set
     */
    String getLoggerLevel(String packageName);

    /**
     * Set the log level for a specific package.
     *
     * @param packageName Name of the package to log (or the ROOT logger)
     * @param level Log level to set
     */
    void setLoggerLevel(String packageName, String level);

    /**
     * Delete/unset a logger configuration for a specific package.
     *
     * @param packageName Name of the package associated with the logger to remove
     */
    void deleteLogger(String packageName);

    /**
     * Get the root logger level.
     *
     * @return Root logger level
     */
    String getRootLoggerLevel();

    /**
     * Set the root logger level.
     *
     * @param level Log level to set for root
     */
    void setRootLoggerLevel(String level);
}
