package com.mobi.jaas.rest;

/*-
 * #%L
 * com.mobi.jaas.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.rest.util.swagger.JsonLdObject;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.Explode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    private final Logger logger = LoggerFactory.getLogger(GroupRest.class);
    private final ValueFactory vf = new ValidatingValueFactory();

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String TAG_NAME = "Group";
    private static final String TAG_DESC = "Operations for managing groups, their roles, and members";
    private static final String GROUP = "Group ";
    private static final String TITLE_PROVIDED = "Group title must be provided";
    private static final String NOT_FOUND = " not found";

    private EngineManager engineManager;
    private GroupFactory groupFactory;
    private Engine rdfEngine;

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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Retrieves all Groups")  
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD list of the Groups",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JsonLdObject.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving Groups",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getGroups() {
        try {
            ArrayNode result = engineManager.getGroups().stream()
                    .map(group -> group.getModel().filter(group.getResource(), null, null))
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("admin")
    @Operation(
            summary = "Creates a new Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "The title of the created Group"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })

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
                throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(GROUP + title + " already exists"));
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
            Value createGroupTitle = group.getProperty(DCTERMS.TITLE).orElseThrow(() ->
                    RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Group title must be present in created group")));
            return Response.status(201).entity(createGroupTitle.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Retrieves a specific Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve
     * @return Response with a JSON representation of the Group in Mobi
     */
    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Retrieves a specific Group by title")  
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD representation of the Group"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getGroup(
            @Parameter(description = "Title of the Group to retrieve", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }

        try {
            Group group = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));

            String json = groupedModelToString(group.getModel().filter(group.getResource(), null, null),
                    getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Operation(
            summary = "Updates a Group's information",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Group successfully updated",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while updating the Group",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response updateGroup(
            @Parameter(description = "Title of the Group to update", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "JSON-LD string representation of a Group to replace the existing Group",
                    required = true) String newGroupStr) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }

        Model groupModel = jsonldToModel(newGroupStr);
        Set<Resource> subjects = groupModel.filter(null, RDF.TYPE,
                vf.createIRI(Group.TYPE)).subjects();
        if (subjects.size() < 1) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Group must have an ID"));
        }
        Group newGroup = groupFactory.createNew(subjects.iterator().next(), groupModel);

        Value title = newGroup.getProperty(DCTERMS.TITLE).orElseThrow(() ->
                RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Group title must be present in new group")));
        if (!groupTitle.equals(title.stringValue())) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Provided group title and the group title in the data must match"));
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            Optional<Value> savedGroupTitle = savedGroup.getProperty(DCTERMS.TITLE);
            if (!savedGroupTitle.isPresent()) {
                throw RestUtils.getErrorObjInternalServerError(new MobiException("Group must have a title"));
            }
            if (!savedGroupTitle.get().equals(title)) {
                throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Group titles must match"));
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
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Removes a Group from Mobi, and by consequence removing all users from it as well.
     *
     * @param groupTitle the title of the Group to remove
     * @return Response indicating the success or failure of the request
     */
    @DELETE
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}")
    @RolesAllowed("admin")
    @Operation(
            summary = "Deletes a Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Group successfully deleted",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response deleteGroup(
            @Parameter(description = "Title of the Group to remove", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }
        try {
            if (!engineManager.groupExists(groupTitle)) {
                throw RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND));
            }

            engineManager.deleteGroup(rdfEngine.getEngineName(), groupTitle);
            logger.info("Deleted group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Retrieves the list of roles of the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve roles from
     * @return Response with a JSON array of the roles of the Group in Mobi
     */
    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/roles")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Retrieves the Roles of a Group")  
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD array of the roles of the Group",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JsonLdObject.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getGroupRoles(
            @Parameter(description = "Title of the Group to retrieve roles from", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }

        try {
            Group group = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));

            ArrayNode result = group.getHasGroupRole().stream()
                    .map(role -> role.getModel().filter(role.getResource(), null, null))
                    .map(RestUtils::modelToJsonld)
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @Operation(
            summary = "Adds Roles to a Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Roles successfully added to the Group",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response addGroupRoles(
            @Parameter(description = "Title of the Group to add a role to", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "Name of the roles to add to the specified Group",
                            required = true),
                    schema = @Schema(implementation = String.class, description = "Role")))
            @QueryParam("roles") List<String> roles) {
        if (StringUtils.isEmpty(groupTitle) || roles.isEmpty()) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Both group title and roles must be provided"));
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            roles.stream()
                    .map(s -> engineManager.getRole(s).orElseThrow(() ->
                            RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Role " + s + NOT_FOUND))))
                    .forEach(savedGroup::addHasGroupRole);
            engineManager.updateGroup(savedGroup);
            logger.info("Role(s) " + String.join(", ", roles) + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/roles")
    @RolesAllowed("admin")
    @Operation(
            summary = "Removes a Role from a Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Role successfully removed from the Group",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response removeGroupRole(
            @Parameter(description = "Title of the Group to remove a role from", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "Role to remove from the specified Group", required = true)
            @QueryParam("role") String role) {
        if (StringUtils.isEmpty(groupTitle) || StringUtils.isEmpty(role)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Both group title and role must be provided"));
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            Role roleObj = engineManager.getRole(role).orElseThrow(() ->
                    RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Role " + role + NOT_FOUND)));
            savedGroup.removeHasGroupRole(roleObj);
            engineManager.updateGroup(savedGroup);
            logger.info("Removed role " + role + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Retrieves the list of users for the specified Group in Mobi.
     *
     * @param groupTitle the title of the Group to retrieve users from
     * @return Response with a JSON array of the users of the Group in Mobi
     */
    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/users")
    @RolesAllowed("user")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Retrieves the Users in a Group")  
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD array of the users for the specified Group",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JsonLdObject.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving Group Users",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getGroupUsers(
            @Parameter(description = "Title of the Group to retrieve users from", required = true)
            @PathParam("groupTitle") String groupTitle) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }

        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            Set<User> members = savedGroup.getMember_resource().stream()
                    .map(iri -> engineManager.getUsername(iri).orElseThrow(() ->
                            RestUtils.getErrorObjInternalServerError(new MobiException("Unable to get User: " + iri))))
                    .map(username -> engineManager.retrieveUser(username).orElseThrow(() ->
                            RestUtils.getErrorObjInternalServerError(new MobiException("Unable to get User: " + username))))
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
            throw RestUtils.getErrorObjBadRequest(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @Operation(
            summary = "Adds a User to a Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "User successfully added to the Group",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while adding the User to the Group",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response addGroupUser(
            @Parameter(description = "Title of the Group to add users to", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "List of usernames of users to add to the Group",
                            required = true),
                    schema = @Schema(implementation = String.class, description = "username")))
            @QueryParam("users") List<String> usernames) {
        if (StringUtils.isEmpty(groupTitle)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(TITLE_PROVIDED));
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(rdfEngine.getEngineName(), groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            usernames.stream()
                    .map(username -> engineManager.retrieveUser(username).orElseThrow(() ->
                            RestUtils.getErrorObjInternalServerError(new MobiException("User " + username + NOT_FOUND))))
                    .forEach(savedGroup::addMember);
            engineManager.updateGroup(rdfEngine.getEngineName(), savedGroup);
            logger.info("Added user(s) " + String.join(", ", usernames) + " to group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
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
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{groupTitle}/users")
    @RolesAllowed("admin")
    @Operation(
            summary = "Removes a User from a Group",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "User successfully removed from the Group",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Group data or parameters are invalid",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Group with the provided title does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while removing the User from the Group",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response removeGroupUser(
            @Parameter(description = "Title of the Group to remove a user from", required = true)
            @PathParam("groupTitle") String groupTitle,
            @Parameter(description = "Username of the user to remove from the Group", required = true)
            @QueryParam("user") String username) {
        if (StringUtils.isEmpty(groupTitle) || StringUtils.isEmpty(username)) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException("Both group title and username must be provided"));
        }
        try {
            Group savedGroup = engineManager.retrieveGroup(groupTitle).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException(GROUP + groupTitle + NOT_FOUND)));
            User savedUser = engineManager.retrieveUser(username).orElseThrow(() ->
                    RestUtils.getErrorObjInternalServerError(new MobiException("User " + username + NOT_FOUND)));
            savedGroup.removeMember(savedUser);
            engineManager.updateGroup(savedGroup);
            logger.info("Removed user " + username + " from group " + groupTitle);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }
}
