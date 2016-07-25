package org.matonto.jaas.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.Response;

@Path("/groups")
@Api( value = "/groups")
public interface GroupsRest {
    @GET
    @RolesAllowed("user")
    @ApiOperation("List all MatOnto groups")
    Response listGroups();

    @POST
    @RolesAllowed("user")
    @ApiOperation("Create a new MatOnto group")
    Response createGroup(@QueryParam("name") String groupName);

    @GET
    @Path("/{groupId}")
    @RolesAllowed("user")
    @ApiOperation("Get a single MatOnto group")
    Response getGroup(@PathParam("groupId") String groupName);

    @PUT
    @Path("/{groupId}")
    @RolesAllowed("user")
    @ApiOperation("Update a MatOnto group's information")
    Response updateGroup(@PathParam("groupId") String groupName);

    @DELETE
    @Path("/{groupId}")
    @RolesAllowed("user")
    @ApiOperation("Remove a MatOnto group")
    Response deleteGroup(@PathParam("groupId") String groupName);

    @GET
    @Path("/{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("List roles of a MatOnto group")
    Response getGroupRoles(@PathParam("groupId") String groupName);

    @PUT
    @Path("/{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Add role to a MatOnto group")
    Response addGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);

    @DELETE
    @Path("/{groupId}/roles")
    @RolesAllowed("admin")
    @ApiOperation("Remove role from a MatOnto group")
    Response removeGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role);
}
