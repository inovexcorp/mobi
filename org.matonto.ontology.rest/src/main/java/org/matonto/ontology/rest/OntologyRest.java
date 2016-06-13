package org.matonto.ontology.rest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.io.InputStream;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/ontologies")
@Api( value = "/ontologies" )
public interface OntologyRest {

    /**
     * Returns all ontology Resource identifiers.
     *
     * @return all ontology Resource identifiers.
     */
    @GET
    @Path("ontologyids")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation(value = "Gets all Ontology Resource identifiers")
    Response getAllOntologyIds();

    /**
     * Returns JSON-formatted ontologies with requested ontology IDs; The ontology id list
     * is provided as a comma separated string. NOTE: If an ontology in the list does not exist,
     * it will be excluded from the response.
     *
     * @param ontologyIdList a comma separated String representing the ontology ids
     * @return all ontologies specified by ontologyIdList in JSON-LD format
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntologies(@QueryParam("ontologyids") String ontologyIdList);

    /**
     * Ingests/uploads an ontology file to a data store.
     *
     * @param fileInputStream The ontology file to upload
     * @return true if persisted, false otherwise
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response uploadFile(@FormDataParam("file") InputStream fileInputStream);

    /**
     * Ingests an ontology json-ld string to a data store.
     *
     * @param ontologyJson The ontology json-ld to upload
     * @return true if persisted, false otherwise
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response uploadOntologyJson(@QueryParam("ontologyjson") String ontologyJson);

    /**
     * Returns ontology with requested ontology ID in the requested format
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return ontology with requested ontology ID in the requested format
     */
    @GET
    @Path("{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntology(@PathParam("ontologyid") String ontologyIdStr,
                         @DefaultValue("jsonld") @QueryParam("rdfformat") String rdfFormat);

    /**
     * Streams the ontology with requested ontology ID to an OutputStream.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return the ontology with requested ontology ID as an OutputStream.
     */
    @GET
    @Path("{ontologyid}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*"})
    @RolesAllowed("user")
    Response downloadOntologyFile(@PathParam("ontologyid") String ontologyIdStr,
                                  @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                                  @DefaultValue("ontology") @QueryParam("fileName") String fileName);

    /**
     * Replaces the ontology's resource with the new data
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceIdStr the String representing the edited Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the edited Resource.
     * @return true if updated, false otherwise
     */
    @POST
    @Path("{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response saveChangesToOntology(@PathParam("ontologyid") String ontologyIdStr,
                                   @QueryParam("resourceid") String resourceIdStr,
                                   @QueryParam("resourcejson") String resourceJson);

    /**
     * Delete ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns IRIs in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return IRIs in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getIRIsInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns annotation properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getAnnotationsInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Create a new owl annotation property in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param annotationJson the String representing the new annotation in JSON-LD.
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @POST
    @Path("{ontologyid}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addAnnotationToOntology(@PathParam("ontologyid") String ontologyIdStr,
                                     @QueryParam("annotationjson") String annotationJson);

    /**
     * Returns classes in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return classes in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getClassesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Add class to ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new class model.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyid}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addClassToOntology(@PathParam("ontologyid") String ontologyIdStr,
                                @QueryParam("resourcejson") String resourceJson);

    /**
     * Delete class with requested class ID from ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param classIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyid}/classes/{classid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteClassFromOntology(@PathParam("ontologyid") String ontologyIdStr,
                                      @PathParam("classid") String classIdStr);

    /**
     * Returns datatypes in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return datatypes in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDatatypesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns object properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return object properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getObjectPropertiesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Adds the object property to the ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new property model.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyid}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addObjectPropertyToOntology(@PathParam("ontologyid") String ontologyIdStr,
                                         @QueryParam("resourcejson") String resourceJson);

    /**
     * Delete object property with requested class ID from ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param propertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyid}/object-properties/{propertyid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteObjectPropertyFromOntology(@PathParam("ontologyid") String ontologyIdStr,
                                      @PathParam("propertyid") String propertyIdStr);

    /**
     * Returns data properties in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return data properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDataPropertiesInOntology(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Adds the data property to the ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new property model.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyid}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addDataPropertyToOntology(@PathParam("ontologyid") String ontologyIdStr,
                                       @QueryParam("resourcejson") String resourceJson);

    /**
     * Delete data property with requested class ID from ontology with requested ontology ID from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param propertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyid}/data-properties/{propertyid}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteDataPropertyFromOntology(@PathParam("ontologyid") String ontologyIdStr,
                                              @PathParam("propertyid") String propertyIdStr);

    /**
     * Returns named individuals in the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return named individuals in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getNamedIndividualsInOntology(@PathParam("ontologyid") String ontologyIdStr);
    
    /**
     * Returns IRIs in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return IRIs in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getIRIsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return array of imported ontologies from the ontology with the requested ID in the requested format
     */
    @GET
    @Path("{ontologyid}/imported-ontologies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation(value = "Retrieves the JSON-LD of all directly imported ontologies")
    Response getImportsClosure(@PathParam("ontologyid") String ontologyIdStr,
                                     @DefaultValue("jsonld") @QueryParam("rdfformat") String rdfFormat);

    /**
     * Returns annotation properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return annotation properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getAnnotationsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns classes in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return classes in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getClassesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns datatypes in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return datatypes in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDatatypesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns object properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return object properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getObjectPropertiesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns data properties in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return data properties in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDataPropertiesInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);

    /**
     * Returns named individuals in the direct imported ontologies of the ontology with requested ontology ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @return named individuals in the ontology with requested ontology ID.
     */
    @GET
    @Path("{ontologyid}/imported-named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getNamedIndividualsInImportedOntologies(@PathParam("ontologyid") String ontologyIdStr);
}
