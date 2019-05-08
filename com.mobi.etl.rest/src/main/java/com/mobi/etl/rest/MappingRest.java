package com.mobi.etl.rest;

/*-
 * #%L
 * com.mobi.etl.rest
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


@Path("/mappings")
@Api( value = "/mappings" )
public interface MappingRest {
    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store with a UUID local name and creates
     * a new MappingRecord in the catalog.
     *
     * @param title The required title for the new MappingRecord
     * @param description The optional description for the new MappingRecord
     * @param markdown The optional markdown abstract for the new MappingRecord.
     * @param keywords The optional list of keywords strings for the new MappingRecord
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @return a Response with the MappingRecord Resource ID
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Upload mapping sent as form data.")
    Response upload(@Context ContainerRequestContext context,
                    @FormDataParam("title") String title,
                    @FormDataParam("description") String description,
                    @FormDataParam("markdown") String markdown,
                    @FormDataParam("keywords") List<FormDataBodyPart> keywords,
                    @FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld);

    /**
     * Collects the JSON-LD from an uploaded mapping and returns it as JSON.
     *
     * @param recordId the id of an uploaded mapping
     * @return a response with the JSON-LD from the uploaded mapping
     */
    @GET
    @Path("{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieve JSON-LD of an uploaded mapping")
    Response getMapping(@PathParam("recordId") String recordId);

    /**
     * Downloads an uploaded mapping.
     *
     * @param recordId the id of an uploaded mapping
     * @return a response with mapping to download
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Download an uploaded mapping")
    Response downloadMapping(@PathParam("recordId") String recordId,
                             @DefaultValue("jsonld") @QueryParam("format") String format);

    /**
     * Deletes an uploaded mapping from the data store.
     *
     * @param recordId the id of an uploaded mapping
     * @return a response indicating the success or failure of the request
     */
    @DELETE
    @Path("{recordId}")
    @RolesAllowed("user")
    @ApiOperation("Delete an uploaded mapping")
    Response deleteMapping(@Context ContainerRequestContext context,
                           @PathParam("recordId") String recordId);
}
