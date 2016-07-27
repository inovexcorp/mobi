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
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngineFactory;
import org.matonto.jaas.rest.UsersRest;
import org.matonto.rest.util.ErrorUtils;

import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component(immediate = true)
public class UsersRestImpl implements UsersRest {
    protected JaasRealm realm;
    protected BackingEngine engine;

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Activate
    protected void start(Map<String, Object> props) {
        AppConfigurationEntry[] entries = realm.getEntries();
        engine = new TokenBackingEngineFactory().build(entries[1].getOptions());
    }

    @Override
    public Response listUsers() {
        JSONArray users = new JSONArray();
        engine.listUsers().stream()
                .map(UserPrincipal::getName)
                .forEach(users::add);

        return Response.status(200).entity(users.toString()).build();
    }

    @Override
    public Response createUser(String username, String password) {
        engine.addUser(username, password);

        return Response.ok().build();
    }

    @Override
    public Response getUser(String username) {
        Optional<UserPrincipal> optUser = findUser(username);
        if (!optUser.isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        return Response.status(200).entity(optUser.get().getName()).build();
    }

    @Override
    public Response updateUser(String username, String newUsername, String newPassword) {
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));

        List<GroupPrincipal> groups = new ArrayList<>();
        List<RolePrincipal> roles = new ArrayList<>();
        if (newUsername != null) {
            groups.addAll(engine.listGroups(user));
            roles.addAll(engine.listRoles(user));
            engine.deleteUser(username);
        }

        engine.addUser(newUsername != null ? newUsername : username, newPassword);

        if (newUsername != null) {
            for (GroupPrincipal group : groups) {
                engine.addGroup(newUsername, group.getName());
            }
            for (RolePrincipal role : roles) {
                engine.addRole(newUsername, role.getName());
            }
        }

        return Response.ok().build();
    }

    @Override
    public Response deleteUser(String username) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        engine.deleteUser(username);

        return Response.ok().build();
    }

    @Override
    public Response getUserRoles(String username) {
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));
        JSONArray roles = new JSONArray();
        engine.listRoles(user).stream()
                .map(RolePrincipal::getName)
                .forEach(roles::add);

        return Response.status(200).entity(roles.toString()).build();
    }

    @Override
    public Response addUserRole(String username, String role) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        engine.addRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        engine.deleteRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response listUserGroups(String username) {
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST));
        JSONArray groups = new JSONArray();
        engine.listGroups(user).stream()
                .map(GroupPrincipal::getName)
                .forEach(groups::add);

        return Response.status(200).entity(groups.toString()).build();
    }

    @Override
    public Response addUserGroup(String username, String group) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        engine.addGroup(username, group);
        return Response.ok().build();
    }

    @Override
    public Response removeUserGroup(String username, String group) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User not found", Response.Status.BAD_REQUEST);
        }
        engine.deleteGroup(username, group);
        return Response.ok().build();
    }

    private Optional<UserPrincipal> findUser(String username) {
        List<UserPrincipal> users = engine.listUsers();
        for (UserPrincipal prin : users) {
            if (prin.getName().equals(username)) {
                return Optional.of(prin);
            }
        }
        return Optional.empty();
    }
}
