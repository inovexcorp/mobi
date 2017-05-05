package org.matonto.dataset.rest;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

/**
 * Created by seansmitz on 5/5/17.
 */
@Path("/datasets")
@Api(value = "/datasets")
public interface NewDatasetRest {
    /**
     * Retrieves all the Datasets in the local Catalog in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of Datasets
     * @param offset The offset for a page of Datasets
     * @param limit The number of Datasets to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param searchText The optional search text for the query
     * @return A Response with a JSON array of Datasets
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all Datasets in the local Catalog")
    Response getDatasets(@Context UriInfo uriInfo,
                         @QueryParam("offset") int offset,
                         @QueryParam("limit") int limit,
                         @QueryParam("sort") String sort,
                         @DefaultValue("true") @QueryParam("ascending") boolean asc,
                         @QueryParam("searchText") String searchText);

    /**
     * Retrieves all the triples from a Dataset in the local Catalog in a JSON array. Can optionally be paged if passed
     * a limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of triples
     * @param datasetId The id of the dataset from which to retrieve the triples.
     * @param offset The offset for a page of Dataset triples
     * @param limit The number of triples to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter The optional search text for the query
     * @return A Response with a JSON array of Datasets
     */
    @GET
    @Path("{datasetId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all triples from a Dataset in the local Catalog")
    Response getDatasetData(@Context UriInfo uriInfo,
                            @PathParam("datasetId") String datasetId,
                            @QueryParam("offset") int offset,
                            @QueryParam("limit") int limit,
                            @QueryParam("sort") String sort,
                            @DefaultValue("true") @QueryParam("ascending") boolean asc,
                            @QueryParam("filter") String filter);

    /**
     * Retrieves all the triples from a Dataset in the local Catalog in a JSON array. Can optionally be paged if passed
     * a limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of triples
     * @param datasetId The id of the dataset from which to retrieve the triples.
     * @param offset The offset for a page of Dataset triples
     * @param limit The number of triples to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter
     * @return A Response with a JSON array of Datasets
     */
    @GET
    @Path("{datasetId}/instances")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all triples for instances of classes from a Dataset in the local Catalog")
    Response getDatasetDataInstances(@Context UriInfo uriInfo,
                                     @PathParam("datasetId") String datasetId,
                                     @QueryParam("offset") int offset,
                                     @QueryParam("limit") int limit,
                                     @QueryParam("sort") String sort,
                                     @DefaultValue("true") @QueryParam("ascending") boolean asc,
                                     @QueryParam("filter") String filter);

    /**
     *
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of triples
     * @param datasetId The id of the dataset from which to retrieve the triples.
     * @param offset The offset for a page of Dataset triples
     * @param limit The number of triples to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param numExamples
     * @return A Response with a JSON array of Datasets
     */
    @GET
    @Path("{datasetId}/instances/summary")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all triples for instances of classes from a Dataset in the local Catalog")
    Response getDatasetDataInstancesSummary(@Context UriInfo uriInfo,
                                     @PathParam("datasetId") String datasetId,
                                     @QueryParam("offset") int offset,
                                     @QueryParam("limit") int limit,
                                     @QueryParam("sort") String sort,
                                     @DefaultValue("true") @QueryParam("ascending") boolean asc,
                                     @QueryParam("numExamples") int numExamples);

    /**
     *
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of triples
     * @param datasetId The id of the dataset from which to retrieve the triples.
     * @param instanceId The id of the class instance to retrieve.
     * @param offset The offset for a page of Dataset triples
     * @param limit The number of triples to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @return A Response with a JSON array of Datasets
     */
    @GET
    @Path("{datasetId}/instances/{instanceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all triples for instances of classes from a Dataset in the local Catalog")
    Response getDatasetDataInstancesSummary(@Context UriInfo uriInfo,
                                            @PathParam("datasetId") String datasetId,
                                            @PathParam("instanceId") String instanceId,
                                            @QueryParam("offset") int offset,
                                            @QueryParam("limit") int limit,
                                            @QueryParam("sort") String sort,
                                            @DefaultValue("true") @QueryParam("ascending") boolean asc);

    }
