package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/states")
@Api(value = "/states")
public interface StateRest {
    /**
     * Retrieves a JSON array of the IDs and associated resources for all State for the User making the request
     * which match the passed criteria. Can filter by associated Application and by the IDs of associated resources.
     *
     * @param context the context of the request
     * @param applicationId the ID of the Application to filter State by
     * @param subjectIds a List of all the IDs of resources that should be associated with the States
     * @return a Response with an JSON array of the IDs and JSON-LD serialization of the resources for all States
     *      that match the passed criteria
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves State for the User making the request based on filter criteria")
    Response getStates(@Context ContainerRequestContext context,
                       @QueryParam("application") String applicationId,
                       @QueryParam("subjects") List<String> subjectIds);

    /**
     * Creates a new State for the User making the request using the passed JSON-LD to be associated with the new State.
     * Can pass the ID of an Application to be associated with the new State. Returns the ID of the new State.
     *
     * @param context the context of the request
     * @param applicationId the ID of the Application to associate the new State with
     * @param stateJson the JSON-LD of all resources to be linked to the new State
     * @return a Response with the ID of the new State
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Creates a new State for the User making the request")
    Response createState(@Context ContainerRequestContext context,
                         @QueryParam("application") String applicationId,
                         String stateJson);

    /**
     * Retrieves all resources associated with the State identified by ID. Will only retrieve the State if it belongs
     * to the User making the request; returns a 403 otherwise. If state cannot be found, returns a 400.
     *
     * @param context the context of the request
     * @param stateId the ID of the State to retrieve
     * @return a Response with the JSON-LD serialization of all resources associated with the specified State
     */
    @GET
    @Path("{stateId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves State by ID as long it belongs to the User making the request")
    Response getState(@Context ContainerRequestContext context, @PathParam("stateId") String stateId);

    /**
     * Updates the resources of the State identified by ID with the new statements passed as JSON-LD. Will only update
     * the State if it belongs to the User making the request; returns a 403 code otherwise. If state cannot be found,
     * returns a 400.
     *
     * @param context the context of the request
     * @param stateId the ID of the State to update
     * @param newStateJson the JSON-LD serialization of the new resources to associate with the State
     * @return a Response indicating the success of the request
     */
    @PUT
    @Path("{stateId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates State as long as it belongs to the User making the request")
    Response updateState(@Context ContainerRequestContext context,
                         @PathParam("stateId") String stateId,
                         String newStateJson);

    /**
     * Removes the State identified by ID and all associated resources if not used by other States. Will only delete
     * the State if it belongs to the User making the request; returns a 403 code otherwise. If state cannot be found,
     * returns a 400.
     *
     * @param context the context of the request
     * @param stateId the ID of the State to remove
     * @return a Response indicating the success of the request
     */
    @DELETE
    @Path("{stateId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes State as long as it belongs to the User making the request")
    Response deleteState(@Context ContainerRequestContext context, @PathParam("stateId") String stateId);
}
