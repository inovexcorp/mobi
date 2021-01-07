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
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.preference.api.PreferenceService;
import com.mobi.preference.api.ontologies.Preference;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.IOException;
import java.util.Set;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = PreferenceRest.class, immediate = true)
@Path("/preference")
@Api( value = "/preference" )
public class PreferenceRest {
    private static final ObjectMapper mapper = new ObjectMapper();

    private PreferenceService preferenceService;
    private SesameTransformer transformer;
    private EngineManager engineManager;
    private ValueFactory vf;
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
    void setValueFactory(ValueFactory valueFactory) {this.vf = valueFactory; }

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
        ArrayNode preferencesArray = mapper.createArrayNode();
        userPreferences.stream().map(pref -> getPreferenceAsJsonNode(pref)).forEach(preferencesArray::add);
        return Response.ok(preferencesArray.toString()).build();
    }

    @PUT
    @Produces(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
    public Response updateUserPreference(@Context ContainerRequestContext context,
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
            preferenceService.updatePreference(user, preference);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    // TODO: Technically we could strip the preferenceId and preferenceType from the newUserPreferenceJson instead of
    // TODO: having these two FormDataParams. Should we do that instead?
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a JSON object with a paginated list of provenance Activities and referenced Entities")
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

    public JsonNode getPreferenceAsJsonNode(Preference preference) {
        try {
            return mapper.readTree(RestUtils.modelToString(preference.getModel(), RDFFormat.JSONLD, transformer));
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    private Preference getPreferenceFromModel(String preferenceId, String preferenceType, Model preferenceModel) {
        return getSpecificPreferenceFactory(preferenceType).getExisting(vf.createIRI(preferenceId),
                preferenceModel).orElseThrow(() -> ErrorUtils.sendError("Could not parse " + preferenceType + " preference with id " +
                preferenceId + " from request.", Response.Status.BAD_REQUEST));
    }

    private OrmFactory<? extends Preference> getSpecificPreferenceFactory(String preferenceType) {
        return (OrmFactory<? extends Preference>) factoryRegistry.getFactoryOfType(preferenceType).orElseThrow(() ->
                ErrorUtils.sendError("Unknown preference type: " + preferenceType, Response.Status.BAD_REQUEST));
    }

    private Model convertJsonld(String jsonld) {
        return jsonldToModel(jsonld, transformer);
    }
}
