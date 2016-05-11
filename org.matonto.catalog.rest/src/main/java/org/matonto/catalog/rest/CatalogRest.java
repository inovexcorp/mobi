package org.matonto.catalog.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.matonto.catalog.api.Distribution;
import org.matonto.catalog.rest.jaxb.DistributionMarshaller;
import org.matonto.catalog.rest.jaxb.PaginatedResults;
import org.matonto.catalog.rest.jaxb.PublishedResourceMarshaller;

import javax.ws.rs.*;
import javax.ws.rs.core.*;
import java.util.List;
import java.util.Set;

@Path("/catalog")
@Api( value = "/catalog" )
public interface CatalogRest {

    /**
     * Retrieves a list of all the PublishedResources in the catalog. An optional type parameter filters the returned
     * resources. Parameters can be passed to control paging.
     *
     * @param resourceType The String representing the rdf:type of the resources to retrieve.
     * @param searchTerms The String representing the search terms for filtering resources.
     * @param limit The number of resources to return in one page.
     * @param start The offset for the page.
     * @return The paginated List of PublishedResources that match the search criteria.
     */
    @GET
    @Path("/resources")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves the published catalog resources.")
    PaginatedResults<PublishedResourceMarshaller> listPublishedResources(
            @Context UriInfo uriInfo,
            @DefaultValue("http://matonto.org/ontologies/catalog#PublishedResource") @QueryParam("type") String resourceType,
            @QueryParam("searchTerms") String searchTerms,
            @DefaultValue("http://purl.org/dc/terms/modified") @QueryParam("sortBy") String sortBy,
            @DefaultValue("false") @QueryParam("asc") boolean ascending,
            @DefaultValue("100") @QueryParam("limit") int limit,
            @DefaultValue("0") @QueryParam("start") int start);

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

    /**
     * Publishes a new resource to the catalog.
     *
     * @param resource The PublishedResourceMarshaller containing the resource metadata.
     * @param resourceType The String representing the rdf:type of the resource to publish.
     * @return Whether or not the resource was successfully published.
     */
    @POST
    @Path("/resources")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Publishes a new resource to the catalog.")
    Response createPublishedResource(PublishedResourceMarshaller resource,
                                     @DefaultValue("http://matonto.org/ontologies/catalog#PublishedResource") @QueryParam("type") String resourceType);

    /**
     * Removes a PublishedResource from the catalog.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @return Whether or not the resource was successfully removed.
     */
    @DELETE
    @Path("/resources/{resourceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Removes a published resource from the catalog.")
    Response deletePublishedResource(@PathParam("resourceId") String resourceId);

//    @GET
//    @Path("/resources/{resourceId}/versions/{versionId}")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
//
//    /**
//     * version param
//     * @param resourceId
//     * @return
//     */
//    @POST
//    @Path("/resources/{resourceId}/versions")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
//
//    @DELETE
//    @Path("/resources/{resourceId}/versions/{versionId}")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
//
//    @GET
//    @Path("/resources/{resourceId}/versions")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);

    /**
     * Returns the Distributions for the requested Resource ID.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @return The paginated List of Distributions for the requested Resource ID.
     */
    @GET
    @Path("/resources/{resourceId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves all the distributions for the supplied resourceId.")
    Set<DistributionMarshaller> getDistributions(@PathParam("resourceId") String resourceId);

    /**
     * Publishes a new distribution for the specified resource.
     *
     * @param distribution The Distribution containing the distribution metadata.
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @return Whether or not the distribution was successfully published.
     */
    @POST
    @Path("/resources/{resourceId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Publishes a new distribution for the specified resource.")
    Response createDistribution(Distribution distribution,
                                @PathParam("resourceId") String resourceId);

    /**
     * Removes all the Distributions from the specified resource.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @return Whether or not the distributions were successfully removed.
     */
    @DELETE
    @Path("/resources/{resourceId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Removes all the distribution from the specified resource.")
    Response deleteDistributions(@PathParam("resourceId") String resourceId);

    /**
     * Retrieves a Distribution from the specified resource.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @param distributionId the String representing the Distribution ID. NOTE: Assumes ID represents
     *                       an IRI unless String begins with "_:".
     * @return the Distribution from the specified resource.
     */
    @GET
    @Path("/resources/{resourceId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves the published resource distribution by its ID.")
    DistributionMarshaller getDistribution(@PathParam("resourceId") String resourceId,
                                           @PathParam("distributionId") String distributionId);

    /**
     * Removes a Distribution from the specified resource.
     *
     * @param resourceId the String representing the Resource ID. NOTE: Assumes ID represents
     *                   an IRI unless String begins with "_:".
     * @param distributionId the String representing the Distribution ID. NOTE: Assumes ID represents
     *                       an IRI unless String begins with "_:".
     * @return Whether or not the distribution was successfully removed.
     */
    @DELETE
    @Path("/resources/{resourceId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves the published catalog resource by its ID.")
    Response deleteDistribution(@PathParam("resourceId") String resourceId,
                                @PathParam("distributionId") String distributionId);

//    @GET
//    @Path("/resources/{resourceId}/versions/{versionId}/distributions")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
//
//    @POST
//    @Path("/resources/{resourceId}/versions/{versionId}/distributions")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);
//
//    @DELETE
//    @Path("/resources/{resourceId}/versions/{versionId}/distributions")
//    @Produces(MediaType.APPLICATION_JSON)
//    @ApiOperation("Retrieves the published catalog resource by its ID.")
//    PublishedResourceMarshaller getPublishedResource(@PathParam("resourceId") String resourceId);

    /**
     * Returns all the available resource types.
     *
     * @return all the available resource type.
     */
    @GET
    @Path("/resource-types")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves all the available resource types.")
    Response getResourceTypes();

    /**
     * Returns all the available sorting options.
     *
     * @return all the available sorting options.
     */
    @GET
    @Path("/sort-options")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieves all the available sorting options.")
    Response getSortOptions();
}
