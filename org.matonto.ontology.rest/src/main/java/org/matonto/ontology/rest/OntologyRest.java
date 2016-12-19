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

import java.io.InputStream;
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

@Path("/ontologies")
@Api( value = "/ontologies" )
public interface OntologyRest {

    /**
     * Ingests/uploads an ontology file to a data store and creates and stores an OntologyRecord using the form data in
     * the repository to track the work done on it. A master Branch is created and stored with an initial Commit
     * containing the data provided in the ontology file.
     *
     * @param context the context of the request.
     * @param fileInputStream the ontology file to upload.
     * @param title the title for the OntologyRecord.
     * @param description the description for the OntologyRecord
     * @param keywords the comma separated list of keywords associated with the OntologyRecord
     * @return OK if persisted, BAD REQUEST if publishers can't be found, or INTERNAL SERVER ERROR if there is a problem
     *         creating the OntologyRecord.
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Uploads an ontology file to the data store.")
    Response uploadFile(@Context ContainerRequestContext context,
                        @FormDataParam("file") InputStream fileInputStream,
                        @FormDataParam("title") String title,
                        @FormDataParam("description") String description,
                        @FormDataParam("keywords") String keywords);

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified by the
     * provided ontologyId.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param entityIdStr the String representing the edited entity id. NOTE: Assumes id represents an IRI unless String
     *                    begins with "_:".
     * @param entityJson the String representing the edited Resource.
     * @return a Response indicating whether it was successfully updated.
     */
    @POST
    @Path("{ontologyId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates the requester's InProgressCommit with the provided entity.")
    Response saveChangesToOntology(@Context ContainerRequestContext context,
                                   @PathParam("ontologyId") String ontologyIdStr,
                                   @QueryParam("branchId") String branchIdStr,
                                   @QueryParam("commitId") String commitIdStr,
                                   @QueryParam("entityId") String entityIdStr,
                                   String entityJson);

    /**
     * Returns IRIs in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the IRIs in the identified ontology.")
    Response getIRIsInOntology(@Context ContainerRequestContext context,
                               @PathParam("ontologyId") String ontologyIdStr,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation properties in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the annotations in the identified ontology.")
    Response getAnnotationsInOntology(@Context ContainerRequestContext context,
                                      @PathParam("ontologyId") String ontologyIdStr,
                                      @QueryParam("branchId") String branchIdStr,
                                      @QueryParam("commitId") String commitIdStr);

    /**
     * Add a new owl annotation property to the ontology identified by the provided IDs associated with the
     * requester's InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param annotationJson the String representing the new annotation in JSON-LD.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/annotations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new annotation to the identified ontology.")
    Response addAnnotationToOntology(@Context ContainerRequestContext context,
                                     @PathParam("ontologyId") String ontologyIdStr,
                                     String annotationJson);

    /**
     * Delete annotation with requested annotation ID from ontology identified by the provided IDs from the server.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param annotationIdStr the String representing the annotation Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/annotations/{annotationId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified annotation from the identified ontology.")
    Response deleteAnnotationFromOntology(@Context ContainerRequestContext context,
                                     @PathParam("ontologyId") String ontologyIdStr,
                                     @PathParam("annotationId") String annotationIdStr,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the classes in the identified ontology.")
    Response getClassesInOntology(@Context ContainerRequestContext context,
                                  @PathParam("ontologyId") String ontologyIdStr,
                                  @QueryParam("branchId") String branchIdStr,
                                  @QueryParam("commitId") String commitIdStr);

    /**
     * Add a new class to ontology identified by the provided IDs from the server associated with the requester's
     * InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param classJson the String representing the new class model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/classes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new class to the identified ontology.")
    Response addClassToOntology(@Context ContainerRequestContext context,
                                @PathParam("ontologyId") String ontologyIdStr,
                                String classJson);

    /**
     * Delete class with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context the context of the request.
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
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/classes/{classId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified class from the identified ontology.")
    Response deleteClassFromOntology(@Context ContainerRequestContext context,
                                     @PathParam("ontologyId") String ontologyIdStr,
                                     @PathParam("classId") String classIdStr,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatypes in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the datatypes in the identified ontology.")
    Response getDatatypesInOntology(@Context ContainerRequestContext context,
                                    @PathParam("ontologyId") String ontologyIdStr,
                                    @QueryParam("branchId") String branchIdStr,
                                    @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new datatype to the ontology identified by the provided IDs associated with the requester's
     * InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param datatypeJson the String representing the new datatype model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/datatypes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new datatype to the identified ontology.")
    Response addDatatypeToOntology(@Context ContainerRequestContext context,
                                   @PathParam("ontologyId") String ontologyIdStr,
                                   String datatypeJson);

    /**
     * Delete the datatype from the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param datatypeIdStr the String representing the datatype Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/datatypes/{datatypeId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified datatype from the identified ontology.")
    Response deleteDatatypeFromOntology(@Context ContainerRequestContext context,
                                        @PathParam("ontologyId") String ontologyIdStr,
                                        @PathParam("datatypeId") String datatypeIdStr,
                                        @QueryParam("branchId") String branchIdStr,
                                        @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object properties in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the object properties in the identified ontology.")
    Response getObjectPropertiesInOntology(@Context ContainerRequestContext context,
                                           @PathParam("ontologyId") String ontologyIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new object property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param objectPropertyJson the String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/object-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new object property to the identified ontology.")
    Response addObjectPropertyToOntology(@Context ContainerRequestContext context,
                                         @PathParam("ontologyId") String ontologyIdStr,
                                         String objectPropertyJson);

    /**
     * Delete object property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param objectPropertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                            an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/object-properties/{objectPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified object property from the identified ontology.")
    Response deleteObjectPropertyFromOntology(@Context ContainerRequestContext context,
                                              @PathParam("ontologyId") String ontologyIdStr,
                                              @PathParam("objectPropertyId") String objectPropertyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data properties in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the data properties from the identified ontology.")
    Response getDataPropertiesInOntology(@Context ContainerRequestContext context,
                                         @PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new data property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param dataPropertyJson the String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/data-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new data property to the identified ontology.")
    Response addDataPropertyToOntology(@Context ContainerRequestContext context,
                                       @PathParam("ontologyId") String ontologyIdStr,
                                       String dataPropertyJson);

    /**
     * Delete data property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param dataPropertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/data-properties/{dataPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified data property from the identified ontology.")
    Response deleteDataPropertyFromOntology(@Context ContainerRequestContext context,
                                            @PathParam("ontologyId") String ontologyIdStr,
                                            @PathParam("dataPropertyId") String dataPropertyIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individuals in the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the individuals in the identified ontology.")
    Response getNamedIndividualsInOntology(@Context ContainerRequestContext context,
                                           @PathParam("ontologyId") String ontologyIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new individual to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param individualJson the String representing the new individual model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{ontologyId}/named-individuals")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new individual to the identified ontology.")
    Response addIndividualToOntology(@Context ContainerRequestContext context,
                                     @PathParam("ontologyId") String ontologyIdStr,
                                     String individualJson);

    /**
     * Delete individual with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context the context of the request.
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
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{ontologyId}/named-individuals/{individualId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified individual from the identified ontology.")
    Response deleteIndividualFromOntology(@Context ContainerRequestContext context,
                                          @PathParam("ontologyId") String ontologyIdStr,
                                          @PathParam("individualId") String individualIdStr,
                                          @QueryParam("branchId") String branchIdStr,
                                          @QueryParam("commitId") String commitIdStr);

    /**
     * Returns IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the IRIs from the imported ontologies of the identified ontology.")
    Response getIRIsInImportedOntologies(@Context ContainerRequestContext context,
                                         @PathParam("ontologyId") String ontologyIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param context the context of the request.
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
    @ApiOperation("Retrieves the JSON-LD of all directly imported ontologies.")
    Response getImportsClosure(@Context ContainerRequestContext context,
                               @PathParam("ontologyId") String ontologyIdStr,
                               @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation properties in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the annotations from the imported ontologies of the identified ontology.")
    Response getAnnotationsInImportedOntologies(@Context ContainerRequestContext context,
                                                @PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the classes from the imported ontologies of the identified ontology.")
    Response getClassesInImportedOntologies(@Context ContainerRequestContext context,
                                            @PathParam("ontologyId") String ontologyIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatypes in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the datatypes from the imported ontologies of the identified ontology.")
    Response getDatatypesInImportedOntologies(@Context ContainerRequestContext context,
                                              @PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object properties in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the object properties from the imported ontologies of the identified ontology.")
    Response getObjectPropertiesInImportedOntologies(@Context ContainerRequestContext context,
                                                     @PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data properties in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the data properties from the imported ontologies of the identified ontology.")
    Response getDataPropertiesInImportedOntologies(@Context ContainerRequestContext context,
                                                   @PathParam("ontologyId") String ontologyIdStr,
                                                   @QueryParam("branchId") String branchIdStr,
                                                   @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individuals in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the named individuals from the imported ontologies of the identified ontology.")
    Response getNamedIndividualsInImportedOntologies(@Context ContainerRequestContext context,
                                                     @PathParam("ontologyId") String ontologyIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON class hierarchy for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the class hierarchies for the identified ontology.")
    Response getOntologyClassHierarchy(@Context ContainerRequestContext context,
                                       @PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON object property hierarchy for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the object property hierarchies for the identified ontology.")
    Response getOntologyObjectPropertyHierarchy(@Context ContainerRequestContext context,
                                                @PathParam("ontologyId") String ontologyIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON data property hierarchy for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the data property hierarchies for the identified ontology.")
    Response getOntologyDataPropertyHierarchy(@Context ContainerRequestContext context,
                                              @PathParam("ontologyId") String ontologyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON SKOS concept hierarchy for the ontology identified by the provided IDs.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the concept hierarchies for the identified ontology.")
    Response getConceptHierarchy(@Context ContainerRequestContext context,
                                 @PathParam("ontologyId") String ontologyIdStr,
                                 @QueryParam("branchId") String branchIdStr,
                                 @QueryParam("commitId") String commitIdStr);

    /**
     * Returns classes with individuals defined in the ontology in a hierarchical structure with the requested
     * ontologyId.
     *
     * @param context the context of the request.
     * @param ontologyIdStr the String representing the ontology Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return nested JSON structure that represents the class hierarchy for classes with individuals in the ontology
     *         identified by the provided IDs.
     */
    @GET
    @Path("{ontologyId}/classes-with-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the classes with individuals in a hierarchical structure for the identified ontology.")
    Response getClassesWithIndividuals(@Context ContainerRequestContext context,
                                       @PathParam("ontologyId") String ontologyIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Returns JSON SPARQL query results containing statements with the requested entity IRI as the predicate or object
     * of each statement.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the usages of the identified entity in the identified ontology.")
    Response getEntityUsages(@Context ContainerRequestContext context,
                             @PathParam("ontologyId") String ontologyIdStr,
                             @PathParam("entityIri") String entityIRIStr,
                             @QueryParam("branchId") String branchIdStr,
                             @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the JSON String of the resulting entities sorted by type from the ontology with the requested ontology ID
     * that have statements which contain the requested searchText in a Literal Value.
     *
     * @param context the context of the request.
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
    @ApiOperation("Gets the search results from the identified ontology using the provided searchText.")
    Response getSearchResults(@Context ContainerRequestContext context,
                              @PathParam("ontologyId") String ontologyIdStr,
                              @QueryParam("searchText") String searchText,
                              @QueryParam("branchId") String branchIdStr,
                              @QueryParam("commitId") String commitIdStr);
}
