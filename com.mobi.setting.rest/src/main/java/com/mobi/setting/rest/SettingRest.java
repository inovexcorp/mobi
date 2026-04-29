package com.mobi.setting.rest;

/*-
 * #%L
 * setting.rest
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
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.jsonldToModel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.rest.util.swagger.JsonLdObject;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.setting.ApplicationSetting;
import com.mobi.setting.api.ontologies.setting.Setting;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DELETE;
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

@Component(service = SettingRest.class, immediate = true)
@JaxrsResource
@Path("/settings")
public class SettingRest {
    private final ValueFactory vf = new ValidatingValueFactory();

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String TAG_NAME = "Setting";
    private static final String TAG_DESC = "Operations for managing application and user preference settings";

    /**
     * A map of the available SettingServices. The string is get typeIRI for the individual SettingService.
     */
    private final Map<String, SettingService> settingServices = new HashMap<>();

    private SettingService<?> getSettingService(String type) {
        SettingService<? extends Setting> service = settingServices.get(type);
        if (service == null) {
            throw RestUtils.getErrorObjBadRequest(
                    new IllegalArgumentException("Could not find SettingService for type: " + type));
        }
        return service;
    }

    @Reference(policy = ReferencePolicy.DYNAMIC, cardinality = ReferenceCardinality.MULTIPLE)
    void setSettingService(SettingService<? extends Setting> settingService) {
        settingServices.put(settingService.getTypeIRI(), settingService);
    }

    void unsetSettingService(SettingService<? extends Setting> settingService) {
        settingServices.remove(settingService.getTypeIRI());
    }

    @Reference
    EngineManager engineManager;

    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves all Settings of the provided type")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "JSON object with all the requested Settings"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving Settings",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getAllSettings(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "'type' must be provided");
        User user = getActiveUser(servletRequest, engineManager);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Set<? extends Setting> settings = service.getSettings(user);
            return settingsToJson(service, settings);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{settingId}")
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the Setting specified by the provided ID")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "JSON-LD representation of the identified Setting"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the Setting",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getSetting(
            @Parameter(description = "The resource identifying the Setting to retrieve",
                    required = true)
            @PathParam("settingId") String settingId,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "'type' must be provided");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            return getSettingResponse(service, settingId);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @POST
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(summary = "Creates a Setting and its referenced entities from the provided body")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "The IRI string of the created Setting"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
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
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while creating the Setting",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response createSetting(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "The specific type of setting being updated",
                    required = true)
            @QueryParam("subType") String subType,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type,
            @Parameter(description = "A JSON-LD representation of the Setting that will be created", required = true)
            String jsonld) {
        checkStringParam(subType, "subType is required");
        checkStringParam(type, "type is required");
        checkStringParam(jsonld, "Setting JSON is required");
        User user = getActiveUser(servletRequest, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = jsonldToModel(jsonld);
            Resource resourceId = service.createSetting(model, vf.createIRI(subType), user);
            return Response.status(201).entity(resourceId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @PUT
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{settingId}")
    @RolesAllowed("user")
    @Operation(summary = "Updates a Setting and its referenced entities using the provided body")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Setting successfully updated",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
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
                    responseCode = "500",
                    description = "An error occurred while updating the Setting",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response updateSetting(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "The resource identifying the Setting to update",
                    required = true)
            @PathParam("settingId") String settingId,
            @Parameter(description = "The specific type of Setting being updated",
                    required = true)
            @QueryParam("subType") String subType,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type,
            @Parameter(description = "A JSON-LD representation of the updated setting",
                    required = true) String jsonld) {
        checkStringParam(subType, "subType is required");
        checkStringParam(type, "type is required");
        checkStringParam(jsonld, "Setting JSON-LD is required");
        User user = getActiveUser(servletRequest, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = jsonldToModel(jsonld);
            service.updateSetting(vf.createIRI(settingId), model, vf.createIRI(subType), user);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @DELETE
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("{settingId}")
    @RolesAllowed("user")
    @Operation(summary = "Deletes a Setting specified by the provided ID")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Setting successfully deleted",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
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
                    responseCode = "500",
                    description = "An error occurred while deleting the Setting",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response deleteSetting(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "The resource identifying the Setting to delete",
                    required = true)
            @PathParam("settingId") String settingId,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        User user = getActiveUser(servletRequest, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            service.deleteSetting(vf.createIRI(settingId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("groups")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves all SettingGroups")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "JSON-LD array with the SettingGroups",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JsonLdObject.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving SettingGroups",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getGroups(
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = service.getSettingGroups();
            return Response.ok(RestUtils.modelToJsonld(model)).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("groups/{groupId}/definitions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the SettingGroup's definitions associated with the provided group ID")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "JSON-LD array with the SettingGroup's definitions",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = JsonLdObject.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the SettingGroup definitions",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getSettingDefinitions(
            @Parameter(description = "The resource id of the group to retrieve setting definitions for",
                    required = true)
            @PathParam("groupId") String groupId,
            @Parameter(description = "The type of Setting to retrieve."
                    + "For example `http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                    required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = service.getSettingDefinitions(vf.createIRI(groupId));
            return Response.ok(RestUtils.modelToJsonld(model)).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("types/{settingType}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the Setting whose type is the provided Setting type")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "JSON-LD representation of the identified Setting"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the Setting by type",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getSettingByType(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "The resource identifying the type of Setting to retrieve", required = true)
            @PathParam("settingType") String settingType,
            @Parameter(description = "The type of Setting to retrieve."
                    + "For example `http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                    required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            User user = getActiveUser(servletRequest, engineManager);
            SettingService<? extends Setting> service = getSettingService(type);
            Setting setting = service.getSettingByType(vf.createIRI(settingType), user)
                    .orElseThrow(() -> RestUtils.getErrorObjNotFound(
                            new IllegalArgumentException("Setting with type " + settingType + " does not exist.")));
            JsonNode result = getSettingAsJsonNode(setting);
            return Response.ok(result.toString()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    @DELETE
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Path("types/{settingType}")
    @RolesAllowed("user")
    @Operation(summary = "Deletes the Setting whose type is the provided Setting type")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Setting successfully deleted",
                    content = @Content(schema = @Schema(implementation = Void.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Provided Setting data or parameters are invalid",
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
                    responseCode = "500",
                    description = "An error occurred while deleting the Setting by type",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response deleteSettingByType(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @PathParam("settingType") String settingType,
            @Parameter(description = "The type of Setting to retrieve. For example"
                    + "`http://mobi.com/ontologies/setting#Preference` or "
                    + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                    required = true)
            @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        User user = getActiveUser(servletRequest, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            service.deleteSettingByType(vf.createIRI(settingType), user);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    private Response getSettingResponse(SettingService<? extends Setting> settingService, String settingId) {
        Setting setting = settingService.getSetting(vf.createIRI(settingId))
                .orElseThrow(() -> RestUtils.getErrorObjBadRequest(
                        new IllegalArgumentException("Setting with id " + settingId
                                + " does not exist.")));
        JsonNode result = getSettingAsJsonNode(setting);
        return Response.ok(result.toString()).build();
    }

    private Response settingsToJson(SettingService<? extends Setting> settingService, Set<? extends Setting> settings) {
        ObjectNode result = mapper.createObjectNode();
        settings.forEach(setting -> {
            JsonNode jsonNode = getSettingAsJsonNode(setting);
            result.set(settingService.getSettingType(setting).stringValue(), jsonNode);
        });
        return Response.ok(result.toString()).build();
    }

    private JsonNode getSettingAsJsonNode(Setting setting) {
        try {
            return mapper.readTree(RestUtils.modelToString(setting.getModel(), RDFFormat.JSONLD));
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private void checkAdmin(String type, User user) {
        if (ApplicationSetting.TYPE.equals(type)) {
            String username = user.getUsername().orElseThrow(() ->
                            RestUtils.getErrorObjBadRequest(
                                    new IllegalArgumentException("User must be a registered user.")))
                    .stringValue();
            if (!RestUtils.isAdminUser(username, engineManager)) {
                throw RestUtils.getErrorObjUnauthorized(
                        new IllegalAccessException("User must have Admin role to perform this action."));
            }
        }
    }
}
