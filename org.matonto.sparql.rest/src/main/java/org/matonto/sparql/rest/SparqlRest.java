package org.matonto.sparql.rest;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Response;

@Path("/query")
public interface SparqlRest {

    @GET
    Response queryRdf(
            @QueryParam("query") String query
    );
}
