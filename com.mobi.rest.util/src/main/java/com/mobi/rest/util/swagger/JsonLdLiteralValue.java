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
 * Class representing a JSON-LD literal value for Swagger documentation.
 */
public class JsonLdLiteralValue implements JsonLdValue {

    @Schema(description = "The literal value", required = true, name = "@value", example = "some value")
    public String value;

    @Schema(description = "Language tag (e.g. 'en')", name = "@language", example = "en")
    public String language;

    @Schema(description = "Datatype IRI", format = "uri", name = "@datatype", example = "http://www.w3.org/2001/XMLSchema#string")
    public String datatype;

    public JsonLdLiteralValue() {
    }
}
