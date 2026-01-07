package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.List;
import java.util.Map;

/**
 * Represents an entity with detailed information.
 *
 * This record encapsulates the properties of an entity, including its IRI (Internationalized Resource Identifier),
 * name, types, description, and source record details. The source record is represented as a map of key-value pairs
 * for flexibility.
 *
 * @param iri            The Internationalized Resource Identifier (IRI) of the entity. Must not be null.
 * @param entityName     The name of the entity. Must not be null.
 * @param types          A list of RDF types associated with the entity. Must not be null or empty.
 * @param description    A description of the entity. May be an empty string if no description is available.
 * @param sourceRecord   A map representing the source record of the entity. The map should contain
 *                       key-value pairs such as title, iri, and type. Each value in the map must be a non-null string.
 * @param recordKeywords      A list of keywords associated with the entity record. These keywords are typically
 *                            used for search or classification purposes. Must not be null, but may be an empty list
 *                            if no keywords are available.
 * @param matchingAnnotations A list of annotations related to the entity. Each annotation is represented
 *                            as a map containing "prop", "propName", and "value" fields.
 */
public record EntityMetadata(
        String iri,
        String entityName,
        List<String> types,
        String description,
        Map<String, String> sourceRecord,
        List<String> recordKeywords,
        List<Map<String, String>> matchingAnnotations
) {
    private static final ObjectMapper mapper = new ObjectMapper();
    /**
     * Converts this {@link EntityMetadata} record to an {@link ObjectNode} for serialization.
     *
     * @return An {@link ObjectNode} representing the entity.
     */
    public ObjectNode toObjectNode() {
        ObjectNode entityNode = mapper.createObjectNode();
        entityNode.put("iri", iri);
        entityNode.put("entityName", entityName);

        ArrayNode typesNode = mapper.createArrayNode();
        types.forEach(typesNode::add);
        entityNode.set("types", typesNode);
        entityNode.put("description", description != null ? description : "");

        ObjectNode sourceRecordNode = mapper.createObjectNode();
        sourceRecord.forEach(sourceRecordNode::put);

        ArrayNode keywords = mapper.createArrayNode();
        recordKeywords.forEach(keywords::add);
        sourceRecordNode.set("keywords", keywords);
        entityNode.set("record", sourceRecordNode);

        ArrayNode annotationsNode = mapper.createArrayNode();
        for (Map<String, String> annotation : matchingAnnotations.subList(0,
                Math.min(5, matchingAnnotations.size()))) {
            ObjectNode annotationNode = mapper.createObjectNode();
            annotation.forEach(annotationNode::put);
            annotationsNode.add(annotationNode);
        }
        entityNode.set("matchingAnnotations", annotationsNode);
        entityNode.put("totalNumMatchingAnnotations", matchingAnnotations.size());

        return entityNode;
    }
}
