package com.mobi.sse;

/*-
 * #%L
 * sse
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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.sse.OutboundSseEvent;
import javax.ws.rs.sse.Sse;
import javax.ws.rs.sse.SseBroadcaster;
import javax.ws.rs.sse.SseEventSink;

/**
 * OSGi JAX-RS REST class for the /sse-stream path. Also an OSGi EventHandler that subscribes to the SSE Mobi Topic.
 */
@Component(immediate = true,
        service = { SSERest.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=" + SSETopics.TOPIC_NAME
)
@JaxrsResource
@Path("/sse-stream")
public class SSERest implements EventHandler {
    /**
     * The singleton instance of ObjectMapper for JSON serialization/deserialization.
     */
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * Injected instance of Sse for Server-Sent Event construction.
     */
    @Context
    Sse sse;

    /**
     * Volatile SseBroadcaster instance for Server-Sent Event broadcasting.
     */
    private volatile SseBroadcaster broadcaster;

    /**
     * Shutdown method to close the SseBroadcaster if it exists.
     */
    @Deactivate
    protected void shutdown() {
        if (this.broadcaster != null) {
            this.broadcaster.close();
        }
    }

    /**
     * RESTful endpoint method to return Server-Sent Event stream.
     *
     * @param eventSink Instance of SseEventSink for sending Server-Sent Events.
     */
    @GET
    @Produces("text/event-stream")
    @RolesAllowed("user")
    public void getEventStream(@Context SseEventSink eventSink) {
        if (this.broadcaster == null) {
            this.broadcaster = this.sse.newBroadcaster();
        }
        eventSink.send(buildStarterEvent());
        this.broadcaster.register(eventSink);
    }

    /**
     * Event handler method to handle OSGi events and broadcast Server-Sent Events.
     *
     * @param event The incoming OSGi event.
     */
    @Override
    public void handleEvent(Event event) {
        if (this.broadcaster == null) {
            this.broadcaster = this.sse.newBroadcaster();
        }
        try {
            OutboundSseEvent outboundSseEvent = buildEvent(event);
            this.broadcaster.broadcast(outboundSseEvent);
        } catch (Exception ex) {
            throw new MobiException("Error creating Server-Sent Event", ex);
        }
    }

    /**
     * Builder method to construct the Server-Sent Event starter message.
     *
     * @return An OutboundSseEvent instance representing the Server-Sent Event starter message.
     */
    private OutboundSseEvent buildStarterEvent() {
        return sse.newEventBuilder()
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .data("{\"start\": true}")
                .build();
    }

    /**
     * Builder method to construct a Server-Sent Event message based on an incoming OSGi event. Expects the OSGi event
     * to have properties for the string TYPE and the JSON string of DATA to send in the Server-Sent Event.
     *
     * @param event The incoming OSGi event.
     * @return An OutboundSseEvent instance representing the Server-Sent Event message.
     * @throws Exception If an error occurs during event data processing.
     */
    private OutboundSseEvent buildEvent(Event event) throws Exception {
        String type = event.getProperty(SSETopics.PROPERTY_TYPE).toString();
        String data = event.getProperty(SSETopics.PROPERTY_DATA).toString();
        ObjectNode messageData = mapper.createObjectNode()
                .put("type", type)
                .set("data", mapper.readValue(data, JsonNode.class));
        return sse.newEventBuilder()
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .data(messageData.toString())
                .build();
    }
}
