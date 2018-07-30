package com.mobi.security.policy.rest;


import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/user-access")
@Api(value = "/user-access")
public interface UserAccessRest {

    @GET
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves if a user is allowed to access.")
    Response userAccess(ContainerRequestContext context, String jsonRequest);
}
