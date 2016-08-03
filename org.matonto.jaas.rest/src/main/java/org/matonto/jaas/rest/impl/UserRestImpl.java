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
import com.nimbusds.jwt.SignedJWT;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngine;
import org.matonto.jaas.modules.token.TokenBackingEngineFactory;
import org.matonto.jaas.rest.UserRest;
import org.matonto.jaas.utils.TokenUtils;
import org.matonto.rest.util.ErrorUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class UserRestImpl implements UserRest {
    protected JaasRealm realm;
    protected TokenBackingEngine engine;
    private final Logger logger = LoggerFactory.getLogger(UserRestImpl.class);

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Activate
    protected void start() {
        AppConfigurationEntry[] entries = realm.getEntries();
        BackingEngine be = getFactory().build(entries[1].getOptions());
        if (be instanceof TokenBackingEngine) {
            engine = (TokenBackingEngine) be;
        }
    }

    protected TokenBackingEngineFactory getFactory() {
        return new TokenBackingEngineFactory();
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
        if (findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User already exists", Response.Status.BAD_REQUEST);
        }

        if (username == null || password == null) {
            throw ErrorUtils.sendError("Both a username and password must be provided", Response.Status.BAD_REQUEST);
        }

        engine.addUser(username, password);
        logger.info("Created user " + username);
        return Response.ok().build();
    }

    @Override
    public Response getUser(String username) {
        Optional<UserPrincipal> optUser = findUser(username);
        if (!optUser.isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        return Response.status(200).entity(optUser.get().getName()).build();
    }

    @Override
    public Response updateUser(ContainerRequestContext context, String username, String newUsername, String newPassword) {
        if (!isAuthorizedUser(context, username)) {
            throw ErrorUtils.sendError("Not authorized", Response.Status.UNAUTHORIZED);
        }
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

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
    public Response deleteUser(ContainerRequestContext context, String username) {
        if (!isAuthorizedUser(context, username)) {
            throw ErrorUtils.sendError("Not authorized", Response.Status.UNAUTHORIZED);
        }
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        engine.deleteUser(username);
        logger.info("Deleted user " + username);
        return Response.ok().build();
    }

    @Override
    public Response getUserRoles(String username) {
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        JSONArray roles = new JSONArray();
        engine.listRoles(user).stream()
                .map(RolePrincipal::getName)
                .forEach(roles::add);

        return Response.status(200).entity(roles.toString()).build();
    }

    @Override
    public Response addUserRole(String username, String role) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        logger.info("Adding role " + role + " to user " + username);
        engine.addRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        logger.info("Removing role " + role + " from user " + username);
        engine.deleteRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response listUserGroups(String username) {
        UserPrincipal user = findUser(username)
                .orElseThrow(() -> ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

        logger.info("Listing groups for " + username);
        JSONArray groups = new JSONArray();
        engine.listGroups(user).stream()
                .map(GroupPrincipal::getName)
                .forEach(groups::add);

        return Response.status(200).entity(groups.toString()).build();
    }

    @Override
    public Response addUserGroup(String username, String group) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        logger.info("Adding user " + username + " to group " + group);
        engine.addGroup(username, group);
        return Response.ok().build();
    }

    @Override
    public Response removeUserGroup(String username, String group) {
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        logger.info("Removing user " + username + " from group " + group);
        engine.deleteGroup(username, group);
        return Response.ok().build();
    }

    @Override
    public Response checkPassword(ContainerRequestContext context, String username, String password) {
        if (!isAuthorizedUser(context, username)) {
            throw ErrorUtils.sendError("Not authorized", Response.Status.UNAUTHORIZED);
        }
        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }
        boolean result = engine.checkPassword(username, password);
        return Response.status(200).entity(result).build();
    }

    private boolean isAuthorizedUser(ContainerRequestContext context, String username) {
        try {
            Optional<SignedJWT> optional = TokenUtils.verifyToken(TokenUtils.getTokenString(context));
            if (optional.isPresent()) {
                JSONObject payload = JSONObject.fromObject(optional.get().getPayload().toString());
                logger.info("Payload " + payload);
                if (!payload.get("sub").equals(username) && !context.getSecurityContext().isUserInRole("admin")) {
                    return false;
                }
            }
        } catch (Exception e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }

        return true;
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
