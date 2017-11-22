package com.mobi.dataset.rest;

/*-
 * #%L
 * com.mobi.dataset.rest
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
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/datasets")
@Api(value = "/datasets")
public interface DatasetRest {
    /**
     * Retrieves all the DatasetRecords in the local Catalog in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of DatasetRecords
     * @param offset The offset for a page of DatasetRecords
     * @param limit The number of DatasetRecords to return in one page
     * @param sort The IRI of the property to sort by
     * @param asc Whether or not the list should be sorted ascending or descending. Default is ascending
     * @param searchText The optional search text for the query
     * @return A Response with a JSON array of DatasetRecords
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all DatasetRecords in the local Catalog")
    Response getDatasetRecords(@Context UriInfo uriInfo,
                               @QueryParam("offset") int offset,
                               @QueryParam("limit") int limit,
                               @QueryParam("sort") String sort,
                               @DefaultValue("true") @QueryParam("ascending") boolean asc,
                               @QueryParam("searchText") String searchText);

    /**
     * Creates a new DatasetRecord in the local Catalog using the passed information and Dataset with the passed
     * IRI in the repository with the passed id.
     *
     * @param context The context of the request
     * @param title The required title for the new DatasetRecord
     * @param repositoryId The required id of a repository in Mobi
     * @param datasetIRI The optional IRI for the new Dataset
     * @param description The optional description for the new DatasetRecord
     * @param keywords The optional comma separated list of keywords for the new DatasetRecord
     * @return A Response with the IRI string of the created DatasetRecord
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Creates a new DatasetRecord in the local Catalog and Dataset in the specified repository")
    Response createDatasetRecord(@Context ContainerRequestContext context,
                                 @FormDataParam("title") String title,
                                 @FormDataParam("repositoryId") String repositoryId,
                                 @FormDataParam("datasetIRI") String datasetIRI,
                                 @FormDataParam("description") String description,
                                 @FormDataParam("keywords") String keywords,
                                 @FormDataParam("ontologies") List<FormDataBodyPart> ontologies);

    /**
     * Gets a specific DatasetRecord from the local Catalog.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @return A Response indicating the success of the request
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @ApiOperation("Gets a specific DatasetRecord from the local Catalog")
    Response getDatasetRecord(@PathParam("datasetRecordId") String datasetRecordId);

    /**
     * Deletes a specific DatasetRecord and its Dataset from the local Catalog. By default only removes named graphs
     * that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param context The context of the request
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the delete should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific DatasetRecord in the local Catalog")
    Response deleteDatasetRecord(@Context ContainerRequestContext context,
                                 @PathParam("datasetRecordId") String datasetRecordId,
                                 @DefaultValue("false") @QueryParam("force") boolean force);

    /**
     * Deletes all named graphs associated with the Dataset of a specific DatasetRecord. By default only removes named
     * graphs that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the clear should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @ApiOperation("Clears the data within a specific DatasetRecord in the local Catalog")
    Response clearDatasetRecord(@PathParam("datasetRecordId") String datasetRecordId,
                                @DefaultValue("false") @QueryParam("force") boolean force);

    /**
     * Uploads all RDF data in the provided file into the Dataset of a specific DatasetRecord.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param fileInputStream An InputStream of a RDF file passed as form data
     * @param fileDetail Information about the RDF file being uploaded, including the name
     * @return A Response indicating the success of the request
     */
    @POST
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @ApiOperation("Uploads the data within an RDF file to a specific DatasetRecord in the local Catalog")
    Response uploadData(@PathParam("datasetRecordId") String datasetRecordId,
                        @FormDataParam("file") InputStream fileInputStream,
                        @FormDataParam("file") FormDataContentDisposition fileDetail);
}
