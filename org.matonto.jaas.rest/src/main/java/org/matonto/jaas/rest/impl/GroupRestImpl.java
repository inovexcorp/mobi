package org.matonto.jaas.rest.impl;

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

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngineFactory;
import org.matonto.jaas.rest.GroupRest;
import org.matonto.rest.util.ErrorUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class GroupRestImpl implements GroupRest {
    protected JaasRealm realm;
    protected BackingEngine engine;
    private final Logger logger = LoggerFactory.getLogger(GroupRestImpl.class);

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Activate
    protected void start() {
        AppConfigurationEntry[] entries = realm.getEntries();
        engine = getFactory().build(entries[1].getOptions());
    }

    protected TokenBackingEngineFactory getFactory() {
        return new TokenBackingEngineFactory();
    }

    @Override
    public Response listGroups() {
        JSONObject obj = new JSONObject();
        engine.listGroups().forEach((groupPrincipal, string) -> obj.put(groupPrincipal.getName(), string));
        return Response.status(200).entity(obj.toString()).build();
    }

    @Override
    public Response createGroup(String groupName) {
        if (findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group already exists", Response.Status.BAD_REQUEST);
        }

        if (groupName == null) {
            throw ErrorUtils.sendError("Group name must be provided", Response.Status.BAD_REQUEST);
        }

        engine.createGroup(groupName);
        logger.info("Created group " + groupName);
        return Response.ok().build();
    }

    @Override
    public Response getGroup(String groupName) {
        Map.Entry<GroupPrincipal, String> group = findGroup(groupName)
                .orElseThrow(() -> ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST));
        JSONObject obj = new JSONObject();
        obj.put("name", group.getKey().getName());
        obj.put("roles", JSONArray.fromObject(group.getValue().split(",")));
        return Response.status(200).entity(obj.toString()).build();
    }

    @Override
    public Response updateGroup(String groupName) {
        return Response.status(Response.Status.NOT_IMPLEMENTED).build();
    }

    @Override
    public Response deleteGroup(String groupName) {
        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        List<UserPrincipal> users = engine.listUsers();
        engine.listUsers().stream()
                .filter(userPrincipal -> isInGroup(userPrincipal, groupName))
                .map(UserPrincipal::getName)
                .forEach(user -> {
                    engine.deleteGroup(user, groupName);
                    logger.info("Deleting " + groupName + " from " + user);
                });
        logger.info("Deleted group " + groupName);

        return Response.ok().build();
    }

    @Override
    public Response getGroupRoles(String groupName) {
        Map.Entry<GroupPrincipal, String> group = findGroup(groupName)
                .orElseThrow(() -> ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST));
        JSONArray roles = JSONArray.fromObject(group.getValue().split(","));

        return Response.status(200).entity(roles.toString()).build();
    }

    @Override
    public Response addGroupRole(String groupName, String role) {
        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        engine.addGroupRole(groupName, role);
        return Response.ok().build();
    }

    @Override
    public Response removeGroupRole(String groupName, String role) {
        if (!findGroup(groupName).isPresent()) {
            throw ErrorUtils.sendError("Group not found", Response.Status.BAD_REQUEST);
        }

        engine.deleteGroupRole(groupName, role);
        return Response.ok().build();
    }

    private Optional<Map.Entry<GroupPrincipal, String>> findGroup(String groupName) {
        Map<GroupPrincipal, String> groups = engine.listGroups();
        for (Map.Entry<GroupPrincipal, String> group : groups.entrySet()) {
            if (group.getKey().getName().equals(groupName)) {
                return Optional.of(group);
            }
        }
        return Optional.empty();
    }

    private boolean isInGroup(UserPrincipal user, String groupName) {
        List<GroupPrincipal> groups = engine.listGroups(user);
        for (GroupPrincipal group : groups) {
            if (group.getName().equals(groupName)) {
                logger.info("User " + user.getName() + " is in " + groupName);
                return true;
            }
        }
        logger.info("User " + user.getName() + " is not in " + groupName);
        return false;
    }
}
