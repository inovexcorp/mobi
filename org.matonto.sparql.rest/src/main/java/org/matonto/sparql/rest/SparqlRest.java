package org.matonto.sparql.rest;

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
     * @param start The offset for the page.
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
            @DefaultValue("0") @QueryParam("start") int start);
}
