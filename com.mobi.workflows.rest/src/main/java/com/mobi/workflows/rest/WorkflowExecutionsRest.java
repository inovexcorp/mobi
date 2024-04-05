package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
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

import com.mobi.exception.MobiException;
import com.mobi.prov.api.ProvenanceService;
import com.mobi.workflows.api.WorkflowsTopics;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.QueryResults;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BasicWriterSettings;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.event.Event;
import org.osgi.service.event.EventConstants;
import org.osgi.service.event.EventHandler;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
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

@Component(immediate = true,
        service = { WorkflowExecutionsRest.class, EventHandler.class },
        property = EventConstants.EVENT_TOPIC + "=" + WorkflowsTopics.TOPIC_ACTIVITY_BASE + "/*"
)
@JaxrsResource
@Path("/workflow-executions")
public class WorkflowExecutionsRest implements EventHandler {

    @Reference
    ProvenanceService provService;

    @Context
    Sse sse;

    private volatile SseBroadcaster broadcaster;

    private static final String GET_EXECUTING_ACTIVITIES;

    static {
        try {
            GET_EXECUTING_ACTIVITIES = IOUtils.toString(Objects.requireNonNull(
                    WorkflowExecutionsRest.class.getResourceAsStream("/get_executing_activities.rq")),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Deactivate
    protected void shutdown() {
        if (this.broadcaster != null) {
            this.broadcaster.close();
        }
    }

    /**
     * Creates an SSE endpoint that provides Events containing a JSON-LD array of currently running
     * WorkflowExecutionActivity instances.
     *
     * @param eventSink The object to receive the executions events
     */
    @GET
    @Produces("text/event-stream")
    @RolesAllowed("user")
    public void executionsSse(@Context SseEventSink eventSink) {
        if (this.broadcaster == null) {
            this.broadcaster = this.sse.newBroadcaster();
        }
        eventSink.send(buildEvent());
        this.broadcaster.register(eventSink);
    }

    @Override
    public void handleEvent(Event event) {
        if (this.broadcaster == null) {
            this.broadcaster = this.sse.newBroadcaster();
        }
        this.broadcaster.broadcast(buildEvent());
    }

    private OutboundSseEvent buildEvent() {
        String result = collectExecutingActivities();
        return sse.newEventBuilder()
            .mediaType(MediaType.APPLICATION_JSON_TYPE)
            .data(result)
            .build();
    }

    private String collectExecutingActivities() {
        try (RepositoryConnection conn = provService.getConnection()) {
            GraphQuery query = conn.prepareGraphQuery(GET_EXECUTING_ACTIVITIES);
            Model results = QueryResults.asModel(query.evaluate());
            // JSON-LD is written without pretty printing because Event data needs to be a single line
            StringWriter sw = new StringWriter();
            RDFWriter writer = Rio.createWriter(RDFFormat.JSONLD, sw);
            writer.getWriterConfig().set(BasicWriterSettings.PRETTY_PRINT, false);
            Rio.write(results, new BufferedGroupingRDFHandler(writer));
            return sw.toString();
        }
    }
}
