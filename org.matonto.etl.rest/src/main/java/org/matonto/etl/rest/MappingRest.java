package org.matonto.etl.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("/mappings")
@Api( value = "/mappings" )
public interface MappingRest {

    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store
     * with the passed local name.
     *
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @param mappingId the localName for the new mapping file
     * @return a response with a boolean indicating the success of the upload
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @ApiOperation("Upload mapping sent as form data.")
    Response upload(@FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld,
                    @QueryParam("Id") String mappingId);

    /**
     * Produces a JSON array of all the mapping IRIs in the data store.
     *
     * @return a response with a JSON array of all the mapping IRIs
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieve list of all mapping IRIs")
    Response getMappingNames();

    /**
     * Collects the JSON-LD from an uploaded mapping and returns it as JSON.
     *
     * @param mappingName the local name of an uploaded mapping
     * @return a response with the JSON-LD from the uploaded mapping
     */
    @GET
    @Path("{mappingName}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieve JSON-LD of an uploaded mapping")
    Response getMapping(@PathParam("mappingName") String mappingName);

    /**
     * Downloads an uploaded mapping.
     *
     * @param mappingName the local name of an uploaded mapping
     * @return a response with an octet-stream to download the mapping
     */
    @GET
    @Path("{mappingName}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @ApiOperation("Download an uploaded mapping")
    Response downloadMapping(@PathParam("mappingName") String mappingName);

    /**
     * Deletes an uploaded maping from the data store.
     *
     * @param mappingName the local name of an uploaded mapping
     * @return a response with a boolean indicating the success of the deletion
     */
    @DELETE
    @Path("{mappingName}")
    @ApiOperation("Delete an uploaded mapping")
    Response deleteMapping(@PathParam("mappingName") String mappingName);
}
