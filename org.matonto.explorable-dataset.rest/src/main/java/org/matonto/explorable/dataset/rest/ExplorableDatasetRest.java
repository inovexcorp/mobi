package org.matonto.explorable.dataset.rest;

/*-
 * #%L
 * org.matonto.dataset.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

/**
 * Created by seansmitz on 5/5/17.
 */
@Path("/explorable-datasets")
@Api(value = "/explorable-datasets")
public interface ExplorableDatasetRest {
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
     * @param datasetRecordId The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} from which to retrieve the data.
     * @param offset    The offset for a page of data
     * @param limit     The number of data to return in one page
     * @param sort      The IRI of the property to sort by
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter    The optional search text for the query
     * @return A {@link Response} with a JSON array of data
     */
    @GET
    @Path("{datasetRecordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all data from a Dataset in the local Catalog")
    Response getDatasetData(@Context UriInfo uriInfo,
                            @PathParam("datasetRecordId") String datasetRecordId,
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
     * @param datasetRecordId The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                  {@link org.matonto.dataset.ontology.dataset.Dataset} from which to retrieve the data.
     * @param offset    The offset for a page of ontology objects.
     * @param limit     The number of ontology objects to return in one page
     * @param sort      The IRI of the property to sort by
     * @param asc       Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param filter    The optional array of ontology object ids to filter by.
     * @return A {@link Response} with a JSON array of ontology objects.
     */
    @GET
    @Path("{datasetRecordId}/instances")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all the data associated with ontology objects, from a Dataset in the local Catalog")
    Response getDatasetDataInstances(@Context UriInfo uriInfo,
                                     @PathParam("datasetRecordId") String datasetRecordId,
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
     * @param datasetRecordId   The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                    {@link org.matonto.dataset.ontology.dataset.Dataset} to summarize.
     * @param offset      The offset for a page of Dataset data
     * @param limit       The number of data to return in one page
     * @param sort        The IRI of the property to sort by
     * @param asc         Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param numExamples the maximum number of examples to be provided for each ontology object.
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{datasetRecordId}/instances-summary")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves an aggregated summary of all ontology objects from a Dataset in the local Catalog")
    Response getDatasetDataInstancesSummary(@Context UriInfo uriInfo,
                                            @PathParam("datasetRecordId") String datasetRecordId,
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
     * @param datasetRecordId  The id of the {@link org.matonto.dataset.ontology.dataset.DatasetRecord} for the
     *                   {@link org.matonto.dataset.ontology.dataset.Dataset}
     * @param instanceId The id of the ontology object instance to retrieve.
     * @param sort       The IRI of the property to sort by
     * @param asc        Whether or not the list should be sorted ascending or descending. Default is ascending
     * @return A {@link Response} with a JSON object.
     */
    @GET
    @Path("{datasetRecordId}/instances/{instanceId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a particular instance of an ontology object from a Dataset in the local Catalog")
    Response getDatasetDataInstance(@Context UriInfo uriInfo,
                                    @PathParam("datasetRecordId") String datasetRecordId,
                                    @PathParam("instanceId") String instanceId,
                                    @QueryParam("offset") int offset,
                                    @QueryParam("limit") int limit,
                                    @QueryParam("sort") String sort,
                                    @DefaultValue("true") @QueryParam("ascending") boolean asc);

}
