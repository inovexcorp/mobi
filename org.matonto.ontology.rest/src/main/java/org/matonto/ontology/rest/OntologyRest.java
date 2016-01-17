package org.matonto.ontology.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataParam;

import javax.validation.constraints.NotNull;
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
    @Path("getAllOntologyIds")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiOperation(value = "Gets all Ontology Resource identifiers")
    Response getAllOntologyIds();

    /**
     * Returns JSON-formatted ontologies in the ontology registry
     *
     * @return all ontologies in JSON-LD format.
     */
    @GET
    @Path("/getAllOntologies")
    @Produces(MediaType.APPLICATION_JSON)
    Response getAllOntologies();

    /**
     * Returns JSON-formatted ontologies with requested ontology IDs; The ontology id list
     * is provided as a comma separated string.
     *
     * @param ontologyIdList a comma separated String representing the ontology ids
     * @return all ontologies specified by ontologyIdList in JSON-LD format
     */
    @GET
    @Path("/getOntologies")
    @Produces(MediaType.APPLICATION_JSON)
    Response getOntologies(@QueryParam("ontologyIdList") String ontologyIdList);

    /**
     * Ingests/uploads an ontology file to a data store
     *
     * @param fileInputStream The ontology file to upload
     * @return true if persisted, false otherwise
     */
    @POST
    @Path("/uploadOntology")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    Response uploadFile(@FormDataParam("file") InputStream fileInputStream);

    /**
     * Returns ontology with requested ontology ID in the requested format
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return ontology with requested ontology ID in the requested format
     */
    @GET
    @Path("/getOntology")
    @Produces(MediaType.APPLICATION_JSON)
    Response getOntology(
            @NotNull @QueryParam("ontologyIdStr") String ontologyIdStr,
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat);

    /**
     * Streams the ontology with requested ontology ID to an OutputStream.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return the ontology with requested ontology ID as an OutputStream.
     */
    @GET
    @Path("/downloadOntology")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    Response downloadOntologyFile(@QueryParam("ontologyIdStr") String ontologyIdStr,
                                  @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat);

    /**
     * Delete ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @GET
    @Path("/deleteOntology")
    @Produces(MediaType.APPLICATION_JSON)
    Response deleteOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns IRIs in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return IRIs in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getAllIRIs")
    @Produces(MediaType.APPLICATION_JSON)
    Response getIRIsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns annotation properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getAnnotations")
    @Produces(MediaType.APPLICATION_JSON)
    Response getAnnotationsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns classes in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return classes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getClasses")
    @Produces(MediaType.APPLICATION_JSON)
    Response getClassesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns datatypes in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return datatypes in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getDatatypes")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDatatypesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns object properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return object properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getObjectProperties")
    @Produces(MediaType.APPLICATION_JSON)
    Response getObjectPropertiesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns data properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return data properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getDataProperties")
    @Produces(MediaType.APPLICATION_JSON)
    Response getDataPropertiesInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);

    /**
     * Returns named individuals in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return named individuals in the ontology with requested ontology ID.
     */
    @GET
    @Path("/getNamedIndividuals")
    @Produces(MediaType.APPLICATION_JSON)
    Response getNamedIndividualsInOntology(@QueryParam("ontologyIdStr") String ontologyIdStr);
}
