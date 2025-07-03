package com.mobi.ontology.rest;

/*-
 * #%L
 * com.mobi.ontology.rest
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

import static com.mobi.rest.util.RestUtils.LDJSON_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.RDFXML_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.TURTLE_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getCurrentModel;
import static com.mobi.rest.util.RestUtils.getGarbageCollectionTime;
import static com.mobi.rest.util.RestUtils.getInProgressCommitIRI;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.getUploadedModel;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.api.ontologies.ontologyeditor.OntologyRecord;
import com.mobi.ontology.rest.json.EntityNames;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.OntologyUtils;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.ontology.utils.imports.ImportsResolver;
import com.mobi.persistence.utils.BNodeUtils;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.persistence.utils.RDFFiles;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.FileUpload;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.BNode;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
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
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
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
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Path("/ontologies")
@Component(service = OntologyRest.class, immediate = true)
@JaxrsResource
public class OntologyRest {

    private final ModelFactory mf = new DynamicModelFactory();
    private final ValueFactory vf = new ValidatingValueFactory();

    @Reference
    protected OntologyManager ontologyManager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected DifferenceManager differenceManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected BranchManager branchManager;

    @Reference
    protected RecordManager recordManager;

    @Reference
    protected CompiledResourceManager compiledResourceManager;

    @Reference
    protected EngineManager engineManager;

    @Reference
    protected OntologyCache ontologyCache;

    @Reference
    protected BNodeService bNodeService;

    @Reference
    protected PDP pdp;

    @Reference
    protected ImportsResolver importsResolver;

    private static final Logger log = LoggerFactory.getLogger(OntologyRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String GET_ENTITY_QUERY;
    private static final String GET_PROPERTY_RANGES;
    private static final String GET_CLASS_PROPERTIES;
    private static final String GET_NO_DOMAIN_PROPERTIES;
    private static final String GET_ENTITY_NAMES;
    private static final String NAME_SPLITTER = "�";

    private static final String ONTOLOGY_NOT_FOUND = "The ontology could not be found.";
    private static final String ONTOLOGY = "Ontology ";
    private static final String DOES_NOT_EXIST = " does not exist.";
    private static final String ENTITIES = "%ENTITIES%";
    private static final String TURTLE = "turtle";
    private static final String RDF_XML = "rdf/xml";
    private static final String OWL_XML = "owl/xml";
    private static final String ONTOLOGY_ID = "ontologyId";
    private static final String JSONLD = "jsonld";

    static {
        try {
            GET_ENTITY_QUERY = IOUtils.toString(
                    Objects.requireNonNull(OntologyRest.class.getResourceAsStream("/retrieve-entity.rq")),
                    StandardCharsets.UTF_8
            );
            GET_PROPERTY_RANGES = IOUtils.toString(
                    Objects.requireNonNull(OntologyRest.class.getResourceAsStream("/query-property-ranges.rq")),
                    StandardCharsets.UTF_8
            );
            GET_CLASS_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(OntologyRest.class.getResourceAsStream("/query-class-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_NO_DOMAIN_PROPERTIES = IOUtils.toString(
                    Objects.requireNonNull(OntologyRest.class.getResourceAsStream("/query-no-domain-properties.rq")),
                    StandardCharsets.UTF_8
            );
            GET_ENTITY_NAMES = IOUtils.toString(
                    Objects.requireNonNull(OntologyRest.class.getResourceAsStream("/query-entity-names.rq")),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    /**
     * Ingests/uploads an ontology file or the JSON-LD of an ontology to a data store and creates and stores an
     * OntologyRecord using the form data in the repository to track the work done on it. A master Branch is created
     * and stored with an initial Commit containing the data provided in the ontology file. Only provide either an
     * ontology file or ontology JSON-LD.
     *
     * @param servletRequest  The HttpServletRequest.
     * @return CREATED with record ID in the data if persisted, BAD REQUEST if publishers can't be found, or INTERNAL
     *      SERVER ERROR if there is a problem creating the OntologyRecord.
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "ontologies",
            summary = "Uploads an ontology file to the data store",
            description = "Uploads and imports an ontology file to a data store and creates an associated "
                    + "OntologyRecord using the form data. A master Branch is created and stored with an initial "
                    + "Commit containing the data provided in the ontology file.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "OntologyRecord created"),
                    @ApiResponse(responseCode = "400", description = "Publisher can't be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem creating OntologyRecord")
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA, encoding = {
                                    @Encoding(name = "keywords", explode = true)
                                }, schema = @Schema(implementation = OntologyFileUpload.class)
                            )
                    }
            )
    )
    @RolesAllowed("user")
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = OntologyRecord.TYPE))
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
            throw ErrorUtils.sendError("The ontology data is missing.", Response.Status.BAD_REQUEST);
        } else if (inputStream != null && json != null) {
            throw ErrorUtils.sendError("Only provide either an ontology file or ontology json data.",
                    Response.Status.BAD_REQUEST);
        }

        if (keywords == null) {
            keywords = Collections.emptySet();
        }
        if (inputStream != null) {
            RecordOperationConfig config = new OperationConfig();
            config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, inputStream);
            config.set(VersionedRDFRecordCreateSettings.FILE_NAME, filename);
            return createOntologyRecord(servletRequest, title, description, markdown, keywords, config);
        } else {
            checkStringParam(json, "The ontologyJson is missing.");
            RecordOperationConfig config = new OperationConfig();
            Model jsonModel = getModelFromJson(json);
            config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonModel);
            return createOntologyRecord(servletRequest, title, description, markdown, keywords, config);
        }
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private static class OntologyFileUpload {
        @Schema(type = "string", format = "binary", description = "Ontology file to upload.")
        public String file;

        @Schema(type = "string", description = "Ontology JSON-LD to upload")
        public String json;

        @Schema(type = "string", description = "Title for the OntologyRecord", required = true)
        public String title;

        @Schema(type = "string", description = "Optional description for the OntologyRecord")
        public String description;

        @Schema(type = "string", description = "Optional markdown abstract for the new OntologyRecord")
        public String markdown;

        @ArraySchema(
                arraySchema = @Schema(description =
                        "Optional list of keyword strings for the OntologyRecord"),
                schema = @Schema(implementation = String.class, description = "Keyword"))
        public List<String> keywords;
    }

    /**
     * Returns the ontology associated with the requested record ID in the requested format.
     *
     * @param servletRequest the HttpServletRequest.
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
     * @param clearCache  whether the cached version of the identified Ontology should be cleared before
     *                    retrieval
     * @param skolemize   whether the JSON-LD of the ontology should be skolemized
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return a Response with the ontology in the requested format.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @Operation(
            tags = "ontologies",
            summary = "Returns the ontology associated with the requested record ID in the requested format",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The Ontology in the requested format"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID. NOTE: Assumes id represents an "
                    + "IRI unless String begins with \"_:\"", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Optional String representing the Branch Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to Master branch if missing")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "Optional String representing the Commit Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to head commit if missing. The "
                    + "provided commitId must be on the Branch identified by the provided branchId; "
                    + "otherwise, nothing will be returned")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Desired RDF return format",
                    schema = @Schema(allowableValues = {JSONLD, RDF_XML, OWL_XML, TURTLE}))
            @DefaultValue(JSONLD) @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "Whether or not the cached version of the identified Ontology should "
                    + "be cleared before retrieval")
            @DefaultValue("false") @QueryParam("clearCache") boolean clearCache,
            @Parameter(description = "Whether or not the JSON-LD of the ontology should be skolemized.")
            @DefaultValue("false") @QueryParam("skolemize") boolean skolemize,
            @Parameter(description = "Whether or not any in progress commits by user should be applied "
                    + "to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            }
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn)
                    .orElseThrow(() ->
                            ErrorUtils.sendError(ONTOLOGY_NOT_FOUND, Response.Status.BAD_REQUEST));

            StreamingOutput output = outputStream ->
                    writeOntologyToStream(ontology, rdfFormat, skolemize, outputStream);
            return Response.ok(output).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Streams the ontology associated with the requested record ID to an OutputStream.
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
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param fileName    the file name for the ontology file
     * @param applyInProgressCommit whether to apply the InProgessCommit to the downlaod.
     * @return the ontology associated with requested record ID to download.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @Operation(
            tags = "ontologies",
            summary = "Streams the ontology associated with the requested record ID to an OutputStream",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The Ontology associated with requested record ID to download"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
            },
            hidden = true
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadOntologyFile(
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
                    schema = @Schema(allowableValues = {JSONLD, RDF_XML, OWL_XML, TURTLE}))
            @DefaultValue(JSONLD) @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "File name for the ontology file")
            @DefaultValue("ontology") @QueryParam("fileName") String fileName,
            @Parameter(description = "")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            StreamingOutput stream = getOntologyAsRdfStream(ontology, rdfFormat, false);
            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type",
                    getRDFFormatMimeType(rdfFormat)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified
     * by the provided recordId.
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
     * @param entityIdStr String representing the edited entity id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param entityJson  String representing the edited Resource.
     * @return a Response indicating whether it was successfully updated.
     */
    @POST
    @Path("{recordId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Updates the requester's InProgressCommit with the provided entity",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response saveChangesToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "String representing the edited entity id", required = true)
            @QueryParam("entityId") String entityIdStr,
            @Parameter(description = "String representing the edited Resource", required = true) String entityJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Model entityModel = getModelForEntityInOntology(ontology, entityIdStr);
            Difference diff = differenceManager.getDiff(entityModel, getModelFromJson(entityJson));
            Resource recordId = vf.createIRI(recordIdStr);
            User user = getActiveUser(servletRequest, engineManager);
            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);
            commitManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                    diff.getAdditions(), diff.getDeletions(), conn);
            return Response.ok().build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified by the
     * provided recordId.
     *
     * @param servletRequest the HttpServletRequest.
     * @return OK if successful or METHOD_NOT_ALLOWED if the changes can not be applied to the commit specified.
     */
    @PUT
    @Path("{recordId}")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Updates the specified ontology branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "OK if successful or METHOD_NOT_ALLOWED if the changes "
                                    + "can not be applied to the commit specified"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "401", description = "User does not have permission"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = OntologyFileUploadChanges.class)
                            )
                    }
            )
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(id = "http://mobi.com/ontologies/catalog#branch", value = "branchId", type =
                    ValueType.QUERY)
    )
    public Response uploadChangesToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        Map<String, Object> formData = RestUtils.getFormData(servletRequest, new HashMap<>());
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream fileInputStream = file.getStream();
        String filename = file.getFilename();

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
                MasterBranch branch = branchManager.getMasterBranch(catalogIRI, recordId, conn);
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
                            RDFFiles.getFileExtension(filename), uploadedBNodes, mf, bNodeService);
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
                assert temp != null;
                return temp;
            });
            log.trace("uploadChangesToOntology futures creation took {} ms", System.currentTimeMillis() - startTime);

            Model currentModel = currentModelFuture.get();
            Model uploadedModel = uploadedModelFuture.get();

            startTime = System.currentTimeMillis();
            if (OntologyModels.findFirstOntologyIRI(uploadedModel).isEmpty()) {
                OntologyModels.findFirstOntologyIRI(currentModel)
                        .ifPresent(iri -> uploadedModel.add(iri, RDF.TYPE, OWL.ONTOLOGY));
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
                    mf);
            Model deletionsRestored = BNodeUtils.restoreBNodes(diff.getDeletions(), catalogBNodes, mf);
            commitManager.updateInProgressCommit(catalogIRI, recordId, inProgressCommitIRI,
                    additionsRestored, deletionsRestored, conn);
            log.trace("uploadChangesToOntology getInProgressCommitIRI took {} ms",
                    System.currentTimeMillis() - startTime);

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
            log.trace("uploadChangesToOntology took " + (System.currentTimeMillis() - totalTime));
            log.trace("uploadChangesToOntology getGarbageCollectionTime {} ms", getGarbageCollectionTime());
        }
    }

    /**
     * Class used for OpenAPI documentation for upload changes endpoint.
     */
    private static class OntologyFileUploadChanges {
        @Schema(type = "string", format = "binary", description = "Ontology file to upload.")
        public String file;
    }

    /**
     * Clears the cached version of the Ontology identified by the Record IRI and optionally by the provided Commit IRI.
     * If the specified version of the Ontology is not cached, still returns a 200.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param
     * @return A Response indicating the success of the operation
     */
    @DELETE
    @Path("{recordId}/cache")
    @RolesAllowed("user")
    @Operation(tags = "ontologies",
            summary = "Clears the cached version of an ontology",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The operation was successful"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
            })
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response clearCache(@Context HttpServletRequest servletRequest,
                               @Parameter(description = "String representing the Record Resource ID", required = true)
                               @PathParam("recordId") String recordIdStr,
                               @Parameter(description = "String representing the Commit Resource ID")
                               @QueryParam("commitId") String commitIdStr) {
        try {
            ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            return Response.ok().build();
        } catch (Exception ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }
    
    /**
     * Returns a JSON object with keys for the list of IRIs of derived skos:Concepts, the list of IRIs of derived
     * skos:ConceptSchemes, an object with the concept hierarchy and index, and an object with the concept scheme
     * hierarchy and index.
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
     * @return JSON object with keys "derivedConcepts", "derivedConceptSchemes", "concepts.hierarchy", "concepts.index",
     *      "conceptSchemes.hierarchy", and "conceptSchemes.index".
     */
    @GET
    @Path("{recordId}/vocabulary-stuff")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets a JSON representation of all the SKOS vocabulary related information about the ontology",
            responses = {
                    @ApiResponse(responseCode = "200", description = "JSON object with keys \"derivedConcepts\", "
                            + "\"derivedConceptSchemes\", \"concepts.hierarchy\", \"concepts.index\","
                            + "\"conceptSchemes.hierarchy\", and \"conceptSchemes.index\""),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVocabularyStuff(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    true, conn);
            if (optionalOntology.isPresent()) {
                StreamingOutput output = getVocabularyStuffStream(optionalOntology.get());
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST, Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private StreamingOutput getVocabularyStuffStream(Ontology ontology) {
        Set<Ontology> onlyImports = OntologyUtils.getImportedOntologies(ontology);

        return outputStream -> {
            StopWatch watch = new StopWatch();
            log.trace("Start concepts");
            watch.start();

            outputStream.write("{\"concepts\": ".getBytes());
            outputStream.write(irisToJsonArray(getConceptIRIs(ontology)).toString().getBytes());

            watch.stop();
            log.trace("End concepts: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start conceptSchemes");
            watch.start();

            outputStream.write(", \"conceptSchemes\": ".getBytes());
            outputStream.write(irisToJsonArray(getConceptSchemeIRIs(ontology)).toString().getBytes());

            watch.stop();
            log.trace("End conceptSchemes: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start importedIRIs");
            watch.start();

            outputStream.write(", \"importedIRIs\": ".getBytes());
            outputStream.write(doWithOntologies(onlyImports, this::getAllIRIs).toString()
                    .getBytes());

            watch.stop();
            log.trace("End importedIRIs: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start derivedConcepts");
            watch.start();

            outputStream.write(", \"derivedConcepts\": ".getBytes());
            outputStream.write(getDerivedConceptTypeIRIArray(ontology).toString().getBytes());

            watch.stop();
            log.trace("End derivedConcepts: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start derivedConceptSchemes");
            watch.start();

            outputStream.write(", \"derivedConceptSchemes\": ".getBytes());
            outputStream.write(getDerivedConceptSchemeTypeIRIArray(ontology).toString().getBytes());

            watch.stop();
            log.trace("End derivedConceptSchemes: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start derivedSemanticRelations");
            watch.start();

            outputStream.write(", \"derivedSemanticRelations\": ".getBytes());
            outputStream.write(getDerivedSemanticRelationIRIArray(ontology).toString().getBytes());

            watch.stop();
            log.trace("End derivedSemanticRelations: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start conceptHierarchy");
            watch.start();

            outputStream.write(", \"conceptHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptRelationships(), outputStream);

            watch.stop();
            log.trace("End conceptHierarchy: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start conceptSchemeHierarchy");
            watch.start();

            outputStream.write(", \"conceptSchemeHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptSchemeRelationships(), outputStream);
            outputStream.write("}".getBytes());

            watch.stop();
            log.trace("End conceptSchemeHierarchy: " + watch.getTime() + "ms");
        };
    }

    /**
     * Returns a JSON object with all the lists and objects needed by the UI to properly display and work with
     * ontologies.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return JSON object with keys .
     */
    @GET
    @Path("{recordId}/ontology-stuff")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets a JSON representation of all the OWL ontology related information about the ontology",
            responses = {
                    @ApiResponse(responseCode = "200", description = "JSON object with keys"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyStuff(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean to decide to clear cache")
            @DefaultValue("false") @QueryParam("clearCache") boolean clearCache,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            }
            Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn);
            if (optionalOntology.isPresent()) {
                StreamingOutput output = getOntologyStuffStream(optionalOntology.get());
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST,
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private StreamingOutput getOntologyStuffStream(Ontology ontology) {
        Set<Ontology> onlyImports = OntologyUtils.getImportedOntologies(ontology);

        return outputStream -> {
            StopWatch watch = new StopWatch();

            OntologyId ontologyId = ontology.getOntologyId();
            outputStream.write("{ \"ontologyIRI\": ".getBytes());
            outputStream.write(ontologyId.getOntologyIRI().isPresent()
                    ? ("\"" + ontologyId.getOntologyIRI().get() + "\"").getBytes() : "".getBytes());

            log.trace("Start iriList");
            watch.start();
            outputStream.write(", \"iriList\": ".getBytes());
            outputStream.write(getAllIRIs(ontology).toString().getBytes());
            watch.stop();
            log.trace("End iriList: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start importedIRIs");
            watch.start();
            outputStream.write(", \"importedIRIs\": ".getBytes());
            outputStream.write(doWithOntologies(onlyImports, this::getAllIRIs).toString()
                    .getBytes());
            watch.stop();
            log.trace("End importedIRIs: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start importedOntologies");
            watch.start();
            outputStream.write(", \"importedOntologies\": ".getBytes());
            ArrayNode arr = mapper.createArrayNode();
            onlyImports.stream()
                    .map(this::getOntologyIdentifiersAsJsonObject)
                    .forEach(arr::add);
            outputStream.write(arr.toString().getBytes());
            watch.stop();
            log.trace("End importedOntologies: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start failedImports");
            watch.start();
            outputStream.write(", \"failedImports\": ".getBytes());
            outputStream.write(mapper.valueToTree(getUnloadableImportIRIs(ontology)).toString().getBytes());
            watch.stop();
            log.trace("End failedImports: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start classHierarchy");
            watch.start();
            outputStream.write(", \"classHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubClassesOf(), outputStream);
            watch.stop();
            log.trace("End classHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start individuals");
            watch.start();
            outputStream.write(", \"individuals\": ".getBytes());
            ObjectNode classesWithIndividuals = mapper.valueToTree(
                    ontology.getClassesWithIndividuals().getParentMap());
            outputStream.write(classesWithIndividuals.toString().getBytes());
            watch.stop();
            log.trace("End individuals: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start dataPropertyHierarchy");
            watch.start();
            outputStream.write(", \"dataPropertyHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubDatatypePropertiesOf(), outputStream);
            watch.stop();
            log.trace("End dataPropertyHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start objectPropertyHierarchy");
            watch.start();
            outputStream.write(", \"objectPropertyHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubObjectPropertiesOf(), outputStream);
            watch.stop();
            log.trace("End objectPropertyHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start annotationHierarchy");
            watch.start();
            outputStream.write(", \"annotationHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubAnnotationPropertiesOf(), outputStream);
            watch.stop();
            log.trace("End annotationHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start conceptHierarchy");
            watch.start();
            outputStream.write(", \"conceptHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptRelationships(), outputStream);
            watch.stop();
            log.trace("End conceptHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start conceptSchemeHierarchy");
            watch.start();
            outputStream.write(", \"conceptSchemeHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptSchemeRelationships(), outputStream);
            watch.stop();
            log.trace("End conceptSchemeHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start propertyToRanges");
            watch.start();
            outputStream.write(", \"propertyToRanges\": ".getBytes());
            writePropertyRangesToStream(ontology.getTupleQueryResults(GET_PROPERTY_RANGES, true), outputStream);
            watch.stop();
            log.trace("End propertyToRanges: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start classToAssociatedProperties");
            watch.start();
            outputStream.write(", \"classToAssociatedProperties\": ".getBytes());
            writeClassPropertiesToStream(ontology.getTupleQueryResults(GET_CLASS_PROPERTIES, true), outputStream);
            watch.stop();
            log.trace("End classToAssociatedProperties: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start noDomainProperties");
            watch.start();
            outputStream.write(", \"noDomainProperties\": ".getBytes());
            writeNoDomainPropertiesToStream(ontology.getTupleQueryResults(GET_NO_DOMAIN_PROPERTIES, true),
                    outputStream);
            watch.stop();
            log.trace("End noDomainProperties: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start entityNames");
            watch.start();
            outputStream.write(", \"entityNames\": ".getBytes());
            String queryString = GET_ENTITY_NAMES.replace(ENTITIES, "");
            writeEntityNamesToStream(ontology.getTupleQueryResults(queryString, true), outputStream);
            watch.stop();
            log.trace("End entityNames: " + watch.getTime() + "ms");

            outputStream.write("}".getBytes());
        };
    }

    /**
     * Returns a JSON object with (ObjectPropertyRange) properties and ranges.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return JSON object with keys
     */
    @GET
    @Path("{recordId}/property-ranges")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets a JSON representation of the properties Ranges",
            responses = {
                    @ApiResponse(responseCode = "200", description = "JSON object with keys"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getPropertyToRanges(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Optional<Ontology> optionalOntology = optOntology(servletRequest,
                    recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit, conn);
            if (optionalOntology.isPresent()) {
                StreamingOutput output = getPropertyToRangesStream(optionalOntology.get());
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST,
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private StreamingOutput getPropertyToRangesStream(Ontology ontology) {
        Set<Ontology> onlyImports = OntologyUtils.getImportedOntologies(ontology);

        return outputStream -> {
            StopWatch watch = new StopWatch();

            watch.reset();
            log.trace("Start propertyToRanges");
            watch.start();
            outputStream.write("{ \"propertyToRanges\": ".getBytes());
            writePropertyRangesToStream(ontology.getTupleQueryResults(GET_PROPERTY_RANGES, true), outputStream);
            watch.stop();
            log.trace("End propertyToRanges: " + watch.getTime() + "ms");
            outputStream.write("}".getBytes());
        };
    }

    /**
     * Returns IRIs in the ontology identified by the provided IDs.
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
     * @return IRIs in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the IRIs in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "IRIs in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getIRIsInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ObjectNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs,
                    true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns annotation property IRIs in the ontology identified by the provided IDs.
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
     * @return annotation properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the annotations in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Annotation properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getAnnotationsInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ObjectNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationIRIObject, true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add a new owl annotation property to the ontology identified by the provided IDs associated with the
     * requester's InProgressCommit.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr    String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                       String begins with "_:".
     * @param annotationJson String representing the new annotation in JSON-LD.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/annotations")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new annotation to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully added"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addAnnotationToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID. NOTE: Assumes id represents an "
                    + "IRI unless String begins with \"_:\"")
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new annotation in JSON-LD", required = true)
            String annotationJson) {
        verifyJsonldType(annotationJson, OWL.ANNOTATIONPROPERTY.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(annotationJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Delete annotation with requested annotation ID from ontology identified by the provided IDs from the server.
     *
     * @param servletRequest  the HttpServletRequest.
     * @param recordIdStr     String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:".
     * @param annotationIdStr String representing the annotation Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr     String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        master Branch.
     * @param commitIdStr     String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        head Commit. The provided commitId must be on the Branch identified by the provided
     *                        branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/annotations/{annotationId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Updates the specified ontology branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "The ontology could not be found"),
                    @ApiResponse(responseCode = "401",
                            description = "User does not has the permission to modify the record "
                                    + "since deleting an annotation is part of modifying the record"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteAnnotationFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the annotation Resource ID", required = true)
            @PathParam("annotationId") String annotationIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, annotationIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns class IRIs in the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return classes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the classes in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Classes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether any in progress commits by user should be "
                    + "applied to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ArrayNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getClassArray, applyInProgressCommit, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add a new class to ontology identified by the provided IDs from the server associated with the requester's
     * InProgressCommit.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param classJson   String representing the new class model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/classes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new class to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully added"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addClassToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new class model", required = true)
            String classJson) {
        verifyJsonldType(classJson, OWL.CLASS.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(classJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete class with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param classIdStr  String representing the class Resource id. NOTE: Assumes id represents
     *                    an IRI unless String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/classes/{classId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the identified class from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteClassFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("classId") String classIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, classIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns datatype IRIs in the ontology identified by the provided IDs.
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
     * @return datatypes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the datatypes in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Datatypes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDatatypesInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ObjectNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getDatatypeIRIObject, true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new datatype to the ontology identified by the provided IDs associated with the requester's
     * InProgressCommit.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr  String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:".
     * @param datatypeJson String representing the new datatype model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/datatypes")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new datatype to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully added"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addDatatypeToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "JSON String representing the new datatype model", required = true)
            String datatypeJson) {
        verifyJsonldType(datatypeJson, OWL.DATATYPEPROPERTY.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(datatypeJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete the datatype from the ontology identified by the provided IDs.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr   String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:".
     * @param datatypeIdStr String representing the datatype Resource id. NOTE: Assumes id represents
     *                      an IRI unless String begins with "_:".
     * @param branchIdStr   String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                      master Branch.
     * @param commitIdStr   String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                      String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                      head Commit. The provided commitId must be on the Branch identified by the provided
     *                      branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/datatypes/{datatypeId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the identified datatype from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteDatatypeFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the datatype Resource ID", required = true)
            @PathParam("datatypeId") String datatypeIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, datatypeIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns object property IRIs in the ontology identified by the provided IDs.
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
     * @return object properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the object properties in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Object properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getObjectPropertiesInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ArrayNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyArray, true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new object property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param servletRequest     the HttpServletRequest.
     * @param recordIdStr        String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                           unless String begins with "_:".
     * @param objectPropertyJson String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/object-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new object property to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addObjectPropertyToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new property model", required = true)
            String objectPropertyJson) {
        verifyJsonldType(objectPropertyJson, OWL.OBJECTPROPERTY.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(objectPropertyJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete object property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param servletRequest      the HttpServletRequest.
     * @param recordIdStr         String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:".
     * @param objectPropertyIdStr String representing the class Resource id. NOTE: Assumes id represents
     *                            an IRI unless String begins with "_:".
     * @param branchIdStr         String representing the Branch Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:". NOTE: Optional param - if nothing is specified, it
     *                            will get the master Branch.
     * @param commitIdStr         String representing the Commit Resource id. NOTE: Assumes id represents an IRI
     *                            unless String begins with "_:". NOTE: Optional param - if nothing is specified, it
     *                            will get the head Commit. The provided commitId must be on the Branch identified by
     *                            the provided branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/object-properties/{objectPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the identified object property from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteObjectPropertyFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("objectPropertyId") String objectPropertyIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, objectPropertyIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns data properties in the ontology identified by the provided IDs.
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
     * @return data properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the data properties from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Data properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDataPropertiesInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ArrayNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyArray, true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new data property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param servletRequest   the HttpServletRequest.
     * @param recordIdStr      String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                         String begins with "_:".
     * @param dataPropertyJson String representing the new property model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/data-properties")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new data property to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully added"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addDataPropertyToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "JSON String representing the new property model", required = true)
            String dataPropertyJson) {
        verifyJsonldType(dataPropertyJson, OWL.DATATYPEPROPERTY.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(dataPropertyJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete data property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param servletRequest    the HttpServletRequest.
     * @param recordIdStr       String representing the record Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:".
     * @param dataPropertyIdStr String representing the class Resource id. NOTE: Assumes id represents
     *                          an IRI unless String begins with "_:".
     * @param branchIdStr       String representing the Branch Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:". NOTE: Optional param - if nothing is specified, it will
     *                          get the master Branch.
     * @param commitIdStr       String representing the Commit Resource id. NOTE: Assumes id represents an IRI
     *                          unless String begins with "_:". NOTE: Optional param - if nothing is specified, it will
     *                          get the head Commit. The provided commitId must be on the Branch identified by the
     *                          provided branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/data-properties/{dataPropertyId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the identified data property from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteDataPropertyFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("dataPropertyId") String dataPropertyIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, dataPropertyIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns named individual IRIs in the ontology identified by the provided IDs.
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
     * @return named individuals in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the individuals in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Named individuals in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getNamedIndividualsInOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ObjectNode result = doWithOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualIRIObject, true, conn);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new individual to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr    String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                       String begins with "_:".
     * @param individualJson String representing the new individual model.
     * @return a Response indicating whether it was successfully added.
     */
    @POST
    @Path("{recordId}/named-individuals")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Adds a new individual to the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response indicating whether it was successfully added"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addIndividualToOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new individual model", required = true)
            String individualJson) {
        verifyJsonldType(individualJson, OWL.NAMEDINDIVIDUAL.stringValue());
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return additionsToInProgressCommit(servletRequest, recordIdStr, getModelFromJson(individualJson), conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete individual with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param servletRequest  the HttpServletRequest.
     * @param recordIdStr     String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:".
     * @param individualIdStr String representing the individual Resource id. NOTE: Assumes id represents
     *                        an IRI unless String begins with "_:".
     * @param branchIdStr     String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        master Branch.
     * @param commitIdStr     String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                        String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                        head Commit. The provided commitId must be on the Branch identified by the provided
     *                        branchId; otherwise, nothing will be returned.
     * @return a Response indicating whether it was successfully deleted.
     */
    @DELETE
    @Path("{recordId}/named-individuals/{individualId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the identified individual from the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether it was successfully deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteIndividualFromOntology(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the individual Resource ID", required = true)
            @PathParam("individualId") String individualIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(servletRequest, ontology, individualIdStr, recordIdStr, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return IRIs in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the IRIs from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "IRIs in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getIRIsInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs,
                    applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns IRIs of the ontologies in the imports closure for the ontology identified by the provided IDs.
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
     * @return IRIs of the ontologies in the imports closure for the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-ontology-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the imported ontology IRIs of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "IRIs of the ontologies in the imports closure for the "
                                    + "ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getImportedOntologyIRIs(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ArrayNode arrayNode = mapper.createArrayNode();
            Set<String> importedOntologyIris = new HashSet<>();
            Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    false, conn);
            if (optionalOntology.isPresent()) {
                Ontology ontology = optionalOntology.get();
                ontology.getUnloadableImportIRIs().stream()
                        .map(Value::stringValue)
                        .forEach(importedOntologyIris::add);
                OntologyUtils.getImportedOntologies(ontology).stream()
                        .filter(importedOntology ->  importedOntology.getOntologyId().getOntologyIRI().isPresent())
                        .map(importedOntology -> importedOntology.getOntologyId().getOntologyIRI().get().stringValue())
                        .forEach(importedOntologyIris::add);
                for (String importedOntologyIri : importedOntologyIris) {
                    arrayNode.add(importedOntologyIri);
                }
                return Response.ok(arrayNode.toString()).build();
            } else {
                throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST, Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return array of imported ontologies from the ontology with the requested ID in the requested format
     */
    @GET
    @Path("{recordId}/imported-ontologies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Updates the specified ontology branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "array of imported ontologies from the ontology with the "
                                    + "requested ID in the requested format"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getImportsClosure(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Desired RDF return format")
            @DefaultValue(JSONLD) @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Set<Ontology> importedOntologies = getImportedOntologies(servletRequest, recordIdStr, branchIdStr,
                    commitIdStr, applyInProgressCommit, conn);
            ArrayNode arrayNode = mapper.createArrayNode();
            importedOntologies.stream()
                    .map(ontology -> getOntologyAsJsonObject(ontology, rdfFormat))
                    .forEach(arrayNode::add);
            return arrayNode.size() == 0 ? Response.noContent().build() : Response.ok(arrayNode.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns annotation property IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return annotation properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the annotations from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Annotation properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getAnnotationsInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationIRIObject, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns class IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return classes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-classes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the classes from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Classes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getClassIRIArray, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns datatype IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return datatypes in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the datatypes from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Datatypes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDatatypesInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getDatatypeIRIObject, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns object property IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return object properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the object properties from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Object properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getObjectPropertiesInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyIRIObject, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns data property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr the String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return data properties in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-data-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the data properties from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Data properties in the ontology identified by "
                                    + "the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDataPropertiesInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyIRIObject, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns named individual IRIs in the imports closure for the ontology identified by the provided IDs.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return named individuals in the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/imported-named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the named individuals from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Named individuals in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getNamedIndividualsInImportedOntologies(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to apply in progress commit")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            return doWithImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualIRIObject, applyInProgressCommit, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the class hierarchy for the ontology identified by the provided IDs as a JSON object with keys for a
     * map of parent class IRIs to arrays of children class IRIs and a map of child class IRIs to arrays of parent class
     * IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return A JSON object that represents the class hierarchy for the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/class-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the class hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON object that represents the class hierarchy "
                                    + "for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyClassHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn).orElseThrow(() ->
                        ErrorUtils.sendError(ONTOLOGY_NOT_FOUND, Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubClassesOf();
            return Response.ok(getHierarchyStream(hierarchy, nested, getClassIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the object property hierarchy for the ontology identified by the provided IDs as a JSON object with keys
     * for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to arrays
     * of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the object property hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/object-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the object property hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object that represents the object property "
                                    + "hierarchy for the ontology identified by the provided IDS"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyObjectPropertyHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubObjectPropertiesOf();
            return Response.ok(getHierarchyStream(hierarchy, nested, getObjectPropertyIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the data property hierarchy for the ontology identified by the provided IDs as a JSON object with keys
     * for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to arrays
     * of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the data property hierarchy for the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/data-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the data property hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object that represents the data property hierarchy"
                                    + " for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyDataPropertyHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubDatatypePropertiesOf();
            return Response.ok(getHierarchyStream(hierarchy, nested, getDataPropertyIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the annotation property hierarchy for the ontology identified by the provided IDs as a JSON object with
     * keys for a map of parent property IRIs to arrays of children property IRIs and a map of child property IRIs to
     * arrays of parent property IRIs. Optionally can also have a key for a nested JSON-LD representation of the
     * hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the annotation property hierarchy for the ontology identified by the
     *         provided IDs.
     */
    @GET
    @Path("{recordId}/annotation-property-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the data property hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object that represents the annotation property "
                                    + "hierarchy for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyAnnotationPropertyHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubAnnotationPropertiesOf();
            return Response.ok(getHierarchyStream(hierarchy, nested, getAnnotationIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the SKOS concept hierarchy for the ontology identified by the provided IDs as a JSON object with keys for
     * a map of parent concept IRIs to arrays of children concept IRIs and a map of child concept IRIs to arrays of
     * parent concept IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the SKOS concept hierarchy for the ontology identified by the provided IDs.
     */
    @GET
    @Path("{recordId}/concept-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the concept hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON object that represents the SKOS concept hierarchy "
                                    + "for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConceptHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getConceptRelationships();
            return Response.ok(getHierarchyStream(hierarchy, nested, getConceptIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the SKOS concept scheme hierarchy for the ontology identified by the provided IDs as a JSON object with
     * keys for a map of parent concept scheme IRIs to arrays of children concept IRIs and a map of child concept IRIs
     * to arrays of parent concept scheme IRIs. Optionally can also have a key for a nested JSON-LD representation of
     * the hierarchy.
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
     * @param nested      Whether to return the nested JSON-LD version of the hierarchy.
     * @return A JSON object that represents the SKOS concept scheme hierarchy for the ontology identified by
     *         the provided IDs.
     */
    @GET
    @Path("{recordId}/concept-scheme-hierarchies")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the concept hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON object that represents the SKOS concept"
                                    + " scheme hierarchy for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConceptSchemeHierarchy(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getConceptSchemeRelationships();
            return Response.ok(getHierarchyStream(hierarchy, nested, getConceptSchemeIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns classes with individuals defined in the ontology identified by the provided IDs as a JSON object with a
     * key for a map of class IRIs to arrays of individual IRIs.
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
     * @return A JSON object that represents the classes with individuals in the ontology identified by the provided
     *         IDs.
     */
    @GET
    @Path("{recordId}/classes-with-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the classes with individuals in a hierarchical structure for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object that represents the classes with individuals in "
                                    + "the ontology identified by the provided IDS"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesWithIndividuals(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            ObjectNode objectNode = mapper.createObjectNode();
            objectNode.set("individuals",
                    mapper.valueToTree(ontology.getClassesWithIndividuals().getParentMap()));
            return Response.ok(objectNode.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns JSON SPARQL query results containing results with the requested entity IRI as the predicate or object
     * of each result when the queryType is "select". Returns JSON-LD containing statements with the requested entity
     * IRI as the predicate or object of each statement when the queryType is "construct".
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr  String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:".
     * @param entityIRIStr String representing the entity Resource IRI.
     * @param branchIdStr  String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                     String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                     master Branch.
     * @param commitIdStr  String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
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
    @Operation(
            tags = "ontologies",
            summary = "Gets the usages of the identified entity in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON-LD containing statements with the requested entity"
                                    + " IRI as the predicate or object of each statement when the "
                                    + "queryType is \"construct\"."),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntityUsages(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the entity Resource IRI", required = true)
            @PathParam("entityIri") String entityIRIStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "String identifying whether you want to do a select or construct query")
            @DefaultValue("select") @QueryParam("queryType") String queryType) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            Resource entityIRI = vf.createIRI(entityIRIStr);
            if (queryType.equals("construct")) {
                Model results = ontology.constructEntityUsages(entityIRI);
                return Response.ok(modelToJsonld(results)).build();
            } else if (queryType.equals("select")) {
                TupleQueryResult results = ontology.getEntityUsages(entityIRI);
                return Response.ok(JSONQueryResults.getResponse(results).toString()).build();
            } else {
                throw ErrorUtils.sendError("The queryType parameter is not select or construct as expected.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the JSON String of the resulting entities sorted by type from the ontology with the requested record ID
     * that have statements which contain the requested searchText in a Literal Value.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr String representing the record Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param searchText  the String for the text that is searched for in all of the Literals within the ontology with
     *                    the requested record ID.
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @return JSON String providing the sorted list of results from the search.
     */
    @GET
    @Path("{recordId}/search-results")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the search results from the identified ontology using the provided searchText",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON String of the resulting entities sorted "
                                    + "by type from the ontology with the requested record ID "
                                    + "that have statements which contain the requested searchText in a "
                                    + "Literal Value."),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getSearchResults(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String for the text that is searched for in all of the Literals within the "
                    + "ontology with the requested record ID")
            @QueryParam("searchText") String searchText,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            checkStringParam(searchText, "The searchText is missing.");
            TupleQueryResult results = ontology.getSearchResults(searchText);
            Map<String, Set<String>> response = new HashMap<>();
            results.forEach(queryResult -> {
                Value entity = Bindings.requiredResource(queryResult, "entity");
                Value filter = Bindings.requiredResource(queryResult, "type");
                if (!(entity instanceof BNode) && !(filter instanceof BNode)) {
                    String entityString = entity.stringValue();
                    String filterString = filter.stringValue();
                    if (response.containsKey(filterString)) {
                        response.get(filterString).add(entityString);
                    } else {
                        Set<String> newSet = new HashSet<>();
                        newSet.add(entityString);
                        response.put(filterString, newSet);
                    }
                }
            });
            return response.size() == 0 ? Response.noContent().build() :
                    Response.ok(mapper.valueToTree(response).toString())
                            .build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a list of ontology IRIs that were not imported.
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
     * @return JSON list of ontology IRIs that were not imported.
     */
    @GET
    @Path("{recordId}/failed-imports")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets a list of ontology IRIs that were not imported",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of ontology IRIs that were not imported"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getFailedImports(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr, true,
                    conn)
                    .orElseThrow(() -> ErrorUtils.sendError(ONTOLOGY_NOT_FOUND,
                            Response.Status.BAD_REQUEST));
            return Response.ok(getUnloadableImportIRIs(ontology)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Response.ResponseBuilder getResponseBuilderForGraphQuery(Ontology ontology, String query,
                                                                     boolean includeImports, boolean skolemize,
                                                                     String format) {
        return getResponseBuilderForGraphQuery(ontology, query, includeImports, skolemize, getRdfFormat(format));
    }

    private Response.ResponseBuilder getResponseBuilderForGraphQuery(Ontology ontology, String query,
                                                                     boolean includeImports, boolean skolemize,
                                                                     RDFFormat format) {
        StreamingOutput output = outputStream -> {
            ontology.getGraphQueryResultsStream(query, includeImports, format, skolemize, outputStream);
        };
        return Response.ok(output);
    }

    /**
     * Retrieves the triples for a specified entity including all of is transitively attached Blank Nodes.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr    String representing the record Resource ID. NOTE: Assumes ID represents an IRI unless
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
     * @param includeImports boolean indicating whether ontology imports should be included in the query.
     * @param applyInProgressCommit whether to apply the in progress commit for the user making the request.
     * @return The RDF triples for a specified entity including all of is transitively attached Blank Nodes.
     */
    @GET
    @Path("{recordId}/entities/{entityId}")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Retrieves the triples for a specified entity including all of is "
                    + "transitively attached Blank Node",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "RDF triples for a specified entity including all of is "
                                    + "transitively attached Blank Nodes"),
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
            @DefaultValue(JSONLD) @QueryParam("format") String format,
            @Parameter(description = "Boolean indicating whether ontology imports "
                    + "should be included in the query")
            @DefaultValue("true") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Ontology ontology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn).orElseThrow(() -> ErrorUtils.sendError(
                            ONTOLOGY_NOT_FOUND, Response.Status.BAD_REQUEST));

            IRI entity = vf.createIRI(entityIdStr);
            String queryString = GET_ENTITY_QUERY.replace("%ENTITY%", "<" + entity.stringValue() + ">");

            return getResponseBuilderForGraphQuery(ontology, queryString, includeImports, format.equals(JSONLD),
                    format).type(format.equals(JSONLD) ? MediaType.APPLICATION_JSON_TYPE : MediaType.TEXT_PLAIN_TYPE)
                    .build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the map of EntityNames in an Ontology.
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
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @return Returns the list of EntityNames for the given Ontology.
     */
    @POST
    @Path("{recordId}/entity-names")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Updates the specified ontology branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of EntityNames for the given Ontology"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntityNames(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether any imports")
            @DefaultValue("true") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Boolean indicating whether any in progress commits by user should be "
                    + "applied to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(description = "Filter JSON", required = true) String filterJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            StopWatch watch = new StopWatch();
            log.trace("Start entityNames");
            watch.start();

            Set<Resource> resources = new HashSet<>();
            JsonNode arrNode = mapper.readTree(filterJson).get("filterResources");
            if (arrNode != null && arrNode.isArray()) {
                for (final JsonNode objNode : arrNode) {
                    resources.add(vf.createIRI(objNode.asText()));
                }
            }

            String queryString = null;
            if (resources.isEmpty()) {
                queryString = GET_ENTITY_NAMES.replace(ENTITIES, "");
            } else {
                String resourcesString = "VALUES ?entity {<" + resources.stream().map(Resource::stringValue)
                        .collect(Collectors.joining("> <")) + ">}";
                queryString = GET_ENTITY_NAMES.replace(ENTITIES, resourcesString);
            }
            Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn);
            if (optionalOntology.isPresent()) {
                String finalQueryString = queryString;
                StreamingOutput output = outputStream -> {
                    TupleQueryResult result = optionalOntology.get().getTupleQueryResults(finalQueryString,
                            includeImports);
                    writeEntityNamesToStream(result, outputStream);
                };
                watch.stop();
                log.trace("Entity names endpoint: " + watch.getTime() + "ms");
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST,
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException | IOException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the triples for a specified entity including all of is transitively attached Blank Nodes.
     *
     * @param servletRequest the HttpServletRequest.
     * @param ontologyIRI    String representing the IRI of the requested ontology
     * @param format    Optional string representing the format of the ontology
     * @return The Ontology in the requested format. Format is turtle unless otherwise specified.
     */
    @GET
    @Path("/ontology/{ontologyIRI}")
    @Produces({TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE, MediaType.APPLICATION_OCTET_STREAM})
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Retrieves the ontology associated with the requested ontology iri in the requested format",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The Ontology in the requested format",
                            content = {
                                    @Content(mediaType = "*/*"),
                                    @Content(mediaType = TURTLE_MIME_TYPE),
                                    @Content(mediaType = LDJSON_MIME_TYPE),
                                    @Content(mediaType = RDFXML_MIME_TYPE),
                                    @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM),
                            }
                    ),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getOntologyByIRI(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the IRI of the requested ontology", required = true)
            @PathParam("ontologyIRI") String ontologyIRI,
            @Parameter(description = "Desired RDF return format",
                    schema = @Schema(allowableValues = {JSONLD, RDF_XML, TURTLE}))
            @QueryParam("format") String format
    ) {
        try {
            IRI ontIRI = vf.createIRI(ontologyIRI);
            Optional<Resource> ontologyRecord = this.importsResolver.getRecordIRIFromOntologyIRI(ontIRI);

            if (ontologyRecord.isEmpty()) {
                String fileExt = "." + RDFFiles.getFileExtension(ontologyIRI);
                ontIRI = vf.createIRI(ontologyIRI.replaceFirst(fileExt, ""));
                ontologyRecord = this.importsResolver.getRecordIRIFromOntologyIRI(ontIRI);
            }

            if (ontologyRecord.isPresent()) {
                IRI recordIRI = (IRI) ontologyRecord.get();
                Decision canRead = isReadable(getActiveUser(servletRequest, engineManager), recordIRI);

                if (!(canRead == Decision.DENY)) {
                    String finalFormat = (format != null ? format :
                            RDFFiles.getFormatForFileName(ontologyIRI).isPresent()
                                    ? RDFFiles.getFormatForFileName(ontologyIRI).get().getName() : TURTLE);

                    Ontology ontology = this.ontologyManager.retrieveOntology(recordIRI).orElseThrow(
                            () -> new IllegalStateException("Expected Ontology object to be present")
                    );

                    StreamingOutput output = outputStream ->
                            writeOntologyToStream(ontology, finalFormat, false, outputStream);
                    return Response.ok(output).build();
                } else {
                    throw ErrorUtils.sendError("User does not have permission to access ontology.",
                            Response.Status.FORBIDDEN);
                }
            } else {
                throw ErrorUtils.sendError("IRI does not correspond to any ontology record.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    private Decision isReadable(User user, IRI recordIRI) {
        IRI subjectId = (IRI) user.getResource();
        IRI actionId = vf.createIRI("http://mobi.com/ontologies/policy#Read");
        Map<String, Literal> attributes = new HashMap<>();
        Request request = pdp.createRequest(Collections.singletonList(subjectId), attributes,
                Collections.singletonList(recordIRI), new HashMap<>(), Collections.singletonList(actionId), attributes);

        com.mobi.security.policy.api.Response response = pdp.evaluate(request,
                vf.createIRI(POLICY_PERMIT_OVERRIDES));

        return response.getDecision();
    }

    private RDFFormat getRdfFormat(String format) {
        return switch (format.toLowerCase()) {
            case RDF_XML -> RDFFormat.RDFXML;
            case OWL_XML -> throw new NotImplementedException("OWL/XML format is not yet implemented.");
            case TURTLE -> RDFFormat.TURTLE;
            default -> RDFFormat.JSONLD;
        };
    }

    private Set<String> getUnloadableImportIRIs(Ontology ontology) {
        return ontology.getUnloadableImportIRIs().stream()
                .map(Value::stringValue)
                .collect(Collectors.toSet());
    }

    private StreamingOutput getHierarchyStream(Hierarchy hierarchy, boolean includeNested, Set<IRI> iris) {
        return outputStream -> writeHierarchyToStream(hierarchy, outputStream, includeNested, iris);
    }

    private void writeHierarchyToStream(Hierarchy hierarchy, OutputStream outputStream) throws IOException {
        writeHierarchyToStream(hierarchy, outputStream, false, null);
    }

    private void writeHierarchyToStream(Hierarchy hierarchy, OutputStream outputStream, boolean includeNested,
                                        @Nullable Set<IRI> iris) throws IOException {
        outputStream.write("{\"parentMap\": ".getBytes());
        outputStream.write(mapper.valueToTree(hierarchy.getParentMap()).toString().getBytes());
        outputStream.write(", \"childMap\": ".getBytes());
        outputStream.write(mapper.valueToTree(hierarchy.getChildMap()).toString().getBytes());
        outputStream.write(", \"circularMap\": ".getBytes());
        outputStream.write(mapper.valueToTree(hierarchy.getCircularMap()).toString().getBytes());
        if (iris != null) {
            outputStream.write(", \"iris\": ".getBytes());
            outputStream.write(irisToJsonArray(iris).toString().getBytes());
        }
        if (includeNested) {
            outputStream.write(", \"hierarchy\": ".getBytes());
            hierarchy.writeHierarchyString(outputStream);
        }
        outputStream.write("}".getBytes());
    }

    /**
     * Writes the ranges for each property from the query results to the provided output stream.
     *
     * @param tupleQueryResults the query results that contain "prop" and "range" bindings
     * @param outputStream the output stream to write the results to
     */
    private void writePropertyRangesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream)
            throws IOException {
        Map<String, Set<String>> propertyMap = new HashMap<>();
        tupleQueryResults.forEach(bindings -> {
            String prop = Bindings.requiredResource(bindings, "prop").stringValue();
            String range = Bindings.requiredResource(bindings, "range").stringValue();
            if (propertyMap.containsKey(prop)) {
                propertyMap.get(prop).add(range);
            } else {
                Set<String> ranges = new HashSet<>();
                ranges.add(range);
                propertyMap.put(prop, ranges);
            }
        });
        outputStream.write(mapper.valueToTree(propertyMap).toString().getBytes());
    }

    /**
     * Writes the associated properties for each class from the query results to the provided output stream.
     *
     * @param tupleQueryResults the query results that contain "class" and "prop" bindings
     * @param outputStream the output stream to write the results to
     */
    private void writeClassPropertiesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream)
            throws IOException {
        Map<String, Set<String>> classMap = new HashMap<>();
        tupleQueryResults.forEach(bindings -> {
            String clazz = Bindings.requiredResource(bindings, "class").stringValue();
            String prop = Bindings.requiredResource(bindings, "prop").stringValue();
            if (classMap.containsKey(clazz)) {
                classMap.get(clazz).add(prop);
            } else {
                Set<String> props = new HashSet<>();
                props.add(prop);
                classMap.put(clazz, props);
            }
        });
        outputStream.write(mapper.valueToTree(classMap).toString().getBytes());
    }

    /**
     * Writes the associated no domain properties from the query results to the provided output stream.
     *
     * @param tupleQueryResults the query results that contain "prop" bindings
     * @param outputStream the output stream to write the results to
     */
    private void writeNoDomainPropertiesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream)
            throws IOException {
        List<String> props = new ArrayList<>();
        tupleQueryResults.forEach(bindings -> {
            String prop = Bindings.requiredResource(bindings, "prop").stringValue();
            props.add(prop);
        });
        outputStream.write(mapper.valueToTree(props).toString().getBytes());
    }

    /**
     * Writes the associated entity names from the query results to the provided output stream. Note, entities without
     * labels are not included in the results.
     *
     * @param tupleQueryResults the query results that contain "entity", "prefName", and ?names_array bindings
     * @param outputStream the output stream to write the results to
     */
    private void writeEntityNamesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream)
            throws IOException {
        Map<String, EntityNames> entityNamesMap = new HashMap<>();
        String entityBinding = "entity";
        String namesBinding = "names_array";
        tupleQueryResults.forEach(bindings -> {
            if (Optional.ofNullable(bindings.getBinding(entityBinding)).isPresent()) {
                String entity = Bindings.requiredResource(bindings, entityBinding).stringValue();
                String namesString = Bindings.requiredLiteral(bindings, namesBinding).stringValue();
                if (!namesString.isEmpty()) {
                    EntityNames entityNames = new EntityNames();

                    String[] names = StringUtils.split(namesString, NAME_SPLITTER);
                    entityNames.label = names[0];

                    Set<String> namesSet = new HashSet<>();
                    CollectionUtils.addAll(namesSet, names);
                    entityNames.setNames(namesSet);
                    entityNamesMap.putIfAbsent(entity, entityNames);
                }
            }
        });

        outputStream.write(mapper.valueToTree(entityNamesMap).toString().getBytes());
    }

    /**
     * Optionally gets the Ontology based on the provided IDs.
     *
     * @param servletRequest        The HttpServletRequest.
     * @param recordIdStr           the record ID String to process.
     * @param branchIdStr           the branch ID String to process.
     * @param commitIdStr           the commit ID String to process.
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @param conn                  the RepositoryConnection to use for lookup
     * @return an Optional containing the Ontology if it was found.
     */
    private Optional<Ontology> optOntology(HttpServletRequest servletRequest, String recordIdStr, String branchIdStr,
                                           String commitIdStr, boolean applyInProgressCommit,
                                           RepositoryConnection conn) {
        checkStringParam(recordIdStr, "The recordIdStr is missing.");
        Optional<Ontology> optionalOntology;
        try {
            Resource recordId = vf.createIRI(recordIdStr);

            if (StringUtils.isNotBlank(commitIdStr)) {
                if (StringUtils.isNotBlank(branchIdStr)) {
                    optionalOntology = ontologyManager.retrieveOntology(recordId,
                            vf.createIRI(branchIdStr), vf.createIRI(commitIdStr));
                } else {
                    optionalOntology = ontologyManager.retrieveOntologyByCommit(recordId,
                            vf.createIRI(commitIdStr));
                }
            } else if (StringUtils.isNotBlank(branchIdStr)) {
                optionalOntology = ontologyManager.retrieveOntology(recordId, vf.createIRI(branchIdStr));
            } else {
                optionalOntology = ontologyManager.retrieveOntology(recordId);
            }

            if (optionalOntology.isPresent() && applyInProgressCommit) {
                User user = getActiveUser(servletRequest, engineManager);
                Optional<InProgressCommit> inProgressCommitOpt = commitManager.getInProgressCommitOpt(
                        configProvider.getLocalCatalogIRI(), vf.createIRI(recordIdStr), user, conn);

                if (inProgressCommitOpt.isPresent()) {
                    optionalOntology = Optional.of(ontologyManager.applyChanges(optionalOntology.get(),
                            inProgressCommitOpt.get()));
                }
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }

        return optionalOntology;
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in an Ontology identified by the provided IDs.
     *
     * @param servletRequest        the HttpServletRequest.
     * @param recordIdStr           the record ID String to process.
     * @param branchIdStr           the branch ID String to process.
     * @param commitIdStr           the commit ID String to process.
     * @param iriFunction           the Function that takes an Ontology and returns a List of IRI corresponding to an
     *                              Ontology component.
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @param conn                  the RepositoryConnection to use for lookup
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private <T extends JsonNode> T doWithOntology(HttpServletRequest servletRequest, String recordIdStr,
                                                  String branchIdStr, String commitIdStr,
                                                  Function<Ontology, T> iriFunction,
                                                  boolean applyInProgressCommit, RepositoryConnection conn) {
        Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                applyInProgressCommit, conn);
        if (optionalOntology.isPresent()) {
            return iriFunction.apply(optionalOntology.get());
        } else {
            throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in imported Ontologies for the Ontology identified
     * by the provided IDs.
     *
     * @param servletRequest        the HttpServletRequest.
     * @param recordIdStr           the record ID String to process.
     * @param branchIdStr           the branch ID String to process.
     * @param commitIdStr           the commit ID String to process.
     * @param iriFunction           the Function that takes an Ontology and returns a List of IRI corresponding to an
     *                              Ontology component.
     * @param applyInProgressCommit Boolean indicating whether any in progress commits by user should be
     *                              applied to the return value
     * @param conn                  the RepositoryConnection to use for lookup
     * @return the JSON list of imported IRI lists determined by the provided Function.
     */
    private Response doWithImportedOntologies(HttpServletRequest servletRequest, String recordIdStr,
                                              String branchIdStr, String commitIdStr,
                                              Function<Ontology, ObjectNode> iriFunction,
                                              boolean applyInProgressCommit, RepositoryConnection conn) {
        Set<Ontology> importedOntologies;
        try {
            importedOntologies = getImportedOntologies(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit, conn);
        } catch (RDFHandlerException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        if (!importedOntologies.isEmpty()) {
            return Response.ok(doWithOntologies(importedOntologies, iriFunction).toString()).build();
        } else {
            return Response.noContent().build();
        }
    }

    protected static ArrayNode doWithOntologies(Set<Ontology> ontologies, Function<Ontology, ObjectNode> function) {
        ArrayNode arrayNode = mapper.createArrayNode();
        for (Ontology ontology : ontologies) {
            ObjectNode object = function.apply(ontology);
            OntologyId ontologyId = ontology.getOntologyId();
            Optional<IRI> ontologyIRI = ontologyId.getOntologyIRI();
            if (ontologyIRI.isPresent()) {
                object.put("id", ontologyIRI.get().stringValue());
            } else {
                object.put("id", ontologyId.getOntologyIdentifier().stringValue());
            }
            arrayNode.add(object);
        }
        return arrayNode;
    }

    /**
     * Gets the imported Ontologies for the Ontology identified by the provided IDs.
     *
     * @param servletRequest        the HttpServletRequest.
     * @param recordIdStr           the record ID String to process.
     * @param branchIdStr           the branch ID String to process.
     * @param commitIdStr           the commit ID String to process.
     * @param applyInProgressCommit whether to apply uncommitted changes when grabbing the ontologies
     * @param conn                  the RepositoryConnection to use for lookup
     * @return the Set of imported Ontologies.
     */
    private Set<Ontology> getImportedOntologies(HttpServletRequest servletRequest, String recordIdStr,
                                                String branchIdStr, String commitIdStr, boolean applyInProgressCommit,
                                                RepositoryConnection conn) {
        Optional<Ontology> optionalOntology = optOntology(servletRequest, recordIdStr, branchIdStr, commitIdStr,
                applyInProgressCommit, conn);
        if (optionalOntology.isPresent()) {
            Ontology baseOntology = optionalOntology.get();
            return OntologyUtils.getImportedOntologies(baseOntology.getImportsClosure(), baseOntology);
        } else {
            throw ErrorUtils.sendError(ONTOLOGY + recordIdStr + DOES_NOT_EXIST, Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets an ArrayNode of Annotations from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return an ArrayNode of Annotations from the provided Ontology.
     */
    private ObjectNode getAnnotationIRIObject(Ontology ontology) {
        Set<IRI> iris = getAnnotationIRIs(ontology);
        return getObjectArray("annotationProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of AnnotationProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the AnnotationProperties from.
     * @return a Set of AnnotationProperty IRIs from the provided Ontology.
     */
    private Set<IRI> getAnnotationIRIs(Ontology ontology) {
        return ontology.getAllAnnotationProperties()
                .stream()
                .map(AnnotationProperty::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ArrayNode of Deprecated from the provided Ontology.
     *
     * @param ontology the Ontology to get the Deprecated from.
     * @return an ArrayNode of Deprecated from the provided Ontology.
     */
    private ObjectNode getDeprecatedIRIObject(Ontology ontology) {
        Set<IRI> iris = ontology.getDeprecatedIRIs();
        return getObjectArray("deprecatedIris", irisToJsonArray(iris));
    }

    /**
     * Gets an ObjectNode of Class IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return an ObjectNode with a classes key to an array of Class IRIs from the provided Ontology.
     */
    private ObjectNode getClassIRIArray(Ontology ontology) {
        Set<IRI> iris = getClassIRIs(ontology);
        return getObjectArray("classes", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of Class IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return a Set of Class IRIs from the provided Ontology.
     */
    private Set<IRI> getClassIRIs(Ontology ontology) {
        return ontology.getAllClasses()
                .stream()
                .map(OClass::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ArrayNode of Classes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return an ArrayNode of Classes form the provided Ontology.
     */
    private ArrayNode getClassArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel();
        ontology.getAllClasses().stream()
                .map(clazz -> model.filter(clazz.getIRI(), null, null))
                .filter(m -> !m.isEmpty())
                .map(m -> getObjectFromJsonld(modelToJsonld(m)))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets an ObjectNode of Datatype IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Datatypes from.
     * @return an ObjectNode with a datatypes key to an array of Datatype IRIs from the provided Ontology.
     */
    private ObjectNode getDatatypeIRIObject(Ontology ontology) {
        Set<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Datatype::getIRI)
                .collect(Collectors.toSet());
        return getObjectArray("datatypes", irisToJsonArray(iris));
    }

    /**
     * Gets an ObjectNode of ObjectProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return an ObjectNode with a objectProperties key to an array of ObjectProperty IRIs from the provided Ontology.
     */
    private ObjectNode getObjectPropertyIRIObject(Ontology ontology) {
        Set<IRI> iris = getObjectPropertyIRIs(ontology);
        return getObjectArray("objectProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of ObjectProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return a Set of ObjectProperty IRIs from the provided Ontology.
     */
    private Set<IRI> getObjectPropertyIRIs(Ontology ontology) {
        return ontology.getAllObjectProperties()
                .stream()
                .map(ObjectProperty::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ArrayNode of ObjectProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return an ArrayNode of ObjectProperties from the provided Ontology.
     */
    private ArrayNode getObjectPropertyArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel();
        ontology.getAllObjectProperties().stream()
                .map(property -> getObjectFromJsonld(modelToJsonld(model.filter(property.getIRI(), null, null))))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets an ObjectNode of DatatypeProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return an ObjectNode with a dataProperties key to an array of DatatypeProperty IRIs from the provided Ontology.
     */
    private ObjectNode getDataPropertyIRIObject(Ontology ontology) {
        Set<IRI> iris = getDataPropertyIRIs(ontology);
        return getObjectArray("dataProperties", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of DatatypeProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return a Set of DatatypeProperty IRIs from the provided Ontology.
     */
    private Set<IRI> getDataPropertyIRIs(Ontology ontology) {
        return ontology.getAllDataProperties()
                .stream()
                .map(DataProperty::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ArrayNode of DatatypeProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return an ArrayNode of DatatypeProperties from the provided Ontology.
     */
    private ArrayNode getDataPropertyArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel();
        ontology.getAllDataProperties().stream()
                .map(dataProperty ->
                        getObjectFromJsonld(modelToJsonld(model.filter(dataProperty.getIRI(),
                                null, null))))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets an ArrayNode of NamedIndividuals from the provided Ontology.
     *
     * @param ontology the Ontology to get the NamedIndividuals from.
     * @return an ArrayNode of NamedIndividuals from the provided Ontology.
     */
    private ObjectNode getNamedIndividualIRIObject(Ontology ontology) {
        Set<IRI> iris = getNamedIndividualIRIs(ontology);
        return getObjectArray("namedIndividuals", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of Individual IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Individuals from.
     * @return a Set of Individual IRIs from the provided Ontology.
     */
    private Set<IRI> getNamedIndividualIRIs(Ontology ontology) {
        return ontology.getAllIndividuals().stream()
                .map(Individual::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ObjectNode of Concept IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Concepts from.
     * @return an ObjectNode with a concepts key to an array of Concept IRIs from the provided Ontology.
     */
    private ObjectNode getConceptIRIObject(Ontology ontology) {
        Set<IRI> iris = getConceptIRIs(ontology);
        return getObjectArray("concepts", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of Concept IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Concepts from.
     * @return a Set of Concept IRIs from the provided Ontology.
     */
    private Set<IRI> getConceptIRIs(Ontology ontology) {
        return ontology.getIndividualsOfType(SKOS.CONCEPT).stream()
                .map(Individual::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets an ObjectNode of ConceptScheme IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ConceptSchemes from.
     * @return an ObjectNode with a conceptSchemes key to an array of ConceptScheme IRIs from the provided Ontology.
     */
    private ObjectNode getConceptSchemeIRIObject(Ontology ontology) {
        Set<IRI> iris = getConceptSchemeIRIs(ontology);
        return getObjectArray("conceptSchemes", irisToJsonArray(iris));
    }

    /**
     * Gets a Set of ConceptScheme IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ConceptSchemes from.
     * @return a Set of ConceptScheme IRIs from the provided Ontology.
     */
    private Set<IRI> getConceptSchemeIRIs(Ontology ontology) {
        return ontology.getIndividualsOfType(SKOS.CONCEPT_SCHEME).stream()
                .map(Individual::getIRI)
                .collect(Collectors.toSet());
    }

    private ObjectNode getDerivedConceptTypeIRIObject(Ontology ontology) {
        return getObjectArray("derivedConcepts", getDerivedConceptTypeIRIArray(ontology));
    }

    private ArrayNode getDerivedConceptTypeIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubClassesFor(SKOS.CONCEPT));
    }

    private ObjectNode getDerivedConceptSchemeTypeIRIObject(Ontology ontology) {
        return getObjectArray("derivedConceptSchemes", getDerivedConceptSchemeTypeIRIArray(ontology));
    }

    private ArrayNode getDerivedConceptSchemeTypeIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubClassesFor(SKOS.CONCEPT_SCHEME));
    }

    private ObjectNode getDerivedSemanticRelationIRIObject(Ontology ontology) {
        return getObjectArray("derivedSemanticRelations", getDerivedSemanticRelationIRIArray(ontology));
    }

    private ArrayNode getDerivedSemanticRelationIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubPropertiesFor(SKOS.SEMANTIC_RELATION));
    }

    /**
     * Creates an ArrayNode of IRI strings from the passed Set of IRIs.
     *
     * @param iris the Set of IRIs to turn into this ArrayNode.
     * @return an ArrayNode of the IRI strings.
     */
    private ArrayNode irisToJsonArray(Set<IRI> iris) {
        return mapper.valueToTree(iris.stream().map(Value::stringValue).collect(Collectors.toSet()));
    }

    /**
     * Creates an ObjectNode with a specified key out of an ArrayNode.
     *
     * @param field the key for the ObjectNode that will be returned.
     * @param arrayNode the value for the ObjectNode that will be returned.
     * @return an ObjectNode with a key of the passed in field and a value of the passed in ArrayNode
     */
    private ObjectNode getObjectArray(String field, ArrayNode arrayNode) {
        ObjectNode jsonObject = mapper.createObjectNode();
        jsonObject.set(field, arrayNode);
        return jsonObject;
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @param skolemize whether the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @param outputStream the OutputStream that the rdf should be written to
     */
    private OutputStream writeOntologyToStream(Ontology ontology, String rdfFormat, boolean skolemize,
                                               OutputStream outputStream) {
        return switch (rdfFormat.toLowerCase()) {
            case RDF_XML -> ontology.asRdfXml(outputStream);
            case OWL_XML -> ontology.asOwlXml(outputStream);
            case TURTLE -> ontology.asTurtle(outputStream);
            default -> ontology.asJsonLD(skolemize, outputStream);
        };
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @param skolemize whether the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @return A String containing the newly serialized Ontology.
     */
    private String getOntologyAsRdf(Ontology ontology, String rdfFormat, boolean skolemize) {
        switch (rdfFormat.toLowerCase()) {
            case RDF_XML -> {
                return ontology.asRdfXml().toString();
            }
            case OWL_XML -> {
                return ontology.asOwlXml().toString();
            }
            case TURTLE -> {
                return ontology.asTurtle().toString();
            }
            default -> {
                OutputStream outputStream = ontology.asJsonLD(skolemize);
                return outputStream.toString();
            }
        }
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @param skolemize whether the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @return A String containing the newly serialized Ontology.
     */
    private StreamingOutput getOntologyAsRdfStream(Ontology ontology, String rdfFormat, boolean skolemize) {
        return output -> {
            switch (rdfFormat.toLowerCase()) {
                case RDF_XML -> ontology.asRdfXml(output);
                case OWL_XML -> ontology.asOwlXml(output);
                case TURTLE -> ontology.asTurtle(output);
                default -> ontology.asJsonLD(skolemize, output);
            }
        };
    }

    /**
     * Return an ObjectNode with the requested format and the requested ontology in that format.
     *
     * @param ontology  the ontology to format and return
     * @param rdfFormat the format to serialize the ontology in
     * @return an ObjectNode with the document format and the ontology in that format
     */
    private ObjectNode getOntologyAsJsonObject(Ontology ontology, String rdfFormat) {
        log.trace("Start getOntologyAsJsonObject");
        OntologyId ontologyId = ontology.getOntologyId();
        Optional<IRI> optIri = ontologyId.getOntologyIRI();

        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("documentFormat", rdfFormat);
        objectNode.put("id", ontologyId.getOntologyIdentifier().stringValue());
        objectNode.put(ONTOLOGY_ID, optIri.isPresent() ? optIri.get().stringValue() : "");
        long start = System.currentTimeMillis();
        try {
            objectNode.set("ontology", mapper.readTree(getOntologyAsRdf(ontology, rdfFormat, false)));
        } catch (IOException e) {
            throw new MobiException(e);
        }
        log.trace("getOntologyAsJsonObject took {}ms", System.currentTimeMillis() - start);

        return objectNode;
    }

    private ObjectNode getOntologyIdentifiersAsJsonObject(Ontology ontology) {
        log.trace("Start getOntologIdentifiersyAsJsonObject");
        OntologyId ontologyId = ontology.getOntologyId();
        Optional<IRI> optIri = ontologyId.getOntologyIRI();

        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("id", ontologyId.getOntologyIdentifier().stringValue());
        objectNode.put(ONTOLOGY_ID, optIri.isPresent() ? optIri.get().stringValue() : "");

        return objectNode;
    }

    /**
     * Return an ObjectNode with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs
     * @return the ObjectNode with the IRIs for all components of an ontology.
     */
    private ObjectNode getAllIRIs(Ontology ontology) {
        return combineJsonObjects(
                getAnnotationIRIObject(ontology),
                getDeprecatedIRIObject(ontology),
                getClassIRIArray(ontology),
                getDatatypeIRIObject(ontology),
                getObjectPropertyIRIObject(ontology),
                getDataPropertyIRIObject(ontology),
                getNamedIndividualIRIObject(ontology),
                getConceptIRIObject(ontology),
                getConceptSchemeIRIObject(ontology),
                getDerivedConceptTypeIRIObject(ontology),
                getDerivedConceptSchemeTypeIRIObject(ontology),
                getDerivedSemanticRelationIRIObject(ontology));
    }

    private ObjectNode getVocabularyIRIs(Ontology ontology) {
        return combineJsonObjects(getConceptIRIObject(ontology), getConceptSchemeIRIObject(ontology));
    }

    /**
     * Combines multiple ObjectNodes into a single ObjectNode.
     *
     * @param objects the ObjectNodes to combine.
     * @return an ObjectNode which has the combined key-value pairs from all the provided ObjectNodes.
     */
    private ObjectNode combineJsonObjects(ObjectNode... objects) {
        ObjectNode objectNode = mapper.createObjectNode();

        for (ObjectNode each : objects) {
            objectNode.setAll(each);
        }
        return objectNode;
    }

    /**
     * Creates a Model using the provided JSON-LD.
     *
     * @param json the JSON-LD to convert to a Model.
     * @return a Model created using the JSON-LD.
     */
    private Model getModelFromJson(String json) {
        return jsonldToModel(json);
    }

    /**
     * Adds the provided Model to the requester's InProgressCommit additions.
     *
     * @param servletRequest the HttpServletRequest.
     * @param recordIdStr    the record ID String to process.
     * @param entityModel    the Model to add to the additions in the InProgressCommit.
     * @param conn           the RepositoryConnection to use for lookup
     * @return a Response indicating the success or failure of the addition.
     */
    private Response additionsToInProgressCommit(HttpServletRequest servletRequest, String recordIdStr,
                                                 Model entityModel, RepositoryConnection conn) {
        User user = getActiveUser(servletRequest, engineManager);
        Resource recordId = vf.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);
        commitManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                entityModel, null, conn);
        return Response.status(Response.Status.CREATED).build();
    }

    /**
     * Adds the Statements associated with the entity identified by the provided ID to the requester's InProgressCommit
     * deletions.
     *
     * @param servletRequest the HttpServletRequest.
     * @param ontology       the ontology to process.
     * @param entityIdStr    the ID of the entity to be deleted.
     * @param recordIdStr    the ID of the record which contains the entity to be deleted.
     * @param conn           the RepositoryConnection to use for lookup
     * @return a Response indicating the success or failure of the deletion.
     */
    private Response deletionsToInProgressCommit(HttpServletRequest servletRequest, Ontology ontology,
                                                 String entityIdStr, String recordIdStr, RepositoryConnection conn) {
        User user = getActiveUser(servletRequest, engineManager);
        Resource recordId = vf.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId, conn, commitManager, configProvider);
        Model ontologyModel = ontology.asModel();
        Resource entityId = vf.createIRI(entityIdStr);
        Model model = mf.createEmptyModel();
        model.addAll(ontologyModel.stream()
                .filter(statement -> statement.getSubject().equals(entityId)
                        || statement.getPredicate().equals(entityId) || statement.getObject().equals(entityId))
                .collect(Collectors.toSet()));
        if (model.size() == 0) {
            throw ErrorUtils.sendError(entityIdStr + " was not found within the ontology.",
                    Response.Status.BAD_REQUEST);
        }
        commitManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                null, model, conn);
        return Response.ok().build();
    }

    /**
     * Gets the entity from within the provided Ontology based on the provided entity ID.
     *
     * @param ontology    the Ontology to process.
     * @param entityIdStr the ID of the entity to get.
     * @return a Model representation of the entity with the provided ID.
     */
    private Model getModelForEntityInOntology(Ontology ontology, String entityIdStr) {
        Model ontologyModel = ontology.asModel();
        Model temp = mf.createEmptyModel();
        temp.addAll(ontologyModel);
        return temp.filter(vf.createIRI(entityIdStr), null, null);
    }

    /**
     * Verifies that the provided JSON-LD contains the proper @type.
     *
     * @param jsonldStr the JSON-LD of the entity being verified.
     * @param type      the @type that the entity should be.
     */
    private void verifyJsonldType(String jsonldStr, String type) {
        try {
            JsonNode json = mapper.readTree(jsonldStr);

            if (!json.has("@type")) {
                throw ErrorUtils.sendError("The JSON-LD does not contain \"@type\".", Response.Status.BAD_REQUEST);
            }

            JsonNode jsonNode = json.get("@type");
            if (jsonNode.isArray()) {
                ObjectReader reader = mapper.reader(new TypeReference<List<String>>() {});
                List<String> values = reader.readValue(jsonNode);
                if (!values.contains(type)) {
                    throw ErrorUtils.sendError("The JSON-LD does not contain the proper type: " + type + ".",
                            Response.Status.BAD_REQUEST);
                }
            } else {
                throw ErrorUtils.sendError("The JSON-LD does not contain an array of types.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (IOException e) {
            throw ErrorUtils.sendError(e.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates the OntologyRecord using CatalogManager.
     *
     * @param servletRequest   the HttpServletRequest.
     * @param title            the title for the OntologyRecord.
     * @param description      the description for the OntologyRecord.
     * @param keywordSet       the comma separated list of keywords associated with the OntologyRecord.
     * @param config           the RecordOperationConfig containing the appropriate model or input file.
     * @return a Response indicating the success of the creation.
     */
    private Response createOntologyRecord(HttpServletRequest servletRequest, String title, String description,
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
        OntologyRecord record;
        Resource branchId;
        Resource commitId;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            record = recordManager.createRecord(user, config, OntologyRecord.class, conn);
            branchId = record.getMasterBranch_resource().orElseThrow(() ->
                    new IllegalStateException("Record must have a master branch"));

            RepositoryResult<Statement> commitStmt = conn.getStatements(branchId,
                    vf.createIRI(Branch.head_IRI), null);
            if (!commitStmt.hasNext()) {
                commitStmt.close();
                throw ErrorUtils.sendError("The requested instance could not be found.",
                        Response.Status.BAD_REQUEST);
            }
            commitId = (Resource) commitStmt.next().getObject();
            commitStmt.close();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }

        ObjectNode objectNode = mapper.createObjectNode();
        Resource ontologyIRI = record.getTrackedIdentifier().orElseThrow(() ->
                new IllegalStateException("Ontology IRI must be present"));
        objectNode.put(ONTOLOGY_ID, ontologyIRI.toString());
        objectNode.put("recordId", record.getResource().stringValue());
        objectNode.put("branchId", branchId.toString());
        objectNode.put("commitId", commitId.toString());

        return Response.status(Response.Status.CREATED).entity(objectNode.toString()).build();
    }

    /**
     * Class used for OpenAPI documentation for encoded url endpoint.
     */
    private static class EncodedQuery {
        @Schema(type = "string", description = "The SPARQL query to execute", required = true,
                example = "SELECT * WHERE { ?s ?p ?o . }")
        public String query;
        @Schema(type = "string", description = "Optional Branch ID representing the branch IRI of the Record to query")
        public String branchId;
        @Schema(type = "string", description = "Optional Commit ID representing the commit IRI of the Record to query")
        public String commitId;
        @Schema(type = "boolean", description = "Optional boolean representing whether to "
                + "include imported ontologies when executing the query")
        public String includeImports;
        @Schema(type = "boolean", description = "Optional boolean representing whether to "
                + "apply the in progress commit when executing the query")
        public String applyInProgressCommit;
        @Schema(name = "fileName", description = "File name of the downloaded results file when the "
                + "`ACCEPT` header is set to `application/octet-stream`")
        public String fileName;
        @Schema(type = "string", description = "Format of the downloaded results file when the `ACCEPT` "
                + "header is set to `application/octet-stream`",
                allowableValues = {"xlsx", "csv", "tsv", "ttl", JSONLD, "rdf", "json"})
        public String fileType;
    }
}
