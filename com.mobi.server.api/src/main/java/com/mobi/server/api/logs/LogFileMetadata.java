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

/**
 * Metadata about a log file.
 */
public class LogFileMetadata {
    private String fileName;
    private long sizeBytes;
    private long lastModified;
    private long lineCount;

    public LogFileMetadata() {}

    public LogFileMetadata(String fileName, long sizeBytes, long lastModified, long lineCount) {
        this.fileName = fileName;
        this.sizeBytes = sizeBytes;
        this.lastModified = lastModified;
        this.lineCount = lineCount;
    }

    // Getters and setters
    public String getFileName() {
        return fileName;
    }
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }
    public void setSizeBytes(long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public long getLastModified() {
        return lastModified;
    }
    public void setLastModified(long lastModified) {
        this.lastModified = lastModified;
    }

    public long getLineCount() {
        return lineCount;
    }
    public void setLineCount(long lineCount) {
        this.lineCount = lineCount;
    }
}
