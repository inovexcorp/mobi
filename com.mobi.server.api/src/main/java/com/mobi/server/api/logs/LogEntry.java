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
 * Represents a single log entry with metadata.
 */
public class LogEntry {
    private long lineNumber;
    private String content;
    private String level;
    private String timestamp;

    public LogEntry() {}

    public LogEntry(long lineNumber, String content) {
        this.lineNumber = lineNumber;
        this.content = content;
        parseLogLevel();
    }

    private void parseLogLevel() {
        if (content.contains("ERROR")) {
            this.level = "ERROR";
        } else if (content.contains("WARN")) {
            this.level = "WARN";
        } else if (content.contains("INFO")) {
            this.level = "INFO";
        } else if (content.contains("DEBUG")) {
            this.level = "DEBUG";
        } else {
            this.level = "TRACE";
        }
    }

    // Getters and setters
    public long getLineNumber() {
        return lineNumber;
    }
    public void setLineNumber(long lineNumber) {
        this.lineNumber = lineNumber;
    }

    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }

    public String getLevel() {
        return level;
    }
    public void setLevel(String level) {
        this.level = level;
    }

    public String getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
