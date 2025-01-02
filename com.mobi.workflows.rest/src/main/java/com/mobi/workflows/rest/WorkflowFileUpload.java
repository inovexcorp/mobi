package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
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

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Class used for OpenAPI documentation for file upload endpoint.
 */
public class WorkflowFileUpload {
    @Schema(type = "string", format = "binary", description = "Mapping file to upload.")
    public String file;

    @Schema(type = "string", description = "Mapping serialized as JSON-LD", required = true)
    public String jsonld;

    @Schema(type = "string", description = "Required title for the new WorkflowRecord", required = true)
    public String title;

    @Schema(type = "string", description = "Optional description for the new WorkflowRecord")
    public String description;

    @Schema(type = "string", description = "Optional markdown abstract for the new WorkflowRecord")
    public String markdown;

    @ArraySchema(arraySchema = @Schema(description = "Optional list of keywords strings for the new "
            + "WorkflowRecord"), schema = @Schema(implementation = String.class, description = "keyword")
    )
    public List<String> keywords;
}
