package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
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

import static com.mobi.ontologies.rdfs.Resource.type_IRI;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createIRI;
import static com.mobi.rest.util.RestUtils.createPaginatedResponseWithJsonNode;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getObjectNodeFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.security.policy.api.xacml.XACML.POLICY_PERMIT_OVERRIDES;
import static java.util.Arrays.asList;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.RecordCount;
import com.mobi.catalog.api.builder.UserCount;
import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.ClosedMergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.Value;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.MobiNotFoundException;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.Decision;
import com.mobi.security.policy.api.PDP;
import com.mobi.security.policy.api.Request;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.security.policy.api.ontologies.policy.Update;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.Explode;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.sail.SailException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
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

@Component(service = MergeRequestRest.class, immediate = true)
@JaxrsResource
@Path("/merge-requests")
public class MergeRequestRest {
    private final Logger log = LoggerFactory.getLogger(MergeRequestRest.class);
    private final ValueFactory vf = new ValidatingValueFactory();
    private static final ObjectMapper mapper = new ObjectMapper();

    private MergeRequestManager manager;
    private CatalogConfigProvider configProvider;
    private EngineManager engineManager;
    private MergeRequestFactory mergeRequestFactory;
    private CommentFactory commentFactory;
    private PDP pdp;

    @Reference
    void setManager(MergeRequestManager manager) {
        this.manager = manager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setMergeRequestFactory(MergeRequestFactory mergeRequestFactory) {
        this.mergeRequestFactory = mergeRequestFactory;
    }

    @Reference
    void setCommentFactory(CommentFactory commentFactory) {
        this.commentFactory = commentFactory;
    }

    @Reference
    void setPdp(PDP pdp) {
        this.pdp = pdp;
    }

    /**
     * Retrieves a list of all the {@link MergeRequest}s in Mobi sorted according to the provided parameters
     * and optionally filtered by records, creators, and whether they are accepted. This list respects the Read access
     * on the attached Records on the Merge Requests.
     *
     * @param sort IRI of the predicate to sort by
     * @param offset An optional offset for the results.
     * @param limit An optional limit for the results.
     * @param asc Whether the results should be sorted ascending or descending. Default is false.
     * @param requestStatus Whether the results should only be accepted, closed, or open requests.
     * @param searchText An optional search text for the list.
     * @param creators An optional creator user IRI list to filter the list by.
     * @param records An optional record IRI list to filter the list by.
     * @return The list of all {@link MergeRequest}s that match the criteria
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves all MergeRequests in the application",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "List of all MergeRequests that match the criteria"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getMergeRequests(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "The IRI of the predicate to sort by", required = true)
            @QueryParam("sort") String sort,
            @Parameter(description = "Whether the results should be sorted ascending or descending")
            @DefaultValue("false") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Whether the results should only be accepted, closed, or open requests")
            @DefaultValue("open") @QueryParam("requestStatus") String requestStatus,
            @Parameter(description = "Optional offset for the results")
            @QueryParam("offset") int offset,
            @Parameter(description = "Optional limit for the results")
            @QueryParam("limit") int limit,
            @Parameter(description = "Optional search text to filter the list by")
            @QueryParam("searchText") String searchText,
            @Parameter(description = "Optional creator user IRIs to filter the list by")
            @QueryParam("creators") List<String> creators,
            @Parameter(description = "Optional assignee user IRIs to filter the list by")
            @QueryParam("assignees") List<String> assignees,
            @Parameter(description = "Optional record IRI list to filter the list by")
            @QueryParam("records") List<String> records) {
        User activeUser = getActiveUser(servletRequest, engineManager);
        MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder().setRequestingUser(activeUser);
        if (!StringUtils.isEmpty(sort)) {
            builder.setSortBy(createIRI(sort, vf));
        }
        if (!StringUtils.isEmpty(searchText)) {
            builder.setSearchText(searchText);
        }
        if (creators != null && !creators.isEmpty()) {
            builder.setCreators(creators.stream().map(vf::createIRI).collect(Collectors.toList()));
        }
        if (assignees != null && !assignees.isEmpty()) {
            builder.setAssignees(assignees.stream().map(vf::createIRI).collect(Collectors.toList()));
        }
        if (records != null && !records.isEmpty()) {
            builder.setOnRecords(records.stream().map(vf::createIRI).collect(Collectors.toList()));
        }
        builder.setAscending(asc).setRequestStatus(requestStatus);
        try {
            List<MergeRequest> requests = manager.getMergeRequests(builder.build());
            Stream<MergeRequest> stream = requests.stream();
            if (offset > 0) {
                stream = stream.skip(offset);
            }
            if (limit > 0) {
                stream = stream.limit(limit);
            }
            ArrayNode result = mapper.createArrayNode();
            stream.map(request -> modelToJsonld(request.getModel()))
                    .map(RestUtils::getObjectNodeFromJsonld)
                    .forEach(result::add);
            return Response.ok(result).header("X-Total-Count", requests.size()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | SailException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Creates a new {@link MergeRequest} in the repository with the passed form data. Requires the `title`, `recordId`,
     * `sourceBranchId`, and `targetBranchId` fields to be set. Returns a Response with the IRI of the new
     * {@link MergeRequest}.
     *
     * @param servletRequest The HttpServletRequest.
     * @param title The required title for the new {@link MergeRequest}.
     * @param description Optional description for the new {@link MergeRequest}.
     * @param recordId The required IRI of the {@link VersionedRDFRecord} to associate with the new
     *                 {@link MergeRequest}. NOTE: Assumes ID represents an IRI unless String begins with "_:".
     * @param sourceBranchId The required IRI of the source {@link Branch} with the new commits to add to the target
     *                       {@link Branch} of the new {@link MergeRequest}. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param targetBranchId The required IRI of the target {@link Branch} which will receive the new commits from the
     *                       source {@link Branch} of the new {@link MergeRequest}. NOTE: Assumes ID represents an IRI
     *                       unless String begins with "_:".
     * @param assignees The list of username of {@link User}s to assign the new {@link MergeRequest} to
     * @param removeSource Boolean value to remove source
     * @return A Response with the IRI string of the created {@link MergeRequest}.
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Creates a new MergeRequest in the application with the provided information",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created MergeRequest"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createMergeRequests(
            @Context HttpServletRequest servletRequest,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new MergeRequest", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new MergeRequest"))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the VersionedRDFRecord to associate with the "
                    + "new MergeRequest", required = true))
            @FormParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the source Branch with the new commits to add "
                    + "to the target Branch of the new MergeRequest", required = true))
            @FormParam("sourceBranchId") String sourceBranchId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the target Branch which will receive the new commits "
                    + "from the source Branch of the new MergeRequest", required = true))
            @FormParam("targetBranchId") String targetBranchId,
            @Parameter(explode = Explode.TRUE, array = @ArraySchema(
                    arraySchema = @Schema(description = "List of username of Users to assign the new MergeRequest to"),
                    schema = @Schema(implementation = String.class, description = "Username")))
            @FormParam("assignees") List<String> assignees,
            @Parameter(schema = @Schema(type = "string",
                    description = "Boolean value to remove source"))
            @FormParam("removeSource") @DefaultValue("false") boolean removeSource) {

        checkStringParam(title, "Merge Request title is required");
        checkStringParam(recordId, "Merge Request record is required");
        checkStringParam(sourceBranchId, "Merge Request source branch is required");
        checkStringParam(targetBranchId, "Merge Request target branch is required");
        User activeUser = getActiveUser(servletRequest, engineManager);
        MergeRequestConfig.Builder builder = new MergeRequestConfig.Builder(title, createIRI(recordId, vf),
                createIRI(sourceBranchId, vf), createIRI(targetBranchId, vf), activeUser, removeSource);
        if (StringUtils.isNotEmpty(StringUtils.stripToEmpty(description))) {
            builder.description(description);
        }
        if (assignees != null ) {
            assignees.forEach(username -> {
                Optional<User> assignee = engineManager.retrieveUser(username);
                if (assignee.isEmpty()) {
                    throw ErrorUtils.sendError("User " + username + " does not exist", Response.Status.BAD_REQUEST);
                }
                builder.addAssignee(assignee.get());
            });
        }
        if (targetBranchId.equals(sourceBranchId)) {
            throw ErrorUtils.sendError("Cannot merge the same branch into itself.", Response.Status.BAD_REQUEST);
        }
        try {
            MergeRequest request = manager.createMergeRequest(builder.build(), configProvider.getLocalCatalogIRI());
            manager.addMergeRequest(request);
            return Response.status(201).entity(request.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a list of all the Merge Request creators with counts of how many Merge Requests they've made and their
     * display name. Parameters can be passed to control paging.
     *
     * @param uriInfo Information about the request URI.
     * @param searchText Optional text to search the list with.
     * @param offset Optional offset for the page of results.
     * @param limit Optional limit for the page of results.
     * @return List of User IRIs with their names and their Merge Request counts.
     */
    @GET
    @Path("creators")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves the list of creators of the MergeRequests in the application with their counts",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with JSON containing the User count details",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON, array = @ArraySchema(
                                    uniqueItems = true, schema = @Schema(example = "{\"user\": "
                                    + "\"http://test.com/some-uri\", \"name\": \"Joe\", \"count\": 5}")))),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getCreators(@Context HttpServletRequest servletRequest, @Context UriInfo uriInfo,
                                @Parameter(description = "String used to filter out creators")
                                @QueryParam("searchText") String searchText,
                                @Parameter(description = "Offset for the page")
                                @QueryParam("offset") int offset,
                                @Parameter(description = "Number of creators to return in one page")
                                @QueryParam("limit") int limit) {
        try {
            LinksUtils.validateParams(limit, offset);
            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder();
            if (offset > 0) {
                builder.offset(offset);
            }
            if (limit > 0) {
                builder.limit(limit);
            }
            if (StringUtils.isNotEmpty(StringUtils.stripToEmpty(searchText))) {
                builder.searchText(searchText);
            }
            User activeUser = getActiveUser(servletRequest, engineManager);
            PaginatedSearchResults<UserCount> counts = manager.getCreators(builder.build(), activeUser.getResource());
            ArrayNode arr = serializeUserCount(counts);
            return createPaginatedResponseWithJsonNode(uriInfo, arr, counts.getTotalSize(), limit == 0
                    ? counts.getTotalSize() : limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | SailException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a list of all the Merge Request creators with counts of how many Merge Requests they've made and their
     * display name. Parameters can be passed to control paging.
     *
     * @param uriInfo Information about the request URI.
     * @param searchText Optional text to search the list with.
     * @param offset Optional offset for the page of results.
     * @param limit Optional limit for the page of results.
     * @return List of User IRIs with their names and their Merge Request counts.
     */
    @GET
    @Path("assignees")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves the list of assignees of the MergeRequests in the application with their counts",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with JSON containing the User count details",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON, array = @ArraySchema(
                                    uniqueItems = true, schema = @Schema(example = "{\"user\": "
                                    + "\"http://test.com/some-uri\", \"name\": \"Joe\", \"count\": 5}")))),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getAssignees(@Context HttpServletRequest servletRequest, @Context UriInfo uriInfo,
                                @Parameter(description = "String used to filter out assignees")
                                @QueryParam("searchText") String searchText,
                                @Parameter(description = "Offset for the page")
                                @QueryParam("offset") int offset,
                                @Parameter(description = "Number of assignees to return in one page")
                                @QueryParam("limit") int limit) {
        try {
            LinksUtils.validateParams(limit, offset);
            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder();
            if (offset > 0) {
                builder.offset(offset);
            }
            if (limit > 0) {
                builder.limit(limit);
            }
            if (StringUtils.isNotEmpty(StringUtils.stripToEmpty(searchText))) {
                builder.searchText(searchText);
            }
            User activeUser = getActiveUser(servletRequest, engineManager);
            PaginatedSearchResults<UserCount> counts = manager.getAssignees(builder.build(), activeUser.getResource());
            ArrayNode arr = serializeUserCount(counts);
            return createPaginatedResponseWithJsonNode(uriInfo, arr, counts.getTotalSize(), limit == 0
                    ? counts.getTotalSize() : limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | SailException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a list of all the Merge Request records with counts of how many Merge Requests they're associated with
     * and their title. Parameters can be passed to control paging.
     *
     * @param uriInfo Information about the request URI.
     * @param searchText Optional text to search the list with.
     * @param offset Optional offset for the page of results.
     * @param limit Optional limit for the page of results.
     * @return List of Record IRIs with their titles and their Merge Request counts.
     */
    @GET
    @Path("records")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves the list of records of the MergeRequests in the application with their counts",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with JSON containing the Record count details",
                            content = @Content(mediaType = MediaType.APPLICATION_JSON, array = @ArraySchema(
                                    uniqueItems = true, schema = @Schema(example = "{\"record\": "
                                    + "\"http://test.com/some-uri\", \"title\": \"Pizza Ontology\", \"count\": 5}")))),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getRecords(@Context HttpServletRequest servletRequest, @Context UriInfo uriInfo,
                                @Parameter(description = "String used to filter out records")
                                @QueryParam("searchText") String searchText,
                                @Parameter(description = "Offset for the page")
                                @QueryParam("offset") int offset,
                                @Parameter(description = "Number of records to return in one page")
                                @QueryParam("limit") int limit) {
        try {
            LinksUtils.validateParams(limit, offset);
            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder();
            if (offset > 0) {
                builder.offset(offset);
            }
            if (limit > 0) {
                builder.limit(limit);
            }
            if (StringUtils.isNotEmpty(StringUtils.stripToEmpty(searchText))) {
                builder.searchText(searchText);
            }
            User activeUser = getActiveUser(servletRequest, engineManager);
            PaginatedSearchResults<RecordCount> counts = manager.getRecords(builder.build(), activeUser.getResource());
            ArrayNode arr = serializeRecordCount(counts);
            return createPaginatedResponseWithJsonNode(uriInfo, arr, counts.getTotalSize(), limit == 0
                    ? counts.getTotalSize() : limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | SailException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Returns a {@link MergeRequest} with the provided ID.
     *
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return Response with the {@link MergeRequest} with the provided ID
     */
    @GET
    @Path("{requestId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves a MergeRequest from the application by its ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the MergeRequest with the provided ID"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "404",
                            description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getMergeRequest(
            @Parameter(description = "String representing the MergeRequest", required = true)
            @PathParam("requestId") String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            MergeRequest request = manager.getMergeRequest(requestIdResource).orElseThrow(() ->
                    ErrorUtils.sendError("Merge Request " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            String json = groupedModelToString(request.getModel(), getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates an existing {@link MergeRequest} that has the {@code requestId} with the provided JSONLD of
     * {@code newMergeRequest}.
     *
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param newMergeRequest String representing the JSONLD representation of the updated {@link MergeRequest}.
     * @return Response indicating the status of the update.
     */
    @PUT
    @Path("{requestId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Updates an existing MergeRequest that has the requestId with the provided "
                    + "JSONLD of newMergeRequest",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating the status of the update"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response updateMergeRequest(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "String representing the JSONLD representation of the updated MergeRequest",
                    required = true)
                    String newMergeRequest) {
        Resource requestIdResource = createIRI(requestId, vf);
        User activeUser = getActiveUser(servletRequest, engineManager);
        try {
            if (checkMergeRequestManagePermissions(requestIdResource, activeUser)) {
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }
            manager.updateMergeRequest(requestIdResource, jsonToMergeRequest(requestIdResource, newMergeRequest));
            return Response.ok().build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Accepts a {@link MergeRequest} with the provided ID by completing the merge it represents and changing the
     * type to an {@link com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest}.
     *
     * @param servletRequest The HttpServletRequest.
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return Response containing the plaintext status of the Merge Request.
     */
    @GET
    @Path("{requestId}/status")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Returns the status of the Merge Request in plaintext",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the status of the changed. " +
                                    "Plaintext can be closed, accepted, and open"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "404",
                            description = "Merge Request not found"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Read.TYPE)
    @ResourceId(type = ValueType.PROP_PATH, value = "<" + MergeRequest.onRecord_IRI + ">",
            start = @Value(type = ValueType.PATH, value = "requestId"))
    public Response retrieveMergeRequestStatus(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId){
        Resource requestIdResource = createIRI(requestId, vf);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            String status;
            List<String> types = conn.getStatements(requestIdResource, vf.createIRI(type_IRI), null).stream()
                    .map(statement -> statement.getObject().stringValue())
                    .collect(Collectors.toUnmodifiableList());

            if (types.isEmpty()) {
                throw new MobiNotFoundException("Merge Request " + requestId + " could not be found");
            }
            if (types.contains(ClosedMergeRequest.TYPE)) {
                status = "closed";
            } else if (types.contains(AcceptedMergeRequest.TYPE)) {
                status = "accepted";
            } else if (types.contains(MergeRequest.TYPE)) {
                status = "open";
            } else {
                throw new IllegalStateException("The Merge Request has no associated status.");
            }
            return Response.ok(status).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Accepts a {@link MergeRequest} with the provided ID by completing the merge it represents and changing the
     * type to an {@link com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest}.
     *
     * @param servletRequest The HttpServletRequest.
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param action The action to be taken against the Merge Request linked to the requestId
     * @return Response indicating the status of the taken action.
     */
    @POST
    @Path("{requestId}/status")
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Updates the type (open, closed, accepted) of the Merge Request and performs the " +
                    "subsequent action",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the status of the changed"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Merge Request not found"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response updateMergeRequestStatus(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(schema = @Schema(description = "The corresponding action to take on the merge request",
                    allowableValues = {"accept", "close", "open"},
                    required = true))
            @QueryParam("action") @DefaultValue("") String action ) {
        Resource requestIdResource = createIRI(requestId, vf);
        User activeUser = getActiveUser(servletRequest, engineManager);
        try {
            if (checkMergeRequestManagePermissions(requestIdResource, activeUser)) {
                RuntimeException throwable = new RuntimeException("User does not have modify MR permission");
                throw RestUtils.getErrorObjUnauthorized(throwable);
            }
            if (action.equals("accept")) {
                manager.acceptMergeRequest(requestIdResource, activeUser);
            } else if (action.equals("close")) {
                manager.closeMergeRequest(requestIdResource, activeUser);
            } else if (action.equals("open")) {
                manager.reopenMergeRequest(requestIdResource, activeUser);
            } else {
                throw new IllegalArgumentException("Not a valid action to take.");
            }
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiNotFoundException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Deletes an existing {@link MergeRequest} that has the {@code requestId}.
     *
     * @param requestId String representing the {@link MergeRequest} ID to delete. NOTE: Assumes ID represents an
     *                  IRI unless String begins with "_:".
     * @return Response indicating the status of the delete action.
     */
    @DELETE
    @Path("{requestId}")
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Deletes a MergeRequest that has the provided requestId",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating the status of the delete"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response deleteMergeRequest(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID to delete", required = true)
            @PathParam("requestId") String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        User activeUser = getActiveUser(servletRequest, engineManager);
        try {
            if (checkMergeRequestManagePermissions(requestIdResource, activeUser)) {
                return Response.status(Response.Status.UNAUTHORIZED).build();
            }
            manager.deleteMergeRequest(requestIdResource);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex,"Merge Request " + requestId + " could not be found",
                    Response.Status.NOT_FOUND);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Checks Manage Permission for MergeRequests
     *
     * @param requestId MergeRequest IRI
     * @param activeUser Request User
     * @return
     *  True if user is creator or has manage permission of associated RDF record,
     *  False if user is not a creator or has manage permission of associated RDF record
     */
    protected boolean checkMergeRequestManagePermissions(Resource requestId, User activeUser) {
        MergeRequest mergeRequest = manager.getMergeRequest(requestId).orElseThrow(() ->
                ErrorUtils.sendError("Merge Request " + requestId + " could not be found",
                        Response.Status.NOT_FOUND));
        boolean accessDenied = true;

        Optional<org.eclipse.rdf4j.model.Value> creator = mergeRequest.getProperty(vf.createIRI(_Thing.creator_IRI));
        if (creator.isPresent() && creator.get().stringValue().equals(activeUser.getResource().stringValue())) {
            accessDenied = false;
        }
        // If user is not the creator then check to see if user has manage permission
        Optional<Resource> onRecord = mergeRequest.getOnRecord_resource();
        if (accessDenied && onRecord.isPresent()) {
            Request request = pdp.createRequest(asList((IRI) activeUser.getResource()), new HashMap<>(),
                    asList((IRI)onRecord.get()), new HashMap<>(),
                    asList(vf.createIRI(Update.TYPE)), new HashMap<>());
            log.debug(request.toString());
            com.mobi.security.policy.api.Response response = pdp.evaluate(request,
                    vf.createIRI(POLICY_PERMIT_OVERRIDES));
            log.debug(response.toString());

            if (response.getDecision().equals(Decision.PERMIT)) {
                accessDenied = false;
            }
        }
        return accessDenied;
    }

    /**
     * Retrieves a list of all the {@link Comment} chains in Mobi on the provided {@code requestId} sorted by issued
     * date of the head of each comment chain.
     *
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return The list of all {@link Comment} chains for the specified {@link MergeRequest}
     */
    @GET
    @Path("{requestId}/comments")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves all Comment threads on a MergeRequest sorted by issued date of the head "
                    + "of each comment chain",
            responses = {
                    @ApiResponse(responseCode = "200", description = "list of all Comment chains for the "
                            + "specified MergeRequest"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getComments(
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
            ArrayNode result = mapper.createArrayNode();
            manager.getComments(requestIdResource)
                    .forEach(comments -> {
                        ArrayNode commentArr = mapper.createArrayNode();
                        comments.stream()
                                .map(comment -> getObjectNodeFromJsonld(
                                        groupedModelToString(comment.getModel(), RDFFormat.JSONLD)))
                                .forEach(commentArr::add);
                        result.add(commentArr);
                    });
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns a {@link MergeRequest} with the provided ID.
     *
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param commentId String representing the {@link Comment} ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:".
     * @return A Response with the {@link Comment} with the provided ID
     */
    @GET
    @Path("{requestId}/comments/{commentId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Retrieves a Comment from the application by its ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response with the Comment with the provided ID"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getComment(
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "String representing the Comment ID", required = true)
            @PathParam("commentId") String commentId) {
        try {
            manager.getMergeRequest(createIRI(requestId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("MergeRequest " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            Comment comment = manager.getComment(createIRI(commentId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + commentId + " could not be found",
                            Response.Status.NOT_FOUND));
            String json = groupedModelToString(comment.getModel(), getRDFFormat("jsonld"));
            return Response.ok(getObjectFromJsonld(json)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new {@link Comment} in the repository with the passed form data. Requires the `commentStr` to be set.
     * If a `commentId` is provided, the the created comment is made as a reply comment to the Comment specified. If
     * the `commentId` already has a reply comment, the newly created comment is added to the bottom of the comment
     * chain. Returns a Response with the IRI of the new {@link Comment}.
     *
     * @param servletRequest The HttpServletRequest.
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param commentId Optional IRI of the parent {@link Comment} that the newly created Comment is a reply
     *                       to. NOTE: Assumes ID represents an IRI unless String begins with "_:".
     * @param commentStr String containing comment text for the {@link Comment}.
     * @return A Response with the IRI string of the created {@link Comment}.
     */
    @POST
    @Path("{requestId}/comments")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Creates a new Comment on the MergeRequest in the application with the provided information",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Comment"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createComment(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "Optional IRI of the parent Comment that the newly created "
                    + "Comment is a reply to", required = false)
            @QueryParam("commentId") String commentId,
            @Parameter(description = "String containing comment text for the Comment", required = true)
                    String commentStr) {
        checkStringParam(commentStr, "Comment string is required");
        User activeUser = getActiveUser(servletRequest, engineManager);

        try {
            Comment comment = null;
            if (StringUtils.isEmpty(commentId)) {
                comment = manager.createComment(createIRI(requestId, vf), activeUser, commentStr);
            } else {
                comment = manager.createComment(createIRI(requestId, vf), activeUser, commentStr,
                        createIRI(commentId, vf));
            }
            return Response.status(201).entity(comment.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates an existing {@link Comment} that has the {@code commentId} with the provided String of
     * {@code newCommentStr}.
     * @param servletRequest The HttpServletRequest.
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param commentId String representing the {@link Comment} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param newCommentStr String representing the new description of the updated {@link Comment}.
     * @return Response indicating the status of the update.
     */
    @PUT
    @Path("{requestId}/comments/{commentId}")
    @Consumes(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Updates a Comment by its ID using the provided String",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating the status of the update"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response updateComment(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "String representing the Comment ID", required = true)
            @PathParam("commentId") String commentId,
            @Parameter(description = "String representing the new description of the updated Comment", required = true)
                    String newCommentStr) {
        manager.getMergeRequest(createIRI(requestId, vf)).orElseThrow(() ->
                ErrorUtils.sendError("MergeRequest " + requestId + " could not be found",
                        Response.Status.NOT_FOUND));

        Resource commentIdResource = createIRI(commentId, vf);
        Comment comment = manager.getComment(commentIdResource).orElseThrow(() ->
                ErrorUtils.sendError("Comment " + commentId + " could not be found",
                        Response.Status.BAD_REQUEST));
        checkStringParam(newCommentStr, "Comment string is required");

        User activeUser = getActiveUser(servletRequest, engineManager);
        Optional<org.eclipse.rdf4j.model.Value> creator = comment.getProperty(vf.createIRI(_Thing.creator_IRI));
        if (creator.isPresent() && !(creator.get().stringValue().equals(activeUser.getResource().stringValue()))) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }

        comment.setProperty(vf.createLiteral(newCommentStr), vf.createIRI(_Thing.description_IRI));
        try {
            manager.updateComment(commentIdResource, comment);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes an existing {@link Comment} that has the {@code commentId} if it belongs to the active {@link User}.
     *
     * @param servletRequest The HttpServletRequest.
     * @param requestId String representing the {@link MergeRequest} ID the comment is on. NOTE: Assumes ID
     *                  represents an IRI unless String begins with "_:".
     * @param commentId String representing the {@link Comment} ID to delete. NOTE: Assumes ID represents an IRI
     *                  unless String begins with "_:".
     * @return Response indicating the status of the delete.
     */
    @DELETE
    @Path("{requestId}/comments/{commentId}")
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Deletes a Comment that has the provided commentId",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Response indicating the status of the delete"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "401", description = "Response indicating UNAUTHORIZED"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Response indicating NOT_FOUND"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response deleteComment(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the MergeRequest ID the comment is on", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "String representing the Comment ID to delete", required = true)
            @PathParam("commentId") String commentId) {
        try {
            Resource commentIRI = createIRI(commentId, vf);
            manager.getMergeRequest(createIRI(requestId, vf)).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + requestId + " could not be found",
                            Response.Status.NOT_FOUND));
            Comment comment = manager.getComment(commentIRI).orElseThrow(() ->
                    ErrorUtils.sendError("Comment " + commentId + " could not be found",
                            Response.Status.NOT_FOUND));
            Optional<org.eclipse.rdf4j.model.Value> commentUser = comment.getProperty(vf.createIRI(_Thing.creator_IRI));
            User user = getActiveUser(servletRequest, engineManager);
            if (commentUser.isPresent() && commentUser.get().stringValue().equals(user.getResource().stringValue())) {
                manager.deleteComment(commentIRI);
            } else {
                throw ErrorUtils.sendError("User not permitted to delete comment " + commentId,
                        Response.Status.UNAUTHORIZED);
            }
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private MergeRequest jsonToMergeRequest(Resource requestId, String jsonMergeRequest) {
        Model mergeReqModel = jsonldToModel(jsonMergeRequest);
        MergeRequest mergeRequest = mergeRequestFactory.getExisting(requestId, mergeReqModel).orElseThrow(() ->
                ErrorUtils.sendError("MergeRequest IDs must match", Response.Status.BAD_REQUEST));

        Optional<Resource> sourceBranch = mergeRequest.getSourceBranch_resource();
        Optional<Resource> targetBranch = mergeRequest.getTargetBranch_resource();

        if (sourceBranch.equals(targetBranch)) {
            throw ErrorUtils.sendError("Cannot merge the same branch into itself.", Response.Status.BAD_REQUEST);
        }

        return mergeRequest;
    }

    private Comment jsonToComment(Resource commentId, String jsonComment) {
        Model commentModel = jsonldToModel(jsonComment);
        return commentFactory.getExisting(commentId, commentModel).orElseThrow(() ->
                ErrorUtils.sendError("Comment IDs must match", Response.Status.BAD_REQUEST));
    }

    private ArrayNode serializeUserCount(PaginatedSearchResults<UserCount> userCounts) {
        ArrayNode userArrayNode = mapper.createArrayNode();

        for (UserCount userCount: userCounts.getPage()) {
            ObjectNode userObject = mapper.createObjectNode();
            userObject.put("user", userCount.getUser().stringValue());
            userObject.put("name", userCount.getName());
            userObject.put("count", userCount.getCount());
            userArrayNode.add(userObject);
        }
        return userArrayNode;
    }

    private ArrayNode serializeRecordCount(PaginatedSearchResults<RecordCount> recordCounts) {
        ArrayNode recordArrayNode = mapper.createArrayNode();

        for (RecordCount recordCount: recordCounts.getPage()) {
            ObjectNode recordObject = mapper.createObjectNode();
            recordObject.put("record", recordCount.getRecord().stringValue());
            recordObject.put("title", recordCount.getTitle());
            recordObject.put("count", recordCount.getCount());
            recordArrayNode.add(recordObject);
        }
        return recordArrayNode;
    }

}
