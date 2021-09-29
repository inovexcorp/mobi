package com.mobi.setting.rest;

/*-
 * #%L
 * setting.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.setting.api.SettingService;
import com.mobi.setting.api.ontologies.ApplicationSetting;
import com.mobi.setting.api.ontologies.Setting;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferenceCardinality;
import org.osgi.service.component.annotations.ReferencePolicy;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = SettingRest.class, immediate = true)
@Path("/settings")
public class SettingRest {
    private static final ObjectMapper mapper = new ObjectMapper();

    /**
     * A map of the available SettingServices. The string is get typeIRI for the individual SettingService.
     */
    private final Map<String, SettingService> settingServices = new HashMap<>();

    private SettingService<?> getSettingService(String type) {
        SettingService<? extends Setting> service = settingServices.get(type);
        if (service == null) {
            throw ErrorUtils.sendError("Could not find SettingService for type: " + type,
                    Response.Status.BAD_REQUEST);
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
    SesameTransformer transformer;

    @Reference
    EngineManager engineManager;

    @Reference
    ValueFactory vf;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Retrieves all Settings of the provided type.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response getAllSettings(@Context ContainerRequestContext context,
                                   @Parameter(description = "The type of Setting to retrieve. For example "
                                           + "`http://mobi.com/ontologies/setting#Preference` or"
                                           + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                                   @QueryParam("type") String type) {
        checkStringParam(type, "'type' must be provided");
        User user = getActiveUser(context, engineManager);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Set<? extends Setting> settings = service.getSettings(user);
            return settingsToJson(service, settings);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{settingId}")
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Retrieves a Setting identified by the settingId.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response getSetting(@Context ContainerRequestContext context,
                               @Parameter(description = "The resource identifying the Setting to retrieve",
                                       required = true)
                               @PathParam("settingId") String settingId,
                               @Parameter(description = "The type of Setting to retrieve. For example "
                                       + "`http://mobi.com/ontologies/setting#Preference` or"
                                       + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                               @QueryParam("type") String type) {
        checkStringParam(type, "'type' must be provided");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            return getSettingResponse(service, settingId);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Creates a Setting and it's referenced entities from the provided body.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response createSetting(@Context ContainerRequestContext context,
                                  @Parameter(description = "The specific type of setting being updated",
                                          required = true)
                                  @QueryParam("subType") String subType,
                                  @Parameter(description = "The type of Setting to retrieve. For example "
                                          + "`http://mobi.com/ontologies/setting#Preference` or"
                                          + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                                  @QueryParam("type") String type,
                                  @Parameter(description = "A JSON-LD representation of the Setting that will be"
                                          + " created", required = true)
                                  String jsonld) {
        checkStringParam(subType, "subType is required");
        checkStringParam(type, "type is required");
        checkStringParam(jsonld, "Setting JSON is required");
        User user = getActiveUser(context, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = jsonldToModel(jsonld, transformer);
            Resource resourceId = service.createSetting(model, vf.createIRI(subType), user);
            return Response.status(201).entity(resourceId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @PUT
    @Path("{settingId}")
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Updates a Setting it's referenced entities using the provided body.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response updateSetting(@Context ContainerRequestContext context,
                                  @Parameter(description = "The resource identifying the Setting to update",
                                          required = true)
                                  @PathParam("settingId") String settingId,
                                  @Parameter(description = "The specific type of Setting being updated",
                                          required = true)
                                  @QueryParam("subType") String subType,
                                  @Parameter(description = "The type of Setting to retrieve. For example "
                                          + "`http://mobi.com/ontologies/setting#Preference` or"
                                          + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                                  @QueryParam("type") String type,
                                  @Parameter(description = "A JSON-LD representation of the updated setting",
                                          required = true) String jsonld) {
        checkStringParam(subType, "subType is required");
        checkStringParam(type, "type is required");
        checkStringParam(jsonld, "Setting JSON-LD is required");
        User user = getActiveUser(context, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = jsonldToModel(jsonld, transformer);
            service.updateSetting(vf.createIRI(settingId), model, vf.createIRI(subType), user);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @DELETE
    @Path("{settingId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Deletes a Setting who has the subjectId of settingId.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response deleteSetting(@Context ContainerRequestContext context,
                                  @Parameter(description = "The resource identifying the Setting to delete",
                                          required = true)
                                  @PathParam("settingId") String settingId,
                                  @Parameter(description = "The type of Setting to retrieve. For example "
                                          + "`http://mobi.com/ontologies/setting#Preference` or"
                                          + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                                  @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        User user = getActiveUser(context, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            service.deleteSetting(vf.createIRI(settingId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @GET
    @Path("groups")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Retrieves all SettingGroups.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response getGroups(@Context ContainerRequestContext context,
                              @Parameter(description = "The type of Setting to retrieve. For example "
                                      + "`http://mobi.com/ontologies/setting#Preference` or"
                                      + "`http://mobi.com/ontologies/setting#ApplicationSetting`", required = true)
                              @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = service.getSettingGroups();
            return Response.ok(RestUtils.modelToJsonld(model, transformer)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @GET
    @Path("groups/{groupId}/definitions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Retrieves SettingGroup definitions associated with the provided groupId",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response getSettingDefinitions(@Context ContainerRequestContext context,
                                          @Parameter(description = "The resource id of the group to "
                                                     + "retrieve setting definitions for", required = true)
                                          @PathParam("groupId") String groupId,
                                          @Parameter(description = "The type of Setting to retrieve. For example "
                                                  + "`http://mobi.com/ontologies/setting#Preference` or"
                                                  + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                                                  required = true)
                                          @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            Model model = service.getSettingDefinitions(vf.createIRI(groupId));
            return Response.ok(RestUtils.modelToJsonld(model, transformer)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @GET
    @Path("types/{settingType}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Retrieves the Setting whose type is the provided settingType",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response getSettingByType(@Context ContainerRequestContext context,
                                     @Parameter(description = "The resource identifying the type of Setting to"
                                             + "retrieve", required = true)
                                     @PathParam("settingType") String settingType,
                                     @Parameter(description = "The type of Setting to retrieve. For example "
                                             + "`http://mobi.com/ontologies/setting#Preference` or"
                                             + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                                             required = true)
                                     @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        try {
            User user = getActiveUser(context, engineManager);
            SettingService<? extends Setting> service = getSettingService(type);
            Setting setting = service.getSettingByType(vf.createIRI(settingType), user)
                    .orElseThrow(() -> ErrorUtils.sendError("Setting with type " + settingType
                            + " does not exist.", Response.Status.BAD_REQUEST));
            JsonNode result = getSettingAsJsonNode(setting);
            return Response.ok(result.toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @DELETE
    @Path("types/{settingType}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "settings",
            summary = "Deletes the Setting whose type is the provided settingType",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "Bad Request"),
                    @ApiResponse(responseCode = "500", description = "Internal Server Error")
            }
    )
    public Response deleteSettingByType(@Context ContainerRequestContext context,
                                        @PathParam("settingType") String settingType,
                                        @Parameter(description = "The type of Setting to retrieve. For example "
                                                + "`http://mobi.com/ontologies/setting#Preference` or"
                                                + "`http://mobi.com/ontologies/setting#ApplicationSetting`",
                                                required = true)
                                        @QueryParam("type") String type) {
        checkStringParam(type, "type is required");
        User user = getActiveUser(context, engineManager);
        checkAdmin(type, user);
        try {
            SettingService<? extends Setting> service = getSettingService(type);
            service.deleteSettingByType(vf.createIRI(settingType), user);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Response getSettingResponse(SettingService<? extends Setting> settingService, String settingId) {
        Setting setting = settingService.getSetting(vf.createIRI(settingId))
                .orElseThrow(() -> ErrorUtils.sendError("Setting with id " + settingId
                        + " does not exist.", Response.Status.BAD_REQUEST));
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
            return mapper.readTree(RestUtils.modelToString(setting.getModel(), RDFFormat.JSONLD, transformer));
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private void checkAdmin(String type, User user) {
        if (ApplicationSetting.TYPE.equals(type)) {
            String username = user.getUsername().orElseThrow(() ->
                    ErrorUtils.sendError("User must be a registered user.", Response.Status.BAD_REQUEST))
                    .stringValue();
            if (!RestUtils.isAdminUser(username, engineManager)) {
                throw ErrorUtils.sendError("User must have Admin role to perform this action.",
                        Response.Status.UNAUTHORIZED);
            }
        }
    }
}