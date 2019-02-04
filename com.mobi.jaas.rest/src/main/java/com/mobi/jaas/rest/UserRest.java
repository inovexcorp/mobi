package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
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

import com.mobi.jaas.api.ontologies.usermanagement.User;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
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

@Path("/users")
@Api( value = "/users")
public interface UserRest {
    /**
     * Retrieves a list of all the {@link User}s in Mobi.
     *
     * @return a Response with a JSON-LD list of the {@link User}s in Mobi
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get all Mobi Users")
    Response getUsers();

    /**
     * Creates a User in Mobi with the passed username and password. Both are required in order
     * to create the User.
     *
     * @param username the required username of the User to create
     * @param password the required password of the User to create
     * @param roles the roles of the User to create
     * @param firstName the optional first name of the User to create
     * @param lastName the optional last name of the User to create
     * @param email the optional email of the User to create
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a Mobi User account")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    Response createUser(@FormDataParam("username") String username,
                        @FormDataParam("password") String password,
                        @FormDataParam("roles") List<FormDataBodyPart> roles,
                        @FormDataParam("firstName") String firstName,
                        @FormDataParam("lastName") String lastName,
                        @FormDataParam("email") String email);

    /**
     * Retrieves the specified User in Mobi.
     *
     * @param username the username of the {@link User} to retrieve
     * @return a Response with a JSON representation of the specified User in Mobi
     */
    @GET
    @Path("{username}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get a single Mobi User")
    Response getUser(@PathParam("username") String username);

    /**
     * Updates the information of the specified User in Mobi. Only the User being updated or an admin can make
     * this request.
     *
     * @param context the context of the request
     * @param username the current username of the user to update
     * @param newUser a JSON-LD string representation of a User with the new information to update
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}")
    @RolesAllowed("user")
    @ApiOperation("Update a Mobi user's information")
    @Consumes(MediaType.APPLICATION_JSON)
    Response updateUser(@Context ContainerRequestContext context,
                        @PathParam("username") String username,
                        String newUser);

    /**
     * Resets the password of the specified User in Mobi. This action is only allowed by admin Users.
     *
     * @param context the context of the request
     * @param username the current username of the User to update
     * @param newPassword a new password for the User
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/password")
    @RolesAllowed("admin")
    @ApiOperation("Resets a Mobi User's password if User making request is the admin")
    Response resetPassword(@Context ContainerRequestContext context,
                           @PathParam("username") String username,
                           @QueryParam("newPassword") String newPassword);

    /**
     * Changes the password of the specified user in Mobi. In order to change the User's password,
     * the current password must be provided.
     *
     * @param context the context of the request
     * @param username the current username of the user to update
     * @param currentPassword the current password of the user to update
     * @param newPassword a new password for the user
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @Path("{username}/password")
    @RolesAllowed("user")
    @ApiOperation("Changes a Mobi User's password if it is the User making the request")
    Response changePassword(@Context ContainerRequestContext context,
                            @PathParam("username") String username,
                            @QueryParam("currentPassword") String currentPassword,
                            @QueryParam("newPassword") String newPassword);

    /**
     * Removes the specified User from Mobi. Only the User being deleted or an admin
     * can make this request.
     *
     * @param context the context of the request
     * @param username the username of the User to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}")
    @RolesAllowed("user")
    @ApiOperation("Remove a Mobi user's account")
    Response deleteUser(@Context ContainerRequestContext context,
                        @PathParam("username") String username);

    /**
     * Retrieves the list of roles of a User in Mobi. By default, this list only includes
     * roles directly set on the User itself. You can optionally include roles from the groups
     * the User is a part of.
     *
     * @param username the username of the User to retrieve roles from
     * @param includeGroups whether or not to include roles from the User's groups
     * @return a Response with a JSON array of the roles of the User in Mobi
     */
    @GET
    @Path("{username}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List roles of a Mobi User")
    Response getUserRoles(@PathParam("username") String username,
                          @DefaultValue("false") @QueryParam("includeGroups") boolean includeGroups);

    /**
     * Adds roles to the specified User in Mobi.
     *
     * @param username the username of the User to add a role to
     * @param roles the names of the roles to add to the specified User
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add roles to a Mobi User")
    Response addUserRoles(@PathParam("username") String username, @QueryParam("roles") List<String> roles);

    /**
     * Removes a role from the specified User in Mobi.
     *
     * @param username the username of the User to remove a role from
     * @param role the role to remove from the specified User
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a Mobi User")
    Response removeUserRole(@PathParam("username") String username, @QueryParam("role") String role);

    /**
     * Retrieves the list of groups a User is a member of in Mobi.
     *
     * @param username the username to retrieve groups from
     * @return a Response with a JSON array of the groups the User is a part of in Mobi
     */
    @GET
    @Path("{username}/groups")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List groups of a Mobi User")
    Response listUserGroups(@PathParam("username") String username);

    /**
     * Adds the specified User to a group in Mobi. If the group does not exist,
     * it will be created.
     *
     * @param username the username of the User to add to the group
     * @param groupTitle the title of the group to add the specified User to
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Add a Mobi user to a group")
    Response addUserGroup(@PathParam("username") String username, @QueryParam("group") String groupTitle);

    /**
     * Removes the specified User from a group in Mobi. If this is the only User in the
     * group, the group will be removed as well.
     *
     * @param username the username of the User to remove from a group
     * @param groupTitle the title of the group to remove the specified User from
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Remove a Mobi User from a group")
    Response removeUserGroup(@PathParam("username") String username, @QueryParam("group") String groupTitle);

    /**
     * Attempts to retrieve the username for the User associated with the passed User IRI. Returns a 404 if
     * a User with the passed IRI cannot be found.
     *
     * @param userIri the IRI to search for
     * @return a Response with the username of the User associated with the IRI
     */
    @GET
    @Path("username")
    @RolesAllowed("user")
    @Produces(MediaType.TEXT_PLAIN)
    @ApiOperation("Retrieve a username based on the passed User IRI")
    Response getUsername(@QueryParam("iri") String userIri);
}
