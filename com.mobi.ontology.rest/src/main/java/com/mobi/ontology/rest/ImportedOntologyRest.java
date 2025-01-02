package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import com.mobi.rest.util.ErrorUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Response;

@Path("/imported-ontologies")
@Component(service = ImportedOntologyRest.class, immediate = true)
@JaxrsResource
public class ImportedOntologyRest {

    /**
     * Checks to see if the provided URL is resolvable.
     *
     * @param url String representing the URL to verify
     * @return OK if the provided URL is resolvable. BAD_REQUEST if the URL is not resolvable. INTERNAL_SERVER_ERROR if
     *         a HttpURLConnection cannot be made.
     * @param url
     * @return
     */
    @GET
    @Path("{url}")
    @Operation(
            tags = "groups",
            summary = "Checks to see if the provided URL is resolvable",
            responses = {
                    @ApiResponse(responseCode = "200", description = "URL is resolvable"),
                    @ApiResponse(responseCode = "400", description = "URL is not resolvable"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "An HttpURLConnection cannot be made"),
            })
    @RolesAllowed("user")
    public Response verifyUrl(
            @Parameter(description = "String representing the URL to verify.", required = true)
            @PathParam("url") String url
    ) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setRequestMethod("HEAD");
            if (conn.getResponseCode() == HttpURLConnection.HTTP_OK ||
                    conn.getResponseCode() == HttpURLConnection.HTTP_MOVED_TEMP ||
                    conn.getResponseCode() == HttpURLConnection.HTTP_MOVED_PERM ||
                    conn.getResponseCode() == HttpURLConnection.HTTP_SEE_OTHER ||
                    conn.getResponseCode() == 307 || conn.getResponseCode() == 308) {
                return Response.ok().build();
            } else {
                throw ErrorUtils.sendError("The provided URL was unresolvable.", Response.Status.BAD_REQUEST);
            }
        } catch (IOException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }
}
