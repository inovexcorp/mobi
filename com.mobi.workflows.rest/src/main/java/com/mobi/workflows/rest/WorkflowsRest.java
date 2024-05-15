package com.mobi.workflows.rest;

/*-
 * #%L
 * com.mobi.workflows.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.createJsonErrorObject;
import static com.mobi.rest.util.RestUtils.createPaginatedResponse;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getCurrentModel;
import static com.mobi.rest.util.RestUtils.getGarbageCollectionTime;
import static com.mobi.rest.util.RestUtils.getInProgressCommitIRI;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.getUploadedModel;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.persistence.utils.BNodeUtils;
import com.mobi.persistence.utils.RDFFiles;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.Value;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.vfs.api.VirtualFile;
import com.mobi.vfs.api.VirtualFilesystem;
import com.mobi.vfs.api.VirtualFilesystemException;
import com.mobi.vfs.ontologies.documents.BinaryFile;
import com.mobi.workflows.api.PaginatedWorkflowSearchParams;
import com.mobi.workflows.api.WorkflowManager;
import com.mobi.workflows.api.ontologies.workflows.WorkflowExecutionActivity;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecord;
import com.mobi.workflows.api.ontologies.workflows.WorkflowRecordFactory;
import com.mobi.workflows.exception.InvalidWorkflowException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.input.BoundedInputStream;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(service = WorkflowsRest.class, immediate = true)
@JaxrsResource
@Path("/workflows")
public class WorkflowsRest {

    // Unit is in bytes
    private final long FILE_SIZE_LIMIT = 512000;
    private static final ObjectMapper mapper = new ObjectMapper();
    private final ValueFactory vf = new ValidatingValueFactory();

    private final ModelFactory modelFactory = new DynamicModelFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    WorkflowManager workflowManager;

    @Reference
    RecordManager recordManager;

    @Reference
    protected DifferenceManager differenceManager;

    @Reference
    BranchManager branchManager;

    @Reference
    WorkflowRecordFactory workflowRecordFactory;

    @Reference
    EngineManager engineManager;

    @Reference
    protected CompiledResourceManager compiledResourceManager;

    @Reference
    protected BNodeService bNodeService;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected PDP pdp;

    @Reference
    protected VirtualFilesystem vfs;

    private static final Logger log = LoggerFactory.getLogger(WorkflowsRest.class);

    static final Set<String> GET_WORKFLOW_RECORDS_SORT_BY = Stream.of("iri", "title", "issued",
            "modified", "active", "status", "workflowIRI", "executorIri", "executorUsername",
            "executorDisplayName", "startTime", "endTime", "succeeded", "runningTime"
    ).collect(Collectors.toUnmodifiableSet());

    /**
     * Retrieves a list of all the Records. An optional type parameter filters the returned Records.
     * Parameters can be passed to control paging.
     *
     * @param servletRequest HttpServletRequest
     * @param uriInfo UriInfo
     * @param offset Offset for the page
     * @param limit Number of Records to return in one page
     * @param asc Whether the list should be sorted ascending or descending
     * @param sort field to sort by
     * @param searchText String used to filter out Records
     * @param status String used to filters the returned records by status.
     * @param startingAfter Datetime string and filters the records down to those whose latest execution activity
     *                      started at or after the provided value
     * @param endingBefore Datetime string and filters the records down to those whose latest execution
     *                     activity ended at or before the provided value
     * @return List of Workflow Records that match the search criteria.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the Workflows",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Workflow Records that match the "
                            + "search criteria"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response findWorkflowRecords(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "Offset for the page")
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Records to return in one page")
            @QueryParam("limit") int limit,
            @Parameter(description = "Whether the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "field to sort by")
            @QueryParam("sort") String sort,
            @Parameter(description = "String used to filter out Records")
            @QueryParam("searchText") String searchText,
            @Parameter(description = "String used to filter the returned records by status. "
                    + "Supports Strings 'running', 'succeeded', 'failed', and 'never_run'")
            @QueryParam("status") String status,
            @Parameter(description = "Datetime string and filters the records down to those whose latest execution "
                    + "activity started at or after the provided value")
            @QueryParam("startingAfter") String startingAfter,
            @Parameter(description = "Datetime string and filters the records down to those whose latest execution "
                    + "activity ended at or before the provided value")
            @QueryParam("endingBefore") String endingBefore
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder()
                    .searchText(searchText)
                    .status(status)
                    .startingAfter(startingAfter)
                    .endingBefore(endingBefore)
                    .offset(offset)
                    .limit(limit)
                    .sortBy(sort)
                    .ascending(asc)
                    .build();
            // Validation
            List<String> invalidFields = params.validate();

            params.getSortBy().ifPresent(userInput -> {
                if (!GET_WORKFLOW_RECORDS_SORT_BY.contains(userInput)) {
                    invalidFields.add("sortBy does not have a valid sort key. "
                            + "Should be one of: " + GET_WORKFLOW_RECORDS_SORT_BY);
                }
            });

            if (!invalidFields.isEmpty()) {
                throw new IllegalArgumentException(String.format("Invalid Fields;;;%s",
                        String.join(";;;", invalidFields)));
            }
            // Find Workflows
            User activeUser = getActiveUser(servletRequest, engineManager);
            PaginatedSearchResults<ObjectNode> records = workflowManager.findWorkflowRecords(params, activeUser, conn);
            // Response
            ArrayNode arrayNode = mapper.createArrayNode();
            for (ObjectNode objectNode : records.getPage()) {
                arrayNode.add(objectNode);
            }
            return createPaginatedResponse(uriInfo, arrayNode, records.getTotalSize(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

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
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA, encoding = {
                                    @Encoding(name = "keywords", explode = true)
                            }, schema = @Schema(implementation = WorkflowFileUpload.class))
                    }
            )
    )
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = WorkflowRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response createWorkflow(@Context HttpServletRequest servletRequest,
                                   @HeaderParam("Content-Type") String contentType) {
        Map<String, List<Class<?>>> fields = new HashMap<>();
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
     * @param servletRequest Context of the request.
     * @param title the title for the WorkflowRecord.
     * @param description the description for the WorkflowRecord.
     * @param keywordSet  the comma separated list of keywords associated with the WorkflowRecord.
     * @param config the RecordOperationConfig containing the appropriate model or input file.
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

            RepositoryResult<Statement> commitStmt = conn.getStatements(branchId,
                    vf.createIRI(Branch.head_IRI), null);
            if (!commitStmt.hasNext()) {
                throw new IllegalStateException("No head Commit found for the MASTER Branch");
            }
            commitId = (Resource) commitStmt.next().getObject();
            commitStmt.close();
            workflowManager.createTriggerService(record);
        } catch (IllegalStateException ex) {
            ObjectNode objectNode = createJsonErrorObject(ex);
            Response response = Response
                    .status(Response.Status.ACCEPTED)
                    .type(MediaType.APPLICATION_JSON_TYPE)
                    .entity(objectNode.toString())
                    .build();
            String message = "Record created, however " + ex.getMessage();
            throw ErrorUtils.sendError(ex, message, response);
        }

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
     * Handles uploading changes to a workflow.
     *
     * @param servletRequest The HttpServletRequest object.
     * @param recordIdStr The string representing the Record Resource ID (required).
     * @param branchIdStr The string representing the Branch Resource ID (optional).
     * @param commitIdStr The string representing the Commit Resource ID (optional).
     * @return A Response object indicating the success or failure of the operation.
     */
    @PUT
    @Path("{recordId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Updates the specified workflow branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "OK if successful or METHOD_NOT_ALLOWED if the changes "
                                    + "can not be applied to the commit specified"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "409", description = "User already has an in-progress commit"),
                    @ApiResponse(responseCode = "401", description = "User does not have permission"),
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
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", value = "branchId", type =
                    ValueType.QUERY, required = false)
    )
    public Response uploadChangesToWorkflow(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {

        Map<String, Object> formData = RestUtils.getFormData(servletRequest, new HashMap<>());
        InputStream fileInputStream = (InputStream) formData.get("stream");
        String filename = (String) formData.get("filename");

        long totalTime = System.currentTimeMillis();
        if (fileInputStream == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIRI = configProvider.getLocalCatalogIRI();
            IRI recordId = vf.createIRI(recordIdStr);

            User user = getActiveUser(servletRequest, engineManager);
            Optional<InProgressCommit> commit = commitManager.getInProgressCommitOpt(catalogIRI, recordId, user,  conn);

            if (commit.isPresent()) {
                log.debug("Removing in progress commit before uploading new commit");
                commitManager.removeInProgressCommit(commit.get(), conn);
            }

            Resource branchId;
            Resource commitId;
            if (StringUtils.isNotBlank(commitIdStr)) {
                checkStringParam(branchIdStr, "The branchIdStr is missing.");
                commitId = vf.createIRI(commitIdStr);
                branchId = vf.createIRI(branchIdStr);
            } else if (StringUtils.isNotBlank(branchIdStr)) {
                branchId = vf.createIRI(branchIdStr);
                commitId = commitManager.getHeadCommit(catalogIRI, recordId, branchId, conn).getResource();
            } else {
                Branch branch = branchManager.getMasterBranch(catalogIRI, recordId, conn);
                branchId = branch.getResource();
                Decision canModify = RestUtils.isBranchModifiable(user, (IRI) branchId, recordId, pdp);
                if (canModify == Decision.DENY) {
                    throw ErrorUtils.sendError("User does not have permission to modify the master branch.",
                            Response.Status.UNAUTHORIZED);
                }
                commitId = branch.getHead_resource().orElseThrow(() -> new IllegalStateException("Branch "
                        + branchIdStr + " has no head Commit set"));
            }

            long startTime = System.currentTimeMillis();
            // Uploaded BNode map used for restoring addition BNodes
            Map<BNode, IRI> uploadedBNodes = new HashMap<>();
            final CompletableFuture<Model> uploadedModelFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    long startTimeF = System.currentTimeMillis();
                    Model temp = getUploadedModel(fileInputStream,
                            RDFFiles.getFileExtension(filename), uploadedBNodes, modelFactory, bNodeService);
                    workflowManager.validateWorkflow(temp);
                    log.trace("uploadedModelFuture took {} ms", System.currentTimeMillis() - startTimeF);
                    return temp;
                } catch (IOException e) {
                    throw new CompletionException(e);
                }
            });

            // Catalog BNode map used for restoring deletion BNodes
            Map<BNode, IRI> catalogBNodes = new HashMap<>();
            final CompletableFuture<Model> currentModelFuture = CompletableFuture.supplyAsync(() -> {
                long startTimeF = System.currentTimeMillis();
                Model temp = getCurrentModel(recordId, branchId, commitId, catalogBNodes, conn, bNodeService, 
                        compiledResourceManager);
                log.trace("currentModelFuture took " + (System.currentTimeMillis() - startTimeF));
                return temp;
            });
            log.trace("uploadChangesToOntology futures creation took {} ms", System.currentTimeMillis() - startTime);

            Model currentModel = currentModelFuture.get();
            Model uploadedModel = uploadedModelFuture.get();

            startTime = System.currentTimeMillis();
            if (OntologyModels.findFirstOntologyIRI(uploadedModel, vf).isEmpty()) {
                OntologyModels.findFirstOntologyIRI(currentModel, vf)
                        .ifPresent(iri -> uploadedModel.add(iri, vf.createIRI(RDF.TYPE.stringValue()),
                                vf.createIRI(OWL.ONTOLOGY.stringValue())));
            }
            log.trace("uploadChangesToOntology futures completion took {} ms", System.currentTimeMillis() - startTime);

            startTime = System.currentTimeMillis();
            Difference diff = differenceManager.getDiff(currentModel, uploadedModel);
            log.trace("uploadChangesToOntology getDiff took {} ms", System.currentTimeMillis() - startTime);

            if (diff.getAdditions().isEmpty() && diff.getDeletions().isEmpty()) {
                return Response.noContent().build();
            }

            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);
            startTime = System.currentTimeMillis();
            Model additionsRestored = BNodeUtils.restoreBNodes(diff.getAdditions(), uploadedBNodes, catalogBNodes,
                    modelFactory);
            Model deletionsRestored = BNodeUtils.restoreBNodes(diff.getDeletions(), catalogBNodes, modelFactory);
            commitManager.updateInProgressCommit(catalogIRI, recordId, inProgressCommitIRI,
                    additionsRestored, deletionsRestored, conn);
            log.trace("uploadChangesToWorkflow getInProgressCommitIRI took {} ms",
                    System.currentTimeMillis() - startTime);

            return Response.ok().build();

        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | ExecutionException | InterruptedException | CompletionException ex) {
            if (ex instanceof ExecutionException) {
                if (ex.getCause() instanceof InvalidWorkflowException invalidWorkflowException) {
                    ObjectNode error = createJsonInvalidWorkflowError(invalidWorkflowException);
                    throw RestUtils.getErrorObjInternalServerError(invalidWorkflowException, error);
                } else if (ex.getCause() instanceof IllegalArgumentException) {
                    throw RestUtils.getErrorObjBadRequest(ex.getCause());
                } else if (ex.getCause() instanceof RDFParseException) {
                    throw RestUtils.getErrorObjBadRequest(ex.getCause());
                }
            }
            throw RestUtils.getErrorObjInternalServerError(ex);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
            log.trace("uploadChangesToOntology took " + (System.currentTimeMillis() - totalTime));
            log.trace("uploadChangesToOntology getGarbageCollectionTime {} ms", getGarbageCollectionTime());
        }
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
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", type = ValueType.PROP_PATH,
                    value = "<" + VersionedRDFRecord.masterBranch_IRI + ">",
                    start = @Value(type = ValueType.PATH, value = "workflowId")
            )
    )
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
     * Retrieves the JSON of the executions of the identified Workflow Record.
     *
     * @param servletRequest The HttpServletRequest.
     * @param uriInfo UriInfo
     * @param workflowRecordIri The IRI string of the {@link WorkflowRecord} to find executions for
     * @param offset Offset for the page
     * @param limit Number of Records to return in one page
     * @param asc Whether the list should be sorted ascending or descending
     * @param status String used to filters the returned records by status.
     * @param startingAfter Datetime string and filters the records down to those whose latest execution activity
     *                      started at or after the provided value
     * @param endingBefore Datetime string and filters the records down to those whose latest execution
     *                     activity ended at or before the provided value
     * @return Response with the JSON-LD of the latest {@link WorkflowExecutionActivity}
     */
    @GET
    @Path("{workflowRecordIri}/executions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the WorkflowExecutionActivities of the workflowRecord provided ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The Workflow Execution Activities linked to the Workflow Record"
                    ),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowRecordIri")
    public Response findWorkflowExecutionActivities(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Record Resource ID. "
                   + "NOTE: Assumes id represents an IRI unless String begins with \"_:\"",
                   required = true)
            @PathParam("workflowRecordIri") String workflowRecordIri,
            @Parameter(description = "Offset for the page")
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Records to return in one page")
            @QueryParam("limit") int limit,
            @Parameter(description = "Whether the list should be sorted ascending or descending")
            @DefaultValue("false") @QueryParam("ascending") boolean asc,
            @Parameter(description = "String used to filters the returned records by status. "
                    + "Supports Strings 'running', 'succeeded', 'failed', and 'never_run'")
            @QueryParam("status") String status,
            @Parameter(description = "Datetime string and filters the records down to those whose latest execution "
                    + "activity started at or after the provided value")
            @QueryParam("startingAfter") String startingAfter,
            @Parameter(description = "Datetime string and filters the records down to those whose latest execution "
                    + "activity ended at or before the provided value")
            @QueryParam("endingBefore") String endingBefore) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            IRI workflowRecordId = vf.createIRI(workflowRecordIri);
            PaginatedWorkflowSearchParams params = new PaginatedWorkflowSearchParams.Builder()
                    .status(status)
                    .startingAfter(startingAfter)
                    .endingBefore(endingBefore)
                    .offset(offset)
                    .limit(limit)
                    .ascending(asc)
                    .build();
            // Validation
            List<String> invalidFields = params.validate();
            if (!invalidFields.isEmpty()) {
                throw new IllegalArgumentException(String.format("Invalid Fields;;;%s",
                        String.join(";;;", invalidFields)));
            }
            // Find Workflows
            User activeUser = getActiveUser(servletRequest, engineManager);
            PaginatedSearchResults<ObjectNode> records = workflowManager.findWorkflowExecutionActivities(
                    workflowRecordId, params, activeUser, conn);
            // Response
            ArrayNode arrayNode = mapper.createArrayNode();
            for (ObjectNode objectNode : records.getPage()) {
                arrayNode.add(objectNode);
            }
            return createPaginatedResponse(uriInfo, arrayNode, records.getTotalSize(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException ex) {
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
                return Response.ok(getObjectFromJsonld(json).toString()).build();
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
     * Retrieves the JSON-LD of the identified execution of the identified Workflow Record.
     *
     * @param servletRequest The HttpServletRequest
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
            summary = "Retrieves the specified Execution Activity of the WorkflowRecord specified by the provided ID",
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
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            WorkflowExecutionActivity executionActivity = getAndValidateActivity(workflowRecordIri, activityIri, true);

            String json = groupedModelToString(executionActivity.getModel(), getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json).toString()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        }
    }

    /**
     * Retrieves the JSON-LD of all the {@link com.mobi.workflows.api.ontologies.workflows.ActionExecution} instances
     * related to the {@link WorkflowExecutionActivity} identified by the provided IRIs.
     *
     * @param servletRequest The HttpServletRequest
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} in question
     * @return Response with the JSON-LD of the {@link com.mobi.workflows.api.ontologies.workflows.ActionExecution}s
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/actions")
    @Produces("application/ld+json")
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves the ActionExecution details of the specified Execution Activity of the WorkflowRecord "
                + "specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The ActionExecutions linked to the Execution "
                            + "Activity linked to the Workflow Record",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getActionExecutions(@Context HttpServletRequest servletRequest,
                                        @Parameter(description = "String representing the Record Resource ID. "
                                                + "NOTE: Assumes id represents an IRI unless String begins with "
                                                + "\"_:\"", required = true)
                                        @PathParam("workflowId") String workflowRecordId,
                                        @Parameter(description = "String representing the Execution Activity Resource "
                                                + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                                + "\"_:\"", required = true)
                                        @PathParam("activityId") String activityId) {
        try {
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            getAndValidateActivity(workflowRecordIri, activityIri, false);

            ArrayNode result = mapper.createArrayNode();
            workflowManager.getActionExecutions(activityIri).stream()
                    .sorted((action1, action2) -> action1.getResource().stringValue()
                            .compareToIgnoreCase(action2.getResource().stringValue()))
                    .map(action -> modelToJsonld(action.getModel().filter(action.getResource(), null, null)))
                    .map(RestUtils::getObjectFromJsonld)
                    .forEach(result::add);
            return Response.ok(result.toString()).type("application/ld+json").build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a preview of the contents of the log file directly associated with an identified execution of an
     * identified WorkflowRecord and returns as a plain text string.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @return Response with a plain text string of a preview of the log file contents
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves a preview of the contents of the log file linked to the Execution Activity specified "
                    + "by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An output stream of the contents of the "
                            + "log file associated with the passed Execution Activity"),
                    @ApiResponse(responseCode = "204", description = "Execution Activity logs do not exist"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Execution Activity does not exist"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", type = ValueType.PROP_PATH,
                    value = "<" + VersionedRDFRecord.masterBranch_IRI + ">",
                    start = @Value(type = ValueType.PATH, value = "workflowId")
            )
    )
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getExecutionLogs(@Context HttpServletRequest servletRequest,
                                     @Parameter(description = "String representing the Record Resource ID. "
                                             + "NOTE: Assumes id represents an IRI unless String begins with "
                                             + "\"_:\"", required = true)
                                     @PathParam("workflowId") String workflowRecordId,
                                     @Parameter(description = "String representing the Execution Activity Resource "
                                             + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                             + "\"_:\"", required = true)
                                     @PathParam("activityId") String activityId) {
        try {
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            WorkflowExecutionActivity executionActivity = getAndValidateActivity(workflowRecordIri, activityIri, false);

            Set<Resource> logFileIRI = executionActivity.getLogs_resource();
            if (logFileIRI.isEmpty()) {
                return Response.noContent().build();
            }
            BinaryFile logFile = workflowManager.getLogFile(logFileIRI.iterator().next());
            return previewFile(logFile);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Downloads the entire contents of the log file directly associated with an identified execution of an identified
     * WorkflowRecord into a file.
     *
     * @param servletRequest The HttpServletRequest
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @return Response that downloads the entire log file
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Downloads the contents of the log file linked to the Execution Activity specified by the "
                    + "provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An downloaded output stream of the contents of "
                            + "the log file associated with the passed Execution Activity"),
                    @ApiResponse(responseCode = "204", description = "Execution Activity logs do not exist"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            hidden = true
    )
    @ActionId(Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", type = ValueType.PROP_PATH,
                    value = "<" + VersionedRDFRecord.masterBranch_IRI + ">",
                    start = @Value(type = ValueType.PATH, value = "workflowId")
            )
    )
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response downloadExecutionLogs(@Context HttpServletRequest servletRequest,
                                          @Parameter(description = "String representing the Record Resource ID. "
                                                  + "NOTE: Assumes id represents an IRI unless String begins with "
                                                  + "\"_:\"", required = true)
                                          @PathParam("workflowId") String workflowRecordId,
                                          @Parameter(description = "String representing the Execution Activity Resource"
                                                  + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                                  + "\"_:\"", required = true)
                                          @PathParam("activityId") String activityId) {
        try {
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            WorkflowExecutionActivity executionActivity = getAndValidateActivity(workflowRecordIri, activityIri, false);

            Set<Resource> logFileIRI = executionActivity.getLogs_resource();
            if (logFileIRI.isEmpty()) {
                return Response.noContent().build();
            }
            BinaryFile logFile = workflowManager.getLogFile(logFileIRI.iterator().next());
            return downloadFile(logFile);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a preview of the contents of an identified log file for an identified execution of an identified
     * WorkflowRecord and returns as a plain text string.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @param logId The IRI string of the Binary File logs to retrieve
     * @return Response with a plain text string of a preview of the log file contents
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs/{logId}")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Retrieves a preview of the contents of the log file specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An output stream of the contents of the "
                            + "log file associated with the passed Binary File IRI"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", type = ValueType.PROP_PATH,
                    value = "<" + VersionedRDFRecord.masterBranch_IRI + ">",
                    start = @Value(type = ValueType.PATH, value = "workflowId")
            )
    )
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response getSpecificLog(@Context HttpServletRequest servletRequest,
                                   @Parameter(description = "String representing the Record Resource ID. "
                                         + "NOTE: Assumes id represents an IRI unless String begins with "
                                         + "\"_:\"", required = true)
                                 @PathParam("workflowId") String workflowRecordId,
                                   @Parameter(description = "String representing the Execution Activity Resource "
                                         + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                         + "\"_:\"", required = true)
                                 @PathParam("activityId") String activityId,
                                   @Parameter(description = "String representing the Log File ID. "
                                         + "NOTE: Assumes id represents an IRI unless String begins with "
                                         + "\"_:\"", required = true)
                                 @PathParam("logId") String logId) {
        try {
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            WorkflowExecutionActivity executionActivity = getAndValidateActivity(workflowRecordIri, activityIri, false);
            // Validate Log is on the Activity or one of the Action Executions
            Resource logIRI = vf.createIRI(logId);
            validateLog(executionActivity, logIRI);
            // Send Log File preview
            BinaryFile logFile = workflowManager.getLogFile(logIRI);
            return previewFile(logFile);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Downloads the entire contents of an identified log file for an identified execution of an identified
     * WorkflowRecord into a file.
     *
     * @param servletRequest The HttpServletRequest.
     * @param workflowRecordId The IRI string of the {@link WorkflowRecord} with the execution
     * @param activityId The IRI string of the {@link WorkflowExecutionActivity} with the logs
     * @param logId The IRI string of the Binary File logs to retrieve
     * @return Response that downloads the entire log file
     */
    @GET
    @Path("{workflowId}/executions/{activityId}/logs/{logId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @Operation(
            tags = "workflows",
            summary = "Downloads the contents of the log file specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "An output stream of the contents of the "
                            + "log file associated with the passed Binary File IRI"),
                    @ApiResponse(responseCode = "400", description = "An invalid argument has been passed"),
                    @ApiResponse(responseCode = "401", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            hidden = true
    )
    @ActionId(Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", type = ValueType.PROP_PATH,
                    value = "<" + VersionedRDFRecord.masterBranch_IRI + ">",
                    start = @Value(type = ValueType.PATH, value = "workflowId")
            )
    )
    @ResourceId(type = ValueType.PATH, value = "workflowId")
    public Response downloadSpecificLog(@Context HttpServletRequest servletRequest,
                                        @Parameter(description = "String representing the Record Resource ID. "
                                              + "NOTE: Assumes id represents an IRI unless String begins with "
                                              + "\"_:\"", required = true)
                                     @PathParam("workflowId") String workflowRecordId,
                                        @Parameter(description = "String representing the Execution Activity Resource "
                                              + "ID. NOTE: Assumes id represents an IRI unless String begins with "
                                              + "\"_:\"", required = true)
                                     @PathParam("activityId") String activityId,
                                        @Parameter(description = "String representing the Log File ID. "
                                              + "NOTE: Assumes id represents an IRI unless String begins with "
                                              + "\"_:\"", required = true)
                                     @PathParam("logId") String logId) {
        try {
            // Validate Activity is for Workflow
            IRI workflowRecordIri = vf.createIRI(workflowRecordId);
            IRI activityIri = vf.createIRI(activityId);
            WorkflowExecutionActivity executionActivity = getAndValidateActivity(workflowRecordIri, activityIri, false);
            // Validate Log is on the Activity or one of the Action Executions
            Resource logIRI = vf.createIRI(logId);
            validateLog(executionActivity, logIRI);
            // Send Log File preview
            BinaryFile logFile = workflowManager.getLogFile(logIRI);
            return downloadFile(logFile);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | VirtualFilesystemException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    private void validateLog(WorkflowExecutionActivity activity, Resource logIRI) {
        boolean logIsRelated;
        if (activity.getLogs_resource().contains(logIRI)) {
            logIsRelated = true;
        } else {
            logIsRelated = workflowManager.getActionExecutions(activity.getResource()).stream()
                    .anyMatch(actionExecution -> actionExecution.getLogs_resource().contains(logIRI));
        }
        if (!logIsRelated) {
            throw new IllegalArgumentException("Log " + logIRI + " is not related to Activity "
                    + activity.getResource());
        }
    }

    private WorkflowExecutionActivity getAndValidateActivity(Resource workflowRecordIri, Resource activityIri,
                                                             boolean useNotFound) {
        WorkflowExecutionActivity executionActivity = workflowManager.getExecutionActivity(activityIri)
                .orElseThrow(() -> {
                    if (useNotFound) {
                        return new MobiNotFoundException("Execution Activity " + activityIri + " not found");
                    } else {
                        return new IllegalArgumentException("Execution Activity " + activityIri + " not found");
                    }
                });
        if (executionActivity.getUsed_resource().size() == 0
                || !executionActivity.getUsed_resource().contains(workflowRecordIri)) {
            throw new IllegalArgumentException("Execution Activity is not related to the specified Workflow");
        }
        return executionActivity;
    }

    private VirtualFile getLogVirtualFile(BinaryFile logFile) throws VirtualFilesystemException {
        Optional<IRI> logPath = logFile.getRetrievalURL();
        if (logPath.isPresent()) {
            String path = logPath.get().stringValue().replace("file://", "");
            try (VirtualFile file = this.vfs.resolveVirtualFile(path)) {
                if (file.exists()) {
                    return file;
                } else {
                    throw new IllegalStateException("Log file does not exist at " + path);
                }
            } catch (Exception ex) {
                throw new VirtualFilesystemException(ex);
            }
        } else {
            throw new IllegalStateException("Log file does not have a path set");
        }
    }

    private Response downloadFile(BinaryFile logFile) throws VirtualFilesystemException {
        VirtualFile file = getLogVirtualFile(logFile);
        StreamingOutput out = os -> IOUtils.copy(file.readContent(), os);
        String fileName = logFile.getFileName().orElse("logs.txt");
        String mimeType = logFile.getMimeType().orElse("text/plain");
        return Response.ok(out).header("Content-Disposition", "attachment;filename=" + fileName)
                .header("Content-Type", mimeType)
                .build();
    }

    private Response previewFile(BinaryFile logFile) throws VirtualFilesystemException {
        VirtualFile file = getLogVirtualFile(logFile);
        StreamingOutput out = os -> IOUtils.copy(
                new BoundedInputStream(file.readContent(), FILE_SIZE_LIMIT), os);
        Response.ResponseBuilder builder = Response.ok(out);
        if (file.getSize() > FILE_SIZE_LIMIT) {
            builder.header("X-Total-Size", file.getSize());
        }
        return builder.build();
    }

    protected static ObjectNode createJsonInvalidWorkflowError(InvalidWorkflowException exception) {
        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("error", exception.getClass().getSimpleName());

        String errorMessage = exception.getMessage();
        objectNode.put("errorMessage", errorMessage);
        Model validationReport = exception.getValidationReport();

        String validationReportTurtle = RestUtils.modelToString(validationReport, "turtle");
        ArrayNode arrayNode = mapper.createArrayNode();

        String[] validationReportLines = validationReportTurtle.split("\n");

        for (String validationReportLine : validationReportLines) {
            arrayNode.add(validationReportLine.trim());
        }

        objectNode.set("errorDetails", arrayNode);

        return objectNode;
    }
}
