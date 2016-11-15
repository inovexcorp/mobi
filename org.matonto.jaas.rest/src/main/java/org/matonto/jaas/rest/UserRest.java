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

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.matonto.jaas.api.ontologies.usermanagement.User;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/users")
@Api( value = "/users")
public interface UserRest {
    /**
     * Retrieves the list of users in MatOnto.
     *
     * @return a Response with a JSON array of the users in MatOnto
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get list of MatOnto users")
    Response listUsers();

    /**
     * Creates a user in MatOnto with the passed username and password. Both are required in order
     * to create the user.
     *
     * @param user the new user to create
     * @param password the password for the new user
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a MatOnto user account")
    @Consumes(MediaType.APPLICATION_JSON)
    Response createUser(User user,
                        @QueryParam("password") String password);

    /**
     * Retrieves the specified user in MatOnto.
     *
     * @param username the username of the user to retrieve
     * @return a Response with a JSON representation of the specified user in MatOnto
     */
    @GET
    @Path("{username}")
    @RolesAllowed("admin")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get a single MatOnto user")
    @JsonSerialize
    Response getUser(@PathParam("username") String username);

    /**
     * Updates the information of the specified user in MatOnto. Only the user being updated or an admin can make
     * this request.
     *
     * @param context the context of the request
     * @param username the current username of the user to update
     * @param currentPassword the current password of the user to update

     * @param newPassword a new password for the user
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}")
    @RolesAllowed("user")
    @ApiOperation("Update a MatOnto user's information")
    @Consumes(MediaType.APPLICATION_JSON)
    Response updateUser(@Context ContainerRequestContext context,
                        @PathParam("username") String username,
                        @QueryParam("currentPassword") String currentPassword,
                        @DefaultValue("") @QueryParam("newPassword") String newPassword,
                        User newUser);

    /**
     * Removes the specified user from MatOnto. Only the user being deleted or an admin
     * can make this request.
     *
     * @param context the context of the request
     * @param username the username of the user to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}")
    @RolesAllowed("user")
    @ApiOperation("Remove a MatOnto user's account")
    Response deleteUser(@Context ContainerRequestContext context,
                        @PathParam("username") String username);

    /**
     * Retrieves the list of roles of a user in MatOnto. By default, this list only includes
     * roles directly set on the user itself. You can optionally include roles from the groups
     * the user is a part of.
     *
     * @param username the username of the user to retrieve roles from
     * @param includeGroups whether or not to include roles from the user's groups
     * @return a Response with a JSON array of the roles of the user in MatOnto
     */
    @GET
    @Path("{username}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List roles of a MatOnto user")
    Response getUserRoles(@PathParam("username") String username,
                          @DefaultValue("false") @QueryParam("includeGroups") boolean includeGroups);

    /**
     * Adds a role to the specified user in MatOnto.
     *
     * @param username the username of the user to add a role to
     * @param role the role to add to the specified user
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add role to a MatOnto user")
    Response addUserRole(@PathParam("username") String username, @QueryParam("role") String role);

    /**
     * Removes a role from the specified user in MatOnto.
     *
     * @param username the username of the user to remove a role from
     * @param role the role to remove from the specified user
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto user")
    Response removeUserRole(@PathParam("username") String username, @QueryParam("role") String role);

    /**
     * Retrieves the list of groups a user is a member of in MatOnto.
     *
     * @param username the username to retrieve groups from
     * @return a Response with a JSON array of the groups the user is a part of in MatOnto
     */
    @GET
    @Path("{username}/groups")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List groups of a MatOnto user")
    Response listUserGroups(@PathParam("username") String username);

    /**
     * Adds the specified user to a group in MatOnto. If the group does not exist,
     * it will be created.
     *
     * @param username the username of the user to add to the group
     * @param groupTitle the title of the group to add the specified user to
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Add a MatOnto user to a group")
    Response addUserGroup(@PathParam("username") String username, @QueryParam("group") String groupTitle);

    /**
     * Removes the specified user from a group in MatOnto. If this is the only user in the
     * group, the group will be removed as well.
     *
     * @param username the username of the user to remove from a group
     * @param groupTitle the title of the group to remove the specified user from
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto user from a group")
    Response removeUserGroup(@PathParam("username") String username, @QueryParam("group") String groupTitle);
}
