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

import java.util.List;

/**
 * Represents a page of log entries.
 */
public class LogPage {
    private List<String> lines;
    private int currentPage;
    private int totalPages;
    private long totalLines;
    private String fileName;

    public LogPage() {}

    public LogPage(List<String> lines, int currentPage, int totalPages, long totalLines, String fileName) {
        this.lines = lines;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalLines = totalLines;
        this.fileName = fileName;
    }

    // Getters and setters
    public List<String> getLines() {
        return lines;
    }
    public void setLines(List<String> lines) {
        this.lines = lines;
    }

    public int getCurrentPage() {
        return currentPage;
    }
    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }

    public int getTotalPages() {
        return totalPages;
    }
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalLines() {
        return totalLines;
    }
    public void setTotalLines(long totalLines) {
        this.totalLines = totalLines;
    }

    public String getFileName() {
        return fileName;
    }
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
