package org.matonto.sparql.rest;

import io.swagger.annotations.ApiOperation;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/query")
public interface SparqlRest {

    /**
     * Returns the results of the provided SPARQL query
     *
     * @param queryString a string representing a SPARQL query
     * @return SPARQL 1.1 results in JSON format
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "Gets the results of the provided SPARQL query.")
    Response queryRdf(@QueryParam("query") String queryString);
}
