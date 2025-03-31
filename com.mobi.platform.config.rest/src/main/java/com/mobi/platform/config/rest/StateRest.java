package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
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

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = StateRest.class, immediate = true)
@JaxrsResource
@Path("/states")
public class StateRest {
    protected StateManager stateManager;
    protected final ValueFactory factory = new ValidatingValueFactory();
    protected final ModelFactory modelFactory = new DynamicModelFactory();
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String NOT_ALLOWED = "Not allowed";

    @Reference
    protected void setStateManager(StateManager stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Retrieves a JSON array of the IDs and associated resources for all State for the User making the request
     * which match the passed criteria. Can filter by associated Application and by the IDs of associated resources.
     *
     * @param servletRequest the HttpServletRequest
     * @param applicationId the ID of the Application to filter State by
     * @param subjectIds a List of all the IDs of resources that should be associated with the States
     * @return a Response with an JSON array of the IDs and JSON-LD serialization of the resources for all States
     *      that match the passed criteria
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "states",
            summary = "Retrieves State for the User making the request based on filter criteria",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getStates(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of the Application to filter State by", required = true)
            @QueryParam("application") String applicationId,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "List of all the IDs of resources that should be "
                            + "associated with the States"),
                    schema = @Schema(implementation = String.class, description = "ID")))
            @QueryParam("subjects") List<String> subjectIds) {
        String username = RestUtils.getActiveUsername(servletRequest);
        Set<Resource> subjects = subjectIds.stream()
                .map(factory::createIRI)
                .collect(Collectors.toSet());
        try {
            Map<Resource, Model> results = stateManager.getStates(username, applicationId, subjects);
            ArrayNode array = mapper.createArrayNode();
            results.keySet().forEach(resource -> {
                ObjectNode state = mapper.createObjectNode();
                state.put("id", resource.stringValue());
                try {
                    state.set("model", mapper.readTree(convertModel(results.get(resource))));
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
                array.add(state);
            });
            return Response.ok(array.toString()).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new State for the User making the request using the passed JSON-LD to be associated with the new State.
     * Can pass the ID of an Application to be associated with the new State. Returns the ID of the new State.
     *
     * @param servletRequest the HttpServletRequest
     * @param applicationId the ID of the Application to associate the new State with
     * @param stateJson the JSON-LD of all resources to be linked to the new State
     * @return a Response with the ID of the new State
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "states",
            summary = "Creates a new State for the User making the request",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createState(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of the Application to associate the new State with", required = true)
            @QueryParam("application") String applicationId,
            @Parameter(description = "JSON-LD of all resources to be linked to the new State", required = true)
                    String stateJson) {
        String username = RestUtils.getActiveUsername(servletRequest);
        try {
            Model newState = Rio.parse(IOUtils.toInputStream(stateJson, StandardCharsets.UTF_8),
                    "", RDFFormat.JSONLD);
            if (newState.isEmpty()) {
                throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
            }
            Resource stateId = (applicationId == null) ? stateManager.storeState(newState, username)
                    : stateManager.storeState(newState, username, applicationId);
            return Response.status(201).entity(stateId.stringValue()).build();
        } catch (IOException ex) {
            throw ErrorUtils.sendError(ex, "Invalid JSON-LD", Response.Status.BAD_REQUEST);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves all resources associated with the State identified by ID. Will only retrieve the State if it belongs
     * to the User making the request; returns a 403 otherwise. If state cannot be found, returns a 400.
     *
     * @param servletRequest the HttpServletRequest
     * @param stateId the ID of the State to retrieve
     * @return a Response with the JSON-LD serialization of all resources associated with the specified State
     */
    @GET
    @Path("{stateId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "states",
            summary = "Retrieves State by ID as long it belongs to the User making the request",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "401", description = "Response indicating UNAUTHORIZED"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getState(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of the State to retrieve", required = true)
            @PathParam("stateId") String stateId) {
        String username = RestUtils.getActiveUsername(servletRequest);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError(NOT_ALLOWED, Response.Status.UNAUTHORIZED);
            }
            Model state = stateManager.getState(factory.createIRI(stateId));
            return Response.ok(convertModel(state)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the resources of the State identified by ID with the new statements passed as JSON-LD. Will only update
     * the State if it belongs to the User making the request; returns a 403 code otherwise. If state cannot be found,
     * returns a 400.
     *
     * @param servletRequest the HttpServletRequest
     * @param stateId the ID of the State to update
     * @param newStateJson the JSON-LD serialization of the new resources to associate with the State
     * @return a Response indicating the success of the request
     */
    @PUT
    @Path("{stateId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "states",
            summary = "Updates State as long as it belongs to the User making the request",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "401", description = "Response indicating UNAUTHORIZED"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response updateState(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of the State to update", required = true)
            @PathParam("stateId") String stateId,
            @Parameter(description = "JSON-LD serialization of the new resources to associate with the State",
                    required = true)
                    String newStateJson) {
        String username = RestUtils.getActiveUsername(servletRequest);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError(NOT_ALLOWED, Response.Status.UNAUTHORIZED);
            }
            Model newState = Rio.parse(
                    IOUtils.toInputStream(newStateJson, StandardCharsets.UTF_8), "", RDFFormat.JSONLD);
            if (newState.isEmpty()) {
                throw ErrorUtils.sendError("Empty state model", Response.Status.BAD_REQUEST);
            }
            stateManager.updateState(factory.createIRI(stateId), newState);
        } catch (IOException ex) {
            throw ErrorUtils.sendError(ex, "Invalid JSON-LD", Response.Status.BAD_REQUEST);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    /**
     * Removes the State identified by ID and all associated resources if not used by other States. Will only delete
     * the State if it belongs to the User making the request; returns a 403 code otherwise. If state cannot be found,
     * returns a 400.
     *
     * @param servletRequest the HttpServletRequest
     * @param stateId the ID of the State to remove
     * @return a Response indicating the success of the request
     */
    @DELETE
    @Path("{stateId}")
    @RolesAllowed("user")
    @Operation(
            tags = "states",
            summary = "Deletes State as long as it belongs to the User making the request",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Success"),
                    @ApiResponse(responseCode = "401", description = "Response indicating UNAUTHORIZED"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response deleteState(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of the State to remove", required = true)
            @PathParam("stateId") String stateId) {
        String username = RestUtils.getActiveUsername(servletRequest);
        try {
            if (!stateManager.stateExistsForUser(factory.createIRI(stateId), username)) {
                throw ErrorUtils.sendError(NOT_ALLOWED, Response.Status.UNAUTHORIZED);
            }
            stateManager.deleteState(factory.createIRI(stateId));
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.NOT_FOUND);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    private String convertModel(Model model) {
        return RestUtils.modelToJsonld(model);
    }
}
