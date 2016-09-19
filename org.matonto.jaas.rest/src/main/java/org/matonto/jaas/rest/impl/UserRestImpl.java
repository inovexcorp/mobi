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
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONArray;
import org.apache.karaf.jaas.boot.ProxyLoginModule;
import org.apache.karaf.jaas.boot.principal.GroupPrincipal;
import org.apache.karaf.jaas.boot.principal.RolePrincipal;
import org.apache.karaf.jaas.boot.principal.UserPrincipal;
import org.apache.karaf.jaas.config.JaasRealm;
import org.apache.karaf.jaas.modules.BackingEngine;
import org.apache.karaf.jaas.modules.BackingEngineFactory;
import org.matonto.jaas.rest.UserRest;
import org.matonto.jaas.utils.TokenUtils;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.web.security.util.RestSecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.security.auth.Subject;
import javax.security.auth.login.AppConfigurationEntry;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;
import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component(immediate = true)
public class UserRestImpl implements UserRest {
    protected JaasRealm realm;
    protected Map<String, BackingEngineFactory> engineFactories = new HashMap<>();
    protected BackingEngine engine;
    private final Logger logger = LoggerFactory.getLogger(UserRestImpl.class);
    static final String TOKEN_MODULE = "org.matonto.jaas.modules.token.TokenLoginModule";

    @Reference(target = "(realmId=matonto)")
    protected void setRealm(JaasRealm realm) {
        this.realm = realm;
    }

    @Reference(type = '*', dynamic = true)
    protected void addEngineFactory(BackingEngineFactory engineFactory) {
        this.engineFactories.put(engineFactory.getModuleClass(), engineFactory);
    }

    protected void removeEngineFactory(BackingEngineFactory engineFactory) {
        this.engineFactories.remove(engineFactory.getModuleClass());
    }

    @Activate
    protected void start() {
        // Get ApplicationConfigEntry
        AppConfigurationEntry entry = null;
        for (AppConfigurationEntry configEntry : realm.getEntries()) {
            if (configEntry.getOptions().get(ProxyLoginModule.PROPERTY_MODULE).equals(TOKEN_MODULE)) {
                entry = configEntry;
                break;
            }
        }

        if (entry == null) throw new IllegalStateException("TokenLoginModule not registered with realm.");

        // Get TokenBackingEngineFactory
        BackingEngineFactory engineFactory;
        if (engineFactories.containsKey(TOKEN_MODULE)) {
            engineFactory = engineFactories.get(TOKEN_MODULE);
        } else {
            throw new IllegalStateException("Cannot find BackingEngineFactory service for TokenLoginModule.");
        }

        engine = engineFactory.build(entry.getOptions());
    }

    @Modified
    protected void update() {
        start();
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
        if (username == null || password == null) {
            throw ErrorUtils.sendError("Both a username and password must be provided", Response.Status.BAD_REQUEST);
        }

        if (findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User already exists", Response.Status.BAD_REQUEST);
        }

        engine.addUser(username, password);
        logger.info("Created user " + username);
        return Response.ok().build();
    }

    @Override
    public Response getUser(String username) {
        UserPrincipal user = findUser(username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        return Response.status(200).entity(user.getName()).build();
    }

    @Override
    public Response updateUser(ContainerRequestContext context, String currentUsername, String currentPassword,
                               String newUsername, String newPassword) {
        if (currentUsername == null || currentPassword == null) {
            throw ErrorUtils.sendError("Both currentUsername and currentPassword must be provided",
                    Response.Status.BAD_REQUEST);
        }

        if (!isAuthorizedUser(context, currentUsername)) {
            throw ErrorUtils.sendError("User is not authorized to make this request with these parameters",
                    Response.Status.FORBIDDEN);
        }

        if (!validPassword(currentUsername, currentPassword)) {
            throw ErrorUtils.sendError("Invalid password", Response.Status.UNAUTHORIZED);
        }

        UserPrincipal user = findUser(currentUsername).orElseThrow(() ->
                ErrorUtils.sendError("User " + currentUsername + " not found", Response.Status.BAD_REQUEST));

        // If changing username, get current groups and roles then delete user
        List<GroupPrincipal> groups = new ArrayList<>();
        List<RolePrincipal> roles = new ArrayList<>();
        if (newUsername != null) {
            groups.addAll(engine.listGroups(user));
            roles.addAll(engine.listRoles(user));
            engine.deleteUser(currentUsername);
        }

        // Add the new user and/or update the password
        String username = newUsername == null ? currentUsername : newUsername;
        String password = newPassword == null ? currentPassword : newPassword;
        engine.addUser(username, password);

        // If changing username, add previous groups and roles
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
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }

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
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }

        UserPrincipal user = findUser(username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

        JSONArray roles = new JSONArray();
        engine.listRoles(user).stream()
                .map(RolePrincipal::getName)
                .forEach(roles::add);

        return Response.status(200).entity(roles.toString()).build();
    }

    @Override
    public Response addUserRole(String username, String role) {
        if (username == null || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Adding role " + role + " to user " + username);
        engine.addRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (username == null || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Removing role " + role + " from user " + username);
        engine.deleteRole(username, role);
        return Response.ok().build();
    }

    @Override
    public Response listUserGroups(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }

        UserPrincipal user = findUser(username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

        logger.info("Listing groups for " + username);
        JSONArray groups = new JSONArray();
        engine.listGroups(user).stream()
                .map(GroupPrincipal::getName)
                .forEach(groups::add);

        return Response.status(200).entity(groups.toString()).build();
    }

    @Override
    public Response addUserGroup(String username, String group) {
        if (username == null || group == null) {
            throw ErrorUtils.sendError("Both username and group must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Adding user " + username + " to group " + group);
        engine.addGroup(username, group);
        return Response.ok().build();
    }

    @Override
    public Response removeUserGroup(String username, String group) {
        if (username == null || group == null) {
            throw ErrorUtils.sendError("Both username and group must be provided", Response.Status.BAD_REQUEST);
        }

        if (!findUser(username).isPresent()) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        logger.info("Removing user " + username + " from group " + group);
        engine.deleteGroup(username, group);
        return Response.ok().build();
    }

    /**
     * Checks if the user is authorized to make this request. Returns true if the requesting user matches username or
     * if the requesting user is an admin.
     *
     * @param context The request context
     * @param username The required username if the user is not an admin
     * @return true if an only if the user is an admin or matches username
     */
    boolean isAuthorizedUser(ContainerRequestContext context, String username) {
        Subject subject = new Subject();
        String tokenString = TokenUtils.getTokenString(context);

        if (!RestSecurityUtils.authenticateToken(realm.getName(), subject, tokenString)) {
            return false;
        }

        String USER_CLASS = "org.apache.karaf.jaas.boot.principal.UserPrincipal";
        String ROLE_CLASS = "org.apache.karaf.jaas.boot.principal.RolePrincipal";

        String user = "";
        Set<String> roles = new HashSet<>();

        // TODO: Make util method for this
        for (Principal principal : subject.getPrincipals()) {
            if (principal.getClass().getName().equals(USER_CLASS)) {
                user = principal.getName();
            } else if (principal.getClass().getName().equals(ROLE_CLASS)) {
                roles.add(principal.getName());
            }
        }

        return user.equals(username) || roles.contains("admin");
    }

    /**
     * Authenticates the username with the password.
     * @param username the username to authenticate
     * @param password the password with which to authenticate
     * @return true if an only if the password authenticates the user
     */
    boolean validPassword(String username, String password) {
        Subject subject = new Subject();
        String realmName = realm.getName();

        return RestSecurityUtils.authenticateUser(realmName, subject, username, password);
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
