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
@Path("/explorable-datasets")
@Api(value = "/explorable-datasets")
public interface NewDatasetRest {
    /**
     * Retrieves all the data, associated by {@link org.matonto.dataset.ontology.dataset.Dataset}, in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     * NOTE: This should <emp>never</emp> be implemented without paging and probably not even then.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of data
     * @param offset  The offset for a page of data
     * @param limit   The number of data to return in one page
     * @param sort    The IRI of the property to sort by
     * @param asc     Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter  The optional search text for the query
     * @return A {@link Response} with a JSON array of data associated by dataset.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all the data, grouped by Dataset, in the local Catalog")
    Response getDatasets(@Context UriInfo uriInfo,
                         @QueryParam("offset") int offset,
                         @QueryParam("limit") int limit,
                         @QueryParam("sort") String sort,
                         @DefaultValue("true") @QueryParam("ascending") boolean asc,
                         @QueryParam("filter") String filter);

    /**
     * Retrieves all the data from a {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     * NOTE: This should <emp>never</emp> be implemented without paging and probably not even then.
     *
     * @param uriInfo   The URI information of the request to be used in creating links to other pages of data
     * @param datasetId The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} from which to retrieve the data.
     * @param offset    The offset for a page of data
     * @param limit     The number of data to return in one page
     * @param sort      The IRI of the property to sort by
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter    The optional search text for the query
     * @return A {@link Response} with a JSON array of data
     */
    @GET
    @Path("{datasetId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all data from a Dataset in the local Catalog")
    Response getDatasetData(@Context UriInfo uriInfo,
                            @PathParam("datasetId") String datasetId,
                            @QueryParam("offset") int offset,
                            @QueryParam("limit") int limit,
                            @QueryParam("sort") String sort,
                            @DefaultValue("true") @QueryParam("ascending") boolean asc,
                            @QueryParam("filter") String filter);

    /**
     * Retrieves all the data associated with ontology objects, from a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo   The URI information of the request to be used in creating links to other pages of data
     * @param datasetId The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} from which to retrieve the data.
     * @param offset    The offset for a page of ontology objects.
     * @param limit     The number of ontology objects to return in one page
     * @param sort      The IRI of the property to sort by
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter    The optional array of ontology object ids to filter by.
     * @return A {@link Response} with a JSON array of ontology objects.
     */
    @GET
    @Path("{datasetId}/instances")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all the data associated with ontology objects, from a Dataset in the local Catalog")
    Response getDatasetDataInstances(@Context UriInfo uriInfo,
                                     @PathParam("datasetId") String datasetId,
                                     @QueryParam("offset") int offset,
                                     @QueryParam("limit") int limit,
                                     @QueryParam("sort") String sort,
                                     @DefaultValue("true") @QueryParam("ascending") boolean asc,
                                     @QueryParam("filter") String filter);

    /**
     * Retrieves an aggregated summary of all ontology objects from a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog}, grouped by their ontology, as a JSON object.
     *
     * @param uriInfo     The URI information of the request to be used in creating links to other pages of data
     * @param datasetId   The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                    {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param offset      The offset for a page of Dataset data
     * @param limit       The number of data to return in one page
     * @param sort        The IRI of the property to sort by
     * @param asc         Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param numExamples the maximum number of examples to be provided for each ontology object.
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{datasetId}/instances-summary")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves an aggregated summary of all ontology objects from a Dataset in the local Catalog")
    Response getDatasetDataInstancesSummary(@Context UriInfo uriInfo,
                                            @PathParam("datasetId") String datasetId,
                                            @QueryParam("offset") int offset,
                                            @QueryParam("limit") int limit,
                                            @QueryParam("sort") String sort,
                                            @DefaultValue("true") @QueryParam("ascending") boolean asc,
                                            @QueryParam("numExamples") int numExamples);

    /**
     * Retrieves a particular instance of an ontology object from a
     * {@link org.matonto.dataset.ontology.dataset.Dataset} in the local
     * {@link org.matonto.catalog.api.ontologies.mcat.Catalog} as a JSON object.
     *
     * @param uriInfo    The URI information of the request to be used in creating links to other pages of data
     * @param datasetId  The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                   {@link org.matonto.dataset.ontology.dataset.Dataset}
     * @param instanceId The id of the ontology object instance to retrieve.
     * @param sort       The IRI of the property to sort by
     * @param asc        Whether or not the list should be sorted ascending or descending. Default is ascending
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{datasetId}/instances/{instanceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a particular instance of an ontology object from a Dataset in the local Catalog")
    Response getDatasetDataInstance(@Context UriInfo uriInfo,
                                    @PathParam("datasetId") String datasetId,
                                    @PathParam("instanceId") String instanceId,
                                    @QueryParam("offset") int offset,
                                    @QueryParam("limit") int limit,
                                    @QueryParam("sort") String sort,
                                    @DefaultValue("true") @QueryParam("ascending") boolean asc);

}
