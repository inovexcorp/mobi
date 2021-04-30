package com.mobi.preference.rest;

/*-
 * #%L
 * preference.rest
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
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.Setting;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.util.Collection;
import java.util.Set;
import javax.annotation.security.RolesAllowed;
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

@Component(service = PreferenceRest.class, immediate = true)
@Path("/preference")
public class PreferenceRest {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Reference
    PreferenceService preferenceService;

    @Reference
    SesameTransformer transformer;

    @Reference
    EngineManager engineManager;

    @Reference
    ValueFactory vf;

    @Reference
    OrmFactoryRegistry factoryRegistry;

    /**
     * Returns a JSON object of user preferences and referenced entities for the active user.
     *
     * @param context Context of the request.
     * @return A JSON object of user preferences for the active user
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "preference",
            summary = "Retrieves all of a user's preferences and their referenced entities",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
                    @ApiResponse(responseCode = "500",
                            description = "Response indicating Internal Server Error")
            }
    )
    public Response getUserPreferences(@Context ContainerRequestContext context) {
        User user = getActiveUser(context, engineManager);
        try {
            Set<Preference> userPreferences = preferenceService.getUserPreferences(user);
            ObjectNode result = mapper.createObjectNode();
            userPreferences.forEach(pref -> {
                JsonNode jsonNode = getSettingAsJsonNode(pref);
                result.set(preferenceService.getPreferenceType(pref).stringValue(), jsonNode);
            });
            return Response.ok(result.toString()).build();
        } catch (MobiException | IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a JSON array of shacl shapes that define all preferences in the passed in preference group.
     *
     * @param context Context of the request.
     * @param preferenceGroup The resource id of the preference group to retrieve definitions for
     * @return A JSON array of shacl shapes that define all preferences in the passed in preference group
     */
    @GET
    @Path("groups/{preferenceGroup}/definitions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "preference",
            summary = "Retrieves all preference definitions in the repo that are part of the passed in preference group",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
            }
    )
    public Response getPreferenceDefinitions(@Context ContainerRequestContext context,
                                             @Parameter(description = "The resource id for the preference group to "
                                                     + "retrieve preference definitions for", required = true)
                                             @PathParam("preferenceGroup") String preferenceGroup) {
        Model preferenceDefinitions = preferenceService.getPreferenceDefinitions(vf.createIRI(preferenceGroup));
        return Response.ok(RestUtils.modelToJsonld(preferenceDefinitions, transformer)).build();
    }


    /**
     * Retrieves all preference groups defined in the repo.
     *
     * @param context Context of the request.
     * @return A JSON array of preference groups
     */
    @GET
    @Path("groups")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "preference",
            summary = "Retrieves all preference groups defined in the repo",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
            }
    )
    public Response getPreferenceGroups(@Context ContainerRequestContext context) {
        Model preferenceGroups = preferenceService.getPreferenceGroups();
        return Response.ok(RestUtils.modelToJsonld(preferenceGroups, transformer)).build();
    }

    /**
     * Returns a JSON-LD representation of a user preference and referenced entities for the specific resource id.
     *
     * @param context Context of the request.
     * @param preferenceId The resource id of the user preference to retrieve
     * @return A JSON object of user preferences for the active user
     */
    @GET
    @Path("{preferenceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Operation(
            tags = "preference",
            summary = "Retrieves a user preference with the specified resource id and it's referenced entities",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR")
            }
    )
    public Response getUserPreference(@Context ContainerRequestContext context,
                                      @Parameter(description = "The resource id for the preference being retrieved",
                                              required = true)
                                      @PathParam("preferenceId") String preferenceId) {
        try {
            Setting preference = preferenceService.getSetting(vf.createIRI(preferenceId))
                    .orElseThrow(() -> ErrorUtils.sendError("Preference with id " + preferenceId
                            + " does not exist.", Response.Status.BAD_REQUEST));
            JsonNode result = getSettingAsJsonNode(preference);
            return Response.ok(result.toString()).build();
        } catch (MobiException | IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates a User Preference as well as it's referenced entities.
     *
     * @param context        Context of the request.
     * @param preferenceId   The resource id of the user preference to be updated
     * @param preferenceType The type of preference that will be updated
     * @param jsonld         The jsonld representation of the user preference and it's referenced entities that will
     *                       replace the current value of the user preference
     * @return A Response indicating whether or not the User Preference was updated.
     */
    @PUT
    @Path("{preferenceId}")
    @RolesAllowed("user")
    @Operation(
            tags = "preference",
            summary = "Updates a specific user preference and it's referenced entities",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST")
            }
    )
    public Response updateUserPreference(@Context ContainerRequestContext context,
                                         @Parameter(description = "The resource id for the preference being updated",
                                                 required = true)
                                         @PathParam("preferenceId") String preferenceId,
                                         @Parameter(description = "The type of user preference being updated",
                                                 required = true)
                                         @QueryParam("preferenceType") String preferenceType,
                                         @Parameter(description = "A JSON-LD representation of the updated user "
                                                 + "preference", required = true)
                                         String jsonld) {
        checkStringParam(preferenceType, "Preference Type is required");
        checkStringParam(jsonld, "User Preference JSON-LD is required");
        User user = getActiveUser(context, engineManager);
        try {
            Model newUserPreferenceModel = jsonldToModel(jsonld, transformer);
            Preference preference = getPreferenceFromModel(preferenceId, preferenceType, newUserPreferenceModel);
            preferenceService.updatePreference(user, preference);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Create a User Preference as well as it's referenced entities.
     *
     * @param context        Context of the request.
     * @param preferenceType The type of preference that will be updated
     * @param jsonld         The jsonld representation of the user preference and it's referenced entities that will
     *                       be created
     * @return The resource id of the created user preference
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "preference",
            summary = "Creates a specific user preference and it's referenced entities",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Success"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST")
            }
    )
    public Response createUserPreference(@Context ContainerRequestContext context,
                                         @Parameter(description = "The type of user preference being created",
                                                 required = true)
                                         @QueryParam("preferenceType") String preferenceType,
                                         @Parameter(description = "A JSON-LD representation of the user "
                                                 + "preference that will be created", required = true)
                                         String jsonld) {
        checkStringParam(preferenceType, "Preference Type is required");
        checkStringParam(jsonld, "User Preference JSON is required");
        User user = getActiveUser(context, engineManager);
        try {
            Model newUserPreferenceModel = jsonldToModel(jsonld, transformer);
            Preference preference = getPreferenceFromModel(preferenceType, newUserPreferenceModel);
            preferenceService.addPreference(user, preference);
            return Response.status(201).entity(preference.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    private JsonNode getSettingAsJsonNode(Setting setting) {
        try {
            return mapper.readTree(RestUtils.modelToString(setting.getModel(), RDFFormat.JSONLD, transformer));
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private Preference getPreferenceFromModel(String preferenceType, Model preferenceModel) {
        Collection<? extends Preference> preferences =
                getSpecificPreferenceFactory(preferenceType).getAllExisting(preferenceModel);
        if (preferences.size() > 1) {
            throw ErrorUtils.sendError("More than one preference of type: " + preferenceType + " found in request.",
                    Response.Status.BAD_REQUEST);
        } else if (preferences.isEmpty()) {
            throw ErrorUtils.sendError("No preference of type: " + preferenceType + " was found in request.",
                    Response.Status.BAD_REQUEST);
        } else {
            return preferences.iterator().next();
        }
    }

    private Preference getPreferenceFromModel(String preferenceId, String preferenceType, Model preferenceModel) {
        return getSpecificPreferenceFactory(preferenceType).getExisting(vf.createIRI(preferenceId),
                preferenceModel).orElseThrow(() -> ErrorUtils.sendError("Could not parse " + preferenceType + " "
                + "preference with id " + preferenceId + " from request.", Response.Status.BAD_REQUEST));
    }

    private OrmFactory<? extends Preference> getSpecificPreferenceFactory(String preferenceType) {
        return (OrmFactory<? extends Preference>) factoryRegistry.getFactoryOfType(preferenceType).orElseThrow(() ->
                ErrorUtils.sendError("Unknown preference type: " + preferenceType, Response.Status.BAD_REQUEST));
    }
}