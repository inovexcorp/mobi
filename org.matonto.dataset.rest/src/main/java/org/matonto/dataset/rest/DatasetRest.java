package org.matonto.dataset.rest;

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
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.annotation.security.RolesAllowed;
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

@Path("/datasets")
@Api(value = "/datasets")
public interface DatasetRest {
    /**
     * Retrieves all the DatasetRecords in the local Catalog in a JSON array.
     *
     * @return A Response with a JSON array of DatasetRecords
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("users")
    @ApiOperation("Retrieves all DatasetRecords in the local Catalog")
    Response getDatasets();

    /**
     * Creates a new DatasetRecord in the local Catalog using the passed information and Dataset with the passed
     * IRI in the repository the passed id.
     *
     * @param context The context of the request
     * @param datasetIRI The required IRI for the new Dataset
     * @param repositoryId The required id of a repository in MatOnto
     * @param title The required title for the new DatasetRecord
     * @param description The optional description for the new DatasetRecord
     * @param keywords The optional comma separated list of keywords for the new DatasetRecord
     * @return A Response with the IRI string of the created DatasetRecord
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Creates a new DatasetRecord in the local Catalog and Dataset in the specified repository")
    Response createDataset(@Context ContainerRequestContext context,
                           @FormDataParam("datasetIRI") String datasetIRI,
                           @FormDataParam("repositoryId") String repositoryId,
                           @FormDataParam("title") String title,
                           @FormDataParam("description") String description,
                           @FormDataParam("keywords") String keywords);

    /**
     * Deletes a specific DatasetRecord and its Dataset from the local catalog. By default only removes named graphs
     * that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the delete should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes a specific DatasetRecord in the local Catalog")
    Response deleteDataset(@PathParam("datasetRecordId") String datasetRecordId,
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
    Response clearDataset(@PathParam("datasetRecordId") String datasetRecordId,
                          @DefaultValue("false") @QueryParam("force") boolean force);
}
