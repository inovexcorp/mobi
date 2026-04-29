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

import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = UsernameRest.class, immediate = true)
@JaxrsResource
@Path("/username")
public class UsernameRest {
    private static final String TAG_NAME = "Username";
    private static final String TAG_DESC = "Operations for resolving user IRIs to usernames";
    
    final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    EngineManager engineManager;

    /**
     * Attempts to retrieve the username for the User associated with the passed User IRI. Returns a 404 if
     * a User with the passed IRI cannot be found.
     *
     * @param userIri the IRI to search for
     * @return a Response with the username of the User associated with the IRI
     */
    @GET
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @RolesAllowed("user")
    @Produces(MediaType.TEXT_PLAIN)
    @Operation(summary = "Retrieves a username by User IRI")  
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "The username string for the User identified by the provided IRI"
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "The provided IRI is not valid",
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
                    responseCode = "404",
                    description = "User with the provided IRI does not exist",
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON,
                            schema = @Schema(implementation = ErrorObjectSchema.class)
                    )
            )
    })
    public Response getUsername(
            @Parameter(description = "IRI to search for", required = true)
            @QueryParam("iri") String userIri) {
        try {
            String username = engineManager.getUsername(vf.createIRI(userIri)).orElseThrow(() ->
                    RestUtils.getErrorObjNotFound(new MobiNotFoundException("User not found")));
            return Response.ok(username).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

}
