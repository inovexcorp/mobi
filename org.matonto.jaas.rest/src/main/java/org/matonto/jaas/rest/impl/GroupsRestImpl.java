package org.matonto.jaas.rest.impl;

import org.matonto.jaas.rest.GroupsRest;

import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

public class GroupsRestImpl implements GroupsRest {
    @Override
    public Response listGroups() {
        return null;
    }

    @Override
    public Response createGroup(@QueryParam("name") String groupName) {
        return null;
    }

    @Override
    public Response getGroup(@PathParam("groupId") String groupName) {
        return null;
    }

    @Override
    public Response updateGroup(@PathParam("groupId") String groupName) {
        return null;
    }

    @Override
    public Response deleteGroup(@PathParam("groupId") String groupName) {
        return null;
    }

    @Override
    public Response getGroupRoles(@PathParam("groupId") String groupName) {
        return null;
    }

    @Override
    public Response addGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role) {
        return null;
    }

    @Override
    public Response removeGroupRole(@PathParam("groupId") String groupName, @QueryParam("role") String role) {
        return null;
    }
}
