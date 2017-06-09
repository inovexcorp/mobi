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
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.List;

@Path("/groups")
@Api( value = "/groups")
public interface GroupRest {
    /**
     * Retrieves the list of groups in MatOnto.
     *
     * @return a Response with a JSON array of the groups in MatOnto
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List all MatOnto groups")
    Response listGroups();

    /**
     * Creates a group in MatOnto with the passed information.
     *
     * @param group the new group to create
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a new MatOnto group")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.APPLICATION_JSON)
    Response createGroup(Group group);

    /**
     * Retrieves a specific group in MatOnto.
     *
     * @param groupTitle the title of the group to retrieve
     * @return a Response with a JSON representation of the group in MatOnto
     */
    @GET
    @Path("{groupTitle}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get a single MatOnto group")
    Response getGroup(@PathParam("groupTitle") String groupTitle);

    /**
     * Updates information about the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to update
     * @param newGroup the new group to replace the existing one
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @ApiOperation("Update a MatOnto group's information")
    @Consumes(MediaType.APPLICATION_JSON)
    Response updateGroup(@PathParam("groupTitle") String groupTitle, Group newGroup);

    /**
     * Removes a group from MatOnto, and by consequence removing all users from it as well.
     *
     * @param groupTitle the title of the group to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto group")
    Response deleteGroup(@PathParam("groupTitle") String groupTitle);

    /**
     * Retrieves the list of roles of the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to retrieve roles from
     * @return a Response with a JSON array of the roles of the group in MatOnto
     */
    @GET
    @Path("{groupTitle}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List roles of a MatOnto group")
    Response getGroupRoles(@PathParam("groupTitle") String groupTitle);

    /**
     * Adds roles to the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to add a role to
     * @param roles the name of the roles to add to the specified group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add roles to a MatOnto group")
    Response addGroupRoles(@PathParam("groupTitle") String groupTitle, @QueryParam("roles") List<String> roles);

    /**
     * Removes a role from the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to remove a role from
     * @param role the role to remove from the specified group
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto group")
    Response removeGroupRole(@PathParam("groupTitle") String groupTitle, @QueryParam("role") String role);

    /**
     * Retrieves the list of users for the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to retrieve users from
     * @return a Response with a JSON array of the users of the group in MatOnto
     */
    @GET
    @Path("{groupTitle}/users")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List users of a MatOnto group")
    Response getGroupUsers(@PathParam("groupTitle") String groupTitle);

    /**
     * Adds the users specified by usernames to the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to add users to
     * @param usernames the list of usernames of users to add to the group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @ApiOperation("Add a MatOnto User to a Group")
    Response addGroupUser(@PathParam("groupTitle") String groupTitle, @QueryParam("users") List<String> usernames);

    /**
     * Removes the user specified by username from the specified group in MatOnto.
     *
     * @param groupTitle the title of the group to remove a user from
     * @param username the username of the user to remove from the group
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto User from a Group")
    Response removeGroupUser(@PathParam("groupTitle") String groupTitle, @QueryParam("user") String username);
}
