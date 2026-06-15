package com.mobi.webhooks.rest;

/*-
 * #%L
 * com.mobi.webhooks.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.createPaginatedResponse;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;
import static com.mobi.rest.util.RestUtils.validatePaginationParams;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.FileUpload;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.rest.util.swagger.JsonLdObject;
import com.mobi.webhooks.api.WebhookConfigurationService;
import com.mobi.webhooks.api.ontology.webhooks.WebhookConfiguration;
import com.mobi.webhooks.api.WebhookExecutor;
import com.mobi.webhooks.api.ontology.webhooks.WebhookExecutionActivity;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecord;
import com.mobi.webhooks.api.ontology.webhooks.WebhookRecordFactory;
import com.mobi.webhooks.api.record.config.WebhookRecordCreateSettings;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.commons.io.FilenameUtils;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.LinkedHashModel;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.PROV;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.RDFParser;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.StatementCollector;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
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
import javax.ws.rs.core.UriInfo;

/**
 * The WebhookRest class provides endpoints for managing WebhookRecords within the application.
 * It includes methods for retrieving a list of, creating, and updating WebhookRecords.
 */
@Component(service = WebhookRest.class, immediate = true)
@JaxrsResource
@Path("/webhooks")
public class WebhookRest {
    private static final Logger LOG = LoggerFactory.getLogger(WebhookRest.class);
    private static final String TAG = "Webhooks";
    private static final String DESCRIPTION = "Operations for managing WebhookRecords";
    private static final Set<String> SORT_RESOURCES;
    private static final Set<String> EXECUTION_SORT_RESOURCES = Set.of(PROV.STARTED_AT_TIME.stringValue());

    static {
        Set<String> sortResources = new HashSet<>();
        sortResources.add(DCTERMS.MODIFIED.stringValue());
        sortResources.add(DCTERMS.ISSUED.stringValue());
        sortResources.add(DCTERMS.TITLE.stringValue());
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ObjectMapper mapper = new ObjectMapper();

    @Reference
    RecordManager recordManager;

    @Reference
    EngineManager engineManager;

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    BNodeService bNodeService;

    @Reference
    WebhookConfigurationService webhookConfigurationService;

    @Reference
    WebhookRecordFactory webhookRecordFactory;

    @Reference
    WebhookExecutor webhookExecutor;

    /**
     * Retrieves a paginated list of WebhookRecords accessible to the requesting user. Filters results by view
     * permissions granted to the requesting user.
     *
     * @param servletRequest HttpServletRequest
     * @param uriInfo        UriInfo
     * @param offset         Offset for the page
     * @param limit          Number of Records to return in one page
     * @param sort           IRI of the property to sort by
     * @param asc            Whether the list should be sorted ascending or descending
     * @param searchText     Optional search text to filter WebhookRecords by title or description
     * @return Response with a JSON-LD array of WebhookRecords visible to the user
     */
    @GET
    @Tag(name = TAG, description = DESCRIPTION)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves all WebhookRecords")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD array of WebhookRecords",
                    content = @Content(
                            array = @ArraySchema(
                                    schema = @Schema(
                                            implementation = JsonLdObject.class,
                                            description = "A list of WebhookRecord JSON-LD objects")
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid pagination parameters or sort IRI",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving WebhookRecords",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response findWebhookRecords(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(hidden = true) @Context UriInfo uriInfo,
            @Parameter(description = "Offset for a page of WebhookRecords", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of WebhookRecords to return in one page", required = true)
            @QueryParam("limit") int limit,
            @Parameter(description = "IRI of the property to sort by")
            @QueryParam("sort") String sort,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Optional search text to filter WebhookRecords")
            @QueryParam("searchText") String searchText) {
        long start = System.currentTimeMillis();
        User activeUser = getActiveUser(servletRequest, engineManager);
        LOG.debug("GET /webhooks requested by user: {} | offset={} limit={} sort={} ascending={} searchText={}",
                activeUser.getResource().stringValue(), offset, limit, sort, asc, searchText);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder()
                    .offset(offset)
                    .ascending(asc)
                    .typeFilter(List.of(vf.createIRI(WebhookRecord.TYPE)));
            if (limit > 0) {
                builder.limit(limit);
            }
            if (sort != null) {
                builder.sortBy(vf.createIRI(sort));
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }

            PaginatedSearchResults<Record> results = recordManager.findRecord(
                    configProvider.getLocalCatalogIRI(), builder.build(), activeUser, conn);

            LOG.debug("Returning {} of {} total WebhookRecord(s): [{}] | took {}ms",
                    results.page().size(), results.totalSize(),
                    results.page().stream().map(r -> r.getResource().stringValue())
                            .collect(Collectors.joining(", ")),
                    System.currentTimeMillis() - start);

            return createPaginatedResponse(uriInfo, results.page(), results.totalSize(),
                    limit, offset, WebhookRecord.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a paginated list of the WebhookExecutionActivities (with their linked ConnectionAttempts) associated
     * with the identified WebhookRecord. Requires the requesting user to have permission to view the record.
     *
     * @param servletRequest HttpServletRequest
     * @param uriInfo        UriInfo
     * @param recordId       The IRI string of the WebhookRecord to retrieve executions for
     * @param offset         Offset for the page
     * @param limit          Number of executions to return in one page
     * @param sort           IRI of the property to sort by. Only {@code prov:startedAtTime} is supported
     * @param asc            Whether the list should be sorted ascending or descending by start time
     * @return Response with a JSON-LD array where each element is the JSON-LD array of a WebhookExecutionActivity and
     *      its ConnectionAttempts
     */
    @GET
    @Path("{recordId}/executions")
    @Tag(name = TAG, description = DESCRIPTION)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the WebhookExecutionActivities associated with a WebhookRecord")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD array of WebhookExecutionActivities and their ConnectionAttempts",
                    content = @Content(
                            array = @ArraySchema(
                                    schema = @Schema(
                                            implementation = JsonLdObject.class,
                                            description = "A list of WebhookExecutionActivity JSON-LD objects")
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid pagination parameters or sort IRI",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "User does not have permission to view the WebhookRecord",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "WebhookRecord could not be found",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the executions",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getWebhookExecutions(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(hidden = true) @Context UriInfo uriInfo,
            @Parameter(description = "String representing the WebhookRecord ID", required = true,
                    schema = @Schema(type = "string", format = "uri"))
            @PathParam("recordId") String recordId,
            @Parameter(description = "Offset for a page of executions")
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of executions to return in one page")
            @QueryParam("limit") int limit,
            @Parameter(description = "IRI of the property to sort by. Only prov:startedAtTime is supported")
            @QueryParam("sort") String sort,
            @Parameter(description = "Whether the list should be sorted ascending or descending by start time")
            @DefaultValue("false") @QueryParam("ascending") boolean asc) {
        long start = System.currentTimeMillis();
        User activeUser = getActiveUser(servletRequest, engineManager);
        LOG.debug("GET /webhooks/{}/executions requested by user: {} | offset={} limit={} sort={} ascending={}",
                recordId, activeUser.getResource().stringValue(), offset, limit, sort, asc);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, EXECUTION_SORT_RESOURCES, limit, offset);
            recordManager.getRecordOpt(configProvider.getLocalCatalogIRI(), vf.createIRI(recordId),
                    webhookRecordFactory, conn).orElseThrow(() -> RestUtils.getErrorObjNotFound(
                            new MobiNotFoundException("WebhookRecord " + recordId + " could not be found")));

            PaginatedSearchResults<WebhookExecutionActivity> results =
                    webhookExecutor.getExecutions(vf.createIRI(recordId), offset, limit, sort, asc);

            ArrayNode executions = mapper.createArrayNode();
            results.page().forEach(activity ->
                    executions.add(RestUtils.getArrayNodeFromJson(RestUtils.modelToJsonld(activity.getModel()))));

            LOG.debug("Returning {} of {} total WebhookExecution(s) for record {} | took {}ms",
                    results.page().size(), results.totalSize(), recordId, System.currentTimeMillis() - start);
            return createPaginatedResponse(uriInfo, executions, results.totalSize(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the WebhookExecutionActivity with the latest start time associated with the identified WebhookRecord.
     * Requires the requesting user to have permission to view the record.
     *
     * @param servletRequest HttpServletRequest
     * @param recordId       The IRI string of the WebhookRecord to retrieve the latest execution for
     * @return Response with the JSON-LD array of the latest WebhookExecutionActivity and its ConnectionAttempts, or an
     *      empty JSON-LD array if the record has no executions
     */
    @GET
    @Path("{recordId}/executions/latest")
    @Tag(name = TAG, description = DESCRIPTION)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the latest WebhookExecutionActivity associated with a WebhookRecord")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD array of the latest WebhookExecutionActivity and its ConnectionAttempts, "
                            + "or an empty array if the record has no executions",
                    content = @Content(
                            array = @ArraySchema(
                                    schema = @Schema(
                                            implementation = JsonLdObject.class,
                                            description = "The latest WebhookExecutionActivity JSON-LD object")
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid WebhookRecord IRI",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "User does not have permission to view the WebhookRecord",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "WebhookRecord could not be found",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the latest execution",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getLatestWebhookExecution(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the WebhookRecord ID", required = true,
                    schema = @Schema(type = "string", format = "uri"))
            @PathParam("recordId") String recordId) {
        long start = System.currentTimeMillis();
        String activeUser = getActiveUser(servletRequest, engineManager).getResource().stringValue();
        LOG.debug("GET /webhooks/{}/executions/latest requested by user: {}",
                recordId, activeUser);

        Resource recordIri = vf.createIRI(recordId);

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.getRecordOpt(configProvider.getLocalCatalogIRI(), recordIri,
                    webhookRecordFactory, conn).orElseThrow(() -> RestUtils.getErrorObjNotFound(
                            new MobiNotFoundException("WebhookRecord " + recordId + " could not be found")));

            ArrayNode execution = webhookExecutor.getLatestExecution(recordIri)
                    .map(activity -> RestUtils.getArrayNodeFromJson(RestUtils.modelToJsonld(activity.getModel())))
                    .orElseGet(mapper::createArrayNode);

            LOG.debug("Returning latest WebhookExecution for record {} (found={}) | took {}ms",
                    recordId, !execution.isEmpty(), System.currentTimeMillis() - start);
            return Response.ok(execution.toString()).build();
        } catch (IllegalArgumentException ex) {
            LOG.error("Could not complete request due to illegal argument", ex);
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            LOG.error("Could not complete request due to issue on server", ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves the WebhookConfiguration associated with the specified WebhookRecord.
     *
     * @param servletRequest HttpServletRequest
     * @param recordId       IRI of the WebhookRecord
     * @return Response containing the JSON-LD representation of the WebhookConfiguration
     */
    @GET
    @Tag(name = TAG, description = DESCRIPTION)
    @Path("{recordId}/configuration")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Retrieves the WebhookConfiguration for the specified WebhookRecord")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON-LD object representing the WebhookConfiguration",
                    content = @Content(schema = @Schema(implementation = JsonLdObject.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "The provided recordId is not a valid IRI",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "User does not have permission to view this WebhookRecord",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Webhook Configuration linked to the provided ID does not exist",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "An error occurred while retrieving the WebhookConfiguration",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getWebhookConfiguration(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "IRI of the WebhookRecord", required = true,
                    schema = @Schema(type = "string", format = "uri"))
            @PathParam("recordId") String recordId) {
        long start = System.currentTimeMillis();
        User activeUser = getActiveUser(servletRequest, engineManager);
        LOG.debug("GET /webhooks/{}/configuration requested by user: {}", recordId,
                activeUser.getResource().stringValue());
        try {
            WebhookConfiguration config = webhookConfigurationService.getWebhookConfig(recordId);
            LOG.debug("GET /webhooks/{}/configuration completed in {}ms", recordId,
                    System.currentTimeMillis() - start);
            return Response.ok(modelToSkolemizedJsonld(config.getModel(), bNodeService)).build();
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Creates a new Webhook Record in the local catalog.
     * Processes the request payload to extract the webhook configuration, validate it,
     * and persist a new record in the local repository.
     *
     * @param servletRequest the HTTP request containing the multipart form data with details about
     *                       the webhook configuration, including fields such as title, description,
     *                       markdown, keywords, JSON-LD, and optionally, a file upload.
     * @return a {@link Response} object containing the status of the operation. If the creation
     *         is successful, the response contains the IRI of the newly created WebhookRecord
     *         and a 201 status code. In cases of errors, the response includes an appropriate
     *         status code and error description.
     */
    @POST
    @Tag(name = TAG, description = DESCRIPTION)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON})
    @RolesAllowed("user")
    @Operation(summary = "Creates a new Webhook Record in the local Catalog")
    @RequestBody(description = "Request Payload representing A Webhook Configuration",
            content = @Content(schema = @Schema(implementation = WebhookUploadSchema.class)))
    @ApiResponses({
            @ApiResponse(responseCode = "201",
                    description = "Successful Creation. Returns IRI of the newly created WebhookRecord",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "400", description = "Bad Request",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "401", description = "User is Unauthenticated",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "403", description = "User Lacks Permissions to Create Webhook Records",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "500", description = "Internal Server Error",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class)))
            })
    @ActionAttributes(@AttributeValue(id = RDF.NAMESPACE + "type", value = WebhookRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response createWebhookRecord(@Context HttpServletRequest servletRequest) {
        User user = getActiveUser(servletRequest, engineManager);
        LOG.debug("Received POST request for WebhookRecord creation from User: {}", user);

        Map<String, List<Class<?>>> fields = new HashMap<>();
        fields.put("title", List.of(String.class));
        fields.put("description", List.of(String.class));
        fields.put("markdown", List.of(String.class));
        fields.put("jsonld", List.of(String.class));
        fields.put("keywords", List.of(List.class, String.class));
        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);

        String title = (String) formData.get("title");
        String description = (String) formData.get("description");
        String markdown = (String) formData.get("markdown");
        String jsonld = (String) formData.get("jsonld");
        List<String> keywords = (List<String>) formData.get("keywords");
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream fileStream = file.getStream();

        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(title, "Title is required");

            RecordOperationConfig config = new OperationConfig();
            config.set(RecordCreateSettings.CATALOG_ID, configProvider.getLocalCatalogIRI().stringValue());
            config.set(RecordCreateSettings.RECORD_TITLE, title);
            config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
            config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
            config.set(RecordCreateSettings.RECORD_PUBLISHERS, Stream.of(user).collect(Collectors.toSet()));

            if (keywords != null && !keywords.isEmpty()) {
                config.set(RecordCreateSettings.RECORD_KEYWORDS, new HashSet<>(keywords));
            }

            if (fileStream != null || (jsonld != null && !jsonld.isBlank())) {
                Model configModel = parseConfigModel(fileStream, file.getFilename(), jsonld);
                config.set(WebhookRecordCreateSettings.CONFIGURATION_MODEL, configModel);
            }
            WebhookRecord record = recordManager.createRecord(user, config, WebhookRecord.class, conn);

            LOG.debug("Request processing took {}ms to create Webhook record: {}", System.currentTimeMillis() - start,
                    record.getResource().stringValue());
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException | NullPointerException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Updates the WebhookConfiguration associated with an existing WebhookRecord.
     * This method accepts either a configuration file or an inline JSON-LD string
     * to update the configuration of a specific WebhookRecord identified by its IRI.
     *
     * @param servletRequest the HTTP servlet request containing the form data and user context
     * @param recordId the IRI of the WebhookRecord to be updated, provided as a path parameter
     * @return a Response object indicating the result of the operation.
     *         A successful update returns a 200 status.
     *         Errors can result in status codes 400 (Bad Request), 401 (Unauthorized),
     *         403 (Forbidden), 404 (Not Found), or 500 (Internal Server Error).
     */
    @PUT
    @Tag(name = TAG, description = DESCRIPTION)
    @Path("{recordId}/configuration")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(summary = "Updates the WebhookConfiguration associated with an existing WebhookRecord")
    @RequestBody(description = "Updated WebhookConfiguration as a file or inline JSON-LD",
            content = @Content(schema = @Schema(implementation = WebhookConfigUpdateSchema.class)))
    @ApiResponses({
            @ApiResponse(responseCode = "200",
                    description = "WebhookConfiguration successfully updated"),
            @ApiResponse(responseCode = "400",
                    description = "Invalid or missing configuration model, or SHACL validation failure",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "403",
                    description = "User lacks Modify permission on the WebhookRecord",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "404",
                    description = "WebhookRecord with the given IRI could not be found",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))),
            @ApiResponse(responseCode = "500",
                    description = "An error occurred while updating the WebhookConfiguration",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class)))
    })
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateWebhookConfiguration(
            @Parameter(hidden = true) @Context HttpServletRequest servletRequest,
            @Parameter(description = "IRI of the WebhookRecord to update", required = true,
                    schema = @Schema(type = "string", format = "uri"))
            @PathParam("recordId") String recordId) {
        long start = System.currentTimeMillis();
        User activeUser = getActiveUser(servletRequest, engineManager);
        LOG.debug("PUT /webhooks/{}/configuration requested by user: {}",
                recordId, activeUser.getResource().stringValue());

        Map<String, List<Class<?>>> fields = new HashMap<>();
        fields.put("jsonld", List.of(String.class));
        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);

        String jsonld = (String) formData.get("jsonld");
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream fileStream = file.getStream();

        if (fileStream == null && (jsonld == null || jsonld.isBlank())) {
            throw RestUtils.getErrorObjBadRequest(
                    new IllegalArgumentException("Must provide either a configuration file or JSON-LD string"));
        }

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Model configModel = parseConfigModel(fileStream, file.getFilename(), jsonld);
            WebhookRecord webhookRecord = recordManager.getRecordOpt(
                            configProvider.getLocalCatalogIRI(), vf.createIRI(recordId),
                            webhookRecordFactory, conn)
                    .orElseThrow(() -> new MobiNotFoundException(
                            "WebhookRecord " + recordId + " could not be found"));
            webhookConfigurationService.updateConfiguration(webhookRecord, configModel);
            LOG.debug("PUT /webhooks/{}/configuration completed in {}ms",
                    recordId, System.currentTimeMillis() - start);
            return Response.ok().build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiNotFoundException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalStateException | MobiException | NullPointerException ex) {
            LOG.debug("Request processing took {}ms", System.currentTimeMillis() - start);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    protected Model parseConfigModel(InputStream fileStream, String filename, String jsonld) {
        if (fileStream != null) {
            String extension = FilenameUtils.getExtension(filename).toLowerCase();
            RDFFormat format = switch (extension) {
                case "ttl" -> RDFFormat.TURTLE;
                case "xml", "rdf" -> RDFFormat.RDFXML;
                case "jsonld", "json" -> RDFFormat.JSONLD;
                default -> throw new IllegalArgumentException(
                        "Unsupported file format '" + extension + "'. Supported: Turtle (.ttl), RDF/XML (.xml/.rdf), "
                                + "JSON-LD (.jsonld/.json)");
            };
            try {
                Model model = new LinkedHashModel();
                RDFParser parser = Rio.createParser(format);
                parser.setRDFHandler(new StatementCollector(model));
                parser.parse(fileStream, "");
                return model;
            } catch (IOException ex) {
                throw new IllegalArgumentException("Could not read configuration file: " + ex.getMessage(), ex);
            }
        }
        return RestUtils.jsonldToModel(jsonld);
    }
}
