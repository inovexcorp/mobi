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

import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicWriterSettings;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventAdmin;

import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * A collection of utility methods for working with the centralized SSE endpoint for the application.
 */
public class SSEUtils {

    /**
     * Posts an OSGi event using the provided {@link EventAdmin} service that will be picked up by the centralized SSE
     * endpoint. The provided `type` and the JSON-LD of the provided Model will be set in the Server-Sent Event.
     *
     * @param eventAdmin The EventAdmin service to use to publish the OSGi event for the SSE endpoint to pick up
     * @param type The type to be sent in the Server-Sent Event for the consumer to determine what occurred in the
     *             backend to initiate the event
     * @param model The RDF Model to serialize in the Server-Sent Event
     */
    public static void postEvent(EventAdmin eventAdmin, String type, Model model) {
        StringWriter sw = new StringWriter();
        RDFWriter writer = Rio.createWriter(RDFFormat.JSONLD, sw);
        writer.getWriterConfig().set(BasicWriterSettings.PRETTY_PRINT, false);
        Rio.write(model, new BufferedGroupingRDFHandler(writer));
        Map<String, Object> eventProps = new HashMap<>();
        eventProps.put(SSETopics.PROPERTY_TYPE, type);
        eventProps.put(SSETopics.PROPERTY_DATA, sw.toString());
        Event event = new Event(SSETopics.TOPIC_NAME, eventProps);
        eventAdmin.postEvent(event);
    }
}
