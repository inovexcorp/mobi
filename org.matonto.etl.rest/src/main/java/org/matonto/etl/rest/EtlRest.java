package org.matonto.etl.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("/etl")
@Api( value = "/etl" )
public interface EtlRest {

    /**
     * Uploads a delimited document to the data/tmp/ directory.
     *
     * @param fileInputStream an InputStream of a delimited document passed as form data
     * @return a response with the name of the file created on the server
    */
    @POST
    @Path("csv/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @ApiOperation("Upload CSV file sent as form data.")
    Response upload(@FormDataParam("delimitedFile") InputStream fileInputStream);

    /**
     * Maps the data in an uploaded delimited document into RDF in JSON-LD format
     * using a JSON-LD mapping file that is saved to the server. The file must be
     * present in the data/tmp/ directory.
     *
     * @param fileName a string containing the name of the delimited document in the 
     *                 data/tmp/ directory
     * @param mappingInputStream an InputStream of the JSON-LD mapping file passed as
     *                           form data
     * @return a response with a JSON object containing the mapping file name and a
     *      JSON-LD string containing the converted data
    */
    @POST
    @Path("csv/etl/{documentName}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("ETL the document using a mapping file sent as form data.")
    Response etlFile(@PathParam("documentName") String fileName, 
            @FormDataParam("mappingFile") InputStream mappingInputStream);

    /**
    * Retrieves a preview of the first specified number of rows of an uploaded
    * delimited document. The file must be present in the data/tmp/ directory.
    * 
    * @param fileName a string containing the name of the delimited document in the
    *                 data/tmp/ directory
    * @param rowEnd the number of rows to retrieve from the delimited document. NOTE:
    *               the default number of rows is 10
    * @return a response with a JSON array. Each element in the array is a row in the
    *         the document. The row is an array of strings which are the cells in the
    *         row in the document
    */
    @GET
    @Path("csv/preview/{documentName}")
    @ApiOperation("Gather rows from an uploaded document.")
    Response getRows(@PathParam("documentName") String fileName,
            @DefaultValue("10") @QueryParam("Row-Count") int rowEnd);
}
