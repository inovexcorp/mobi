package org.matonto.ontology.rest;

/*-
 * #%L
 * org.matonto.ontology.rest
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
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.matonto.catalog.api.ontologies.mcat.OntologyRecord;

import java.io.InputStream;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/ontologies")
@Api( value = "/ontologies" )
public interface OntologyRest {

    /**
     * Ingests/uploads an ontology file to a data store and creates an OntologyRecord in the repository to track the
     * work done on it. A master Branch is created and stored with an initial Commit containing the data provided in the
     * ontology file.
     *
     * @param fileInputStream the ontology file to upload
     * @param record the OntologyRecord containing metadata describing the uploaded ontology
     * @return true if persisted, false otherwise
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response uploadFile(@FormDataParam("file") InputStream fileInputStream,
                        @FormDataParam("record") OntologyRecord record);

    /**
     * Updates the InProgressCommit associated with the OntologyRecord identified by the provided ontologyId.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceIdStr the String representing the edited Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the edited Resource.
     * @return true if updated, false otherwise
     */
    @POST
    @Path("{ontologyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response saveChangesToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                   @QueryParam("resourceId") String resourceIdStr,
                                   @QueryParam("resourceJson") String resourceJson);

    /**
     * Returns IRIs in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return IRIs in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getIRIsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation properties in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return annotation properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getAnnotationsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                      @QueryParam("branchId") String branchIdStr,
                                      @QueryParam("commitId") String commitIdStr);

    /**
     * Create a new owl annotation property in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param annotationJson the String representing the new annotation in JSON-LD.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return annotation properties in the ontology identified by the provided IDs.
     */
    @POST
    @Path("{ontologyId}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addAnnotationToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                     @QueryParam("annotationJson") String annotationJson,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return classes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getClassesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                  @QueryParam("branchId") String branchIdStr,
                                  @QueryParam("commitId") String commitIdStr);

    /**
     * Add class to ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new class model.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyId}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addClassToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                @QueryParam("resourceJson") String resourceJson,
                                @QueryParam("branchId") String branchIdStr,
                                @QueryParam("commitId") String commitIdStr);

    /**
     * Delete class with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param classIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyId}/classes/{classId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteClassFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                     @PathParam("classId") String classIdStr,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatypes in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return datatypes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDatatypesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                    @QueryParam("branchId") String branchIdStr,
                                    @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object properties in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return object properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getObjectPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds the object property to the ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new property model.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyId}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addObjectPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("resourceJson") String resourceJson,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Delete object property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param propertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyId}/object-properties/{propertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteObjectPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                              @PathParam("propertyId") String propertyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data properties in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return data properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDataPropertiesInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Adds the data property to the ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new property model.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyId}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addDataPropertyToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("resourceJson") String resourceJson,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Delete data property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param propertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyId}/data-properties/{propertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteDataPropertyFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                            @PathParam("propertyId") String propertyIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individuals in the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return named individuals in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getNamedIndividualsInOntology(@PathParam("ontologyId") String ontologyIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds the individual to the ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param resourceJson the String representing the new individual model.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if added, false otherwise.
     */
    @POST
    @Path("{ontologyId}/named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response addIndividualToOntology(@PathParam("ontologyId") String ontologyIdStr,
                                     @QueryParam("resourceJson") String resourceJson,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Delete individual with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param individualIdStr the String representing the individual Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return true if deleted, false otherwise.
     */
    @DELETE
    @Path("{ontologyId}/named-individuals/{individualId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response deleteIndividualFromOntology(@PathParam("ontologyId") String ontologyIdStr,
                                          @PathParam("individualId") String individualIdStr,
                                          @QueryParam("branchId") String branchIdStr,
                                          @QueryParam("commitId") String commitIdStr);

    /**
     * Returns IRIs in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return IRIs in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getIRIsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return array of imported ontologies from the ontology with the requested ID in the requested format
     */
    @GET
    @Path("{ontologyId}/imported-ontologies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation(value = "Retrieves the JSON-LD of all directly imported ontologies")
    Response getImportsClosure(@PathParam("ontologyId") String ontologyIdStr,
                               @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation properties in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return annotation properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getAnnotationsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return classes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getClassesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatypes in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return datatypes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDatatypesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object properties in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return object properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getObjectPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data properties in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return data properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getDataPropertiesInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                   @QueryParam("branchId") String branchIdStr,
                                                   @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individuals in the direct imported ontologies of the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return named individuals in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/imported-named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getNamedIndividualsInImportedOntologies(@PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON class hierarchy for the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the class hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{ontologyId}/class-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntologyClassHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON object property hierarchy for the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the object property hierarchy for the ontology with requested
     *         ontology ID.
     */
    @GET
    @Path("{ontologyId}/object-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntologyObjectPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON data property hierarchy for the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the data property hierarchy for the ontology with requested
     *         ontology ID.
     */
    @GET
    @Path("{ontologyId}/data-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntologyDataPropertyHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes with individuals defined in the ontology with the requested ontologyId.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the class hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{ontologyId}/classes-with-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getClassesWithIndividuals(@PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Returns JSON SPARQL query results containing statements with the requested entity IRI as the predicate of
     * each statement.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param entityIRIStr the String representing the entity Resource IRI.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON SPARQL query results.
     */
    @GET
    @Path("{ontologyId}/entity-usages/{entityIri}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getEntityUsages(@PathParam("ontologyId") String ontologyIdStr,
                             @PathParam("entityIri") String entityIRIStr,
                             @QueryParam("branchId") String branchIdStr,
                             @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON SKOS concept hierarchy for the ontology identified by the provided IDs.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the SKOS concept hierarchy for the ontology with requested
     *         ontology ID.
     */
    @GET
    @Path("{ontologyId}/concept-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getConceptHierarchy(@PathParam("ontologyId") String ontologyIdStr,
                                 @QueryParam("branchId") String branchIdStr,
                                 @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON String of the resulting entities sorted by type from the ontology with the requested ontology ID
     * that have statements which contain the requested searchText in a Literal Value.
     *
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param searchText the String for the text that is searched for in all of the Literals within the ontology with
     *                   the requested ontology ID.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON String providing the sorted list of results from the search.
     */
    @GET
    @Path("{ontologyId}/search-results")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getSearchResults(@PathParam("ontologyId") String ontologyIdStr,
                              @QueryParam("searchText") String searchText,
                              @QueryParam("branchId") String branchIdStr,
                              @QueryParam("commitId") String commitIdStr);
}
