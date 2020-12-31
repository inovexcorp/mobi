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
import static com.mobi.rest.util.RestUtils.thingToObjectNode;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.shacl.NodeShapeFactory;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.preference.api.ontologies.PreferenceFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = PreferenceRest.class, immediate = true)
@Path("/preference")
@Api( value = "/preference" )
public class PreferenceRest {
    private static final Logger LOG = LoggerFactory.getLogger(Preference.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String PREFERENCE_NAMESPACE = "http://mobi.com/preference#";

    private PreferenceService preferenceService;
    private SesameTransformer transformer;
    private EngineManager engineManager;
    private PreferenceFactory preferenceFactory;
    private NodeShapeFactory nodeShapeFactory;
    private ValueFactory vf;
    private ModelFactory mf;
    private OrmFactoryRegistry factoryRegistry;

    @Reference
    void setPreferenceService(PreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setPreferenceFactory(PreferenceFactory preferenceFactory) { this.preferenceFactory = preferenceFactory; }

    @Reference
    void setNodeShapeFactory(NodeShapeFactory nodeShapeFactory) { this.nodeShapeFactory = nodeShapeFactory; }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {this.vf = valueFactory; }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {this.mf = modelFactory; }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {this.factoryRegistry = factoryRegistry; }

    /**
     * Returns a JSON array of user preferences for the active user
     *
     * @return A JSON array of user preferences for the active user
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
    public Response getUserPreferences(@Context ContainerRequestContext context) {
        User user = getActiveUser(context, engineManager);
        Set<Preference> userPreferences = preferenceService.getUserPreferences(user);
        ArrayNode preferencesArray = mapper.valueToTree(userPreferences.stream()
                .map(pref -> thingToObjectNode(pref, Preference.TYPE, transformer))
                .collect(Collectors.toList()));
        return Response.ok(preferencesArray.toString()).build();

    }

    /**
     * Returns a JSON array of user preferences for the active user
     *
     * @return A JSON array of user preferences for the active user
     */
//    @PUT
//    @Produces(MediaType.APPLICATION_JSON)
//    @RolesAllowed("user")
//    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
//    public Response updateUserPreferences(@Context ContainerRequestContext context,
//                                          String newUserPreference) {
//        User user = getActiveUser(context, engineManager);
//
//        convertJsonld(newUserPreference)
//
//        // Will we already know the resource id at this point?
//        preferenceFactory.getAllExisting(convertJsonld(newUserPreference)).stream().forEach(preference -> {
//            preference
//            preferenceService.addPreference(user, preference);
//        });
//
//        Set<Preference> userPreferences = preferenceService.getUserPreferences(user);
//
//        ArrayNode preferencesArray = mapper.valueToTree(userPreferences.stream()
//                .map(pref -> thingToObjectNode(pref, Preference.TYPE, transformer))
//                .collect(Collectors.toList()));
//
////        userPreferences.stream().map(pref -> modelToJsonld(pref.getModel(), transformer)).forEach(preferencesArray::add);
//        return Response.ok(preferencesArray.toString()).build();
//
//        Model newThingModel = convertJsonld(newThingJson);
//        return factory.getExisting(thingId, newThingModel).orElseThrow(() ->
//                ErrorUtils.sendError(factory.getTypeIRI().getLocalName() + " IDs must match",
//                        Response.Status.BAD_REQUEST));
//    }

    /**
     * Returns a JSON array of user preferences for the active user
     *
     * @return A JSON array of user preferences for the active user
     */
    @PUT
    @Path("{preferenceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
    public Response updateUserPreferencesAlternate(@Context ContainerRequestContext context,
                                          @PathParam("preferenceId") String preferenceId,
                                          String newUserPreference) {
        try {
            User user = getActiveUser(context, engineManager);
            Preference newPreference = preferenceFactory.getExisting(vf.createIRI(preferenceId), convertJsonld(newUserPreference)).orElseThrow(() ->
                    ErrorUtils.sendError(preferenceFactory.getTypeIRI().getLocalName() + " IDs must match",
                            Response.Status.BAD_REQUEST));
            preferenceService.updatePreference(user, newPreference);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (
        MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a JSON array of user preferences for the active user
     *
     * @return A JSON array of user preferences for the active user
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
    // TODO: For some reason this endpoint is generating blank nodes when it shouldn't
    public Response createUserPreference(@Context ContainerRequestContext context,
                                         @FormDataParam("preferenceId") String preferenceId,
                                         @FormDataParam("preferenceType") String preferenceType,
                                         @FormDataParam("newUserPreferenceJson") String newUserPreferenceJson) {
        checkStringParam(preferenceId, "Preference ID is required");
        checkStringParam(preferenceType, "Preference Type is required");
        checkStringParam(newUserPreferenceJson, "User Preference JSON is required");
        User user = getActiveUser(context, engineManager);
        try {
            Model newUserPreferenceModel = convertJsonld(newUserPreferenceJson);
            Preference preference = getPreferenceFromModel(preferenceId, preferenceType, newUserPreferenceModel);
            preferenceService.addPreference(user, preference);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Preference getPreferenceFromModel(String preferenceId, String preferenceType, Model preferenceModel) {
        return getSpecificPreferenceFactory(preferenceType).getExisting(vf.createIRI(preferenceId),
                preferenceModel).orElseThrow(() -> ErrorUtils.sendError("Could not parse preference with id " +
                preferenceId + " from request.", Response.Status.BAD_REQUEST));
    }

    private OrmFactory<? extends Preference> getSpecificPreferenceFactory(String preferenceType) {
        return (OrmFactory<? extends Preference>) factoryRegistry.getFactoryOfType(preferenceType).orElseThrow(() ->
                ErrorUtils.sendError("Unknown preference type: " + preferenceType, Response.Status.BAD_REQUEST));
    }

    /**
     * Converts a JSON-LD string into a Model.
     *
     * @param jsonld The string of JSON-LD to convert.
     *
     * @return A Model containing the statements from the JSON-LD string.
     */
    private Model convertJsonld(String jsonld) {
        return jsonldToModel(jsonld, transformer);
    }

    private Map<Class<? extends Preference>, OrmFactory<? extends Preference>> getPreferenceFactories() {
        Map<Class<? extends Preference>, OrmFactory<? extends Preference>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(Preference.class).forEach(factory ->
                factoryMap.put(factory.getType(), factory));
        return factoryMap;
    }
}
