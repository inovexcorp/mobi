package org.matonto.jaas.rest.impl;

import aQute.bnd.annotation.component.Component;
import org.matonto.jaas.modules.token.TokenBackingEngine;
import org.matonto.jaas.rest.UsersRest;

import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class UsersRestImpl implements UsersRest {

    @Override
    public Response listUsers() {
        return null;
    }

    @Override
    public Response createUser(@QueryParam("username") String username, @QueryParam("password") String password) {
        return null;
    }

    @Override
    public Response getUser(@PathParam("userId") String username) {
        return null;
    }

    @Override
    public Response deleteUser(@PathParam("userId") String username) {
        return null;
    }

    @Override
    public Response addUserGroup(@PathParam("userId") String username, @QueryParam("group") String group) {
        return null;
    }

    @Override
    public Response getUserRoles(@PathParam("userId") String username) {
        return null;
    }

    @Override
    public Response addUserRole(@PathParam("userId") String username, @QueryParam("role") String role) {
        return null;
    }

    @Override
    public Response removeUserRole(@PathParam("userId") String username, @QueryParam("role") String role) {
        return null;
    }

    @Override
    public Response listUserGroups(@PathParam("userId") String username) {
        return null;
    }

    @Override
    public Response updateUser(@PathParam("userId") String username, @QueryParam("username") String newUsername, @QueryParam("password") String newPassword) {
        return null;
    }

    @Override
    public Response removeUserGroup(@PathParam("userId") String username, @QueryParam("role") String group) {
        return null;
    }
}
