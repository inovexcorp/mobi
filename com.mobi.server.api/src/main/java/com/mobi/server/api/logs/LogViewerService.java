package com.mobi.server.api.logs;

/*-
 * #%L
 * com.mobi.server.api
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

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * OSGi service for viewing and managing log files.
 */
public interface LogViewerService {

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
}
