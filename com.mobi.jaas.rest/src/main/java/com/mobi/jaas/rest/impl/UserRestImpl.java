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
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.jaas.rest.UserRest;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import net.sf.json.JSONArray;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Response;

@Component(immediate = true)
public class UserRestImpl implements UserRest {
    private EngineManager engineManager;
    private ValueFactory vf;
    private UserFactory userFactory;
    private SesameTransformer transformer;
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
    void setUserFactory(UserFactory userFactory) {
        this.userFactory = userFactory;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference(target = "(engineName=RdfEngine)")
    void setRdfEngine(Engine engine) {
        this.rdfEngine = engine;
    }

    @Override
    public Response getUsers() {
        try {
            Set<User> users = engineManager.getUsers();
            JSONArray result = JSONArray.fromObject(users.stream()
                    .map(user -> {
                        user.clearPassword();
                        return user.getModel().filter(user.getResource(), null, null);
                    })
                    .map(userModel -> modelToJsonld(userModel, transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response createUser(String username, String password, List<FormDataBodyPart> roles, String firstName,
                               String lastName, String email) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        if (StringUtils.isEmpty(password)) {
            throw ErrorUtils.sendError("Password must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            if (engineManager.userExists(username)) {
                throw ErrorUtils.sendError("User already exists", Response.Status.BAD_REQUEST);
            }

            Set<String> roleSet = new HashSet<>();
            if (roles != null && roles.size() > 0) {
                roleSet = roles.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet());
            }

            UserConfig.Builder builder = new UserConfig.Builder(username, password, roleSet);
            if (firstName != null) {
                builder.firstName(firstName);
            }
            if (lastName != null) {
                builder.lastName(lastName);
            }
            if (email != null) {
                builder.email(email);
            }

            User user = engineManager.createUser(rdfEngine.getEngineName(), builder.build());
            if (!user.getUsername().isPresent()) {
                throw ErrorUtils.sendError("User must have a username", Response.Status.INTERNAL_SERVER_ERROR);
            }
            engineManager.storeUser(rdfEngine.getEngineName(), user);
            logger.info("Created user " + user.getResource() + " with username " + username);
            return Response.status(201).entity(user.getUsername().get().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getUser(String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User user = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.NOT_FOUND));
            user.clearPassword();
            String json = groupedModelToString(user.getModel().filter(user.getResource(), null, null),
                    getRDFFormat("jsonld"), transformer);
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response updateUser(ContainerRequestContext context, String username, String newUserStr) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Current username must be provided", Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(context, username);

        try {
            Model userModel = jsonldToModel(newUserStr, transformer);
            Set<Resource> subjects = userModel.filter(null, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(User.TYPE)).subjects();
            if (subjects.size() < 1) {
                throw ErrorUtils.sendError("User must have an ID", Response.Status.BAD_REQUEST);
            }
            User newUser = userFactory.createNew(subjects.iterator().next(), userModel);

            Value newUsername = newUser.getUsername().orElseThrow(() ->
                    ErrorUtils.sendError("Username must be provided in new user", Response.Status.BAD_REQUEST));
            if (!username.equals(newUsername.stringValue())) {
                throw ErrorUtils.sendError("Provided username and the username in the data must match",
                        Response.Status.BAD_REQUEST);
            }
            User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            if (!savedUser.getUsername().isPresent()) {
                throw ErrorUtils.sendError("User must have a username", Response.Status.INTERNAL_SERVER_ERROR);
            }
            if (!savedUser.getPassword().isPresent()) {
                throw ErrorUtils.sendError("User must have a password", Response.Status.INTERNAL_SERVER_ERROR);
            }
            if (!savedUser.getUsername().get().equals(newUsername)) {
                throw ErrorUtils.sendError("Usernames must match", Response.Status.BAD_REQUEST);
            }

            if (!savedUser.getHasUserRole().isEmpty()) {
                newUser.setHasUserRole(savedUser.getHasUserRole());
            }
            newUser.setPassword(savedUser.getPassword().get());

            engineManager.updateUser(rdfEngine.getEngineName(), newUser);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response changePassword(ContainerRequestContext context, String username, String currentPassword,
                                   String newPassword) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Current username must be provided", Response.Status.BAD_REQUEST);
        }
        checkCurrentUser(getActiveUsername(context), username);
        if (StringUtils.isEmpty(currentPassword)) {
            throw ErrorUtils.sendError("Current password must be provided", Response.Status.BAD_REQUEST);
        }
        if (StringUtils.isEmpty(newPassword)) {
            throw ErrorUtils.sendError("New password must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            if (!engineManager.checkPassword(rdfEngine.getEngineName(), username, currentPassword)) {
                throw ErrorUtils.sendError("Invalid password", Response.Status.UNAUTHORIZED);
            }
            return changePassword(username, newPassword);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response resetPassword(ContainerRequestContext context, String username, String newPassword) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Current username must be provided", Response.Status.BAD_REQUEST);
        }
        if (StringUtils.isEmpty(newPassword)) {
            throw ErrorUtils.sendError("New password must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            return changePassword(username, newPassword);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response deleteUser(ContainerRequestContext context, String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(context, username);
        try {
            if (!engineManager.userExists(username)) {
                throw ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST);
            }

            engineManager.deleteUser(rdfEngine.getEngineName(), username);
            logger.info("Deleted user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getUserRoles(String username, boolean includeGroups) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User user = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            Set<Role> roles = includeGroups ? engineManager.getUserRoles(username)
                    : user.getHasUserRole();
            JSONArray result = JSONArray.fromObject(roles.stream()
                    .map(role -> role.getModel().filter(role.getResource(), null, null))
                    .map(roleModel -> modelToJsonld(roleModel, transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response addUserRoles(String username, List<String> roles) {
        if (StringUtils.isEmpty(username) || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both username and roles must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            roles.stream()
                    .map(s -> engineManager.getRole(s).orElseThrow(() ->
                    ErrorUtils.sendError("Role " + s + " not found", Response.Status.BAD_REQUEST)))
                    .forEach(savedUser::addHasUserRole);
            engineManager.updateUser(savedUser);
            logger.info("Role(s) " + String.join(", ", roles) + " added to user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response removeUserRole(String username, String role) {
        if (StringUtils.isEmpty(username) || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            Role roleObj = engineManager.getRole(role).orElseThrow(() ->
                    ErrorUtils.sendError("Role " + role + " not found", Response.Status.BAD_REQUEST));
            savedUser.removeHasUserRole(roleObj);
            engineManager.updateUser(savedUser);
            logger.info("Role " + role + " removed from user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response listUserGroups(String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Username must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            Set<Group> groups = engineManager.getGroups().stream()
                    .filter(group -> group.getMember_resource().stream()
                        .anyMatch(resource -> resource.equals(savedUser.getResource())))
                    .collect(Collectors.toSet());

            JSONArray result = JSONArray.fromObject(groups.stream()
                    .map(group -> group.getModel().filter(group.getResource(), null, null))
                    .map(roleModel -> modelToJsonld(roleModel, transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response addUserGroup(String username, String groupTitle) {
        if (StringUtils.isEmpty(username) || StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            savedGroup.addMember(savedUser);
            engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
            logger.info("Added user " + username + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response removeUserGroup(String username, String groupTitle) {
        if (StringUtils.isEmpty(username) || StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            savedGroup.removeMember(savedUser);
            engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
            logger.info("Removed user " + username + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    @Override
    public Response getUsername(String userIri) {
        try {
            String username = engineManager.getUsername(vf.createIRI(userIri)).orElseThrow(() ->
                    ErrorUtils.sendError("User not found", Response.Status.NOT_FOUND));
            return Response.ok(username).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
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
        if (!savedUser.getPassword().isPresent()) {
            throw ErrorUtils.sendError("User must have a password", Response.Status.INTERNAL_SERVER_ERROR);
        }
        User tempUser = engineManager.createUser(rdfEngine.getEngineName(),
                new UserConfig.Builder("", newPassword, new HashSet<>()).build());
        if (!tempUser.getPassword().isPresent()) {
            throw ErrorUtils.sendError("User must have a password", Response.Status.INTERNAL_SERVER_ERROR);
        }
        savedUser.setPassword(tempUser.getPassword().get());
        engineManager.updateUser(rdfEngine.getEngineName(), savedUser);
        return Response.ok().build();
    }
}
