package com.mobi.sse;

/*-
 * #%L
 * com.mobi.sse
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

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.rest.test.util.MobiRestTestCXF;
import org.junit.BeforeClass;
import org.junit.Test;
import org.osgi.service.event.Event;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.sse.SseEventSource;

public class SSERestTest extends MobiRestTestCXF {
    static SSERest rest;
    private static final ObjectMapper mapper = new ObjectMapper();

    @BeforeClass
    public static void startServer() throws Exception {
        rest = new SSERest();
        configureServer(rest, new com.mobi.rest.test.util.UsernameTestFilter());
    }

    @Test
    public void getEventStreamTest() {
        WebTarget target = target().path("sse-stream");
        try (SseEventSource eventSource = SseEventSource.target(target).build()) {
            AtomicReference<String> data = new AtomicReference<>("");
            eventSource.register(event -> data.set(event.readData()));
            eventSource.open();
            Thread.sleep(500);
            ObjectNode result = mapper.readValue(data.get(), ObjectNode.class);
            assertNotNull(result);
            assertTrue(result.has("start"));
        } catch (InterruptedException | JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    public void handleEventTest() {
        List<String> receivedEventData = new ArrayList<>();
        WebTarget target = target().path("sse-stream");
        try (SseEventSource eventSource = SseEventSource.target(target).build()) {
            eventSource.register(event -> receivedEventData.add(event.readData()));
            eventSource.open();
            Thread.sleep(500);

            String eventData = "{\"test\":true}";
            Map<String, Object> eventProps = new HashMap<>();
            eventProps.put(SSETopics.PROPERTY_TYPE, "test");
            eventProps.put(SSETopics.PROPERTY_DATA, eventData);
            Event osgiEvent = new Event(SSETopics.TOPIC_NAME, eventProps);
            rest.handleEvent(osgiEvent);
            Thread.sleep(500);

            assertEquals(2, receivedEventData.size());
            ObjectNode result = mapper.readValue(receivedEventData.get(receivedEventData.size() - 1), ObjectNode.class);
            assertNotNull(result);
            assertTrue(result.has("type") && result.get("type").textValue().equals("test"));
            assertTrue(result.has("data"));
            JsonNode data = result.get("data");
            assertNotNull(data);
            assertTrue(data.isObject());
            assertEquals(eventData, data.toString());
        } catch (InterruptedException | JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}
