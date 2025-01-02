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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.Engine;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.engines.GroupConfig;
import com.mobi.jaas.api.ontologies.usermanagement.Group;
import com.mobi.jaas.api.ontologies.usermanagement.GroupFactory;
import com.mobi.jaas.api.ontologies.usermanagement.Role;
import com.mobi.jaas.api.ontologies.usermanagement.User;
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
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
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
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = GroupRest.class, immediate = true)
@JaxrsResource
@Path("/groups")
public class GroupRest {
    private EngineManager engineManager;
    private final ValueFactory vf = new ValidatingValueFactory();
    private GroupFactory groupFactory;
    private Engine rdfEngine;
    private final Logger logger = LoggerFactory.getLogger(GroupRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setGroupFactory(GroupFactory groupFactory) {
        this.groupFactory = groupFactory;
    }

    @Reference(target = "(engineName=RdfEngine)")
    void setRdfEngine(Engine engine) {
        this.rdfEngine = engine;
    }

    /**
     * Retrieves a list of all the {@link Group}s in Mobi.
     *
     * @return Response with a JSON-LD list of the {@link Group}s in Mobi
     */
    @GET
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "groups",
            summary = "Get all Mobi Groups",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a JSON-LD list of the Groups in Mobi"),
            }
    )
    public Response getGroups() {
        try {
            ArrayNode result = engineManager.getGroups().stream()
                    .map(group -> group.getModel().filter(group.getResource(), null, null))
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
     * Creates a Group in Mobi with the passed information.
     *
     * @param title The title of the Group
     * @param description The description of the Group
     * @param roles The roles of the Group
     * @param members The members of the Group
     * @return Response indicating the success or failure of the request
     */
    @POST
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Create a new Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating the success or failure of the request"),
            }
    )
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response createGroup(
            @Parameter(schema = @Schema(type = "string",
                    description = "Title of the Group", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Description of the Group", required = true))
            @FormParam("description") String description,
            @Parameter(explode = Explode.TRUE, array = @ArraySchema(
                    arraySchema = @Schema(description = "List of roles of the Group", required = true),
                    schema = @Schema(implementation = String.class, description = "Role")))
            @FormParam("roles") List<String> roles,
            @Parameter(explode = Explode.TRUE, array = @ArraySchema(
                    arraySchema = @Schema(description = "List of members of the Group", required = true),
                    schema = @Schema(implementation = String.class, description = "Member")))
            @FormParam("members") List<String> members) {
        checkStringParam(title, "Group title is required");
        try {
            if (engineManager.groupExists(title)) {
                throw ErrorUtils.sendError("Group " + title + " already exists", Response.Status.BAD_REQUEST);
            }

            GroupConfig.Builder builder = new GroupConfig.Builder(title);

            if (members != null && members.size() > 0) {
                builder.members(members.stream()
                        .map(member -> engineManager.retrieveUser(member))
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .collect(Collectors.toSet()));
            }
            if (description != null) {
                builder.description(description);
            }
            if (roles != null && roles.size() > 0) {
                Set<String> roleSet = new HashSet<>(roles);
                builder.roles(roleSet);
            }

            Group group = engineManager.createGroup(rdfEngine.getEngineName(), builder.build());
            engineManager.storeGroup(rdfEngine.getEngineName(), group);
            logger.info("Created group " + title);
            Value createGroupTitle = group.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                    ErrorUtils.sendError("Group title must be present in created group", Response.Status.BAD_REQUEST));
            return Response.status(201).entity(createGroupTitle.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves a specific Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve
     * @return Response with a JSON representation of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "groups",
            summary = "Get a single Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a JSON representation of the Group in Mobi"),
            }
    )
    public Response getGroup(
            @Parameter(description = "Title of the Group to retrieve", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            Group group = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.NOT_FOUND));

            String json = groupedModelToString(group.getModel().filter(group.getResource(), null, null),
                    getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Updates information about the specified group in Mobi.
     *
     * @param groupTitle the title of the Group to update
     * @param newGroupStr the JSON-LD string representation of a Group to replace the existing Group
     * @return Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Update a Mobi Group's information",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    @Consumes(MediaType.APPLICATION_JSON)
    public Response updateGroup(
            @Parameter(description = "Title of the Group to update", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "JSON-LD string representation of a Group to replace the existing Group",
                    required = true) String newGroupStr) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        Model groupModel = jsonldToModel(newGroupStr);
        Set<Resource> subjects = groupModel.filter(null, vf.createIRI(RDF.TYPE.stringValue()),
                vf.createIRI(Group.TYPE)).subjects();
        if (subjects.size() < 1) {
            throw ErrorUtils.sendError("Group must have an ID", Response.Status.BAD_REQUEST);
        }
        Group newGroup = groupFactory.createNew(subjects.iterator().next(), groupModel);

        Value title = newGroup.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue())).orElseThrow(() ->
                ErrorUtils.sendError("Group title must be present in new group", Response.Status.BAD_REQUEST));
        if (!groupTitle.equals(title.stringValue())) {
            throw ErrorUtils.sendError("Provided group title and the group title in the data must match",
                    Response.Status.BAD_REQUEST);
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            Optional<Value> savedGroupTitle = savedGroup.getProperty(vf.createIRI(DCTERMS.TITLE.stringValue()));
            if (!savedGroupTitle.isPresent()) {
                throw ErrorUtils.sendError("Group must have a title", Response.Status.INTERNAL_SERVER_ERROR);
            }
            if (!savedGroupTitle.get().equals(title)) {
                throw ErrorUtils.sendError("Group titles must match", Response.Status.BAD_REQUEST);
            }
            if (!savedGroup.getHasGroupRole().isEmpty()) {
                newGroup.setHasGroupRole(savedGroup.getHasGroupRole());
            }
            if (!savedGroup.getMember().isEmpty()) {
                newGroup.setMember(savedGroup.getMember());
            }

            engineManager.updateGroup(rdfEngine.getEngineName(), newGroup);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes a Group from Mobi, and by consequence removing all users from it as well.
     *
     * @param groupTitle the title of the Group to remove
     * @return Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Remove a Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response deleteGroup(
            @Parameter(description = "Title of the Group to remove", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            if (!engineManager.groupExists(groupTitle)) {
                throw ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST);
            }

            engineManager.deleteGroup(rdfEngine.getEngineName(), groupTitle);
            logger.info("Deleted group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the list of roles of the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve roles from
     * @return Response with a JSON array of the roles of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "groups",
            summary = "List roles of a Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a JSON array of the roles of the Group in Mobi"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response getGroupRoles(
            @Parameter(description = "Title of the Group to retrieve roles from", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            Group group = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));

            ArrayNode result = group.getHasGroupRole().stream()
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
     * Adds roles to the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to add a role to
     * @param roles the name of the roles to add to the specified Group
     * @return Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Add roles to a Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response addGroupRoles(
            @Parameter(description = "Title of the Group to add a role to", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "Name of the roles to add to the specified Group",
                            required = true),
                    schema = @Schema(implementation = String.class, description = "Role")))
            @QueryParam("roles") List<String> roles) {
        if (StringUtils.isEmpty(groupTitle) || roles.isEmpty()) {
            throw ErrorUtils.sendError("Both group title and roles must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            roles.stream()
                    .map(s -> engineManager.getRole(s).orElseThrow(() ->
                            ErrorUtils.sendError("Role " + s + " not found", Response.Status.BAD_REQUEST)))
                    .forEach(savedGroup::addHasGroupRole);
            engineManager.updateGroup(savedGroup);
            logger.info("Role(s) " + String.join(", ", roles) + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes a role from the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to remove a role from
     * @param role the role to remove from the specified Group
     * @return Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Remove role from a Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response removeGroupRole(
            @Parameter(description = "Title of the Group to remove a role from", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "Role to remove from the specified Group", required = true)
            @QueryParam("role") String role) {
        if (StringUtils.isEmpty(groupTitle) || StringUtils.isEmpty(role)) {
            throw ErrorUtils.sendError("Both group title and role must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            Role roleObj = engineManager.getRole(role).orElseThrow(() ->
                    ErrorUtils.sendError("Role " + role + " not found", Response.Status.BAD_REQUEST));
            savedGroup.removeHasGroupRole(roleObj);
            engineManager.updateGroup(savedGroup);
            logger.info("Removed role " + role + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the list of users for the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve users from
     * @return Response with a JSON array of the users of the Group in Mobi
     */
    @GET
    @Path("{groupTitle}/users")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "groups",
            summary = "List users of a Mobi Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a JSON array of the users for the specified Group in Mobi"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getGroupUsers(
            @Parameter(description = "Title of the Group to retrieve users from", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            Set<User> members = savedGroup.getMember_resource().stream()
                    .map(iri -> engineManager.getUsername(iri).orElseThrow(() ->
                            ErrorUtils.sendError("Unable to get User: " + iri, Response.Status.INTERNAL_SERVER_ERROR)))
                    .map(username -> engineManager.retrieveUser(username).orElseThrow(() ->
                            ErrorUtils.sendError("Unable to get User: " + username,
                                    Response.Status.INTERNAL_SERVER_ERROR)))
                    .collect(Collectors.toSet());

            ArrayNode result = members.stream()
                    .map(member -> {
                        member.clearPassword();
                        return member.getModel().filter(member.getResource(), null, null);
                    })
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Adds the users specified by usernames to the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to add users to
     * @param usernames the list of usernames of users to add to the Group
     * @return Response indicating the success or failure of the request
     */
    @PUT
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Add a Mobi User to a Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response addGroupUser(
            @Parameter(description = "Title of the Group to add users to", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "List of usernames of users to add to the Group",
                            required = true),
                    schema = @Schema(implementation = String.class, description = "username")))
            @QueryParam("users") List<String> usernames) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw ErrorUtils.sendError("Group title must be provided", Response.Status.BAD_REQUEST);
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            usernames.stream()
                    .map(username -> engineManager.retrieveUser(username).orElseThrow(() ->
                            ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST)))
                    .forEach(savedGroup::addMember);
            engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
            logger.info("Added user(s) " + String.join(", ", usernames) + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Removes the user specified by username from the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to remove a user from
     * @param username the username of the user to remove from the Group
     * @return Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @Operation(
            tags = "groups",
            summary = "Remove a Mobi User from a Group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
            }
    )
    public Response removeGroupUser(
            @Parameter(description = "Title of the Group to remove a user from", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "Username of the user to remove from the Group", required = true)
            @QueryParam("user") String username) {
        if (StringUtils.isEmpty(groupTitle) || StringUtils.isEmpty(username)) {
            throw ErrorUtils.sendError("Both group title and username must be provided",
                    Response.Status.BAD_REQUEST);
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    ErrorUtils.sendError("Group " + groupTitle + " not found", Response.Status.BAD_REQUEST));
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    ErrorUtils.sendError("User " + username + " not found", Response.Status.BAD_REQUEST));
            savedGroup.removeMember(savedUser);
            engineManager.updateGroup(savedGroup);
            logger.info("Removed user " + username + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }
}
