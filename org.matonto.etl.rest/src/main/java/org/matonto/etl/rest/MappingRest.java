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
     * Uploads a mapping file to the data/tmp/ directory sent as form data or
     * a JSON-LD string.
     *
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param jsonld a string with a mapping serialized as JSON-LD
     * @return a response with the name of the file created on the server
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @ApiOperation("Upload mapping file sent as form data.")
    Response upload(@FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld,
                    @QueryParam("Id") String mappingId);

    /**
     * Produces a JSON array of all the mapping file names in the data/tmp directory.
     *
     * @return a response with a JSON array of all the mapping file names
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieve list of all mapping file names")
    Response getFileNames();

    /**
     * Collects the JSON-LD from an uploaded mapping file and returns it as JSON.
     *
     * @param fileName a string containing the name of an uploaded mapping file
     * @return a response with the JSON-LD from the uploaded mapping file
     */
    @GET
    @Path("{fileName}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieve the JSON-LD in an uploaded mapping file")
    Response getMapping(@PathParam("fileName") String fileName);

    /**
     * Downloads an uploaded mapping file.
     *
     * @param fileName a string containing the name of an uploaded mapping file
     * @return a response with an octet-stream to download the mapping file
     */
    @GET
    @Path("{fileName}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @ApiOperation("Download an uploaded mapping file")
    Response downloadMapping(@PathParam("fileName") String fileName);
}
