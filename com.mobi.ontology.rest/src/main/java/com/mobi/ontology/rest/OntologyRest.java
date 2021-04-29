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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectNodeFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.modelToString;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CatalogManager;
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
import com.mobi.ontology.core.api.record.config.OntologyRecordCreateSettings;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.core.utils.MobiStringUtils;
import com.mobi.ontology.rest.json.EntityNames;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.OntologyUtils;
import com.mobi.ontology.utils.cache.OntologyCache;
import com.mobi.persistence.utils.BNodeUtils;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import com.mobi.security.policy.api.ontologies.policy.Read;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedOperation;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.component.annotations.ReferencePolicyOption;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.annotation.Nullable;
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
import javax.ws.rs.core.StreamingOutput;


@Path("/ontologies")
@Component(service = OntologyRest.class, immediate = true)
public class OntologyRest {

    private ModelFactory modelFactory;
    private ValueFactory valueFactory;
    private OntologyManager ontologyManager;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private EngineManager engineManager;
    private SesameTransformer sesameTransformer;
    private OntologyCache ontologyCache;
    private BNodeService bNodeService;

    private static final Logger log = LoggerFactory.getLogger(OntologyRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String GET_ENTITY_QUERY;
    private static final String GET_PROPERTY_RANGES;
    private static final String GET_CLASS_PROPERTIES;
    private static final String GET_NO_DOMAIN_PROPERTIES;
    private static final String GET_ENTITY_NAMES;
    private static final String NAME_SPLITTER = "�";

    static {
        try {
            GET_ENTITY_QUERY = IOUtils.toString(
                    OntologyRest.class.getResourceAsStream("/retrieve-entity.rq"), StandardCharsets.UTF_8
            );
            GET_PROPERTY_RANGES = IOUtils.toString(
                    OntologyRest.class.getResourceAsStream("/query-property-ranges.rq"), StandardCharsets.UTF_8
            );
            GET_CLASS_PROPERTIES = IOUtils.toString(
                    OntologyRest.class.getResourceAsStream("/query-class-properties.rq"), StandardCharsets.UTF_8
            );
            GET_NO_DOMAIN_PROPERTIES = IOUtils.toString(
                    OntologyRest.class.getResourceAsStream("/query-no-domain-properties.rq"),
                    StandardCharsets.UTF_8
            );
            GET_ENTITY_NAMES = IOUtils.toString(
                    OntologyRest.class.getResourceAsStream("/query-entity-names.rq"), StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Reference
    void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference(policyOption = ReferencePolicyOption.GREEDY)
    void setOntologyManager(OntologyManager ontologyManager) {
        this.ontologyManager = ontologyManager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    void setOntologyCache(OntologyCache ontologyCache) {
        this.ontologyCache = ontologyCache;
    }

    @Reference
    void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    /**
     * Ingests/uploads an ontology file or the JSON-LD of an ontology to a data store and creates and stores an
     * OntologyRecord using the form data in the repository to track the work done on it. A master Branch is created
     * and stored with an initial Commit containing the data provided in the ontology file. Only provide either an
     * ontology file or ontology JSON-LD.
     *
     * @param context         the context of the request.
     * @param fileInputStream the ontology file to upload.
     * @param ontologyJson    the ontology JSON-LD to upload.
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
    @Operation(
            tags = "ontologies",
            summary = "Uploads an ontology file to the data store",
            description = "Uploads and imports an ontology file to a data store and creates an associated "
                    + "OntologyRecord using the form data. A master Branch is created and stored with an initial "
                    + "Commit containing the data provided in the ontology file.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "OntologyRecord created"),
                    @ApiResponse(responseCode = "400", description = "Publisher can't be found"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Problem creating OntologyRecord")
            }
    )
    @RolesAllowed("user")
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = OntologyRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response uploadFile(
            @Context ContainerRequestContext context,
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "Ontology file to upload.", required = true))
            @FormDataParam("file") InputStream fileInputStream,
            @Parameter(description = "File details", hidden = true)
            @FormDataParam("file") FormDataContentDisposition fileDetail,
            @Parameter(schema = @Schema(type = "string",
                    description = "Ontology JSON-LD to upload"))
            @FormDataParam("json") String ontologyJson,
            @Parameter(schema = @Schema(type = "string",
                    description = "Title for the OntologyRecord", required = true))
            @FormDataParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the OntologyRecord"))
            @FormDataParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional markdown abstract for the new OntologyRecord"))
            @FormDataParam("markdown") String markdown,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional list of keyword strings for the OntologyRecord"))
            @FormDataParam("keywords") List<FormDataBodyPart> keywords) {
        checkStringParam(title, "The title is missing.");
        if (fileInputStream == null && ontologyJson == null) {
            throw ErrorUtils.sendError("The ontology data is missing.", Response.Status.BAD_REQUEST);
        } else if (fileInputStream != null && ontologyJson != null) {
            throw ErrorUtils.sendError("Only provide either an ontology file or ontology json data.",
                    Response.Status.BAD_REQUEST);
        }

        Set<String> keywordSet = Collections.emptySet();
        if (keywords != null) {
            keywordSet = keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet());
        }
        if (fileInputStream != null) {
            RecordOperationConfig config = new OperationConfig();
            config.set(OntologyRecordCreateSettings.INPUT_STREAM, fileInputStream);
            config.set(OntologyRecordCreateSettings.FILE_NAME, fileDetail.getFileName());
            return createOntologyRecord(context, title, description, markdown, keywordSet, config);
        } else {
            checkStringParam(ontologyJson, "The ontologyJson is missing.");
            RecordOperationConfig config = new OperationConfig();
            Model jsonModel = getModelFromJson(ontologyJson);
            config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonModel);
            return createOntologyRecord(context, title, description, markdown, keywordSet, config);
        }
    }

    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @Operation(
            tags = "ontologies",
            summary = "Returns the ontology associated with the requested record ID in the requested format",
            responses = {
                    @ApiResponse(responseCode = "200", description = "The Ontology in the requested format"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID. NOTE: Assumes id represents an "
                    + "IRI unless String begins with \"_:\"", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Optional String representing the Branch Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to Master branch if missing")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "Optional String representing the Commit Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to head commit if missing. The "
                    + "provided commitId must be on the Branch identified by the provided branchId; "
                    + "otherwise, nothing will be returned", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Desired RDF return format",
                    schema = @Schema(allowableValues = {"jsonld", "rdf/xml", "owl/xml", "turtle"}))
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "Whether or not the cached version of the identified Ontology should "
                    + "be cleared before retrieval")
            @DefaultValue("false") @QueryParam("clearCache") boolean clearCache,
            @Parameter(description = "Whether or not the JSON-LD of the ontology should be skolemized.")
            @DefaultValue("false") @QueryParam("skolemize") boolean skolemize,
            @Parameter(description = "Whether or not any in progress commits by user should be applied "
                    + "to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit")
                    boolean applyInProgressCommit
    ) {
        try {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            }
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit)
                    .orElseThrow(() ->
                            ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));

            StreamingOutput output = outputStream -> {
                writeOntologyToStream(ontology, rdfFormat, skolemize, outputStream);
            };
            return Response.ok(output).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes the ontology associated with the requested record ID in the requested format.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @return OK.
     */
    @DELETE
    @Path("{recordId}")
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the OntologyRecord with the requested recordId",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating the success"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Delete.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr) {
        try {
            catalogManager.deleteRecord(getActiveUser(context, engineManager), valueFactory.createIRI(recordIdStr),
                    OntologyRecord.class);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    /**
     * Streams the ontology associated with the requested record ID to an OutputStream.
     *
     * @param context     the context of the request
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
     * @param fileName    the file name for the ontology file
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
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
            },
            hidden = true
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadOntologyFile(
            @Context ContainerRequestContext context,
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
                    schema = @Schema(allowableValues = {"jsonld", "rdf/xml", "owl/xml", "turtle"}))
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "File name for the ontology file")
            @DefaultValue("ontology") @QueryParam("fileName") String fileName
    ) {
        try {
            Ontology ontology = getOntology(context,
                    recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(getOntologyAsRdf(ontology, rdfFormat, false));
                writer.flush();
                writer.close();
            };
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response saveChangesToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "String representing the edited entity id", required = true)
            @QueryParam("entityId") String entityIdStr,
            @Parameter(description = "String representing the edited Resource", required = true)
                    String entityJson) {
        try {
            Ontology ontology = getOntology(context,
                    recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Model entityModel = getModelForEntityInOntology(ontology, entityIdStr);
            Difference diff = catalogManager.getDiff(entityModel, getModelFromJson(entityJson));
            Resource recordId = valueFactory.createIRI(recordIdStr);
            User user = getActiveUser(context, engineManager);
            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
            catalogManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                    diff.getAdditions(), diff.getDeletions());
            return Response.ok().build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the InProgressCommit associated with the User making the request for the OntologyRecord identified by the
     * provided recordId.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
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
    @Operation(
            tags = "ontologies",
            summary = "Updates the specified ontology branch and commit with the data provided",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "OK if successful or METHOD_NOT_ALLOWED if the changes "
                                    + "can not be applied to the commit specified"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response uploadChangesToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "Ontology file to upload", required = true))
            @FormDataParam("file") InputStream fileInputStream,
            @Parameter(description = "File details", hidden = true)
            @FormDataParam("file") FormDataContentDisposition fileDetail) {
        long totalTime = System.currentTimeMillis();

        if (fileInputStream == null) {
            throw ErrorUtils.sendError("The file is missing.", Response.Status.BAD_REQUEST);
        }
        try {
            Resource catalogIRI = configProvider.getLocalCatalogIRI();
            Resource recordId = valueFactory.createIRI(recordIdStr);

            User user = getActiveUser(context, engineManager);
            Optional<InProgressCommit> commit = catalogManager.getInProgressCommit(catalogIRI, recordId, user);

            if (commit.isPresent()) {
                throw ErrorUtils.sendError("User has an in progress commit already.", Response.Status.BAD_REQUEST);
            }

            Resource branchId;
            Resource commitId;
            if (StringUtils.isNotBlank(commitIdStr)) {
                checkStringParam(branchIdStr, "The branchIdStr is missing.");
                commitId = valueFactory.createIRI(commitIdStr);
                branchId = valueFactory.createIRI(branchIdStr);
            } else if (StringUtils.isNotBlank(branchIdStr)) {
                branchId = valueFactory.createIRI(branchIdStr);
                commitId = catalogManager.getHeadCommit(catalogIRI, recordId, branchId).getResource();
            } else {
                Branch branch = catalogManager.getMasterBranch(catalogIRI, recordId);
                branchId = branch.getResource();
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
                            MobiStringUtils.getFileExtension(fileDetail.getFileName()), uploadedBNodes);
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
                Model temp = getCurrentModel(recordId, branchId, commitId, catalogBNodes);
                log.trace("currentModelFuture took " + (System.currentTimeMillis() - startTimeF));
                return temp;
            });
            log.trace("uploadChangesToOntology futures creation took {} ms", System.currentTimeMillis() - startTime);

            Model currentModel = currentModelFuture.get();
            Model uploadedModel = uploadedModelFuture.get();

            startTime = System.currentTimeMillis();
            if (!OntologyModels.findFirstOntologyIRI(uploadedModel, valueFactory).isPresent()) {
                OntologyModels.findFirstOntologyIRI(currentModel, valueFactory)
                        .ifPresent(iri -> uploadedModel.add(iri, valueFactory.createIRI(RDF.TYPE.stringValue()),
                                valueFactory.createIRI(OWL.ONTOLOGY.stringValue())));
            }
            log.trace("uploadChangesToOntology futures completion took {} ms", System.currentTimeMillis() - startTime);

            startTime = System.currentTimeMillis();
            Difference diff = catalogManager.getDiff(currentModel, uploadedModel);
            log.trace("uploadChangesToOntology getDiff took {} ms", System.currentTimeMillis() - startTime);

            if (diff.getAdditions().size() == 0 && diff.getDeletions().size() == 0) {
                return Response.noContent().build();
            }

            Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
            startTime = System.currentTimeMillis();
            catalogManager.updateInProgressCommit(catalogIRI, recordId, inProgressCommitIRI,
                    BNodeUtils.restoreBNodes(diff.getAdditions(), uploadedBNodes, modelFactory),
                    BNodeUtils.restoreBNodes(diff.getDeletions(), catalogBNodes, modelFactory));
            log.trace("uploadChangesToOntology getInProgressCommitIRI took {} ms",
                    System.currentTimeMillis() - startTime);

            return Response.ok().build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | ExecutionException | InterruptedException | CompletionException ex) {
            if (ex instanceof ExecutionException && (ex.getCause() instanceof IllegalArgumentException
                    || ex.getCause() instanceof RDFParseException)) {
                throw RestUtils.getErrorObjBadRequest(new IllegalStateException(ex.getCause().getMessage()));
            }
            throw RestUtils.getErrorObjInternalServerError(ex);
        } finally {
            IOUtils.closeQuietly(fileInputStream);
            log.trace("uploadChangesToOntology took " + (System.currentTimeMillis() - totalTime));
            log.trace("uploadChangesToOntology getGarbageCollectionTime {} ms", getGarbageCollectionTime());
        }
    }

    /**
     * Calculates the garbage collection time in milliseconds.
     *
     * @return The total garbage collection time.
     */
    private static long getGarbageCollectionTime() {
        long collectionTime = 0;
        for (GarbageCollectorMXBean garbageCollectorMXBean : ManagementFactory.getGarbageCollectorMXBeans()) {
            collectionTime += garbageCollectorMXBean.getCollectionTime();
        }
        return collectionTime;
    }

    /**
     * Gets a {@link Model} of the provided {@link InputStream}. Deterministically skolemizes any BNode in the model.
     *
     * @param fileInputStream The {@link InputStream} to process.
     * @param fileExtension The extension of the file associated with the fileInputStream.
     * @param bNodesMap The {@link Map} of BNodes to their deterministically skolemized IRIs. Will be populated in
     *                  method.
     * @return A {@link Model} with deterministically skolemized BNodes.
     * @throws IOException When an error occurs processing the {@link InputStream}
     */
    private Model getUploadedModel(InputStream fileInputStream, String fileExtension, Map<BNode, IRI> bNodesMap)
            throws IOException {
        // Load uploaded ontology into a skolemized model
        return Models.createSkolemizedModel(fileExtension, fileInputStream, modelFactory, sesameTransformer,
                bNodeService, bNodesMap);
    }

    /**
     * Gets a {@link Model} from the provided Record/Branch/Commit in the Catalog. Deterministically skolemizes any
     * BNode in the model.
     *
     * @param recordId The {@link Resource} of the recordId.
     * @param branchId The {@link Resource} of the branchId.
     * @param commitId The {@link Resource} of the commitId.
     * @param bNodesMap The {@link Map} of BNodes to their deterministically skolemized IRIs. Will be populated in
     *                  method.
     * @return A {@link Model} with deterministically skolemized BNodes.
     */
    private Model getCurrentModel(Resource recordId, Resource branchId, Resource commitId, Map<BNode, IRI> bNodesMap) {
        // Load existing ontology into a skolemized model
        return bNodeService.deterministicSkolemize(catalogManager.getCompiledResource(recordId, branchId, commitId),
                bNodesMap);
    }

    /**
     Deletes the ontology associated with the requested record ID in the requested format. Unless a branch is
     * specified. In which case the branch specified by the branchId query parameter will be removed and nothing else.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @return OK.
     */
    @DELETE
    @Path("{recordId}/branches/{branchId}")
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Deletes the Branch with the requested BranchId from the "
                    + "OntologyRecord with the provided recordId",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating successfully request"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(type = ValueType.PATH, id = VersionedRDFRecord.branch_IRI, value = "branchId")
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteOntologyBranch(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = true)
            @PathParam("branchId") String branchIdStr) {
        try {
            ontologyManager.deleteOntologyBranch(valueFactory.createIRI(recordIdStr),
                    valueFactory.createIRI(branchIdStr));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }

    /**
     * Returns a JSON object with keys for the list of IRIs of derived skos:Concepts, the list of IRIs of derived
     * skos:ConceptSchemes, an object with the concept hierarchy and index, and an object with the concept scheme
     * hierarchy and index.
     *
     * @param context the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVocabularyStuff(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true);
            if (optionalOntology.isPresent()) {
                StreamingOutput output = getVocabularyStuffStream(optionalOntology.get());
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
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
            writeHierarchyToStream(ontology.getConceptRelationships(valueFactory, modelFactory), outputStream);

            watch.stop();
            log.trace("End conceptHierarchy: " + watch.getTime() + "ms");
            watch.reset();
            log.trace("Start conceptSchemeHierarchy");
            watch.start();

            outputStream.write(", \"conceptSchemeHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptSchemeRelationships(valueFactory, modelFactory), outputStream);
            outputStream.write("}".getBytes());

            watch.stop();
            log.trace("End conceptSchemeHierarchy: " + watch.getTime() + "ms");
        };
    }

    /**
     * Returns a JSON object with all of the lists and objects needed by the UI to properly display and work with
     * ontologies.
     *
     * @param context the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyStuff(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean to decide to clear cache")
            @DefaultValue("false") @QueryParam("clearCache") boolean clearCache) {
        try {
            if (clearCache) {
                ontologyCache.removeFromCache(recordIdStr, commitIdStr);
            }
            Optional<Ontology> optionalOntology = getOntology(context,
                    recordIdStr, branchIdStr, commitIdStr, true);
            if (optionalOntology.isPresent()) {
                StreamingOutput output = getOntologyStuffStream(optionalOntology.get());
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.",
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
            outputStream.write(ontologyId.getOntologyIRI().isPresent() ?
                    ("\"" + ontologyId.getOntologyIRI().get().toString() + "\"").getBytes() : "".getBytes());

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
            writeHierarchyToStream(ontology.getSubClassesOf(valueFactory, modelFactory), outputStream);
            watch.stop();
            log.trace("End classHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start individuals");
            watch.start();
            outputStream.write(", \"individuals\": ".getBytes());
            ObjectNode classesWithIndividuals = mapper.valueToTree(
                    ontology.getClassesWithIndividuals(valueFactory, modelFactory).getParentMap());
            outputStream.write(classesWithIndividuals.toString().getBytes());
            watch.stop();
            log.trace("End individuals: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start dataPropertyHierarchy");
            watch.start();
            outputStream.write(", \"dataPropertyHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubDatatypePropertiesOf(valueFactory, modelFactory), outputStream);
            watch.stop();
            log.trace("End dataPropertyHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start objectPropertyHierarchy");
            watch.start();
            outputStream.write(", \"objectPropertyHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubObjectPropertiesOf(valueFactory, modelFactory), outputStream);
            watch.stop();
            log.trace("End objectPropertyHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start annotationHierarchy");
            watch.start();
            outputStream.write(", \"annotationHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getSubAnnotationPropertiesOf(valueFactory, modelFactory), outputStream);
            watch.stop();
            log.trace("End annotationHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start conceptHierarchy");
            watch.start();
            outputStream.write(", \"conceptHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptRelationships(valueFactory, modelFactory), outputStream);
            watch.stop();
            log.trace("End conceptHierarchy: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start conceptSchemeHierarchy");
            watch.start();
            outputStream.write(", \"conceptSchemeHierarchy\": ".getBytes());
            writeHierarchyToStream(ontology.getConceptSchemeRelationships(valueFactory, modelFactory), outputStream);
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
            writeNoDomainPropertiesToStream(ontology.getTupleQueryResults(GET_NO_DOMAIN_PROPERTIES, true), outputStream);
            watch.stop();
            log.trace("End noDomainProperties: " + watch.getTime() + "ms");

            watch.reset();
            log.trace("Start entityNames");
            watch.start();
            outputStream.write(", \"entityNames\": ".getBytes());
            String queryString = GET_ENTITY_NAMES.replace("%ENTITIES%", "");
            writeEntityNamesToStream(ontology.getTupleQueryResults(queryString, true), outputStream);
            watch.stop();
            log.trace("End entityNames: " + watch.getTime() + "ms");

            outputStream.write("}".getBytes());
        };
    }

    /**
     * Returns IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getIRIsInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ObjectNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns annotation property IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getAnnotationsInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ObjectNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationIRIObject, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add a new owl annotation property to the ontology identified by the provided IDs associated with the
     * requester's InProgressCommit.
     *
     * @param context        the context of the request.
     * @param recordIdStr    String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addAnnotationToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID. NOTE: Assumes id represents an "
                    + "IRI unless String begins with \"_:\"")
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new annotation in JSON-LD", required = true)
                    String annotationJson) {
        verifyJsonldType(annotationJson, OWL.ANNOTATIONPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(annotationJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Delete annotation with requested annotation ID from ontology identified by the provided IDs from the server.
     *
     * @param context         the context of the request.
     * @param recordIdStr     String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteAnnotationFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the annotation Resource ID", required = true)
            @PathParam("annotationId") String annotationIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context,
                    recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, annotationIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns class IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
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
    @Operation(
            tags = "ontologies",
            summary = "Gets the classes in the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Classes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether or not any in progress commits by user should be "
                    + "applied to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        try {
            ArrayNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr, this::getClassArray,
                    applyInProgressCommit);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add a new class to ontology identified by the provided IDs from the server associated with the requester's
     * InProgressCommit.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addClassToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new class model", required = true)
                    String classJson) {
        verifyJsonldType(classJson, OWL.CLASS.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(classJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete class with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteClassFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("classId") String classIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, classIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns datatype IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDatatypesInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ObjectNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDatatypeIRIObject, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new datatype to the ontology identified by the provided IDs associated with the requester's
     * InProgressCommit.
     *
     * @param context      the context of the request.
     * @param recordIdStr  String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addDatatypeToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "JSON String representing the new datatype model", required = true)
                    String datatypeJson) {
        verifyJsonldType(datatypeJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(datatypeJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete the datatype from the ontology identified by the provided IDs.
     *
     * @param context       the context of the request.
     * @param recordIdStr   String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteDatatypeFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the datatype Resource ID", required = true)
            @PathParam("datatypeId") String datatypeIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, datatypeIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns object property IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getObjectPropertiesInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ArrayNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyArray, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new object property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context            the context of the request.
     * @param recordIdStr        String representing the Record Resource ID. NOTE: Assumes id represents an IRI
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addObjectPropertyToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new property model", required = true)
                    String objectPropertyJson) {
        verifyJsonldType(objectPropertyJson, OWL.OBJECTPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(objectPropertyJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete object property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context             the context of the request.
     * @param recordIdStr         String representing the Record Resource ID. NOTE: Assumes id represents an IRI
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteObjectPropertyFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("objectPropertyId") String objectPropertyIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, objectPropertyIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns data properties in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDataPropertiesInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ArrayNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyArray, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new data property to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context          the context of the request.
     * @param recordIdStr      String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addDataPropertyToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "JSON String representing the new property model", required = true)
                    String dataPropertyJson) {
        verifyJsonldType(dataPropertyJson, OWL.DATATYPEPROPERTY.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(dataPropertyJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete data property with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context           the context of the request.
     * @param recordIdStr       String representing the Record Resource ID. NOTE: Assumes id represents an IRI
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteDataPropertyFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the class Resource ID", required = true)
            @PathParam("dataPropertyId") String dataPropertyIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, dataPropertyIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns named individual IRIs in the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getNamedIndividualsInOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ObjectNode result = doWithOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualIRIObject, true);
            return Response.ok(result.toString()).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Adds a new individual to the ontology identified by the provided IDs from the server associated with the
     * requester's InProgressCommit.
     *
     * @param context        the context of the request.
     * @param recordIdStr    String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response addIndividualToOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the new individual model", required = true)
                    String individualJson) {
        verifyJsonldType(individualJson, OWL.INDIVIDUAL.stringValue());
        try {
            return additionsToInProgressCommit(context, recordIdStr, getModelFromJson(individualJson));
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete individual with requested class ID from ontology identified by the provided IDs from the server.
     *
     * @param context         the context of the request.
     * @param recordIdStr     String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteIndividualFromOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the individual Resource ID", required = true)
            @PathParam("individualId") String individualIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return deletionsToInProgressCommit(context, ontology, individualIdStr, recordIdStr);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
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
    @Path("{recordId}/imported-iris")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the IRIs from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "IRIs in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getIRIsInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getAllIRIs);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns IRIs of the ontologies in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getImportedOntologyIRIs(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            ArrayNode arrayNode = mapper.createArrayNode();
            Set<String> importedOntologyIris = new HashSet<>();
            Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, false);
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
                throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
            }
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns an array of the imports closure in the requested format from the ontology
     * with the requested ID.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getImportsClosure(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Desired RDF return format")
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Set<Ontology> importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
    @Path("{recordId}/imported-annotations")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the annotations from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Annotation properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getAnnotationsInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getAnnotationIRIObject);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns class IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getClassIRIArray);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns datatype IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
    @Path("{recordId}/imported-datatypes")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the datatypes from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Datatypes in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDatatypesInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr, this::getDatatypeIRIObject);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns object property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
    @Path("{recordId}/imported-object-properties")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the object properties from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Object properties in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getObjectPropertiesInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getObjectPropertyIRIObject);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns data property IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDataPropertiesInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getDataPropertyIRIObject);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns named individual IRIs in the imports closure for the ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
    @Path("{recordId}/imported-named-individuals")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Gets the named individuals from the imported ontologies of the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Named individuals in the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getNamedIndividualsInImportedOntologies(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            return doWithImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr,
                    this::getNamedIndividualIRIObject);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the class hierarchy for the ontology identified by the provided IDs as a JSON object with keys for a
     * map of parent class IRIs to arrays of children class IRIs and a map of child class IRIs to arrays of parent class
     * IRIs. Optionally can also have a key for a nested JSON-LD representation of the hierarchy.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
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
    @Operation(
            tags = "ontologies",
            summary = "Gets the class hierarchies for the identified ontology",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "JSON object that represents the class hierarchy "
                                    + "for the ontology identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyClassHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubClassesOf(valueFactory, modelFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyObjectPropertyHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubObjectPropertiesOf(valueFactory, modelFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyDataPropertyHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubDatatypePropertiesOf(valueFactory, modelFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getOntologyAnnotationPropertyHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getSubAnnotationPropertiesOf(valueFactory, modelFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConceptHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getConceptRelationships(valueFactory, modelFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConceptSchemeHierarchy(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Whether to return the nested JSON-LD version of the hierarchy")
            @DefaultValue("false") @QueryParam("nested") boolean nested) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Hierarchy hierarchy = ontology.getConceptSchemeRelationships(valueFactory, modelFactory);
            return Response.ok(getHierarchyStream(hierarchy, nested, getConceptSchemeIRIs(ontology))).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns classes with individuals defined in the ontology identified by the provided IDs as a JSON object with a
     * key for a map of class IRIs to arrays of individual IRIs.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getClassesWithIndividuals(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            ObjectNode objectNode = mapper.createObjectNode();
            objectNode.set("individuals",
                    mapper.valueToTree(ontology.getClassesWithIndividuals(valueFactory, modelFactory).getParentMap()));
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
     * @param context      the context of the request.
     * @param recordIdStr  String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntityUsages(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the entity Resource IRI", required = true)
            @PathParam("entityIri") String entityIRIStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "String identifying whether you want to do a select or construct query")
            @DefaultValue("select") @QueryParam("queryType") String queryType) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            Resource entityIRI = valueFactory.createIRI(entityIRIStr);
            if (queryType.equals("construct")) {
                Model results = ontology.constructEntityUsages(entityIRI, modelFactory);
                return Response.ok(modelToJsonld(results, sesameTransformer)).build();
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getSearchResults(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String for the text that is searched for in all of the Literals within the "
                    + "ontology with the requested record ID")
            @QueryParam("searchText") String searchText,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            checkStringParam(searchText, "The searchText is missing.");
            TupleQueryResult results = ontology.getSearchResults(searchText, valueFactory);
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
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getFailedImports(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));
            return Response.ok(getUnloadableImportIRIs(ontology)).build();
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the results of the provided SPARQL query, which targets a specific ontology, and its import closures.
     * Accepts SELECT and CONSTRUCT queries.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param queryString SPARQL Query to perform against ontology.
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param format      the specified format for the return of construct queries only.
     * @param includeImports boolean indicating whether or not ontology imports should be included in the query.
     * @param applyInProgressCommit whether or not to apply the in progress commit for the user making the request.
     * @return The SPARQL 1.1 results in JSON format if the query is a SELECT or the JSONLD serialization of the results
     *      if the query is a CONSTRUCT
     */
    @GET
    @Path("{recordId}/query")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "ontologies",
            summary = "Retrieves the SPARQL query results of an ontology, "
                    + "and its import closures in the requested format",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "SPARQL 1.1 results in JSON format if the query is a "
                                    + "SELECT or the JSONLD serialization of the results if the query is a CONSTRUCT"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response queryOntology(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "SPARQL Query to perform against ontology", required = true)
            @QueryParam("query") String queryString,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Specified format for the return of construct queries only")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Boolean indicating whether or not ontology "
                    + "imports should be included in the query")
            @DefaultValue("true") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit) {
        checkStringParam(queryString, "Parameter 'query' must be set.");

        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));

            ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);

            if (parsedOperation instanceof ParsedQuery) {
                if (parsedOperation instanceof ParsedTupleQuery) {
                    TupleQueryResult tupResults = ontology.getTupleQueryResults(queryString, includeImports);
                    if (tupResults.hasNext()) {
                        ObjectNode json = JSONQueryResults.getResponse(tupResults);
                        return Response.ok(json.toString(), MediaType.APPLICATION_JSON_TYPE).build();
                    } else {
                        return Response.noContent().build();
                    }
                } else if (parsedOperation instanceof ParsedGraphQuery) {
                    return getReponseForGraphQuery(ontology, queryString, includeImports, false, format);
                } else {
                    throw ErrorUtils.sendError("Unsupported query type used", Response.Status.BAD_REQUEST);
                }
            } else {
                throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
            }
        } catch (MalformedQueryException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the triples for a specified entity including all of is transitively attached Blank Nodes.
     *
     * @param context        the context of the request.
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
     * @param includeImports boolean indicating whether or not ontology imports should be included in the query.
     * @param applyInProgressCommit whether or not to apply the in progress commit for the user making the request.
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntity(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the entity Resource ID", required = true)
            @PathParam("entityId") String entityIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Specified format for the return data. Valid values include 'jsonld', "
                    + "'turtle', 'rdf/xml', and 'trig'")
            @DefaultValue("jsonld") @QueryParam("format") String format,
            @Parameter(description = "Boolean indicating whether or not ontology imports "
                    + "should be included in the query")
            @DefaultValue("true") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit "
                    + "for the user making the request")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit
    ) {
        try {
            Ontology ontology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, applyInProgressCommit).orElseThrow(() ->
                    ErrorUtils.sendError("The ontology could not be found.", Response.Status.BAD_REQUEST));

            IRI entity = valueFactory.createIRI(entityIdStr);
            String queryString = GET_ENTITY_QUERY.replace("%ENTITY%", "<" + entity.stringValue() + ">");

            return getReponseForGraphQuery(ontology, queryString, includeImports, format.equals("jsonld"), format);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the map of EntityNames in an Ontology.
     *
     * @param context     the context of the request.
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
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
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getEntityNames(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Record Resource ID", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "String representing the Branch Resource ID", required = false)
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID", required = false)
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether or not any imports")
            @DefaultValue("true") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Boolean indicating whether or not any in progress commits by user should be "
                    + "applied to the return value")
            @DefaultValue("true") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(description = "Filter JSON", required = true)
                    String filterJson) {
        try {
            StopWatch watch = new StopWatch();
            log.trace("Start entityNames");
            watch.start();

            Set<Resource> resources = new HashSet<>();
            JsonNode arrNode = mapper.readTree(filterJson).get("filterResources");
            if (arrNode != null && arrNode.isArray()) {
                for (final JsonNode objNode : arrNode) {
                    resources.add(valueFactory.createIRI(objNode.asText()));
                }
            }

            String queryString = null;
            if (resources.isEmpty()) {
                queryString = GET_ENTITY_NAMES.replace("%ENTITIES%", "");
            } else {
                String resourcesString = "VALUES ?entity {<" + resources.stream().map(Resource::stringValue)
                        .collect(Collectors.joining("> <")) + ">}";
                queryString = GET_ENTITY_NAMES.replace("%ENTITIES%", resourcesString);
            }
            Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr,
                    applyInProgressCommit);
            if (optionalOntology.isPresent()) {
                String finalQueryString = queryString;
                StreamingOutput output = outputStream -> {
                    TupleQueryResult result = optionalOntology.get().getTupleQueryResults(finalQueryString, includeImports);
                    writeEntityNamesToStream(result, outputStream);
                };
                watch.stop();
                log.trace("Entity names endpoint: " + watch.getTime() + "ms");
                return Response.ok(output).build();
            } else {
                throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.",
                        Response.Status.BAD_REQUEST);
            }
        } catch (MobiException | IOException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private Response getReponseForGraphQuery(Ontology ontology, String query, boolean includeImports, boolean skolemize,
                                             String format) {
        Model entityData = ontology.getGraphQueryResults(query, includeImports, modelFactory);

        if (entityData.size() >= 1) {
            String modelStr;
            if (skolemize) {
                modelStr = modelToSkolemizedString(entityData, format, sesameTransformer, bNodeService);
            } else {
                modelStr = modelToString(entityData, format, sesameTransformer);
            }
            MediaType type = format.equals("jsonld") ? MediaType.APPLICATION_JSON_TYPE : MediaType.TEXT_PLAIN_TYPE;
            return Response.ok(modelStr, type).build();
        } else {
            return Response.noContent().build();
        }
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
        if (iris != null) {
            outputStream.write(", \"iris\": ".getBytes());
            outputStream.write(irisToJsonArray(iris).toString().getBytes());
        }
        if (includeNested) {
            outputStream.write(", \"hierarchy\": ".getBytes());
            hierarchy.writeHierarchyString(sesameTransformer, outputStream);
        }
        outputStream.write("}".getBytes());
    }

    /**
     * Writes the ranges for each property from the query results to the provided output stream.
     *
     * @param tupleQueryResults the query results that contain "prop" and "range" bindings
     * @param outputStream the output stream to write the results to
     */
    private void writePropertyRangesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream) throws IOException {
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
    private void writeClassPropertiesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream) throws IOException {
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
    private void writeNoDomainPropertiesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream) throws IOException {
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
    private void writeEntityNamesToStream(TupleQueryResult tupleQueryResults, OutputStream outputStream) throws IOException {
        Map<String, EntityNames> entityNamesMap = new HashMap<>();
        String entityBinding = "entity";
        String namesBinding = "names_array";
        tupleQueryResults.forEach(bindings -> {
            if (bindings.getBinding(entityBinding).isPresent()) {
                String entity = Bindings.requiredResource(bindings, entityBinding).stringValue();
                String namesString = Bindings.requiredLiteral(bindings, namesBinding).stringValue();
                EntityNames entityNames = new EntityNames();

                String[] names = StringUtils.split(namesString, NAME_SPLITTER);
                entityNames.label = names[0];

                Set<String> namesSet = new HashSet<>();
                CollectionUtils.addAll(namesSet, names);
                entityNames.setNames(namesSet);
                entityNamesMap.putIfAbsent(entity, entityNames);
            }
        });

        outputStream.write(mapper.valueToTree(entityNamesMap).toString().getBytes());
    }

    /**
     * Gets the Resource for the InProgressCommit associated with the provided User and the Record identified by the
     * provided Resource. If that User does not have an InProgressCommit, a new one will be created and that Resource
     * will be returned.
     *
     * @param user     the User with the InProgressCommit
     * @param recordId the Resource identifying the Record with the InProgressCommit
     * @return a Resource which identifies the InProgressCommit associated with the User for the Record
     */
    private Resource getInProgressCommitIRI(User user, Resource recordId) {
        Optional<InProgressCommit> optional = catalogManager.getInProgressCommit(configProvider.getLocalCatalogIRI(),
                recordId, user);
        if (optional.isPresent()) {
            return optional.get().getResource();
        } else {
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(user);
            catalogManager.addInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommit);
            return inProgressCommit.getResource();
        }
    }

    /**
     * Optionally gets the Ontology based on the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return an Optional containing the Ontology if it was found.
     */
    private Optional<Ontology> getOntology(ContainerRequestContext context, String recordIdStr, String branchIdStr,
                                           String commitIdStr, boolean applyInProgressCommit) {
        checkStringParam(recordIdStr, "The recordIdStr is missing.");
        Optional<Ontology> optionalOntology;
        try {
            Resource recordId = valueFactory.createIRI(recordIdStr);

            if (StringUtils.isNotBlank(commitIdStr)) {
                if (StringUtils.isNotBlank(branchIdStr)) {
                    optionalOntology = ontologyManager.retrieveOntology(recordId,
                            valueFactory.createIRI(branchIdStr), valueFactory.createIRI(commitIdStr));
                } else {
                    optionalOntology = ontologyManager.retrieveOntologyByCommit(recordId,
                            valueFactory.createIRI(commitIdStr));
                }
            } else if (StringUtils.isNotBlank(branchIdStr)) {
                optionalOntology = ontologyManager.retrieveOntology(recordId, valueFactory.createIRI(branchIdStr));
            } else {
                optionalOntology = ontologyManager.retrieveOntology(recordId);
            }

            if (optionalOntology.isPresent() && applyInProgressCommit) {
                User user = getActiveUser(context, engineManager);
                Optional<InProgressCommit> inProgressCommitOpt = catalogManager.getInProgressCommit(
                        configProvider.getLocalCatalogIRI(), valueFactory.createIRI(recordIdStr), user);

                if (inProgressCommitOpt.isPresent()) {
                    optionalOntology = Optional.of(ontologyManager.applyChanges(optionalOntology.get(),
                            inProgressCommitOpt.get()));
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }

        return optionalOntology;
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in an Ontology identified by the provided IDs.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @param applyInProgressCommit Boolean indicating whether or not any in progress commits by user should be
     *                              applied to the return value
     * @return The properly formatted JSON response with a List of a particular Ontology Component.
     */
    private <T extends JsonNode> T doWithOntology(ContainerRequestContext context, String recordIdStr,
                                                  String branchIdStr, String commitIdStr,
                                                  Function<Ontology, T> iriFunction,
                                                  boolean applyInProgressCommit) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr,
                applyInProgressCommit);
        if (optionalOntology.isPresent()) {
            return iriFunction.apply(optionalOntology.get());
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets the List of entity IRIs identified by a lambda function in imported Ontologies for the Ontology identified
     * by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @param iriFunction the Function that takes an Ontology and returns a List of IRI corresponding to an Ontology
     *                    component.
     * @return the JSON list of imported IRI lists determined by the provided Function.
     */
    private Response doWithImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                              String branchIdStr, String commitIdStr,
                                              Function<Ontology, ObjectNode> iriFunction) {
        Set<Ontology> importedOntologies;
        try {
            importedOntologies = getImportedOntologies(context, recordIdStr, branchIdStr, commitIdStr);
        } catch (MobiOntologyException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        if (!importedOntologies.isEmpty()) {
            return Response.ok(doWithOntologies(importedOntologies, iriFunction).toString()).build();
        } else {
            return Response.noContent().build();
        }
    }

    private ArrayNode doWithOntologies(Set<Ontology> ontologies, Function<Ontology, ObjectNode> function) {
        ArrayNode arrayNode = mapper.createArrayNode();
        for (Ontology ontology : ontologies) {
            ObjectNode object = function.apply(ontology);
            object.put("id", ontology.getOntologyId().getOntologyIdentifier().stringValue());
            arrayNode.add(object);
        }
        return arrayNode;
    }

    /**
     * Gets the imported Ontologies for the Ontology identified by the provided IDs.
     *
     * @param recordIdStr the record ID String to process.
     * @param branchIdStr the branch ID String to process.
     * @param commitIdStr the commit ID String to process.
     * @return the Set of imported Ontologies.
     */
    private Set<Ontology> getImportedOntologies(ContainerRequestContext context, String recordIdStr,
                                                String branchIdStr, String commitIdStr) {
        Optional<Ontology> optionalOntology = getOntology(context, recordIdStr, branchIdStr, commitIdStr, true);
        if (optionalOntology.isPresent()) {
            Ontology baseOntology = optionalOntology.get();
            return OntologyUtils.getImportedOntologies(baseOntology.getImportsClosure(), baseOntology);
        } else {
            throw ErrorUtils.sendError("Ontology " + recordIdStr + " does not exist.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Gets a JSONArray of Annotations from the provided Ontology.
     *
     * @param ontology the Ontology to get the Annotations from.
     * @return a JSONArray of Annotations from the provided Ontology.
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
     * Gets a JSONArray of Deprecated from the provided Ontology.
     *
     * @param ontology the Ontology to get the Deprecated from.
     * @return a JSONArray of Deprecated from the provided Ontology.
     */
    private ObjectNode getDeprecatedIRIObject(Ontology ontology) {
        Set<IRI> iris = ontology.getDeprecatedIRIs();
        return getObjectArray("deprecatedIris", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONObject of Class IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return a JSONObject with a classes key to an array of Class IRIs from the provided Ontology.
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
     * Gets a JSONArray of Classes from the provided Ontology.
     *
     * @param ontology the Ontology to get the Classes from.
     * @return a JSONArray of Classes form the provided Ontology.
     */
    private ArrayNode getClassArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel(modelFactory);
        ontology.getAllClasses().stream()
                .map(oClass -> model.filter(oClass.getIRI(), null, null))
                .filter(m -> !m.isEmpty())
                .map(m -> getObjectNodeFromJsonld(modelToJsonld(m, sesameTransformer)))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets a JSONObject of Datatype IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Datatypes from.
     * @return a JSONObject with a datatypes key to an array of Datatype IRIs from the provided Ontology.
     */
    private ObjectNode getDatatypeIRIObject(Ontology ontology) {
        Set<IRI> iris = ontology.getAllDatatypes()
                .stream()
                .map(Datatype::getIRI)
                .collect(Collectors.toSet());
        return getObjectArray("datatypes", irisToJsonArray(iris));
    }

    /**
     * Gets a JSONObject of ObjectProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return a JSONObject with a objectProperties key to an array of ObjectProperty IRIs from the provided Ontology.
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
     * Gets a JSONArray of ObjectProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the ObjectProperties from.
     * @return a JSONArray of ObjectProperties from the provided Ontology.
     */
    private ArrayNode getObjectPropertyArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel(modelFactory);
        ontology.getAllObjectProperties().stream()
                .map(property -> getObjectNodeFromJsonld(modelToJsonld(model.filter(property.getIRI(), null, null),
                        sesameTransformer)))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets a JSONObject of DatatypeProperty IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return a JSONObject with a dataProperties key to an array of DatatypeProperty IRIs from the provided Ontology.
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
     * Gets a JSONArray of DatatypeProperties from the provided Ontology.
     *
     * @param ontology the Ontology to get the DatatypeProperties from.
     * @return a JSONArray of DatatypeProperties from the provided Ontology.
     */
    private ArrayNode getDataPropertyArray(Ontology ontology) {
        ArrayNode arrayNode = mapper.createArrayNode();
        Model model = ontology.asModel(modelFactory);
        ontology.getAllDataProperties().stream()
                .map(dataProperty ->
                        getObjectNodeFromJsonld(modelToJsonld(model.filter(dataProperty.getIRI(),
                                null, null), sesameTransformer)))
                .forEach(arrayNode::add);
        return arrayNode;
    }

    /**
     * Gets a JSONArray of NamedIndividuals from the provided Ontology.
     *
     * @param ontology the Ontology to get the NamedIndividuals from.
     * @return a JSONArray of NamedIndividuals from the provided Ontology.
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
     * Gets a JSONObject of Concept IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the Concepts from.
     * @return a JSONObject with a concepts key to an array of Concept IRIs from the provided Ontology.
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
        return ontology.getIndividualsOfType(sesameTransformer.mobiIRI(SKOS.CONCEPT)).stream()
                .map(Individual::getIRI)
                .collect(Collectors.toSet());
    }

    /**
     * Gets a JSONObject of ConceptScheme IRIs from the provided Ontology.
     *
     * @param ontology the Ontology to get the ConceptSchemes from.
     * @return a JSONObject with a conceptSchemes key to an array of ConceptScheme IRIs from the provided Ontology.
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
        return ontology.getIndividualsOfType(sesameTransformer.mobiIRI(SKOS.CONCEPT_SCHEME)).stream()
                .map(Individual::getIRI)
                .collect(Collectors.toSet());
    }

    private ObjectNode getDerivedConceptTypeIRIObject(Ontology ontology) {
        return getObjectArray("derivedConcepts", getDerivedConceptTypeIRIArray(ontology));
    }

    private ArrayNode getDerivedConceptTypeIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubClassesFor(sesameTransformer.mobiIRI(SKOS.CONCEPT)));
    }

    private ObjectNode getDerivedConceptSchemeTypeIRIObject(Ontology ontology) {
        return getObjectArray("derivedConceptSchemes", getDerivedConceptSchemeTypeIRIArray(ontology));
    }

    private ArrayNode getDerivedConceptSchemeTypeIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubClassesFor(sesameTransformer.mobiIRI(SKOS.CONCEPT_SCHEME)));
    }

    private ObjectNode getDerivedSemanticRelationIRIObject(Ontology ontology) {
        return getObjectArray("derivedSemanticRelations", getDerivedSemanticRelationIRIArray(ontology));
    }

    private ArrayNode getDerivedSemanticRelationIRIArray(Ontology ontology) {
        return irisToJsonArray(ontology.getSubPropertiesFor(sesameTransformer.mobiIRI(SKOS.SEMANTIC_RELATION)));
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
     * @param skolemize whether or not the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @param outputStream the OutputStream that the rdf should be written to
     */
    private OutputStream writeOntologyToStream(Ontology ontology, String rdfFormat, boolean skolemize, OutputStream outputStream) {
        switch (rdfFormat.toLowerCase()) {
            case "rdf/xml":
                return ontology.asRdfXml(outputStream);
            case "owl/xml":
                return ontology.asOwlXml(outputStream);
            case "turtle":
                return ontology.asTurtle(outputStream);
            default:
                return ontology.asJsonLD(skolemize, outputStream);
        }
    }

    /**
     * Gets the requested serialization of the provided Ontology.
     *
     * @param ontology  the Ontology you want to serialize in a different format.
     * @param rdfFormat the format you want.
     * @param skolemize whether or not the Ontology should be skoelmized before serialized (NOTE: only applies to
     *                  serializing as JSON-LD)
     * @return A String containing the newly serialized Ontology.
     */
    private String getOntologyAsRdf(Ontology ontology, String rdfFormat, boolean skolemize) {
        switch (rdfFormat.toLowerCase()) {
            case "rdf/xml":
                return ontology.asRdfXml().toString();
            case "owl/xml":
                return ontology.asOwlXml().toString();
            case "turtle":
                return ontology.asTurtle().toString();
            default:
                OutputStream outputStream = ontology.asJsonLD(skolemize);
                return outputStream.toString();
        }
    }

    /**
     * Return a JSONObject with the requested format and the requested ontology in that format.
     *
     * @param ontology  the ontology to format and return
     * @param rdfFormat the format to serialize the ontology in
     * @return a JSONObject with the document format and the ontology in that format
     */
    private ObjectNode getOntologyAsJsonObject(Ontology ontology, String rdfFormat) {
        log.trace("Start getOntologyAsJsonObject");
        OntologyId ontologyId = ontology.getOntologyId();
        Optional<IRI> optIri = ontologyId.getOntologyIRI();

        ObjectNode objectNode = mapper.createObjectNode();
        objectNode.put("documentFormat", rdfFormat);
        objectNode.put("id", ontologyId.getOntologyIdentifier().stringValue());
        objectNode.put("ontologyId", optIri.isPresent() ? optIri.get().stringValue() : "");
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
        objectNode.put("ontologyId", optIri.isPresent() ? optIri.get().stringValue() : "");

        return objectNode;
    }

    /**
     * Return a JSONObject with the IRIs for all components of an ontology.
     *
     * @param ontology The Ontology from which to get component IRIs
     * @return the JSONObject with the IRIs for all components of an ontology.
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
     * Combines multiple JSONObjects into a single JSONObject.
     *
     * @param objects the JSONObjects to combine.
     * @return a JSONObject which has the combined key-value pairs from all of the provided JSONObjects.
     */
    private ObjectNode combineJsonObjects(ObjectNode... objects) {
        ObjectNode objectNode = mapper.createObjectNode();

        if (objects.length == 0) {
            return objectNode;
        }
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
        return jsonldToModel(json, sesameTransformer);
    }

    /**
     * Adds the provided Model to the requester's InProgressCommit additions.
     *
     * @param context     the context of the request.
     * @param recordIdStr the record ID String to process.
     * @param entityModel the Model to add to the additions in the InProgressCommit.
     * @return a Response indicating the success or failure of the addition.
     */
    private Response additionsToInProgressCommit(ContainerRequestContext context, String recordIdStr,
                                                 Model entityModel) {
        User user = getActiveUser(context, engineManager);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        catalogManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                entityModel, null);
        return Response.status(Response.Status.CREATED).build();
    }

    /**
     * Adds the Statements associated with the entity identified by the provided ID to the requester's InProgressCommit
     * deletions.
     *
     * @param context     the context of the request.
     * @param ontology    the ontology to process.
     * @param entityIdStr the ID of the entity to be deleted.
     * @param recordIdStr the ID of the record which contains the entity to be deleted.
     * @return a Response indicating the success or failure of the deletion.
     */
    private Response deletionsToInProgressCommit(ContainerRequestContext context, Ontology ontology,
                                                 String entityIdStr, String recordIdStr) {
        User user = getActiveUser(context, engineManager);
        Resource recordId = valueFactory.createIRI(recordIdStr);
        Resource inProgressCommitIRI = getInProgressCommitIRI(user, recordId);
        Model ontologyModel = ontology.asModel(modelFactory);
        Resource entityId = valueFactory.createIRI(entityIdStr);
        Model model = modelFactory.createModel(ontologyModel.stream()
                .filter(statement -> statement.getSubject().equals(entityId)
                        || statement.getPredicate().equals(entityId) || statement.getObject().equals(entityId))
                .collect(Collectors.toSet()));
        if (model.size() == 0) {
            throw ErrorUtils.sendError(entityIdStr + " was not found within the ontology.",
                    Response.Status.BAD_REQUEST);
        }
        catalogManager.updateInProgressCommit(configProvider.getLocalCatalogIRI(), recordId, inProgressCommitIRI,
                null, model);
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
        Model ontologyModel = ontology.asModel(modelFactory);
        return modelFactory.createModel(ontologyModel).filter(valueFactory.createIRI(entityIdStr), null, null);
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
     * @param context          the context of the request.
     * @param title            the title for the OntologyRecord.
     * @param description      the description for the OntologyRecord.
     * @param keywordSet       the comma separated list of keywords associated with the OntologyRecord.
     * @param config           the RecordOperationConfig containing the appropriate model or input file.
     * @return a Response indicating the success of the creation.
     */
    private Response createOntologyRecord(ContainerRequestContext context, String title, String description,
                                          String markdown, Set<String> keywordSet, RecordOperationConfig config) {
        User user = getActiveUser(context, engineManager);
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
        try {
            record = catalogManager.createRecord(user, config, OntologyRecord.class);
            branchId = record.getMasterBranch_resource().get();
            try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                RepositoryResult<Statement> commitStmt = conn.getStatements(branchId,
                        valueFactory.createIRI(Branch.head_IRI), null);
                if (!commitStmt.hasNext()) {
                    throw ErrorUtils.sendError("The requested instance could not be found.",
                            Response.Status.BAD_REQUEST);
                }
                commitId = (Resource) commitStmt.next().getObject();
            }
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }

        ObjectNode objectNode = mapper.createObjectNode();

        objectNode.put("ontologyId", record.getOntologyIRI().get().toString());
        objectNode.put("recordId", record.getResource().stringValue());
        objectNode.put("branchId", branchId.toString());
        objectNode.put("commitId", commitId.toString());

        return Response.status(Response.Status.CREATED).entity(objectNode.toString()).build();
    }
}
