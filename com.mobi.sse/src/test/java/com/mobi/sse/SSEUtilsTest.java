package com.mobi.sse;

/*-
 * #%L
 * com.mobi.sse
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

public class SSEUtilsTest {
    private AutoCloseable closeable;
    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    private static final ObjectMapper mapper = new ObjectMapper();
    @Mock
    EventAdmin eventAdmin;

    @Before
    public void setup() {
        closeable = MockitoAnnotations.openMocks(this);
    }

    @After
    public void reset() throws Exception {
        closeable.close();
    }

    @Test
    public void sendEventTest() throws Exception {
        Model model = mf.createEmptyModel();
        model.add(vf.createIRI("urn:test"), RDF.TYPE, vf.createIRI("urn:type"));
        model.add(vf.createIRI("urn:test"), RDFS.LABEL, vf.createLiteral("Label"));

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        SSEUtils.postEvent(eventAdmin, "EventType", model);
        verify(eventAdmin).postEvent(captor.capture());
        Event event = captor.getValue();
        assertEquals(SSETopics.TOPIC_NAME, event.getTopic());
        assertTrue(event.containsProperty(SSETopics.PROPERTY_TYPE));
        assertEquals("EventType", event.getProperty(SSETopics.PROPERTY_TYPE).toString());
        assertTrue(event.containsProperty(SSETopics.PROPERTY_DATA));
        ArrayNode arrayNode = mapper.readValue(event.getProperty(SSETopics.PROPERTY_DATA).toString(), ArrayNode.class);
        assertNotNull(arrayNode);
        assertEquals(1, arrayNode.size());
        JsonNode jsonNode = arrayNode.get(0);
        assertNotNull(jsonNode);
        assertTrue(jsonNode.isObject());
        ObjectNode objectNode = (ObjectNode) jsonNode;
        assertTrue(objectNode.has("@id") && objectNode.get("@id").textValue().equals("urn:test"));
        assertTrue(objectNode.has(RDFS.LABEL.stringValue()));
    }
}
