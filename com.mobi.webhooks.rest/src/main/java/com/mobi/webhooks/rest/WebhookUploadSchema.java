package com.mobi.webhooks.rest;

/*-
 * #%L
 * com.mobi.webhooks.rest
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

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Schema used for OpenAPI documentation for webhook upload requests.
 */
public class WebhookUploadSchema {
    @Schema(type = "string", description = "Required title for the new WebhookRecord", required = true)
    public String title;

    @Schema(type = "string", description = "Optional description for the new WebhookRecord")
    public String description;

    @Schema(type = "string", description = "Optional markdown abstract for the new WebhookRecord")
    public String markdown;

    @ArraySchema(arraySchema = @Schema(description = "Optional list of keywords strings for the new "
            + "WebhookRecord"), schema = @Schema(implementation = String.class, description = "keyword")
    )
    public List<String> keywords;
}
