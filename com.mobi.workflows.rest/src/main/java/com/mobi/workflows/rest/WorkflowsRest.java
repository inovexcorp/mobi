package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectNodeFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = WorkflowsRest.class, immediate = true)
@JaxrsResource
@Path("/workflows")
public class WorkflowsRest {
    private static final ObjectMapper mapper = new ObjectMapper();
    private final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    WorkflowManager workflowManager;

    @Reference
    RecordManager recordManager;

    @Reference
    WorkflowRecordFactory workflowRecordFactory;

    @Reference
    EngineManager engineManager;

    /**
     * Creates a new Workflow Record given the RDF provided either via JSON-LD or an RDF file and given all the metadata
     * provided via Form Data. A master Branch is created and stored with an initial Commit containing the data
     * provided in the ontology file. Only provide either an ontology file or ontology JSON-LD.
     *
     * @param servletRequest The HttpServletRequest.
     * @param contentType The contents of the Content-Type header.
     * @return Response CREATED with a JSON object containing important IRIs if persisted, BAD REQUEST if publishers
     *      can't be found, or INTERNAL SERVER ERROR if there is a problem creating the {@link WorkflowRecord}.
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Upload workflow sent as form data",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Response with the WorkflowRecord Resource ID"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = WorkflowFileUpload.class)
                            )
                    }
            )
    )
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = WorkflowRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response createWorkflow(@Context HttpServletRequest servletRequest,
                                   @HeaderParam("Content-Type") String contentType) {
        Map<String, List<Class>> fields = new HashMap<>();
        fields.put("title", Stream.of(String.class).collect(Collectors.toList()));
        fields.put("description", Stream.of(String.class).collect(Collectors.toList()));
        fields.put("jsonld", Stream.of(String.class).collect(Collectors.toList()));
        fields.put("markdown", Stream.of(String.class).collect(Collectors.toList()));
        fields.put("keywords", Stream.of(Set.class, String.class).collect(Collectors.toList()));

        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);
        String title = (String) formData.get("title");
        String description = (String) formData.get("description");
        String jsonld = (String) formData.get("jsonld");
        String markdown = (String) formData.get("markdown");
        Set<String> keywords = (Set<String>) formData.get("keywords");
        InputStream inputStream = (InputStream) formData.get("stream");
        String filename = (String) formData.get("filename");

        try {
            if ((inputStream == null && jsonld == null) || (inputStream != null && jsonld != null)) {
                throw new IllegalArgumentException("Must provide either a file or a JSON-LD string");
            }
            RecordOperationConfig config = new OperationConfig();
            if (inputStream != null) {
                config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, inputStream);
                config.set(VersionedRDFRecordCreateSettings.FILE_NAME, filename);
            } else {
                checkStringParam(jsonld, "The JSON-LD is missing.");
                Model jsonModel = RestUtils.jsonldToModel(jsonld);
                config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonModel);
            }
            return createWorkflowRecord(servletRequest, title, description, markdown, keywords, config);
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Creates the WorkflowRecord using CatalogManager.
     *
     * @param servletRequest          Context of the request.
     * @param title            the title for the WorkflowRecord.
     * @param description      the description for the WorkflowRecord.
     * @param keywordSet       the comma separated list of keywords associated with the WorkflowRecord.
     * @param config           the RecordOperationConfig containing the appropriate model or input file.
     * @return a Response indicating the success of the creation with a JSON object containing the WorkflowId,
     *     recordId, branchId, and commitId.
     */
    private Response createWorkflowRecord(HttpServletRequest servletRequest, String title, String description,
                                             String markdown, Set<String> keywordSet, RecordOperationConfig config) {
        User user = getActiveUser(servletRequest, engineManager);
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        Resource catalogId = configProvider.getLocalCatalogIRI();
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, title);
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
        config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywordSet);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        checkStringParam(title, "The title is missing.");
        WorkflowRecord record;
        Resource branchId;
        Resource commitId;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            record = recordManager.createRecord(user, config, WorkflowRecord.class, conn);
            branchId = record.getMasterBranch_resource()
                    .orElseThrow(() -> new IllegalStateException("Record master branch resource not found."));

            RepositoryResult<Statement> commitStmt = conn.getStatements(branchId, vf.createIRI(Branch.head_IRI), null);
            if (!commitStmt.hasNext()) {
                throw new IllegalStateException("No head Commit found for the MASTER Branch");
            }
            commitId = (Resource) commitStmt.next().getObject();
            commitStmt.close();
        }

        workflowManager.createTriggerService(record);

        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("WorkflowId", record.getWorkflowIRI().orElseThrow(() ->
                new IllegalStateException("WorkflowRecord must have a Workflow IRI")).toString());
        objectNode.put("recordId", record.getResource().stringValue());
        objectNode.put("branchId", branchId.toString());
        objectNode.put("commitId", commitId.toString());
        objectNode.put("title", title);

        return Response.status(Response.Status.CREATED).entity(objectNode.toString()).build();
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private static class WorkflowFileUpload {
        @Schema(type = "string", format = "binary", description = "Mapping file to upload.")
        public String file;

        @Schema(type = "string", description = "Mapping serialized as JSON-LD", required = true)
        public String jsonld;

        @Schema(type = "string", description = "Required title for the new WorkflowRecord", required = true)
        public String title;

        @Schema(type = "string", description = "Optional description for the new WorkflowRecord")
        public String description;

        @Schema(type = "string", description = "Optional markdown abstract for the new WorkflowRecord")
        public String markdown;

        @ArraySchema(arraySchema = @Schema(description = "Optional list of keywords strings for the new "
                + "WorkflowRecord"), schema = @Schema(implementation = String.class, description = "keyword")
        )
        public List<String> keywords;
    }

    /**
     * Manually starts the identified Workflow Record as long as it is active.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} to start
     * @return Response with the IRI string of the newly created {@link WorkflowExecutionActivity}
     */
    @POST
    @Path("{workflowId}/executions")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Starts an execution of the Workflow linked to the workflowRecord specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The newly created Execution Activity "
                            + "created by the execution of the Workflow Record",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response startWorkflow(@Context HttpServletRequest servletRequest,
                                  @Parameter(description = "String representing the Record Resource ID. "
                                          + "NOTE: Assumes id represents an IRI unless String begins with \"_:\"",
                                          required = true)
                                  @PathParam("workflowId") String workflowRecordId) {
        User activeUser = getActiveUser(servletRequest, engineManager);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            WorkflowRecord workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(),
                    vf.createIRI(workflowRecordId), workflowRecordFactory, conn);

            Boolean activeStatus = workflowRecord.getActive().orElseThrow(() ->
                    new IllegalStateException("Workflow Records must have active status."));

            if (!activeStatus) {
                throw new IllegalArgumentException("Workflow " + workflowRecord.getResource() + " is not active");
            }

            Resource activityIRI = workflowManager.startWorkflow(activeUser, workflowRecord);
            return Response.ok(activityIRI.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the JSON-LD of the latest execution of the identified Workflow Record.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowId The IRI string of the {@link WorkflowRecord} with the execution
     * @return Response with the JSON-LD of the latest {@link WorkflowExecutionActivity}
     */
    @GET
    @Path("{workflowId}/executions/latest")
    @Produces("application/ld+json")
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the latest action of the workflowRecord specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The latest Execution Activity linked to the "
                            + "Workflow Record",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "204", description = "Execution Activity does not exist"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getLatestExecution(@Context HttpServletRequest servletRequest,
                                       @Parameter(description = "String representing the Record Resource ID. "
                                               + "NOTE: Assumes id represents an IRI unless String begins with \"_:\"",
                                               required = true)
                                       @PathParam("workflowId") String workflowId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            WorkflowRecord workflowRecord = recordManager.getRecord(configProvider.getLocalCatalogIRI(),
                    vf.createIRI(workflowId), workflowRecordFactory, conn);

            Optional<Resource> activityIRIOpt = workflowRecord.getLatestActivity_resource();
            if (activityIRIOpt.isPresent()) {
                Resource activityIRI = activityIRIOpt.get();

                WorkflowExecutionActivity executionActivity = workflowManager.getExecutionActivity(activityIRI)
                        .orElseThrow(() -> new IllegalStateException("Expected Execution Activity " + activityIRI
                                + " not found"));

                String json = groupedModelToString(executionActivity.getModel(), getRDFFormat("jsonld"));
                return Response.ok(getObjectNodeFromJsonld(json).toString()).build();
            } else {
                return Response.noContent().build();
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the contents of the log file directly associated with an identified execution of an identified Workflow
     * Record and returns as a plain text string.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @return Response with a plain text string of the log file contents
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the contents of the log file linked to the Execution Activity specified by the "
                    + "provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An output stream of the contents of the "
                            + "log file associated with the passed Execution Activity",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "204", description = "Execution Activity logs do not exist"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getExecutionLogs(@Context HttpServletRequest servletRequest,
                                     @PathParam("workflowId") String workflowRecordId,
                                     @PathParam("activityId") String activityId) {
        try {
            WorkflowExecutionActivity executionActivity = workflowManager.getExecutionActivity(vf.createIRI(activityId))
                    .orElseThrow(() -> ErrorUtils.sendError("Execution Activity " + activityId + " not found",
                            Response.Status.BAD_REQUEST));

            Optional<Resource> logFile = executionActivity.getLogs_resource();
            if (logFile.isEmpty()) {
                return Response.noContent().build();
            }
            return Response.ok(workflowManager.getLogFile(logFile.get())).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the JSON-LD of the identified execution of the identified Workflow Record.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} to retrieve
     * @return Response with the JSON-LD of the {@link WorkflowExecutionActivity}
     */
    @GET
    @Path("{workflowId}/executions/{activityId}")
    @Produces("application/ld+json")
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the specified Execution Activity of the workflowRecord specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The Execution Activity linked to the Workflow "
                            + "Record",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Execution Activity does not exist"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getExecutionActivity(@Context HttpServletRequest servletRequest,
                                         @Parameter(description = "String representing the Record Resource ID. "
                                                 + "NOTE: Assumes id represents an IRI unless String begins with "
                                                 + "\"_:\"", required = true)
                                         @PathParam("workflowId") String workflowRecordId,
                                         @Parameter(description = "String representing the Execution Activity Resource "
                                                 + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                                 + "\"_:\"", required = true)
                                         @PathParam("activityId") String activityId) {
        try {
            WorkflowExecutionActivity executionActivity = workflowManager.getExecutionActivity(vf.createIRI(activityId))
                    .orElseThrow(() -> ErrorUtils.sendError("Execution Activity " + activityId + " not found",
                            Response.Status.NOT_FOUND));
            String json = groupedModelToString(executionActivity.getModel(), getRDFFormat("jsonld"));
            return Response.ok(getObjectNodeFromJsonld(json).toString()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the contents of an identified log file for an identified execution of an identified Workflow Record
     * and returns as a plain text string.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param executionActivityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @param logId The IRI string of the Binary File logs to retrieve
     * @return Response with a plain text string of the log file contents
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs/{logId}")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the contents of the log file specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An output stream of the contents of the "
                            + "log file associated with the passed Binary File IRI",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getActionLog(@Context HttpServletRequest servletRequest,
                                     @PathParam("workflowId") String workflowRecordId,
                                     @PathParam("activityId") String executionActivityId,
                                     @PathParam("logId") String logId) {
        try {
            Resource logIRI = vf.createIRI(logId);
            return Response.ok(workflowManager.getLogFile(logIRI)).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }
}
