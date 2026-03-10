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

import java.util.List;

/**
 * Class representing an entity for Swagger documentation.
 */
public class SearchEntity {

    @Schema(description = "The IRI of the entity",
            example = "http://example.org/entity1")
    public String iri;

    @Schema(description = "The name of the entity",
            example = "Example Entity 1")
    public String entityName;

    @Schema(description = "Description of the entity, calculated using a prioritized list of annotations. "
            + "Empty string if no description is available.",
            example = "This is an example description for Entity 1.")
    public String description;

    @Schema(description = "The source record associated with this entity")
    public SourceRecord sourceRecord;

    @Schema(description = "A list of RDF types for the entity",
            example = "[\"http://www.w3.org/2000/01/rdf-schema#Class\"]")
    public List<String> types;

    public SearchEntity() {
    }
}
