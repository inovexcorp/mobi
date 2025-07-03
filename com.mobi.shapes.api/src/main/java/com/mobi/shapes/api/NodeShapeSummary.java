package com.mobi.shapes.api;

/*-
 * #%L
 * com.mobi.shapes.api
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * A summary view of a SHACL Node Shape.
 */
public record NodeShapeSummary (
        String iri,
        String name,
        String targetType,
        String targetValue,
        boolean imported,
        String sourceOntologyIRI
) {
    private static final ObjectMapper mapper = new ObjectMapper();
    /**
     * Converts this {@link NodeShapeSummary} record to an {@link ObjectNode} for serialization.
     *
     * @return An {@link ObjectNode} representing the entity.
     */
    public ObjectNode toObjectNode() {
        ObjectNode nodeShape = mapper.createObjectNode();
        nodeShape.put("iri", iri);
        nodeShape.put("name", name);
        nodeShape.put("targetType", targetType);
        nodeShape.put("targetValue", targetValue);
        nodeShape.put("imported", imported);
        nodeShape.put("sourceOntologyIRI", sourceOntologyIRI);
        return nodeShape;
    }
}