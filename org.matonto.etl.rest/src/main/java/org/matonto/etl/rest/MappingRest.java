package org.matonto.etl.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import java.util.List;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;


@Path("/mappings")
@Api( value = "/mappings" )
public interface MappingRest {
    /**
     * If passed an id list, produces a JSON array of all the mapping
     * with matching IRIs in the data store. Otherwise just produces a
     * JSON array of all mapping IRIs.
     *
     * @param idList a list of local names for mappings
     * @return a response with a JSON array of all the mapping IRIs
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation("Retrieve list of all mapping IRIs")
    Response getMappingNames(@QueryParam("Ids") List<String> idList);

    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store
     * with a UUID local name.
     *
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @return a response with the IRI for the mapping
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @ApiOperation("Upload mapping sent as form data.")
    Response upload(@FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld);

    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store
     * with the passed local name. If the mapping already exists, replaces the
     * existing mapping.
     *
     * @param mappingId the local name for the mapping
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @return a response with the IRI for the mapping
     */
    @PUT
    @Path("{mappingName}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @ApiOperation("Replaces a mapping with a new mapping sent as form data")
    Response upload(@PathParam("mappingName") String mappingId,
                    @FormDataParam("file") InputStream fileInputStream,
                    @FormDataParam("file") FormDataContentDisposition fileDetail,
                    @FormDataParam("jsonld") String jsonld);

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
