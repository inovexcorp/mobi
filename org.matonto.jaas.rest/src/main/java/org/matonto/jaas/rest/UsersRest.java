package org.matonto.jaas.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;

@Path("/users")
@Api( value = "/users")
public interface UsersRest {
    @GET
    @RolesAllowed("admin")
    @ApiOperation("Get list of MatOnto users")
    Response listUsers();

    @POST
    @RolesAllowed("admin")
    @ApiOperation("Create a MatOnto user account")
    Response createUser(@QueryParam("username") String username, @QueryParam("password") String password);

    @GET
    @Path("/{userId}")
    @RolesAllowed("admin")
    @ApiOperation("Get a single MatOnto user")
    Response getUser(@PathParam("userId") String username);

    @PUT
    @Path("/{userId}")
    @RolesAllowed("admin")
    @ApiOperation("Update a MatOnto user's information")
    Response updateUser(@PathParam("userId") String username,
                        @QueryParam("username") String newUsername, @QueryParam("password") String newPassword);

    @DELETE
    @Path("/{userId}")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto user's account")
    Response deleteUser(@PathParam("userId") String username);

    @GET
    @Path("/{userId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("List roles of a MatOnto user")
    Response getUserRoles(@PathParam("userId") String username);

    @PUT
    @Path("/{userId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add role to a MatOnto user")
    Response addUserRole(@PathParam("userId") String username, @QueryParam("role") String role);

    @DELETE
    @Path("/{userId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto user")
    Response removeUserRole(@PathParam("userId") String username, @QueryParam("role") String role);

    @GET
    @Path("/{userId}/groups")
    @RolesAllowed("admin")
    @ApiOperation("List groups of a MatOnto user")
    Response listUserGroups(@PathParam("userId") String username);

    @PUT
    @Path("/{userId}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Add a MatOnto user to a group")
    Response addUserGroup(@PathParam("userId") String username, @QueryParam("group") String group);

    @DELETE
    @Path("/{userId}/groups")
    @RolesAllowed("admin")
    @ApiOperation("Remove a MatOnto user from a group")
    Response removeUserGroup(@PathParam("userId") String username, @QueryParam("role") String group);
}
