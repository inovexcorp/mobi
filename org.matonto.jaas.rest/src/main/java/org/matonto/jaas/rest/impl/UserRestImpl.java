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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import org.matonto.jaas.api.config.MatontoConfiguration;
import org.matonto.jaas.api.engines.EngineManager;
import org.matonto.jaas.api.engines.GroupConfig;
import org.matonto.jaas.api.engines.UserConfig;
import org.matonto.jaas.api.ontologies.usermanagement.Group;
import org.matonto.jaas.api.ontologies.usermanagement.Role;
import org.matonto.jaas.api.ontologies.usermanagement.User;
import org.matonto.jaas.api.principals.UserPrincipal;
import org.matonto.jaas.api.utils.TokenUtils;
import org.matonto.jaas.rest.UserRest;
import org.matonto.ontologies.foaf.Agent;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.web.security.util.RestSecurityUtils;
import org.openrdf.model.vocabulary.DCTERMS;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.security.auth.Subject;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class UserRestImpl implements UserRest {
    protected EngineManager engineManager;
    protected ValueFactory factory;
    protected MatontoConfiguration matontoConfiguration;
    private final Logger logger = LoggerFactory.getLogger(UserRestImpl.class);
    private static final String RDF_ENGINE = "org.matonto.jaas.engines.RdfEngine";

    @Reference
    protected void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    protected void setFactory(ValueFactory factory) {
        this.factory = factory;
    }

    @Reference
    protected void setMatontoConfiguration(MatontoConfiguration configuration) {
        this.matontoConfiguration = configuration;
    }

    @Override
    public Response listUsers() {
        Set<String> usernames = engineManager.getUsers(RDF_ENGINE).stream()
                .map(User::getUsername)
                .filter(Optional::isPresent)
                .map(username -> username.get().stringValue())
                .collect(Collectors.toSet());

        return Response.status(200).entity(usernames).build();
    }

    @Override
    public Response createUser(String username, String password, String firstName, String lastName, String email) {
        if (username == null || password == null) {
            throw ErrorUtils.sendError("Both a username and password must be provided", Response.Status.BAD_REQUEST);
        }
        if (engineManager.userExists(username)) {
            throw ErrorUtils.sendError("User already exists", Response.Status.BAD_REQUEST);
        }

        UserConfig.Builder builder = new UserConfig.Builder(username, password, new HashSet<>());
        if (!firstName.isEmpty()) {
            builder = builder.firstName(firstName);
        }
        if (!lastName.isEmpty()) {
            builder = builder.lastName(lastName);
        }
        if (!email.isEmpty()) {
            builder = builder.email(email);
        }
        boolean result = engineManager.storeUser(RDF_ENGINE, engineManager.createUser(RDF_ENGINE, builder.build()));
        if (result) {
            logger.info("Created user " + username);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response getUser(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }
        User user = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        return Response.status(200).entity(user).build();
    }

    @Override
    public Response updateUser(ContainerRequestContext context, String username, String currentPassword,
                               String newPassword, String newFirstName, String newLastName, String newEmail) {
        if (username == null || currentPassword == null) {
            throw ErrorUtils.sendError("Both currentUsername and currentPassword must be provided",
                    Response.Status.BAD_REQUEST);
        }
        if (!isAuthorizedUser(context, username)) {
            throw ErrorUtils.sendError("User is not authorized to make this request with these parameters",
                    Response.Status.FORBIDDEN);
        }
        if (!engineManager.checkPassword(RDF_ENGINE, username, currentPassword)) {
            throw ErrorUtils.sendError("Invalid password", Response.Status.UNAUTHORIZED);
        }

        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

        String password = newPassword.isEmpty() ? currentPassword : newPassword;
        Set<String> currentRoles = savedUser.getHasUserRole().stream()
                .map(role -> role.getProperty(factory.createIRI(DCTERMS.TITLE.stringValue())))
                .filter(Optional::isPresent)
                .map(roleOpt -> roleOpt.get().stringValue())
                .collect(Collectors.toSet());
        UserConfig config = new UserConfig.Builder(username, password, currentRoles)
                .firstName(newFirstName)
                .lastName(newLastName)
                .email(newEmail)
                .build();
        combineUser(savedUser, engineManager.createUser(RDF_ENGINE, config));

        boolean result = engineManager.updateUser(RDF_ENGINE, savedUser);
        return Response.ok(result).build();
    }

    @Override
    public Response deleteUser(ContainerRequestContext context, String username) {
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }
        if (!isAuthorizedUser(context, username)) {
            throw ErrorUtils.sendError("Not authorized", Response.Status.UNAUTHORIZED);
        }
        if (!engineManager.userExists(username)) {
            throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
        }

        boolean result = engineManager.deleteUser(RDF_ENGINE, username);
        if (result) {
            logger.info("Deleted user " + username);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response getUserRoles(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }

        User user = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));

        return Response.ok(new GenericEntity<Set<Role>>(user.getHasUserRole()) {}).build();
    }

    @Override
    public Response addUserRole(String username, String role) {
        if (username == null || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }

        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        User tempUser = engineManager.createUser(RDF_ENGINE,
                new UserConfig.Builder("", "", Collections.singleton(role)).build());
        Set<Role> allRoles = savedUser.getHasUserRole();
        allRoles.addAll(tempUser.getHasUserRole());
        savedUser.setHasUserRole(allRoles);
        boolean result = engineManager.updateUser(RDF_ENGINE, savedUser);
        if (result) {
            logger.info("Role " + role + " added to user " + username);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (username == null || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        User tempUser = engineManager.createUser(RDF_ENGINE,
                new UserConfig.Builder("", "", Stream.of(role).collect(Collectors.toSet())).build());
        Resource roleIRI = tempUser.getHasUserRole().stream().collect(Collectors.toList()).get(0).getResource();
        savedUser.removeProperty(roleIRI, factory.createIRI(User.hasUserRole_IRI));
        boolean result = engineManager.updateUser(RDF_ENGINE, savedUser);
        if (result) {
            logger.info("Role " + role + " removed from user " + username);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response listUserGroups(String username) {
        if (username == null) {
            throw ErrorUtils.sendError("username must be provided", Response.Status.BAD_REQUEST);
        }

        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Set<Group> groups = engineManager.getGroups(RDF_ENGINE).stream()
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
    public Response addUserGroup(String username, String groupName) {
        if (username == null || groupName == null) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        Set<Agent> newMembers = savedGroup.getMember();
        newMembers.addAll(Stream.of(savedUser).collect(Collectors.toSet()));
        savedGroup.setMember(newMembers);
        boolean result = engineManager.updateGroup(RDF_ENGINE, savedGroup);
        if (result) {
            logger.info("Added user " + username + " to group " + groupName);
        }
        return Response.ok(result).build();
    }

    @Override
    public Response removeUserGroup(String username, String groupName) {
        if (username == null || groupName == null) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        User savedUser = engineManager.retrieveUser(RDF_ENGINE, username).orElseThrow(() ->
                ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
        Group savedGroup = engineManager.retrieveGroup(RDF_ENGINE, groupName).orElseThrow(() ->
                ErrorUtils.sendError("Group " + groupName + " not found", Response.Status.BAD_REQUEST));
        savedGroup.removeProperty(savedUser.getResource(), factory.createIRI(Group.member_IRI));
        boolean result = engineManager.updateGroup(RDF_ENGINE, savedGroup);
        if (result) {
            logger.info("Removed user " + username + " from group " + groupName);
        }
        return Response.ok(result).build();
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

        if (!RestSecurityUtils.authenticateToken("matonto", subject, tokenString, matontoConfiguration)) {
            return false;
        }

        String user = "";
        boolean isAdmin = false;

        // TODO: Make util method for this
        for (Principal principal : subject.getPrincipals()) {
            if (principal instanceof UserPrincipal) {
                user = principal.getName();
                isAdmin = engineManager.getUserRoles(RDF_ENGINE, user).stream()
                        .map(Thing::getResource)
                        .anyMatch(resource -> resource.stringValue().contains("admin"));
            }
        }

        return user.equals(username) || isAdmin;
    }

    private void combineUser(User oldUser, User newUser) {
        oldUser.setPassword(newUser.getPassword().get());
        if (newUser.getHasUserRole().isEmpty()) {
            oldUser.getHasUserRole().forEach(role -> oldUser.removeProperty(role.getResource(),
                    factory.createIRI(User.hasUserRole_IRI)));
        } else {
            oldUser.setHasUserRole(newUser.getHasUserRole());
        }
        if (newUser.getFirstName().isEmpty()) {
            oldUser.getFirstName().forEach(literal -> oldUser.removeProperty(literal,
                    factory.createIRI(User.firstName_IRI)));
        } else {
            oldUser.setFirstName(newUser.getFirstName());
        }
        if (newUser.getLastName().isEmpty()) {
            oldUser.getLastName().forEach(literal -> oldUser.removeProperty(literal,
                    factory.createIRI(User.lastName_IRI)));
        } else {
            oldUser.setLastName(newUser.getLastName());
        }
        if (newUser.getMbox().isEmpty()) {
            oldUser.getMbox().forEach(thing -> oldUser.removeProperty(thing.getResource(),
                    factory.createIRI(User.mbox_IRI)));
        } else {
            oldUser.setMbox(newUser.getMbox());
        }
    }
}
