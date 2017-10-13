package com.mobi.sparql.rest;

/*-
 * #%L
 * com.mobi.sparql.rest
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
import com.mobi.sparql.rest.jaxb.SparqlPaginatedResults;

import java.util.List;
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
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     *
     * @param queryString a string representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return The SPARQL 1.1 results in JSON format.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the results of the provided SPARQL query.")
    Response queryRdf(@QueryParam("query") String queryString,
                      @QueryParam("dataset") String datasetRecordId);

    /**
     * Downloads a delimited file with the results of the provided SPARQL query. Supports CSV, TSV,
     * Excel 97-2003, and Excel 2013 files extensions. Can optionally limit the query to a Dataset.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileExtension The desired extension of the download file.
     * @param fileName The optional file name for the download file.
     * @return A download stream of a file with the results of the provided SPARQL query.
     */
    @GET
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Download the results of the provided SPARQL query.")
    Response downloadQuery(@QueryParam("query") String queryString,
                           @QueryParam("dataset") String datasetRecordId,
                           @QueryParam("fileType") String fileExtension,
                           @DefaultValue("results") @QueryParam("fileName") String fileName);

    /**
     * Retrieves the paged results of the provided SPARQL query. Parameters can be passed to control paging.
     * Links to next and previous pages are within the Links header and the total size is within the
     * X-Total-Count header. Can optionally limit the query to a Dataset.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param limit The number of resources to return in one page.
     * @param offset The offset for the page.
     * @return The paginated List of JSONObjects that match the SPARQL query bindings.
     */
    @GET
    @Path("/page")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the paged results of the provided SPARQL query.")
    Response getPagedResults(@Context UriInfo uriInfo,
                             @QueryParam("query") String queryString,
                             @QueryParam("dataset") String datasetRecordId,
                             @DefaultValue("100") @QueryParam("limit") int limit,
                             @DefaultValue("0") @QueryParam("offset") int offset);
}
