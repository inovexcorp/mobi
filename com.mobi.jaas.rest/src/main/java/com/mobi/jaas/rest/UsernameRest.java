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

import com.mobi.rest.util.ErrorUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.mobi.jaas.api.engines.EngineManager;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

@Component(service = UsernameRest.class, immediate = true)
@JaxrsResource
@Path("/username")
public class UsernameRest {
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

}
