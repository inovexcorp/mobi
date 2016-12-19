package org.matonto.sparql.rest;

/*-
 * #%L
 * org.matonto.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import net.sf.json.JSONObject;
import org.matonto.sparql.rest.jaxb.SparqlPaginatedResults;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/sparql")
@Api( value = "/sparql" )
public interface SparqlRest {

    /**
     * Retrieves the results of the provided SPARQL query.
     *
     * @param queryString a string representing a SPARQL query.
     * @return The SPARQL 1.1 results in JSON format.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation(value = "Retrieves the results of the provided SPARQL query.")
    Response queryRdf(@QueryParam("query") String queryString);

    /**
     * Retrieves the paged results of the provided SPARQL query. Parameters can be passed to control paging.
     *
     * @param limit The number of resources to return in one page.
     * @param offset The offset for the page.
     * @return The paginated List of JSONObjects that match the SPARQL query bindings.
     */
    @GET
    @Path("/page")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation(value = "Retrieves the paged results of the provided SPARQL query.")
    SparqlPaginatedResults<JSONObject> getPagedResults(
            @QueryParam("query") String queryString,
            @Context UriInfo uriInfo,
            @DefaultValue("100") @QueryParam("limit") int limit,
            @DefaultValue("0") @QueryParam("offset") int offset);
}
