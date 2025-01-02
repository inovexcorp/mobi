package com.mobi.catalog.api.record;

/*-
 * #%L
 * com.mobi.catalog.api
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.Test;

import java.util.List;
import java.util.Map;

public class EntityMetadataTest {

    @Test
    public void testToObjectNode() {
        EntityMetadata metadata = new EntityMetadata(
                "http://example.com/entity/1",
                "EntityName",
                List.of("Type1", "Type2"),
                "Sample description",
                Map.of("source1", "value1", "source2", "value2"),
                List.of("keyword1", "keyword2"),
                List.of(
                        Map.of("key1", "value1"),
                        Map.of("key2", "value2"),
                        Map.of("key3", "value3"),
                        Map.of("key4", "value4"),
                        Map.of("key5", "value5"),
                        Map.of("key6", "value6")
                )
        );
        ObjectNode resultNode = metadata.toObjectNode();
        // Validate the ObjectNode structure
        assertNotNull(resultNode);
        assertEquals("http://example.com/entity/1", resultNode.get("iri").asText());
        assertEquals("EntityName", resultNode.get("entityName").asText());
        assertEquals("Sample description", resultNode.get("description").asText());
        // Validate types array
        JsonNode typesNode = resultNode.get("types");
        assertTrue(typesNode.isArray());
        assertEquals(2, typesNode.size());
        assertEquals("Type1", typesNode.get(0).asText());
        assertEquals("Type2", typesNode.get(1).asText());
        // Validate sourceRecord and keywords
        JsonNode sourceRecordNode = resultNode.get("record");
        assertEquals("value1", sourceRecordNode.get("source1").asText());
        assertEquals("value2", sourceRecordNode.get("source2").asText());
        JsonNode keywordsNode = sourceRecordNode.get("keywords");
        assertEquals(2, keywordsNode.size());
        assertEquals("keyword1", keywordsNode.get(0).asText());
        assertEquals("keyword2", keywordsNode.get(1).asText());
        // Validate matchingAnnotations (limited to 5)
        JsonNode matchingAnnotationsNode = resultNode.get("matchingAnnotations");
        assertEquals(5, matchingAnnotationsNode.size());
        assertEquals("value1", matchingAnnotationsNode.get(0).get("key1").asText());
        assertEquals("value2", matchingAnnotationsNode.get(1).get("key2").asText());
        // Validate total number of annotations
        assertEquals(6, resultNode.get("totalNumMatchingAnnotations").asInt());
    }

    @Test
    public void testToObjectNodeWithNullDescription() {
        // Sample data for EntityMetadata with null description
        EntityMetadata metadata = new EntityMetadata(
                "http://example.com/entity/2",
                "EntityName2",
                List.of("TypeA", "TypeB"),
                null,
                Map.of("sourceA", "valueA"),
                List.of("keywordA"),
                List.of(Map.of("keyA", "valueA"))
        );
        ObjectNode resultNode = metadata.toObjectNode();
        assertEquals("", resultNode.get("description").asText());
        assertEquals(1, resultNode.get("totalNumMatchingAnnotations").asInt());
    }

    @Test
    public void testToObjectNodeWithNoMatchingAnnotations() {
        // Sample data for EntityMetadata with null description
        EntityMetadata metadata = new EntityMetadata(
                "http://example.com/entity/2",
                "EntityName2",
                List.of("TypeA", "TypeB"),
                null,
                Map.of("sourceA", "valueA"),
                List.of("keywordA"),
                List.of()
        );
        ObjectNode resultNode = metadata.toObjectNode();
        assertEquals("", resultNode.get("description").asText());
        assertEquals(0, resultNode.get("totalNumMatchingAnnotations").asInt());
    }
}
