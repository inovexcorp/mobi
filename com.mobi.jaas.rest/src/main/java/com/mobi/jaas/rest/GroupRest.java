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

import com.mobi.jaas.api.ontologies.usermanagement.Group;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;

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
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/groups")
@Api( value = "/groups")
public interface GroupRest {
    /**
     * Retrieves a list of all the {@link Group}s in Mobi.
     *
     * @return a Response with a JSON-LD list of the {@link Group}s in Mobi
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get all Mobi Groups")
    Response getGroups();

    /**
     * Creates a Group in Mobi with the passed information.
     *
     * @param title The title of the Group
     * @param description The description of the Group
     * @param roles The roles of the Group
     * @param members The members of the Group
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a new Mobi Group")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    Response createGroup(@FormDataParam("title") String title,
                         @FormDataParam("description") String description,
                         @FormDataParam("roles") List<FormDataBodyPart> roles,
                         @FormDataParam("members") List<FormDataBodyPart> members);

    /**
     * Retrieves a specific Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve
     * @return a Response with a JSON representation of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Get a single Mobi Group")
    Response getGroup(@PathParam("groupTitle") String groupTitle);

    /**
     * Updates information about the specified group in Mobi.
     *
     * @param groupTitle the title of the Group to update
     * @param newGroupStr the JSON-LD string representation of a Group to replace the existing Group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @ApiOperation("Update a Mobi Group's information")
    @Consumes(MediaType.APPLICATION_JSON)
    Response updateGroup(@PathParam("groupTitle") String groupTitle, String newGroupStr);

    /**
     * Removes a Group from Mobi, and by consequence removing all users from it as well.
     *
     * @param groupTitle the title of the Group to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @ApiOperation("Remove a Mobi Group")
    Response deleteGroup(@PathParam("groupTitle") String groupTitle);

    /**
     * Retrieves the list of roles of the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve roles from
     * @return a Response with a JSON array of the roles of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List roles of a Mobi Group")
    Response getGroupRoles(@PathParam("groupTitle") String groupTitle);

    /**
     * Adds roles to the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to add a role to
     * @param roles the name of the roles to add to the specified Group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add roles to a Mobi Group")
    Response addGroupRoles(@PathParam("groupTitle") String groupTitle, @QueryParam("roles") List<String> roles);

    /**
     * Removes a role from the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to remove a role from
     * @param role the role to remove from the specified Group
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a Mobi Group")
    Response removeGroupRole(@PathParam("groupTitle") String groupTitle, @QueryParam("role") String role);

    /**
     * Retrieves the list of users for the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve users from
     * @return a Response with a JSON array of the users of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}/users")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("List users of a Mobi Group")
    Response getGroupUsers(@PathParam("groupTitle") String groupTitle);

    /**
     * Adds the users specified by usernames to the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to add users to
     * @param usernames the list of usernames of users to add to the Group
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @ApiOperation("Add a Mobi User to a Group")
    Response addGroupUser(@PathParam("groupTitle") String groupTitle, @QueryParam("users") List<String> usernames);

    /**
     * Removes the user specified by username from the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to remove a user from
     * @param username the username of the user to remove from the Group
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @ApiOperation("Remove a Mobi User from a Group")
    Response removeGroupUser(@PathParam("groupTitle") String groupTitle, @QueryParam("user") String username);
}
