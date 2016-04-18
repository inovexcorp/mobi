package org.matonto.catalog.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.matonto.catalog.rest.jaxb.PublishedResourceMarshaller;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

@Path("/catalog")
@Api( value = "/catalog" )
public interface CatalogRest {

    /**
     * Returns a PublishedResourceMarshaller with requested Resource ID.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @return PublishedResourceMarshaller with requested Resource ID.
     */
    @GET
    @Path("/resources/{resourceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves the published catalog resource by its ID.")
    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
}
