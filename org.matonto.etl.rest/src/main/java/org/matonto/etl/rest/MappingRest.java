package org.matonto.etl.rest;

/*-
 * #%L
 * org.matonto.etl.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("/mappings")
@Api( value = "/mappings" )
public interface MappingRest {
    /**
     * If passed an id list, produces a JSON array of all the mapping with matching ids
     * in the data store. Otherwise just produces a JSON array of all mapping ids.
     *
     * @param idList a list of mapping ids
     * @return a response with a JSON array of all the mapping ids
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieve list of all saved mappings")
    Response getMappings(@QueryParam("ids") List<String> idList);

    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store
     * with a UUID local name.
     *
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @return a response with the mapping id
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Upload mapping sent as form data.")
    Response upload(@FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld);

    /**
     * Collects the JSON-LD from an uploaded mapping and returns it as JSON.
     *
     * @param mappingIRI the id of an uploaded mapping
     * @return a response with the JSON-LD from the uploaded mapping
     */
    @GET
    @Path("{mappingIRI}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieve JSON-LD of an uploaded mapping")
    Response getMapping(@PathParam("mappingIRI") String mappingIRI);

    /**
     * Downloads an uploaded mapping.
     *
     * @param mappingIRI the id of an uploaded mapping
     * @return a response with mapping to download
     */
    @GET
    @Path("{mappingIRI}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Download an uploaded mapping")
    Response downloadMapping(@PathParam("mappingIRI") String mappingIRI,
                             @DefaultValue("jsonld") @QueryParam("format") String format);

    /**
     * Updates an uploaded mapping using new JSON-LD.
     *
     * @param mappingIRI the id of an uploaded mapping
     * @param newJsonld the JSON-LD to replace the mapping with
     * @return a response indicating the success or failure of the request
     */
    @PUT
    @Path("{mappingIRI}")
    @RolesAllowed("user")
    @ApiOperation("Updates an uploaded mapping")
    Response updateMapping(@PathParam("mappingIRI") String mappingIRI,
                           String newJsonld);

    /**
     * Deletes an uploaded mapping from the data store.
     *
     * @param mappingIRI the id of an uploaded mapping
     * @return a response indicating the success or failure of the request
     */
    @DELETE
    @Path("{mappingIRI}")
    @RolesAllowed("user")
    @ApiOperation("Delete an uploaded mapping")
    Response deleteMapping(@PathParam("mappingIRI") String mappingIRI);
}
