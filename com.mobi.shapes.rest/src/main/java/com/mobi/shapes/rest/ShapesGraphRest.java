package com.mobi.shapes.rest;

/*-
 * #%L
 * com.mobi.shapes.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.BNodeUtils;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.ParsedModel;
import com.mobi.persistence.utils.RDFFiles;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.FileUpload;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.shapes.api.NodeShapeSummary;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
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
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createPaginatedResponse;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;

@Path("/shapes-graphs")
@Component(service = ShapesGraphRest.class, immediate = true)
@JaxrsResource
public class ShapesGraphRest {
    private static final ObjectMapper mapper = new ObjectMapper();
    final ValueFactory vf = new ValidatingValueFactory();
    final ModelFactory mf = new DynamicModelFactory();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    RecordManager recordManager;

    @Reference
    BranchManager branchManager;

    @Reference
    CommitManager commitManager;

    @Reference
    CompiledResourceManager compiledResourceManager;

    @Reference
    DifferenceManager differenceManager;

    @Reference
    EngineManager engineManager;

    @Reference
    BNodeService bNodeService;

    @Reference
    ShapesGraphManager shapesGraphManager;

    @Reference
    OntologyCache ontologyCache;

    @Reference
    PDP pdp;

    /**
     * Ingests/uploads a SHACL Shapes Graph file or the JSON-LD of a SHACL Shapes Graph to a data store and creates and
     * stores a ShapesGraphRecord using the form data in the repository to track the work done on it. A master Branch is
     * created and stored with an initial Commit containing the data provided in the SHACL Shapes Graph file. Only
     * provide either a SHACL Shapes Graph file or SHACL Shapes Graph JSON-LD.
     *
     * @param servletRequest         Context of the request.
     * @return CREATED with record ID in the data if persisted, BAD REQUEST if publishers can't be found, or INTERNAL
     *      SERVER ERROR if there is a problem creating the ShapesGraphRecord.
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "shapes-graphs",
            summary = "Uploads a shapes-graph file to the data store",
            description = "Uploads and imports a shapes-graph file to a data store and creates an associated "
                    + "ShapesGraphRecord using the form data. A master Branch is created and stored with an initial "
                    + "Commit containing the data provided in the SHACL Shapes Graph file.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "ShapesGraphRecord created"),
                    @ApiResponse(responseCode = "400", description = "Resource can't be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem creating ShapesGraphRecord")
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA, encoding = {
                                    @Encoding(name = "keywords", explode = true)
                                }, schema = @Schema(implementation = ShapesGraphFileUpload.class)
                            )
                    }
            )
    )
    @RolesAllowed("user")
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = ShapesGraphRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response uploadFile(@Context HttpServletRequest servletRequest) {
        Map<String, List<Class<?>>> fields = new HashMap<>();
        fields.put("title", List.of(String.class));
        fields.put("description", List.of(String.class));
        fields.put("json", List.of(String.class));
        fields.put("markdown", List.of(String.class));
        fields.put("keywords", List.of(Set.class, String.class));

        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);
        String title = (String) formData.get("title");
        String description = (String) formData.get("description");
        String json = (String) formData.get("json");
        String markdown = (String) formData.get("markdown");
        Set<String> keywords = (Set<String>) formData.get("keywords");
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream inputStream = file.getStream();
        String filename = file.getFilename();
        checkStringParam(title, "The title is missing.");
        if (inputStream == null && json == null) {
            throw RestUtils.getErrorObjBadRequest(
                    new IllegalArgumentException("The SHACL Shapes Graph data is missing."));
        } else if (inputStream != null && json != null) {
            throw RestUtils.getErrorObjBadRequest(
                    new IllegalArgumentException("Only provide either a SHACL Shapes Graph file or " +
                            "SHACL Shapes Graph json data"));
        }
        if (inputStream != null) {
            RecordOperationConfig config = new OperationConfig();
            config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, inputStream);
            config.set(VersionedRDFRecordCreateSettings.FILE_NAME, filename);
            return createShapesGraphRecord(servletRequest, title, description, markdown, keywords, config);
        } else {
            checkStringParam(json, "The json is missing.");
            RecordOperationConfig config = new OperationConfig();
            Model jsonModel = RestUtils.jsonldToModel(json);
            config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonModel);
            return createShapesGraphRecord(servletRequest, title, description, markdown, keywords, config);
        }
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private static class ShapesGraphFileUpload {
        @Schema(type = "string", format = "binary", description = "Ontology file to upload.")
        public String file;

        @Schema(type = "string", description = "ShapesGraph JSON-LD to upload")
        public String json;

        @Schema(type = "string", description = "Title for the OntologyRecord", required = true)
        public String title;

        @Schema(type = "string", description = "Optional description for the ShapesGraphRecord")
        public String description;

        @Schema(type = "string", description = "Optional markdown abstract for the new ShapesGraphRecord")
        public String markdown;

        @ArraySchema(
                arraySchema = @Schema(description =
                        "Optional list of keyword strings for the ShapesGraphRecord"),
                schema = @Schema(implementation = String.class, description = "Keyword"))
        public List<String> keywords;
    }

    /**
     * Creates the ShapesGraphRecord using CatalogManager.
     *
     * @param servletRequest          Context of the request.
     * @param title            the title for the ShapesGraphRecord.
     * @param description      the description for the ShapesGraphRecord.
     * @param keywordSet       the comma separated list of keywords associated with the ShapesGraphRecord.
     * @param config           the RecordOperationConfig containing the appropriate model or input file.
     * @return a Response indicating the success of the creation with a JSON object containing the shapesGraphId,
     *     recordId, branchId, and commitId.
     */
    private Response createShapesGraphRecord(HttpServletRequest servletRequest, String title, String description,
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
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraphRecord record = recordManager.createRecord(user, config, ShapesGraphRecord.class, conn);
            Resource branchId = record.getMasterBranch_resource()
                    .orElseThrow(() -> new IllegalStateException("Record master branch resource not found."));
            RepositoryResult<Statement> commitStmt = conn.getStatements(branchId,
                    vf.createIRI(Branch.head_IRI), null);
            if (!commitStmt.hasNext()) {
                commitStmt.close();
                throw new MobiNotFoundException("The requested instance could not be found.");
            }
            Resource commitId = (Resource) commitStmt.next().getObject();
            commitStmt.close();

            ObjectNode objectNode = mapper.createObjectNode();
            objectNode.put("shapesGraphId", record.getTrackedIdentifier().orElseThrow(() ->
                    new IllegalStateException("ShapesGraphRecord must have a Shapes Graph IRI")).toString());
            objectNode.put("recordId", record.getResource().stringValue());
            objectNode.put("branchId", branchId.toString());
            objectNode.put("commitId", commitId.toString());
            objectNode.put("title", title);

            return Response.status(Response.Status.CREATED).entity(objectNode.toString()).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Streams the SHACL Shapes Graph associated with the requested record ID to an OutputStream.
     *
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param fileName    the file name for the SHACL Shapes Graph file
     * @return the SHACL Shapes Graph associated with requested record ID to download.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @Operation(
            tags = "shapes-graphs",
            summary = "Streams the SHACL Shapes Graph associated with the requested record ID to an OutputStream",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SHACL Shapes Graph associated with requested record ID to download"),
                    @ApiResponse(responseCode = "400", description = "Resource can't be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem downloading ShapesGraphRecord")
            }
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadShapesGraph(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID. "
                    + "NOTE: Assumes id represents an IRI unless String begins with \"_:\"", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Optional String representing the Branch Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to Master branch if missing")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "Optional String representing the Commit Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to head commit if missing. The "
                    + "provided commitId must be on the Branch identified by the provided branchId; otherwise, nothing "
                    + "will be returned")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Desired RDF return format",
                    schema = @Schema(allowableValues = {"jsonld", "rdf/xml", "turtle"}))
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "File name for the SHACL Shapes Graph file")
            @DefaultValue("shapesGraph") @QueryParam("fileName") String fileName,
            @Parameter(description = "Whether or not any in progress commits by user should be applied "
                    + "to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        checkStringParam(recordIdStr, "The recordIdStr is missing.");
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit,
                    servletRequest, conn);
            StreamingOutput output = shapesGraph.serializeShapesGraph(rdfFormat);
            return Response.ok(output).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type",
                    getRDFFormatMimeType(rdfFormat)).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Updates/Creates an InProgressCommit on the ShapesGraphRecord with the difference between the compiled resource
     * at the specified Commit and the provided file contents. Can optionally replace an existing InProgressCommit.
     * If no Branch or Commit IRIs are provided, works against the head of the MASTER Branch. If no Commit IRI is
     * provided, works against the HEAD of the specified Branch.
     *
     * @param servletRequest The HTTP request with form data.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @return A Response indicating whether the InProgress update/create was successful.
     */
    @PUT
    @Path("{recordId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Updates the specified shapes graph branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "OK if successful or METHOD_NOT_ALLOWED if the changes "
                                    + "can not be applied to the commit specified"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = ShapesGraphFileUploadChanges.class)
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
    public Response updateShapesGraph(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID. NOTE: Assumes id represents an IRI "
                    + "unless String begins with \"_:\"", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Optional String representing the Branch Resource id. "
                    + "NOTE: Assumes id represents an IRI unless String begins with \"_:\". "
                    + "Defaults to Master branch if missing")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "Optional String representing the Commit Resource id."
                    + " NOTE: Assumes id represents an IRI unless String begins with \"_:\". "
                    + "Defaults to head commit if missing. The provided commitId must be on "
                    + "the Branch identified by the provided branchId; otherwise, nothing "
                    + "will be returned")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean representing whether the in progress commit should be overwritten")
            @DefaultValue("false") @QueryParam("replaceInProgressCommit") boolean replaceInProgressCommit) {
        Map<String, List<Class<?>>> fields = new HashMap<>();
        fields.put("json", List.of(String.class));

        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream fileInputStream = file.getStream();
        String filename = file.getFilename();
        String jsonld = (String) formData.get("json");
        if (replaceInProgressCommit) {
            throw ErrorUtils.sendError("This functionality has not yet been implemented.",
                    Response.Status.INTERNAL_SERVER_ERROR);
        }
        if ((fileInputStream == null && jsonld == null) || (fileInputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Either a File or JSON-LD must be provided", Response.Status.BAD_REQUEST);
        }
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIRI = configProvider.getLocalCatalogIRI();
            IRI recordId = vf.createIRI(recordIdStr);

            User user = getActiveUser(servletRequest, engineManager);
            Optional<InProgressCommit> commit = commitManager.getInProgressCommitOpt(catalogIRI, recordId, user, conn);

            if (commit.isPresent()) {
                throw ErrorUtils.sendError("User has an in progress commit already.", Response.Status.BAD_REQUEST);
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
                commitId = commitManager.getHeadCommitIRI(branch);
            }

            // Uploaded BNode map used for restoring addition BNodes
            Map<BNode, IRI> uploadedBNodes = new HashMap<>();
            final CompletableFuture<Model> uploadedModelFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return fileInputStream != null
                            ? getUploadedModel(fileInputStream, RDFFiles.getFileExtension(filename), uploadedBNodes)
                            : getUploadedModel(new ByteArrayInputStream(jsonld.getBytes(StandardCharsets.UTF_8)),
                                    "jsonld", uploadedBNodes);
                } catch (IOException e) {
                    throw new CompletionException(e);
                }
            });

            // Catalog BNode map used for restoring deletion BNodes
            Map<BNode, IRI> catalogBNodes = new HashMap<>();
            final CompletableFuture<Model> currentModelFuture = CompletableFuture.supplyAsync(() ->
                    getCurrentModel(recordId, branchId, commitId, catalogBNodes, conn));

            Model currentModel = currentModelFuture.get();
            Model uploadedModel = uploadedModelFuture.get();

            if (OntologyModels.findFirstOntologyIRI(uploadedModel).isEmpty()) {
                OntologyModels.findFirstOntologyIRI(currentModel)
                        .ifPresent(iri -> uploadedModel.add(iri, vf.createIRI(RDF.TYPE.stringValue()),
                                vf.createIRI(OWL.ONTOLOGY.stringValue())));
            }

            Difference diff = differenceManager.getDiff(currentModel, uploadedModel);

            if (diff.getAdditions().isEmpty() && diff.getDeletions().isEmpty()) {
                return Response.noContent().build();
            }

            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId, conn);
            commitManager.updateInProgressCommit(catalogIRI, recordId, inProgressCommitIRI,
                    BNodeUtils.restoreBNodes(diff.getAdditions(), uploadedBNodes, catalogBNodes, mf),
                    BNodeUtils.restoreBNodes(diff.getDeletions(), catalogBNodes, mf), conn);

            return Response.ok().build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | ExecutionException | InterruptedException | CompletionException ex) {
            if (ex instanceof ExecutionException) {
                if (ex.getCause() instanceof IllegalArgumentException) {
                    throw RestUtils.getErrorObjBadRequest(ex.getCause());
                } else if (ex.getCause() instanceof RDFParseException) {
                    throw RestUtils.getErrorObjBadRequest(ex.getCause());
                }
            }
            throw RestUtils.getErrorObjInternalServerError(ex);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
        }
    }

    /**
     * Class used for OpenAPI documentation for upload changes endpoint.
     */
    private static class ShapesGraphFileUploadChanges {
        @Schema(type = "string", format = "binary", description = "ShapesGraph file to upload. Must be provided if "
                + "JSON-lD is not")
        public String file;

        @Schema(description = "JSON-LD containing the ShapesGraph definition. Must be provided if a file is not")
        public String json;
    }

    /**
     * Retrieves the triples for a specified entity.
     *
     * @param servletRequest        Context of the request.
     * @param recordIdStr    String representing the Record Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param entityIdStr    String representing the entity Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param branchIdStr    String representing the Branch Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       master Branch.
     * @param commitIdStr    String representing the Commit Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       head Commit. The provided commitId must be on the Branch identified by the provided
     *                       branchId; otherwise, nothing will be returned.
     * @param format         the specified format for the return data. Valid values include "jsonld", "turtle",
     *                       "rdf/xml", and "trig"
     * @param applyInProgressCommit whether to apply the in-progress commit for the user making the request.
     * @return The RDF triples for a specified entity, including all of its transitively attached Blank Nodes.
     */
    @GET
    @Path("{recordId}/entities/{entityId}")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Retrieves the triples for a specified entity",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "RDF triples for a specified entity"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntity(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the entity Resource ID", required = true)
            @PathParam("entityId") String entityIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Specified format for the return data. Valid values include 'jsonld', "
                    + "'turtle', 'rdf/xml', and 'trig'")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit,
                    servletRequest, conn);
            return Response.ok(RestUtils.modelToString(shapesGraph.getEntity(vf.createIRI(entityIdStr)), format))
                    .build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves all triples in a Shapes Graph not directly attached to the Shapes Graph IRI subjectId.
     *
     * @param servletRequest        Context of the request.
     * @param recordIdStr    String representing the Record Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param branchIdStr    String representing the Branch Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       master Branch.
     * @param commitIdStr    String representing the Commit Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       head Commit. The provided commitId must be on the Branch identified by the provided
     *                       branchId; otherwise, nothing will be returned.
     * @param format         the specified format for the return data. Valid values include "jsonld", "turtle",
     *                       "rdf/xml", and "trig"
     * @param applyInProgressCommit whether to apply the in progress commit for the user making the request.
     * @return The RDF triples for the Shapes Graph not including those directly attached to the Shapes Graph IRI
     *         subjectId.
     */
    @GET
    @Path("{recordId}/content")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Retrieves the triples for a specified entity",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "RDF triples for a specified entity"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getShapesGraphContent(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Specified format for the return data. Valid values include 'jsonld', "
                    + "'turtle', 'rdf/xml', and 'trig'")
            @DefaultValue("turtle") @QueryParam("format") String format,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit,
                    servletRequest, conn);
            return Response.ok(shapesGraph.serializeShapesGraphContent(format)).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves failed import IRIs and successfully imported ontologies for a ShapeGraph.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param clearCache  whether the cached version of the identified Ontology should be cleared before
     *                    retrieval
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return Returns a JSON object containing failed import IRIs and successfully imported ontologies for a ShapeGraph.
     */
    @GET
    @Path("{recordId}/imports")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Retrieve information about imports for the given ShapeGraph",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Returns a JSON object containing failed import IRIs and "
                            + "successfully imported ontologies for a ShapeGraph."),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getShapesGraphImports(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean to decide to clear cache")
            @DefaultValue("false") @QueryParam("clearCache") boolean clearCache,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            }
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit,
                    servletRequest, conn);
            ObjectNode stuff = mapper.createObjectNode();

            Ontology ontology = shapesGraph.getOntology();

            ArrayNode nonImportedIris = mapper.createArrayNode();
            String allSubjectsQuery = "SELECT DISTINCT ?s WHERE { ?s ?p ?o }";
            ontology.getTupleQueryResults(allSubjectsQuery, false).forEach(bindings -> {
                String sub = Bindings.requiredResource(bindings, "s").stringValue();
                nonImportedIris.add(sub);
            });
            stuff.set("nonImportedIris", nonImportedIris);

            ArrayNode failedImportsArray = mapper.createArrayNode();
            Set<String> unloadableImportIRIs = shapesGraph.getUnloadableImportIRIs().stream()
                    .map(Value::stringValue)
                    .collect(Collectors.toSet());
            unloadableImportIRIs.forEach(failedImportsArray::add);
            stuff.set("failedImports", failedImportsArray);

            ArrayNode importedOntologiesArray = mapper.createArrayNode();
            shapesGraph.getImportedOntologies().stream()
                    .map(this::getOntologyIdentifiersAsJsonObject)
                    .forEach(importedOntologiesArray::add);
            stuff.set("importedOntologies", importedOntologiesArray);
            return Response.ok(stuff.toString()).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Constructs a JSON object containing identifiers and IRIs from the given {@link Ontology}.
     *
     * <p>The resulting JSON object has the following structure:
     * <ul>
     *   <li><code>id</code>: The string value of the ontology's internal identifier.</li>
     *   <li><code>ontologyId</code>: The string value of the ontology IRI, or an empty string if not present.</li>
     *   <li><code>iris</code>: A list of all distinct subject IRIs used in the ontology.</li>
     * </ul>
     *
     * @param ontology the {@link Ontology} from which to extract identifier information
     * @return a {@link ObjectNode} representing the ontology metadata
     */

    private ObjectNode getOntologyIdentifiersAsJsonObject(Ontology ontology) {
        OntologyId ontologyId = ontology.getOntologyId();
        Optional<IRI> optIri = ontologyId.getOntologyIRI();

        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("id", ontologyId.getOntologyIdentifier().stringValue());
        objectNode.put("ontologyId", optIri.isPresent() ? optIri.get().stringValue() : "");

        ArrayNode importedIris = mapper.createArrayNode();
        String allSubjectsQuery = "SELECT DISTINCT ?s WHERE { ?s ?p ?o }";
        ontology.getTupleQueryResults(allSubjectsQuery, false).forEach(bindings -> {
            String sub = Bindings.requiredResource(bindings, "s").stringValue();
            importedIris.add(sub);
        });
        objectNode.set("iris", importedIris);
        return objectNode;
    }

    /**
     * Retrieves the IRI of the entity representing the shapes graph.
     *
     * @param recordIdStr    String representing the Record Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param branchIdStr    String representing the Branch Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       master Branch.
     * @param commitIdStr    String representing the Commit Resource ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                       head Commit. The provided commitId must be on the Branch identified by the provided
     *                       branchId; otherwise, nothing will be returned.
     * @param applyInProgressCommit whether to apply the in progress commit for the user making the request.
     * @return The String representation of the IRI representing the Shapes Graph
     */
    @GET
    @Path("{recordId}/id")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Retrieves the Shapes Graph ID for the specified record, branch, and commit",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Shapes Graph ID for the specified record, branch, and commit",
                            content = @Content(mediaType = MediaType.TEXT_PLAIN)),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
                    @ApiResponse(responseCode = "403", description = "Permission Denied for recordId"),
                    @ApiResponse(responseCode = "404", description = "Shapes Graph ID could not be found.",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getShapesGraphId(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, servletRequest, conn);

            IRI shapesGraphId = shapesGraph.getShapesGraphId().orElseThrow(() ->
                    new MobiNotFoundException("Shapes Graph ID could not be found."));

            return Response.ok(shapesGraphId.stringValue()).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    private static class NodeShapeSummaryDoc {
        @Schema(description = "The IRI of the Node Shape.")
        public String iri;

        @Schema(description = "A human-readable name or label for the Node Shape.")
        public String name;

        @Schema(description = "The SHACL target type, such as sh:targetClass or sh:targetNode.")
        public String targetType;

        @Schema(description = "The value associated with the SHACL target, e.g., a class or instance IRI.")
        public String targetValue;

        @Schema(description = "Indicates whether the Node Shape was imported from another ontology.")
        public boolean imported;

        @Schema(description = "The IRI of the source ontology where the Node Shape is defined.")
        public String sourceOntologyIRI;
    }

    /**
     * Retrieves a paginated list of SHACL Node Shapes for the specified Shapes Graph, identified by the given
     * record, branch, and commit. The response can be filtered using a search term, and optionally includes
     * changes from the in-progress commit for the requesting user.
     *
     * @param servletRequest            The HTTP servlet request context.
     * @param uriInfo                   URI information for request construction and metadata.
     * @param recordIdStr               String representing the Record Resource ID.
     *                                  NOTE: Assumes ID represents an IRI unless the string begins with "_:".
     * @param branchIdStr               String representing the Branch Resource ID. Optional. If not specified, the master
     *                                  branch will be used. NOTE: Assumes ID represents an IRI unless the string begins with "_:".
     * @param commitIdStr               String representing the Commit Resource ID. Optional. If not specified, the head commit
     *                                  will be used. The provided commitId must belong to the branch identified by branchId;
     *                                  otherwise, no results will be returned.
     * @param applyInProgressCommit     Whether to apply the in-progress commit for the current user. Defaults to true.
     * @param offset                    Offset index for paging the results. Defaults to 0.
     * @param limit                     Maximum number of node shapes to return. Defaults to 500.
     * @param searchText                Optional text filter applied when searching node shapes by name or other attributes.
     *
     * @return A {@link Response} containing a paginated list of {@code NodeShapeSummary} objects in JSON format.
     */
    @GET
    @Path("{recordId}/node-shapes")
    @Produces({MediaType.APPLICATION_JSON})
    @RolesAllowed("user")
    @Operation(
            tags = "shapes-graphs",
            summary = "Retrieves the list of associated NodeShapeSummary for the specified record, branch, and commit",
            responses = {
                    @ApiResponse(responseCode = "200", description = "A list of Node Shapes with associated metadata",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = NodeShapeSummaryDoc.class))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
                    @ApiResponse(responseCode = "403", description = "Permission Denied",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON)),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getShapesGraphNodeShapes(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Distributions to return in one page")
            @DefaultValue("500") @QueryParam("limit") int limit,
            @Parameter(description = "The text to filter over when searching node shapes")
            @QueryParam("searchText") String searchText
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ShapesGraph shapesGraph = getShapesGraph(recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, servletRequest, conn);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder();
            builder.offset(offset);
            builder.limit(limit);
            if (searchText != null) {
                builder.searchText(searchText);
            }
            PaginatedSearchResults<NodeShapeSummary> searchResults = shapesGraph.findNodeShapes(builder.build(), conn);
            ArrayNode entities = mapper.createArrayNode();
            searchResults.page().forEach(nodeShapeSummary -> entities.add(nodeShapeSummary.toObjectNode()));
            return createPaginatedResponse(uriInfo, entities, searchResults.totalSize(), limit, offset);
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Gets the Resource for the InProgressCommit associated with the provided User and the Record identified by the
     * provided Resource. If that User does not have an InProgressCommit, a new one will be created and that Resource
     * will be returned.
     *
     * @param user     the User with the InProgressCommit
     * @param recordId the Resource identifying the Record with the InProgressCommit
     * @param conn     A RepositoryConnection to use for lookup
     * @return a Resource which identifies the InProgressCommit associated with the User for the Record
     */
    private Resource getInProgressCommitIRI(User user, Resource recordId, RepositoryConnection conn) {
        Optional<InProgressCommit> optional = commitManager.getInProgressCommitOpt(configProvider.getLocalCatalogIRI(),
                recordId, user, conn);
        if (optional.isPresent()) {
            return optional.get().getResource();
        } else {
            InProgressCommit inProgressCommit = commitManager.createInProgressCommit(user);
            commitManager.addInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommit, conn);
            return inProgressCommit.getResource();
        }
    }

    private ShapesGraph getShapesGraph(String recordIdStr, String branchIdStr, String commitIdStr,
                                       boolean applyInProgressCommit, HttpServletRequest servletRequest,
                                       RepositoryConnection conn) {
        Optional<ShapesGraph> shapesGraphOpt;
        if (StringUtils.isNotBlank(commitIdStr) && StringUtils.isNotBlank(branchIdStr)) {
            checkStringParam(branchIdStr, "The branchIdStr is missing.");
            shapesGraphOpt = shapesGraphManager.retrieveShapesGraph(vf.createIRI(recordIdStr),
                    vf.createIRI(branchIdStr), vf.createIRI(commitIdStr));
        } else if (StringUtils.isNotBlank(branchIdStr)) {
            shapesGraphOpt = shapesGraphManager.retrieveShapesGraph(vf.createIRI(recordIdStr),
                    vf.createIRI(branchIdStr));
        } else if (StringUtils.isNotBlank(commitIdStr)) {
            shapesGraphOpt = shapesGraphManager.retrieveShapesGraphByCommit(vf.createIRI(recordIdStr),
                    vf.createIRI(commitIdStr));
        } else {
            shapesGraphOpt = shapesGraphManager.retrieveShapesGraph((vf.createIRI(recordIdStr)));
        }
        ShapesGraph shapesGraph = shapesGraphOpt.orElseThrow(() ->
                        new MobiNotFoundException("The shapes graph could not be found."));
        if (applyInProgressCommit) {
            User user = getActiveUser(servletRequest, engineManager);
            Optional<InProgressCommit> inProgressCommitOpt = commitManager.getInProgressCommitOpt(
                    configProvider.getLocalCatalogIRI(), vf.createIRI(recordIdStr), user, conn);
            inProgressCommitOpt.ifPresent(inProgressCommit -> shapesGraphManager.applyChanges(shapesGraphOpt.get(),
                    inProgressCommit));
        }
        return shapesGraph;
    }

    private Model getCurrentModel(Resource recordId, Resource branchId, Resource commitId, Map<BNode, IRI> bNodesMap,
                                  RepositoryConnection conn) {
        // Load existing ontology into a skolemized model
        return bNodeService.deterministicSkolemize(
                compiledResourceManager.getCompiledResource(recordId, branchId, commitId, conn), bNodesMap);
    }

    private Model getUploadedModel(InputStream fileInputStream, String fileExtension, Map<BNode, IRI> bNodesMap)
            throws IOException {
        // Load uploaded ontology into a skolemized model
        ParsedModel parsedModel = Models.createSkolemizedModel(fileExtension, fileInputStream,
                mf, bNodeService, bNodesMap);

        if ("trig".equalsIgnoreCase(parsedModel.getRdfFormatName())) {
            throw new IllegalArgumentException("TriG data is not supported for shapes graph upload changes.");
        }

        return parsedModel.getModel();
    }
}