package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.UserConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.jaas.api.ontologies.usermanagement.UserFactory;
import com.mobi.platform.config.api.state.StateManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.Explode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = UserRest.class, immediate = true)
@JaxrsResource
@Path("/users")
public class UserRest {
    private final Logger logger = LoggerFactory.getLogger(UserRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    static final String ADMIN_USER_IRI = "http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997";

    private static final String USERNAME_PROVIDED = "Username must be provided";
    private static final String NOT_FOUND = " not found";
    private static final String CURRENT_USERNAME_PROVIDED = "Current username must be provided";
    private static final String MUST_HAVE_PASSWORD = "User must have a password";
    private static final String ROLE = "Role ";

    final ValueFactory vf = new ValidatingValueFactory();
    
    @Reference
    EngineManager engineManager;

    @Reference
    UserFactory userFactory;
    @Reference(target = "(engineName=RdfEngine)")
    Engine rdfEngine;

    @Reference
    CommitManager commitManager;

    @Reference
    StateManager stateManager;

    @Reference
    CatalogConfigProvider configProvider;

    /**
     * Retrieves a list of all the {@link User}s in Mobi.
     *
     * @return a Response with a JSON-LD list of the {@link User}s in Mobi
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "users",
            summary = "Get all Mobi Users",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response getUsers() {
        try {
            Set<User> users = engineManager.getUsers();
            ArrayNode result = users.stream()
                    .map(user -> {
                        user.clearPassword();
                        return user.getModel().filter(user.getResource(), null, null);
                    })
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a User in Mobi with the passed username and password. Both are required in order
     * to create the User.
     *
     * @param username Required username of the User to create
     * @param password Required password of the User to create
     * @param roles Roles of the User to create
     * @param firstName Optional first name of the User to create
     * @param lastName Optional last name of the User to create
     * @param email Optional email of the User to create
     * @return Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Create a Mobi User account",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response createUser(
            @Parameter(schema = @Schema(type = "string",
                   description = "Required username of the User to create", required = true))
            @FormParam("username") String username,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required password of the User to create", required = true))
            @FormParam("password") String password,
            @Parameter(explode = Explode.TRUE, array = @ArraySchema(
                    arraySchema = @Schema(description = "List of roles of the User to create"),
                    schema = @Schema(implementation = String.class, description = "Role")))
            @FormParam("roles") List<String> roles,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional first name of the User to create"))
            @FormParam("firstName") String firstName,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional last name of the User to create"))
            @FormParam("lastName") String lastName,
            @Parameter(schema = @Schema(type = "string", format = "email",
                    description = "Optional email of the User to create"))
            @FormParam("email") String email) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
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
                roleSet = new HashSet<>(roles);
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
            if (user.getUsername().isEmpty()) {
                throw ErrorUtils.sendError("User must have a username", Response.Status.INTERNAL_SERVER_ERROR);
            }
            engineManager.storeUser(rdfEngine.getEngineName(), user);
            logger.info("Created user " + user.getResource() + " with username " + username);
            return Response.status(201).entity(user.getUsername().get().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the specified User in Mobi.
     *
     * @param username the username of the {@link User} to retrieve
     * @return a Response with a JSON representation of the specified User in Mobi
     */
    @GET
    @Path("{username}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "users",
            summary = "Get a single Mobi User",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response getUser(
            @Parameter(description = "Username of the User to retrieve", required = true)
            @PathParam("username") String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }
        try {
            User user = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.NOT_FOUND));
            user.clearPassword();
            String json = groupedModelToString(user.getModel().filter(user.getResource(), null, null),
                    getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Updates the information of the specified User in Mobi. Only the User being updated or an admin can make
     * this request.
     *
     * @param servletRequest The HttpServletRequest
     * @param username the current username of the user to update
     * @param newUserStr a JSON-LD string representation of a User with the new information to update
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}")
    @RolesAllowed("user")
    @Operation(
            tags = "users",
            summary = "Update a Mobi user's information",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateUser(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "Current username of the user to update", required = true)
            @PathParam("username") String username,
            @Parameter(description = "JSON-LD string representation of a User with the new information to update",
                    required = true)
                    String newUserStr) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(CURRENT_USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(servletRequest, username);

        try {
            Model userModel = jsonldToModel(newUserStr);
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
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            if (savedUser.getUsername().isEmpty()) {
                throw ErrorUtils.sendError("User must have a username", Response.Status.INTERNAL_SERVER_ERROR);
            }
            if (savedUser.getPassword().isEmpty()) {
                throw ErrorUtils.sendError(MUST_HAVE_PASSWORD, Response.Status.INTERNAL_SERVER_ERROR);
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

    /**
     * Changes the password of the specified user in Mobi. In order to change the User's password,
     * the current password must be provided.
     *
     * @param servletRequest The HttpServletRequest
     * @param username the current username of the user to update
     * @param currentPassword the current password of the user to update
     * @param newPassword a new password for the user
     * @return a Response indicating the success or failure of the request
     */
    @POST
    @Path("{username}/password")
    @RolesAllowed("user")
    @Operation(
            tags = "users",
            summary = "Changes a Mobi User's password if it is the User making the request",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response changePassword(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "Current username of the user to update", required = true)
            @PathParam("username") String username,
            @Parameter(description = "Current password of the user to update", required = true)
            @QueryParam("currentPassword") String currentPassword,
            @Parameter(description = "New password for the user", required = true)
            @QueryParam("newPassword") String newPassword) {
        if (StringUtils.isEmpty(username)) {
            throw RestUtils.getErrorObjBadRequest(new MobiException(CURRENT_USERNAME_PROVIDED));
        }
        checkCurrentUser(getActiveUsername(servletRequest), username);
        if (StringUtils.isEmpty(currentPassword)) {
            throw RestUtils.getErrorObjBadRequest(new MobiException("Current password must be provided"));
        }
        if (StringUtils.isEmpty(newPassword)) {
            throw RestUtils.getErrorObjBadRequest(new MobiException("New password must be provided"));
        }
        try {
            if (!engineManager.checkPassword(rdfEngine.getEngineName(), username, currentPassword)) {
                throw RestUtils.getErrorObjBadRequest(new MobiException("Current password is wrong"));
            }
            return updatePassword(username, newPassword);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Resets the password of the specified User in Mobi. This action is only allowed by admin Users.
     *
     * @param servletRequest The HttpServletRequest
     * @param username the current username of the User to update
     * @param newPassword a new password for the User
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/password")
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Resets a Mobi User's password if User making request is the admin",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response resetPassword(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "Current username of the User to update", required = true)
            @PathParam("username") String username,
            @Parameter(description = "New password for the User", required = true)
            @QueryParam("newPassword") String newPassword) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(CURRENT_USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }
        if (StringUtils.isEmpty(newPassword)) {
            throw ErrorUtils.sendError("New password must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            return updatePassword(username, newPassword);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes the specified User from Mobi. Only the User being deleted or an admin
     * can make this request.
     *
     * @param servletRequest The HttpServletRequest
     * @param username the username of the User to remove
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}")
    @RolesAllowed("user")
    @Operation(
            tags = "users",
            summary = "Remove a Mobi user's account",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response deleteUser(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "Username of the User to remove", required = true)
            @PathParam("username") String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }
        isAuthorizedUser(servletRequest, username);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Optional<User> user = engineManager.retrieveUser(username);
            if (user.isEmpty()) {
                throw ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST);
            }
            String userIRI = user.get().getResource().stringValue();
            if (userIRI.equals(ADMIN_USER_IRI)) {
                throw ErrorUtils.sendError("The admin user cannot be deleted.",
                        Response.Status.METHOD_NOT_ALLOWED);
            }
            List<InProgressCommit> inProgressCommits = commitManager.getInProgressCommits(user.get(), conn);
            inProgressCommits.forEach(inProgressCommit ->
                    commitManager.removeInProgressCommit(inProgressCommit.getResource(), conn));
            stateManager.getStates(username, null, new HashSet<>())
                    .forEach((resource, model) -> stateManager.deleteState(resource));
            engineManager.deleteUser(rdfEngine.getEngineName(), username);
            logger.info("Deleted user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the list of roles of a User in Mobi. By default, this list only includes
     * roles directly set on the User itself. You can optionally include roles from the groups
     * the User is a part of.
     *
     * @param username the username of the User to retrieve roles from
     * @param includeGroups whether or not to include roles from the User's groups
     * @return a Response with a JSON array of the roles of the User in Mobi
     */
    @GET
    @Path("{username}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "users",
            summary = "List roles of a Mobi User",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response getUserRoles(
            @Parameter(description = "Username of the User to retrieve roles from", required = true)
            @PathParam("username") String username,
            @Parameter(description = "Whether or not to include roles from the User's groups")
            @DefaultValue("false") @QueryParam("includeGroups") boolean includeGroups) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }
        try {
            User user = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            Set<Role> roles = includeGroups ? engineManager.getUserRoles(username)
                    : user.getHasUserRole();
            ArrayNode result = roles.stream()
                    .map(role -> role.getModel().filter(role.getResource(), null, null))
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Adds roles to the specified User in Mobi.
     *
     * @param username the username of the User to add a role to
     * @param roles the names of the roles to add to the specified User
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Add roles to a Mobi User",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response addUserRoles(
            @Parameter(description = "Username of the User to add a role to", required = true)
            @PathParam("username") String username,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "List of names of the roles to add to the specified User"),
                    schema = @Schema(implementation = String.class, description = "role name")))
            @QueryParam("roles") List<String> roles) {
        if (StringUtils.isEmpty(username) || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both username and roles must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            roles.stream()
                    .map(s -> engineManager.getRole(s).orElseThrow(() ->
                            ErrorUtils.sendError(ROLE + s + NOT_FOUND, Response.Status.BAD_REQUEST)))
                    .forEach(savedUser::addHasUserRole);
            engineManager.updateUser(savedUser);
            logger.info("Role(s) " + String.join(", ", roles) + " added to user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes a role from the specified User in Mobi.
     *
     * @param username the username of the User to remove a role from
     * @param role the role to remove from the specified User
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/roles")
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Remove role from a Mobi User",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response removeUserRole(
            @Parameter(description = "Username of the User to remove a role from", required = true)
            @PathParam("username") String username,
            @Parameter(description = "Role to remove from the specified User", required = true)
            @QueryParam("role") String role) {
        if (StringUtils.isEmpty(username) || role == null) {
            throw ErrorUtils.sendError("Both username and role must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            Role roleObj = engineManager.getRole(role).orElseThrow(() ->
                    ErrorUtils.sendError(ROLE + role + NOT_FOUND, Response.Status.BAD_REQUEST));
            if (ADMIN_USER_IRI.equals(savedUser.getResource().stringValue())
                    && roleObj.getResource().stringValue().contains("admin")) {
                throw ErrorUtils.sendError("Cannot remove admin role from admin user",
                        Response.Status.BAD_REQUEST);
            }
            savedUser.removeHasUserRole(roleObj);
            engineManager.updateUser(savedUser);
            logger.info(ROLE + role + " removed from user " + username);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the list of groups a User is a member of in Mobi.
     *
     * @param username the username to retrieve groups from
     * @return a Response with a JSON array of the groups the User is a part of in Mobi
     */
    @GET
    @Path("{username}/groups")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "users",
            summary = "List groups of a Mobi User",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response listUserGroups(
            @Parameter(description = "Username to retrieve groups from", required = true)
            @PathParam("username") String username) {
        if (StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError(USERNAME_PROVIDED, Response.Status.BAD_REQUEST);
        }

        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            Set<Group> groups = engineManager.getGroups().stream()
                    .filter(group -> group.getMember_resource().stream()
                            .anyMatch(resource -> resource.equals(savedUser.getResource())))
                    .collect(Collectors.toSet());

            ArrayNode result = groups.stream()
                    .map(group -> group.getModel().filter(group.getResource(), null, null))
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Adds the specified User to a group in Mobi. If the group does not exist,
     * it will be created.
     *
     * @param username the username of the User to add to the group
     * @param groupTitle the title of the group to add the specified User to
     * @return a Response indicating the success or failure of the request
     */
    @PUT
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Add a Mobi user to a group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response addUserGroup(
            @Parameter(description = "Username of the User to add to the group", required = true)
            @PathParam("username") String username,
            @Parameter(description = "Title of the group to add the specified User to", required = true)
            @QueryParam("group") String groupTitle) {
        if (StringUtils.isEmpty(username) || StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + NOT_FOUND, Response.Status.BAD_REQUEST));
            savedGroup.addMember(savedUser);
            engineManager.updateGroup(savedGroup);
            logger.info("Added user " + username + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes the specified User from a group in Mobi. If this is the only User in the
     * group, the group will be removed as well.
     *
     * @param username the username of the User to remove from a group
     * @param groupTitle the title of the group to remove the specified User from
     * @return a Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{username}/groups")
    @RolesAllowed("admin")
    @Operation(
            tags = "users",
            summary = "Remove a Mobi User from a group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response removeUserGroup(
            @Parameter(description = "Username of the User to remove from a group", required = true)
            @PathParam("username") String username,
            @Parameter(description = "Title of the group to remove the specified User from", required = true)
            @QueryParam("group") String groupTitle) {
        if (StringUtils.isEmpty(username) || StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Both username and group name must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + NOT_FOUND, Response.Status.BAD_REQUEST));
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + NOT_FOUND, Response.Status.BAD_REQUEST));
            savedGroup.removeMember(savedUser);
            engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
            logger.info("Removed user " + username + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Attempts to retrieve the username for the User associated with the passed User IRI. Returns a 404 if
     * a User with the passed IRI cannot be found.
     *
     * @param userIri the IRI to search for
     * @return a Response with the username of the User associated with the IRI
     */
    @GET
    @Path("username")
    @RolesAllowed("user")
    @Produces(MediaType.TEXT_PLAIN)
    @Operation(
            tags = "users",
            summary = "Retrieve a username based on the passed User IRI",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    public Response getUsername(
            @Parameter(description = "IRI to search for", required = true)
            @QueryParam("iri") String userIri) {
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
     * @param servletRequest The HttpServletRequest
     * @param username The required username if the user is not an admin
     */
    private void isAuthorizedUser(HttpServletRequest servletRequest, String username) {
        String activeUsername = getActiveUsername(servletRequest);
        if (!engineManager.userExists(activeUsername)) {
            throw ErrorUtils.sendError("User not found", Response.Status.UNAUTHORIZED);
        }
        if (!RestUtils.isAdminUser(activeUsername, engineManager) && !activeUsername.equals(username)) {
            throw ErrorUtils.sendError("Not authorized to make this request", Response.Status.UNAUTHORIZED);
        }
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
            throw ErrorUtils.sendError("Not authorized to make this request", Response.Status.UNAUTHORIZED);
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
    private Response updatePassword(String username, String newPassword) {
        User savedUser = engineManager.retrieveUser(rdfEngine.getEngineName(), username).orElseThrow(() ->
                        RestUtils.getErrorObjBadRequest(new MobiException("User " + username + NOT_FOUND)));
        if (savedUser.getPassword().isEmpty()) {
            throw RestUtils.getErrorObjInternalServerError(new MobiException(MUST_HAVE_PASSWORD));
        }
        User tempUser = engineManager.createUser(rdfEngine.getEngineName(),
                new UserConfig.Builder("", newPassword, new HashSet<>()).build());
        if (tempUser.getPassword().isEmpty()) {
            throw RestUtils.getErrorObjInternalServerError(new MobiException(MUST_HAVE_PASSWORD));
        }
        savedUser.setPassword(tempUser.getPassword().get());
        engineManager.updateUser(rdfEngine.getEngineName(), savedUser);
        return Response.ok().build();
    }
}
