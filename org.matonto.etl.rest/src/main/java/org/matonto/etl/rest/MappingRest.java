package org.matonto.etl.rest;

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
     * Uploads a mapping sent as form data or a JSON-LD string into a data store
     * with the passed id. If the mapping already exists, replaces the existing mapping.
     *
     * @param mappingIRI the id for the mapping
     * @param fileInputStream an InputStream of a mapping file passed as form data
     * @param fileDetail information about the file being uploaded, including the name
     * @param jsonld a mapping serialized as JSON-LD
     * @return a response with the IRI for the mapping
     */
    @PUT
    @Path("{mappingIRI}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Replaces a mapping with a new mapping sent as form data")
    Response upload(@PathParam("mappingIRI") String mappingIRI,
                    @FormDataParam("file") InputStream fileInputStream,
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
     * @return a response with an octet-stream to download the mapping
     */
    @GET
    @Path("{mappingIRI}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*"})
    @RolesAllowed("user")
    @ApiOperation("Download an uploaded mapping")
    Response downloadMapping(@PathParam("mappingIRI") String mappingIRI);

    /**
     * Deletes an uploaded mapping from the data store.
     *
     * @param mappingIRI the id of an uploaded mapping
     * @return a response with a boolean indicating the success of the deletion
     */
    @DELETE
    @Path("{mappingIRI}")
    @RolesAllowed("user")
    @ApiOperation("Delete an uploaded mapping")
    Response deleteMapping(@PathParam("mappingIRI") String mappingIRI);
}
