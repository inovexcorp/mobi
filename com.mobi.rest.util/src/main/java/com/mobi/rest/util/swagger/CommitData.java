package com.mobi.rest.util.swagger;

/*-
 * #%L
 * com.mobi.rest.util
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

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Class representing commit data for Swagger documentation.
 */
public class CommitData {

    @Schema(description = "Commit ID", format = "uri", example = "http://example.org/commit/1")
    public String id;

    @Schema(description = "The user who created the commit")
    public UserData creator;

    @Schema(description = "Date of the commit", example = "2023-10-27T10:00:00Z")
    public String date;

    @Schema(description = "Commit message", example = "Initial commit")
    public String message;

    @Schema(description = "Base URI", format = "uri", example = "http://example.org/base")
    public String base;

    @Schema(description = "Branch URI", format = "uri", example = "http://example.org/branch/main")
    public String branch;

    @Schema(description = "Auxiliary URI", format = "uri", example = "http://example.org/aux")
    public String auxiliary;

    public CommitData() {
    }
}
