package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import java.io.InputStream;
import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/ontologies")
@Api(value = "/ontologies")
public interface OntologyRest {

    /**
     * Ingests/uploads an ontology file to a data store and creates and stores an OntologyRecord using the form data in
     * the repository to track the work done on it. A master Branch is created and stored with an initial Commit
     * containing the data provided in the ontology file.
     *
     * @param context         the context of the request.
     * @param fileInputStream the ontology file to upload.
     * @param title           the title for the OntologyRecord.
     * @param description     the optional description for the OntologyRecord.
     * @param markdown        the optional markdown abstract for the new OntologyRecord.
     * @param keywords        the optional list of keyword strings for the OntologyRecord.
     * @return CREATED with record ID in the data if persisted, BAD REQUEST if publishers can't be found, or INTERNAL
     *      SERVER ERROR if there is a problem creating the OntologyRecord.
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
                        @FormDataParam("markdown") String markdown,
                        @FormDataParam("keywords") List<FormDataBodyPart> keywords);

    /**
     * Ingests/uploads the JSON-LD of an ontology to a data store and creates and stores an OntologyRecord using the
     * form data in the repository to track the work done on it. A master Branch is created and stored with an initial
     * Commit containing the data provided in the JSON-LD for the ontology.
     *
     * @param context      the context of the request.
     * @param title        the title for the OntologyRecord.
     * @param description  the optional description for the OntologyRecord.
     * @param markdown     the optional markdown abstract for the new OntologyRecord.
     * @param keywords     the optional list of keyword strings for the OntologyRecord.
     * @param ontologyJson the ontology JSON-LD to upload.
     * @return OK with record ID in the data if persisted, BAD REQUEST if publishers can't be found, or INTERNAL
     *      SERVER ERROR if there is a problem creating the OntologyRecord.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Uploads ontology JSON-LD to the data store.")
    Response uploadOntologyJson(@Context ContainerRequestContext context,
                                @QueryParam("title") String title,
                                @QueryParam("description") String description,
                                @QueryParam("markdown") String markdown,
                                @QueryParam("keywords") List<String> keywords,
                                String ontologyJson);

    /**
     * Returns the ontology associated with the requested record ID in the requested format.
     *
     * @param context     the context of the request
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param clearCache  whether or not the cached version of the identified Ontology should be cleared before
     *                    retrieval
     * @param skolemize   whether or not the JSON-LD of the ontology should be skolemized
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return a Response with the ontology in the requested format.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @ApiOperation("Retrieves the ontology in the requested format.")
    Response getOntology(@Context ContainerRequestContext context,
                         @PathParam("recordId") String recordIdStr,
                         @QueryParam("branchId") String branchIdStr,
                         @QueryParam("commitId") String commitIdStr,
                         @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                         @DefaultValue("false") @QueryParam("clearCache") boolean clearCache,
                         @DefaultValue("false") @QueryParam("skolemize") boolean skolemize,
                         @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit);

    /**
     * Deletes the ontology associated with the requested record ID in the requested format.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @return OK.
     */
    @DELETE
    @Path("{recordId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes the OntologyRecord with the requested recordId.")
    Response deleteOntology(@Context ContainerRequestContext context,
                            @PathParam("recordId") String recordIdStr);

    /**
     * Streams the ontology associated with the requested record ID to an OutputStream.
     *
     * @param context     the context of the request
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param fileName    the file name for the ontology file
     * @return the ontology associated with requested record ID to download.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Streams the associated ontology to an OutputStream.")
    Response downloadOntologyFile(@Context ContainerRequestContext context,
                                  @PathParam("recordId") String recordIdStr,
                                  @QueryParam("branchId") String branchIdStr,
                                  @QueryParam("commitId") String commitIdStr,
                                  @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                                  @DefaultValue("ontology") @QueryParam("fileName") String fileName);

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified by the
     * provided recordId.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param entityIdStr the String representing the edited entity id. NOTE: Assumes id represents an IRI unless String
     *                    begins with "_:".
     * @param entityJson  the String representing the edited Resource.
     * @return a Response indicating whether it was successfully updated.
     */
    @POST
    @Path("{recordId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates the requester's InProgressCommit with the provided entity.")
    Response saveChangesToOntology(@Context ContainerRequestContext context,
                                   @PathParam("recordId") String recordIdStr,
                                   @QueryParam("branchId") String branchIdStr,
                                   @QueryParam("commitId") String commitIdStr,
                                   @QueryParam("entityId") String entityIdStr,
                                   String entityJson);

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified by the
     * provided recordId.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param fileInputStream the ontology file to upload.
     * @return OK if successful or METHOD_NOT_ALLOWED if the changes can not be applied to the commit specified.
     */
    @PUT
    @Path("{recordId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates the specified ontology branch and commit with the data provided.")
    Response uploadChangesToOntology(@Context ContainerRequestContext context,
                                   @PathParam("recordId") String recordIdStr,
                                   @QueryParam("branchId") String branchIdStr,
                                   @QueryParam("commitId") String commitIdStr,
                                   @FormDataParam("file") InputStream fileInputStream);

    /**
     Deletes the ontology associated with the requested record ID in the requested format. Unless a branch is
     * specified. In which case the branch specified by the branchId query parameter will be removed and nothing else.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @return OK.
     */
    @DELETE
    @Path("{recordId}/branches/{branchId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes the Branch with the requested BranchId from the OntologyRecord with the provided recordId.")
    Response deleteOntologyBranch(@Context ContainerRequestContext context,
                            @PathParam("recordId") String recordIdStr,
                            @PathParam("branchId") String branchIdStr);

    /**
     * Returns a JSON object with keys for the list of IRIs of derived skos:Concepts, the list of IRIs of derived
     * skos:ConceptSchemes, an object with the concept hierarchy and index, and an object with the concept scheme
     * hierarchy and index.
     *
     * @param context the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON object with keys "derivedConcepts", "derivedConceptSchemes", "concepts.hierarchy", "concepts.index",
     *      "conceptSchemes.hierarchy", and "conceptSchemes.index".
     */
    @GET
    @Path("{recordId}/vocabulary-stuff")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getVocabularyStuff(@Context ContainerRequestContext context,
                                @PathParam("recordId") String recordIdStr,
                                @QueryParam("branchId") String branchIdStr,
                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns a JSON object with all of the lists and objects needed by the UI to properly display and work with
     * ontologies.
     *
     * @param context the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON object with keys .
     */
    @GET
    @Path("{recordId}/ontology-stuff")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    Response getOntologyStuff(@Context ContainerRequestContext context,
                              @PathParam("recordId") String recordIdStr,
                              @QueryParam("branchId") String branchIdStr,
                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the IRIs in the identified ontology.")
    Response getIRIsInOntology(@Context ContainerRequestContext context,
                               @PathParam("recordId") String recordIdStr,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation property IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the annotations in the identified ontology.")
    Response getAnnotationsInOntology(@Context ContainerRequestContext context,
                                      @PathParam("recordId") String recordIdStr,
                                      @QueryParam("branchId") String branchIdStr,
                                      @QueryParam("commitId") String commitIdStr);

    /**
     * Add a new owl annotation property to the ontology identified by the provided IDs associated with the
     * requester's InProgressCommit.
     *
     * @param context        the context of the request.
     * @param recordIdStr    the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                       String begins with "_:".
     * @param annotationJson the String representing the new annotation in JSON-LD.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/annotations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new annotation to the identified ontology.")
    Response addAnnotationToOntology(@Context ContainerRequestContext context,
                                     @PathParam("recordId") String recordIdStr,
                                     String annotationJson);

    /**
     * Delete annotation with requested annotation ID from ontology identified by the provided IDs from the server.
     *
     * @param context         the context of the request.
     * @param recordIdStr     the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:".
     * @param annotationIdStr the String representing the annotation Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr     the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        master Branch.
     * @param commitIdStr     the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        head Commit. The provided commitId must be on the Branch identified by the provided
     *                        branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/annotations/{annotationId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified annotation from the identified ontology.")
    Response deleteAnnotationFromOntology(@Context ContainerRequestContext context,
                                          @PathParam("recordId") String recordIdStr,
                                          @PathParam("annotationId") String annotationIdStr,
                                          @QueryParam("branchId") String branchIdStr,
                                          @QueryParam("commitId") String commitIdStr);

    /**
     * Returns class IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return classes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the classes in the identified ontology.")
    Response getClassesInOntology(@Context ContainerRequestContext context,
                                  @PathParam("recordId") String recordIdStr,
                                  @QueryParam("branchId") String branchIdStr,
                                  @QueryParam("commitId") String commitIdStr,
                                  @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit);

    /**
     * Add a new class to ontology identified by the provided IDs from the server associated with the requester's
     * InProgressCommit.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param classJson   the String representing the new class model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/classes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new class to the identified ontology.")
    Response addClassToOntology(@Context ContainerRequestContext context,
                                @PathParam("recordId") String recordIdStr,
                                String classJson);

    /**
     * Delete class with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param classIdStr  the String representing the class Resource id. NOTE: Assumes id represents
     *                    an IRI unless String begins with "_:".
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
    @Path("{recordId}/classes/{classId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified class from the identified ontology.")
    Response deleteClassFromOntology(@Context ContainerRequestContext context,
                                     @PathParam("recordId") String recordIdStr,
                                     @PathParam("classId") String classIdStr,
                                     @QueryParam("branchId") String branchIdStr,
                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatype IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the datatypes in the identified ontology.")
    Response getDatatypesInOntology(@Context ContainerRequestContext context,
                                    @PathParam("recordId") String recordIdStr,
                                    @QueryParam("branchId") String branchIdStr,
                                    @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new datatype to the ontology identified by the provided IDs associated with the requester's
     * InProgressCommit.
     *
     * @param context      the context of the request.
     * @param recordIdStr  the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:".
     * @param datatypeJson the String representing the new datatype model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/datatypes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new datatype to the identified ontology.")
    Response addDatatypeToOntology(@Context ContainerRequestContext context,
                                   @PathParam("recordId") String recordIdStr,
                                   String datatypeJson);

    /**
     * Delete the datatype from the ontology identified by the provided IDs.
     *
     * @param context       the context of the request.
     * @param recordIdStr   the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:".
     * @param datatypeIdStr the String representing the datatype Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr   the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                      master Branch.
     * @param commitIdStr   the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                      head Commit. The provided commitId must be on the Branch identified by the provided
     *                      branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/datatypes/{datatypeId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified datatype from the identified ontology.")
    Response deleteDatatypeFromOntology(@Context ContainerRequestContext context,
                                        @PathParam("recordId") String recordIdStr,
                                        @PathParam("datatypeId") String datatypeIdStr,
                                        @QueryParam("branchId") String branchIdStr,
                                        @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object property IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the object properties in the identified ontology.")
    Response getObjectPropertiesInOntology(@Context ContainerRequestContext context,
                                           @PathParam("recordId") String recordIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new object property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context            the context of the request.
     * @param recordIdStr        the String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                           unless String begins with "_:".
     * @param objectPropertyJson the String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/object-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new object property to the identified ontology.")
    Response addObjectPropertyToOntology(@Context ContainerRequestContext context,
                                         @PathParam("recordId") String recordIdStr,
                                         String objectPropertyJson);

    /**
     * Delete object property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context             the context of the request.
     * @param recordIdStr         the String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:".
     * @param objectPropertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                            an IRI unless String begins with "_:".
     * @param branchIdStr         the String representing the Branch Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:". NOTE: Optional param - if nothing is specified, it
     *                            will get the master Branch.
     * @param commitIdStr         the String representing the Commit Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:". NOTE: Optional param - if nothing is specified, it
     *                            will get the head Commit. The provided commitId must be on the Branch identified by
     *                            the provided branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/object-properties/{objectPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified object property from the identified ontology.")
    Response deleteObjectPropertyFromOntology(@Context ContainerRequestContext context,
                                              @PathParam("recordId") String recordIdStr,
                                              @PathParam("objectPropertyId") String objectPropertyIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data properties in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the data properties from the identified ontology.")
    Response getDataPropertiesInOntology(@Context ContainerRequestContext context,
                                         @PathParam("recordId") String recordIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new data property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context          the context of the request.
     * @param recordIdStr      the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                         String begins with "_:".
     * @param dataPropertyJson the String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/data-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new data property to the identified ontology.")
    Response addDataPropertyToOntology(@Context ContainerRequestContext context,
                                       @PathParam("recordId") String recordIdStr,
                                       String dataPropertyJson);

    /**
     * Delete data property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context           the context of the request.
     * @param recordIdStr       the String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:".
     * @param dataPropertyIdStr the String representing the class Resource id. NOTE: Assumes id represents
     *                          an IRI unless String begins with "_:".
     * @param branchIdStr       the String representing the Branch Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:". NOTE: Optional param - if nothing is specified, it will
     *                          get the master Branch.
     * @param commitIdStr       the String representing the Commit Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:". NOTE: Optional param - if nothing is specified, it will
     *                          get the head Commit. The provided commitId must be on the Branch identified by the
     *                          provided branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/data-properties/{dataPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified data property from the identified ontology.")
    Response deleteDataPropertyFromOntology(@Context ContainerRequestContext context,
                                            @PathParam("recordId") String recordIdStr,
                                            @PathParam("dataPropertyId") String dataPropertyIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individual IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the individuals in the identified ontology.")
    Response getNamedIndividualsInOntology(@Context ContainerRequestContext context,
                                           @PathParam("recordId") String recordIdStr,
                                           @QueryParam("branchId") String branchIdStr,
                                           @QueryParam("commitId") String commitIdStr);

    /**
     * Adds a new individual to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context        the context of the request.
     * @param recordIdStr    the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                       String begins with "_:".
     * @param individualJson the String representing the new individual model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/named-individuals")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Adds a new individual to the identified ontology.")
    Response addIndividualToOntology(@Context ContainerRequestContext context,
                                     @PathParam("recordId") String recordIdStr,
                                     String individualJson);

    /**
     * Delete individual with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context         the context of the request.
     * @param recordIdStr     the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:".
     * @param individualIdStr the String representing the individual Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr     the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        master Branch.
     * @param commitIdStr     the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        head Commit. The provided commitId must be on the Branch identified by the provided
     *                        branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/named-individuals/{individualId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Deletes the identified individual from the identified ontology.")
    Response deleteIndividualFromOntology(@Context ContainerRequestContext context,
                                          @PathParam("recordId") String recordIdStr,
                                          @PathParam("individualId") String individualIdStr,
                                          @QueryParam("branchId") String branchIdStr,
                                          @QueryParam("commitId") String commitIdStr);

    /**
     * Returns IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the IRIs from the imported ontologies of the identified ontology.")
    Response getIRIsInImportedOntologies(@Context ContainerRequestContext context,
                                         @PathParam("recordId") String recordIdStr,
                                         @QueryParam("branchId") String branchIdStr,
                                         @QueryParam("commitId") String commitIdStr);

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
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
    @Path("{recordId}/imported-ontologies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the JSON-LD of all imported ontologies.")
    Response getImportsClosure(@Context ContainerRequestContext context,
                               @PathParam("recordId") String recordIdStr,
                               @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
                               @QueryParam("branchId") String branchIdStr,
                               @QueryParam("commitId") String commitIdStr);

    /**
     * Returns annotation property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the annotations from the imported ontologies of the identified ontology.")
    Response getAnnotationsInImportedOntologies(@Context ContainerRequestContext context,
                                                @PathParam("recordId") String recordIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr);

    /**
     * Returns class IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the classes from the imported ontologies of the identified ontology.")
    Response getClassesInImportedOntologies(@Context ContainerRequestContext context,
                                            @PathParam("recordId") String recordIdStr,
                                            @QueryParam("branchId") String branchIdStr,
                                            @QueryParam("commitId") String commitIdStr);

    /**
     * Returns datatype IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the datatypes from the imported ontologies of the identified ontology.")
    Response getDatatypesInImportedOntologies(@Context ContainerRequestContext context,
                                              @PathParam("recordId") String recordIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns object property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the object properties from the imported ontologies of the identified ontology.")
    Response getObjectPropertiesInImportedOntologies(@Context ContainerRequestContext context,
                                                     @PathParam("recordId") String recordIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns data property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the data properties from the imported ontologies of the identified ontology.")
    Response getDataPropertiesInImportedOntologies(@Context ContainerRequestContext context,
                                                   @PathParam("recordId") String recordIdStr,
                                                   @QueryParam("branchId") String branchIdStr,
                                                   @QueryParam("commitId") String commitIdStr);

    /**
     * Returns named individual IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
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
    @Path("{recordId}/imported-named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the named individuals from the imported ontologies of the identified ontology.")
    Response getNamedIndividualsInImportedOntologies(@Context ContainerRequestContext context,
                                                     @PathParam("recordId") String recordIdStr,
                                                     @QueryParam("branchId") String branchIdStr,
                                                     @QueryParam("commitId") String commitIdStr);

    /**
     * Returns the class hierarchy for the ontology identified by the provided IDs as a JSON object with keys for a
     * map of parent class IRIs to arrays of children class IRIs and a map of child class IRIs to arrays of parent class
     * IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the class hierarchy for the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/class-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the class hierarchies for the identified ontology.")
    Response getOntologyClassHierarchy(@Context ContainerRequestContext context,
                                       @PathParam("recordId") String recordIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr,
                                       @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns the  object property hierarchy for the ontology identified by the provided IDs as a JSON object with keys
     * for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to arrays
     * of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the object property hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/object-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the object property hierarchies for the identified ontology.")
    Response getOntologyObjectPropertyHierarchy(@Context ContainerRequestContext context,
                                                @PathParam("recordId") String recordIdStr,
                                                @QueryParam("branchId") String branchIdStr,
                                                @QueryParam("commitId") String commitIdStr,
                                                @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns the data property hierarchy for the ontology identified by the provided IDs as a JSON object with keys
     * for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to arrays
     * of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the data property hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/data-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the data property hierarchies for the identified ontology.")
    Response getOntologyDataPropertyHierarchy(@Context ContainerRequestContext context,
                                              @PathParam("recordId") String recordIdStr,
                                              @QueryParam("branchId") String branchIdStr,
                                              @QueryParam("commitId") String commitIdStr,
                                              @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns the annotation property hierarchy for the ontology identified by the provided IDs as a JSON object with
     * keys for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to
     * arrays of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the
     * hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the annotation property hierarchy for the ontology identified by the
     *         provided IDs.
     */
    @GET
    @Path("{recordId}/annotation-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the data property hierarchies for the identified ontology.")
    Response getOntologyAnnotationPropertyHierarchy(@Context ContainerRequestContext context,
                                                    @PathParam("recordId") String recordIdStr,
                                                    @QueryParam("branchId") String branchIdStr,
                                                    @QueryParam("commitId") String commitIdStr,
                                                    @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns the SKOS concept hierarchy for the ontology identified by the provided IDs as a JSON object with keys for
     * a map of parent concept IRIs to arrays of children concept IRIs and a map of child concept IRIs to arrays of
     * parent concept IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the SKOS concept hierarchy for the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/concept-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the concept hierarchies for the identified ontology.")
    Response getConceptHierarchy(@Context ContainerRequestContext context,
                                 @PathParam("recordId") String recordIdStr,
                                 @QueryParam("branchId") String branchIdStr,
                                 @QueryParam("commitId") String commitIdStr,
                                 @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns the SKOS concept scheme hierarchy for the ontology identified by the provided IDs as a JSON object with
     * keys for a map of parent concept scheme IRIs to arrays of children concept IRIs and a map of child concept IRIs
     * to arrays of parent concept scheme IRIs. Optionally can also have a key for a nested JSON-LD representation of
     * the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the SKOS concept scheme hierarchy for the ontology identified by the
     *         provided IDs.
     */
    @GET
    @Path("{recordId}/concept-scheme-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the concept hierarchies for the identified ontology.")
    Response getConceptSchemeHierarchy(@Context ContainerRequestContext context,
                                       @PathParam("recordId") String recordIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr,
                                       @DefaultValue("false") @QueryParam("nested") boolean nested);

    /**
     * Returns classes with individuals defined in the ontology identified by the provided IDs as a JSON object with a
     * key for a map of class IRIs to arrays of individual IRIs
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return A JSON object that represents the classes with individuals in the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/classes-with-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the classes with individuals in a hierarchical structure for the identified ontology.")
    Response getClassesWithIndividuals(@Context ContainerRequestContext context,
                                       @PathParam("recordId") String recordIdStr,
                                       @QueryParam("branchId") String branchIdStr,
                                       @QueryParam("commitId") String commitIdStr);

    /**
     * Returns a list of ontology IRIs that were not imported by OWLAPI.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON list of ontology IRIs that were not imported.
     */
    @GET
    @Path("{recordId}/failed-imports")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets a list of ontology IRIs that were not imported by OWLAPI.")
    Response getFailedImports(@Context ContainerRequestContext context,
                              @PathParam("recordId") String recordIdStr,
                              @QueryParam("branchId") String branchIdStr,
                              @QueryParam("commitId") String commitIdStr);

    /**
     * Returns JSON SPARQL query results containing results with the requested entity IRI as the predicate or object
     * of each result when the queryType is "select". Returns JSON-LD containing statements with the requested entity
     * IRI as the predicate or object of each statement when the queryType is "construct".
     *
     * @param context      the context of the request.
     * @param recordIdStr  the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:".
     * @param entityIRIStr the String representing the entity Resource IRI.
     * @param branchIdStr  the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                     master Branch.
     * @param commitIdStr  the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                     Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                     otherwise, nothing will be returned.
     * @param queryType    the String identifying whether you want to do a select or construct query.
     * @return the proper JSON result described above.
     */
    @GET
    @Path("{recordId}/entity-usages/{entityIri}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the usages of the identified entity in the identified ontology.")
    Response getEntityUsages(@Context ContainerRequestContext context,
                             @PathParam("recordId") String recordIdStr,
                             @PathParam("entityIri") String entityIRIStr,
                             @QueryParam("branchId") String branchIdStr,
                             @QueryParam("commitId") String commitIdStr,
                             @DefaultValue("select") @QueryParam("queryType") String queryType);

    /**
     * Returns the JSON String of the resulting entities sorted by type from the ontology with the requested record ID
     * that have statements which contain the requested searchText in a Literal Value.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param searchText  the String for the text that is searched for in all of the Literals within the ontology with
     *                    the requested record ID.
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
    @Path("{recordId}/search-results")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Gets the search results from the identified ontology using the provided searchText.")
    Response getSearchResults(@Context ContainerRequestContext context,
                              @PathParam("recordId") String recordIdStr,
                              @QueryParam("searchText") String searchText,
                              @QueryParam("branchId") String branchIdStr,
                              @QueryParam("commitId") String commitIdStr);

    /**
     * Retrieves the results of the provided SPARQL query, which targets a specific ontology, and its import closures.
     * Accepts SELECT and CONSTRUCT queries.
     *
     * @param context     the context of the request.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param queryString SPARQL Query to perform against ontology.
     * @param branchIdStr the String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr the String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param format      the specified format for the return of construct queries only.
     * @param includeImports boolean indicating whether or not ontology imports should be included in the query.
     * @return The SPARQL 1.1 results in JSON format if the query is a SELECT or the JSONLD serialization of the results
     *      if the query is a CONSTRUCT
     */
    @GET
    @Path("{recordId}/query")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @ApiOperation("Retrieves the SPARQL query results of an ontology, and its import closures in the requested format.")
    Response queryOntology(@Context ContainerRequestContext context,
                           @PathParam("recordId") String recordIdStr,
                           @QueryParam("query") String queryString,
                           @QueryParam("branchId") String branchIdStr,
                           @QueryParam("commitId") String commitIdStr,
                           @DefaultValue("jsonld") @QueryParam("format") String format,
                           @DefaultValue("true") @QueryParam("includeImports") boolean includeImports);
}
