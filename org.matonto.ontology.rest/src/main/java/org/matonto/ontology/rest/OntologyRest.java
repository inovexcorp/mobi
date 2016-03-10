package org.matonto.ontology.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.InputStream;


@Path("/ontology")
@Api( value = "/ontology" )
public interface OntologyRest {

    /**
     * Returns all ontology Resource identifiers.
     *
     * @return all ontology Resource identifiers.
     */
    @GET
    @Path("/ontologyids")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "Gets all Ontology Resource identifiers")
    Response getAllOntologyIds();

    /**
     * Returns JSON-formatted ontologies in the ontology registry
     *
     * @return all ontologies in JSON-LD format.
     */
    @GET
    @Path("/ontologies")
    @Produces(MediaType.APPLICATION_JSON)
    Response getAllOntologies();

    /**
     * Returns JSON-formatted ontologies with requested ontology IDs; The ontology id list
     * is provided as a comma separated string. NOTE: If an ontology in the list does not exist,
     * it will be excluded from the response.
     *
     * @param ontologyids a comma separated String representing the ontology ids
     * @return all ontologies specified by ontologyIdList in JSON-LD format
     */
    @GET
    @Path("/list/ontologies/{ontologyids}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getOntologies(@PathParam("ontologyids") String ontologyIdList);

    /**
     * Ingests/uploads an ontology file to a data store
     *
     * @param fileInputStream The ontology file to upload
     * @return true if persisted, false otherwise
     */
    @POST
    @Path("/ontology")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    Response uploadFile(@FormDataParam("file") InputStream fileInputStream);

    /**
     * Returns ontology with requested ontology ID in the requested format
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return ontology with requested ontology ID in the requested format
     */
    @GET
    @Path("/ontology/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getOntology(
            @PathParam("ontologyid") String ontologyIdStr,
            @DefaultValue("jsonld") @QueryParam("rdfformat") String rdfFormat);

    /**
     * Streams the ontology with requested ontology ID to an OutputStream.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return the ontology with requested ontology ID as an OutputStream.
     */
    @GET
    @Path("/download/ontology/{ontologyid}")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    Response downloadOntologyFile(@PathParam("ontologyid") String ontologyIdStr,
                                  @DefaultValue("jsonld") @QueryParam("rdfformat") String rdfFormat);

    /**
     * Delete ontology with requested ontology ID from the server.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("/ontology/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response deleteOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns IRIs in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return IRIs in the ontology with requested ontology ID.
     */
    @GET
    @Path("/iris/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getIRIsInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns annotation properties in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/annotations/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getAnnotationsInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns classes in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return classes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/classes/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getClassesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns datatypes in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return datatypes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/datatypes/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDatatypesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns object properties in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return object properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/object-properties/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getObjectPropertiesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns data properties in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return data properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/data-properties/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDataPropertiesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns named individuals in the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return named individuals in the ontology with requested ontology ID.
     */
    @GET
    @Path("/named-individuals/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getNamedIndividualsInOntology(@PathParam("ontologyid") String ontologyIdStr);
    
    /**
     * Returns IRIs in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return IRIs in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-iris/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getIRIsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns annotation properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-annotations/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getAnnotationsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns classes in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return classes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-classes/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getClassesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns datatypes in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return datatypes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-datatypes/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDatatypesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns object properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return object properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-object-properties/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getObjectPropertiesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns data properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return data properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-data-properties/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDataPropertiesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns named individuals in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyid the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return named individuals in the ontology with requested ontology ID.
     */
    @GET
    @Path("/imported-named-individuals/{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    Response getNamedIndividualsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);
}
