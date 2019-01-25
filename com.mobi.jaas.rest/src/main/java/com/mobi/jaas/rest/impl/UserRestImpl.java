package com.mobi.jaas.rest.impl;

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

import static com.mobi.rest.util.RestUtils.getActiveUsername;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.config.MobiConfiguration;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.rest.UserRest;
import com.mobi.ontologies.foaf.Agent;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class UserRestImpl implements UserRest {
    private EngineManager engineManager;
    private ValueFactory vf;
    private ModelFactory mf;
    private SesameTransformer transformer;
    private MobiConfiguration mobiConfiguration;
    private Engine rdfEngine;
    private final Logger logger = LoggerFactory.getLogger(UserRestImpl.class);

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setModelFactory(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setMobiConfiguration(MobiConfiguration configuration) {
        this.mobiConfiguration = configuration;
    }

    @Reference(target = "(engineName=RdfEngine)")
    void setRdfEngine(Engine engine) {
        this.rdfEngine = engine;
    }

    @Override
    public Response getUsers() {
        try {
            Set<User> users = engineManager.getUsers(rdfEngine.getEngineName());
            JSONArray result = JSONArray.fromObject(users.stream()
                    .map(user -> {
                        Model filteredUser = mf.createModel();
                        user.clearPassword();
                        filteredUser.addAll(user.getModel().filter(user.getResource(), null, null));
                        return filteredUser;
                    })
                    .map(userModel -> modelToJsonld(userModel, transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createUser(User user, String password) {
        if (password == null) {
            throw ErrorUtils.sendError("Password must be provided", Response.Status.BAD_REQUEST);
        }
        Value username = user.getUsername().orElseThrow(() ->
                ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST));
        if (engineManager.userExists(username.stringValue())) {
            throw ErrorUtils.sendError("User already exists", Response.Status.BAD_REQUEST);
        }

        User tempUser = engineManager.createUser(rdfEngine.getEngineName(),
                new UserConfig.Builder("", password, new HashSet<>()).build());
        user.setPassword(tempUser.getPassword().get());
        engineManager.storeUser(rdfEngine.getEngineName(), user);
        logger.info("Created user " + username.stringValue());
        return Response.status(201).entity(username.stringValue()).build();
    }

    @Override
    public Response getUser(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        User user = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.NOT_FOUND));
        return Response.status(200).entity(user).build();
    }

    @Override
    public Response updateUser(ContainerRequestContext context, String username, User newUser) {
        if (username == null) {
            throw ErrorUtils.sendError("Current username must be provided",
                    Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(context, username);
        Value newUsername = newUser.getUsername().orElseThrow(() ->
                ErrorUtils.sendError("Username must be provided in new user", Response.Status.BAD_REQUEST));
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        if (!savedUser.getUsername().get().equals(newUsername)) {
            throw ErrorUtils.sendError("Usernames must match", Response.Status.BAD_REQUEST);
        }

        if (!savedUser.getHasUserRole().isEmpty()) {
            newUser.setHasUserRole(savedUser.getHasUserRole());
        }
        newUser.setPassword(savedUser.getPassword().get());

        engineManager.updateUser(rdfEngine.getEngineName(), newUser);
        return Response.ok().build();
    }

    @Override
    public Response changePassword(ContainerRequestContext context, String username, String currentPassword,
                                   String newPassword) {
        if (username == null) {
            throw ErrorUtils.sendError("Current username must be provided", Response.Status.BAD_REQUEST);
        }
        checkCurrentUser(getActiveUsername(context), username);
        if (currentPassword == null) {
            throw ErrorUtils.sendError("Current password must be provided", Response.Status.BAD_REQUEST);
        }
        if (!engineManager.checkPassword(rdfEngine.getEngineName(), username, currentPassword)) {
            throw ErrorUtils.sendError("Invalid password", Response.Status.UNAUTHORIZED);
        }
        if (newPassword == null) {
            throw ErrorUtils.sendError("New password must be provided", Response.Status.BAD_REQUEST);
        }
        return changePassword(username, newPassword);
    }

    @Override
    public Response resetPassword(ContainerRequestContext context, String username, String newPassword) {
        if (username == null) {
            throw ErrorUtils.sendError("Current username must be provided", Response.Status.BAD_REQUEST);
        }
        if (newPassword == null) {
            throw ErrorUtils.sendError("New password must be provided", Response.Status.BAD_REQUEST);
        }
        return changePassword(username, newPassword);
    }

    @Override
    public Response deleteUser(ContainerRequestContext context, String username) {
        if (username == null) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(context, username);
        if (!engineManager.userExists(username)) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        engineManager.deleteUser(rdfEngine.getEngineName(), username);
        logger.info("Deleted user " + username);
        return Response.ok().build();
    }

    @Override
    public Response getUserRoles(String username, boolean includeGroups) {
        if (username == null) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        User user = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Set<Role> roles = includeGroups ? engineManager.getUserRoles(rdfEngine.getEngineName(), username)
                : user.getHasUserRole();
        return Response.ok(new GenericEntity<Set<Role>>(roles) {}).build();
    }

    @Override
    public Response addUserRoles(String username, List<String> roles) {
        if (username == null || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both username and roles must be provided", Response.Status.BAD_REQUEST);
        }

        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Set<Role> roleObjs = new HashSet<>();
        roles.forEach(s -> roleObjs.add(engineManager.getRole(rdfEngine.getEngineName(), s).orElseThrow(() ->
                ErrorUtils.sendError("Role " + s + " not found", Response.Status.BAD_REQUEST))));
        Set<Role> allRoles = savedUser.getHasUserRole();
        allRoles.addAll(roleObjs);
        savedUser.setHasUserRole(allRoles);
        engineManager.updateUser(rdfEngine.getEngineName(), savedUser);
        logger.info("Role(s) " + String.join(", ", roles) + " added to user " + username);
        return Response.ok().build();
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (username == null || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Role roleObj = engineManager.getRole(rdfEngine.getEngineName(), role).orElseThrow(() ->
                ErrorUtils.sendError("Role " + role + " not found", Response.Status.BAD_REQUEST));
        savedUser.removeProperty(roleObj.getResource(), vf.createIRI(User.hasUserRole_IRI));
        engineManager.updateUser(rdfEngine.getEngineName(), savedUser);
        logger.info("Role " + role + " removed from user " + username);
        return Response.ok().build();
    }

    @Override
    public Response listUserGroups(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }

        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Set<Group> groups = engineManager.getGroups(rdfEngine.getEngineName()).stream()
                .filter(group -> {
                    Set<Agent> members = group.getMember();
                    return members.stream()
                        .map(Thing::getResource)
                        .anyMatch(resource -> resource.equals(savedUser.getResource()));
                })
                .collect(Collectors.toSet());

        return Response.status(200).entity(new GenericEntity<Set<Group>>(groups) {}).build();
    }

    @Override
    public Response addUserGroup(String username, String groupTitle) {
        if (username == null || groupTitle == null) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        Set<Agent> newMembers = savedGroup.getMember();
        newMembers.add(savedUser);
        savedGroup.setMember(newMembers);
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Added user " + username + " to group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response removeUserGroup(String username, String groupTitle) {
        if (username == null || groupTitle == null) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(savedUser.getResource(), vf.createIRI(Group.member_IRI));
        engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
        logger.info("Removed user " + username + " from group " + groupTitle);
        return Response.ok().build();
    }

    @Override
    public Response getUsername(String userIri) {
        String username = engineManager.getUsername(vf.createIRI(userIri)).orElseThrow(() ->
                ErrorUtils.sendError("User not found", Response.Status.NOT_FOUND));
        return Response.ok(username).build();
    }

    /**
     * Checks if the user is authorized to make this request. The requesting user must be an admin or have a matching
     * username.
     *
     * @param context The request context
     * @param username The required username if the user is not an admin
     */
    private void isAuthorizedUser(ContainerRequestContext context, String username) {
        String activeUsername = getActiveUsername(context);
        if (!engineManager.userExists(activeUsername)) {
            throw ErrorUtils.sendError("User not found", Response.Status.FORBIDDEN);
        }
        if (!isAdminUser(activeUsername) && !activeUsername.equals(username)) {
            throw ErrorUtils.sendError("Not authorized to make this request", Response.Status.FORBIDDEN);
        }
    }

    /**
     * Determines whether or not the User with the passed username is an admin.
     *
     * @param username The username of a User
     * @return true if the identified User is an admin; false otherwise
     */
    private boolean isAdminUser(String username) {
        return engineManager.getUserRoles(username).stream()
                .map(Thing::getResource)
                .anyMatch(resource -> resource.stringValue().contains("admin"));
    }

    /**
     * Checks whether the User with the passed username is the same as the User with the other passed
     * username.
     *
     * @param username The username of a User
     * @param currentUsername The username of another User
     */
    private void checkCurrentUser(String username, String currentUsername) {
        if (!username.equals(currentUsername)) {
            throw ErrorUtils.sendError("Not authorized to make this request", Response.Status.FORBIDDEN);
        }
    }

    /**
     * Changes the password of the User with the passed username to the passed new password. Returns a Response
     * if the update was successful.
     *
     * @param username The username of a User
     * @param newPassword The new password for the identified User
     * @return A Response indicating the success of the request
     */
    private Response changePassword(String username, String newPassword) {
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        User tempUser = engineManager.createUser(rdfEngine.getEngineName(),
                new UserConfig.Builder("", newPassword, new HashSet<>()).build());
        savedUser.setPassword(tempUser.getPassword().get());
        engineManager.updateUser(rdfEngine.getEngineName(), savedUser);
        return Response.ok().build();
    }
}
