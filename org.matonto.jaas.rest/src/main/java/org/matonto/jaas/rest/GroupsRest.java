package org.matonto.jaas.rest;

/*-
 * #%L
 * org.matonto.jaas.rest
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

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;

@Path("/groups")
@Api( value = "/groups")
public interface GroupsRest {
    @GET
    @RolesAllowed("admin")
    @ApiOperation("List all MatOnto groups")
    Response listGroups();

    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a new MatOnto group")
    Response createGroup(@QueryParam("name") String groupName);

    @GET
    @Path("{groupId}")
    @RolesAllowed("admin")
    @ApiOperation("Get a single MatOnto group")
    Response getGroup(@PathParam("groupId") String groupName);

    @PUT
    @Path("{groupId}")
    @RolesAllowed("admin")
    @ApiOperation("Update a MatOnto group's information")
    Response updateGroup(@PathParam("groupId") String groupName);

    @DELETE
    @Path("{groupId}")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto group")
    Response deleteGroup(@PathParam("groupId") String groupName);

    @GET
    @Path("{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("List roles of a MatOnto group")
    Response getGroupRoles(@PathParam("groupId") String groupName);

    @PUT
    @Path("{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add role to a MatOnto group")
    Response addGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);

    @DELETE
    @Path("{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto group")
    Response removeGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);
}
