package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.createIRI;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getObjectFromJsonld;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;
import static com.mobi.rest.util.RestUtils.modelToJsonld;

import com.mobi.catalog.api.mergerequest.MergeRequestConfig;
import com.mobi.catalog.api.mergerequest.MergeRequestFilterParams;
import com.mobi.catalog.api.mergerequest.MergeRequestManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.catalog.api.ontologies.mergerequests.CommentFactory;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequestFactory;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.Value;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
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

@Component(service = MergeRequestRest.class, immediate = true)
@Path("/merge-requests")
public class MergeRequestRest {

    private MergeRequestManager manager;
    private CatalogConfigProvider configProvider;
    private SesameTransformer transformer;
    private EngineManager engineManager;
    private MergeRequestFactory mergeRequestFactory;
    private CommentFactory commentFactory;
    private ValueFactory vf;

    @Reference
    void setManager(MergeRequestManager manager) {
        this.manager = manager;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
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
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    /**
     * Retrieves a list of all the {@link MergeRequest}s in Mobi sorted according to the provided parameters
     * and optionally filtered by whether or not they are accepted.
     *
     * @param sort IRI of the predicate to sort by
     * @param asc Whether the results should be sorted ascending or descending. Default is false.
     * @param accepted Whether the results should only be accepted or open requests
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
            @Parameter(description = "The IRI of the predicate to sort by", required = true)
            @QueryParam("sort") String sort,
            @Parameter(description = "Whether the results should be sorted ascending or descending")
            @DefaultValue("false") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Whether the results should only be accepted or open requests")
            @DefaultValue("false") @QueryParam("accepted") boolean accepted) {
        MergeRequestFilterParams.Builder builder = new MergeRequestFilterParams.Builder();
        if (!StringUtils.isEmpty(sort)) {
            builder.setSortBy(createIRI(sort, vf));
        }
        builder.setAscending(asc).setAccepted(accepted);
        try {
            JSONArray result = JSONArray.fromObject(manager.getMergeRequests(builder.build()).stream()
                    .map(request -> modelToJsonld(request.getModel(), transformer))
                    .map(RestUtils::getObjectFromJsonld)
                    .collect(Collectors.toList()));
            return Response.ok(result).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new {@link MergeRequest} in the repository with the passed form data. Requires the `title`, `recordId`,
     * `sourceBranchId`, and `targetBranchId` fields to be set. Returns a Response with the IRI of the new
     * {@link MergeRequest}.
     *
     * @param context Context of the request.
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
            @Context ContainerRequestContext context,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new MergeRequest", required = true))
            @FormDataParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new MergeRequest"))
            @FormDataParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the VersionedRDFRecord to associate with the "
                    + "new MergeRequest", required = true))
            @FormDataParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the source Branch with the new commits to add "
                    + "to the target Branch of the new MergeRequest", required = true))
            @FormDataParam("sourceBranchId") String sourceBranchId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the target Branch which will receive the new commits "
                    + "from the source Branch of the new MergeRequest", required = true))
            @FormDataParam("targetBranchId") String targetBranchId,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description = "List of username of Users to assign the new MergeRequest to"),
                    schema = @Schema(implementation = String.class, description = "Username")))
            @FormDataParam("assignees") List<FormDataBodyPart> assignees,
            @Parameter(schema = @Schema(type = "string",
                    description = "Boolean value to remove source"))
            @FormDataParam("removeSource") @DefaultValue("false") boolean removeSource) {

        checkStringParam(title, "Merge Request title is required");
        checkStringParam(recordId, "Merge Request record is required");
        checkStringParam(sourceBranchId, "Merge Request source branch is required");
        checkStringParam(targetBranchId, "Merge Request target branch is required");
        User activeUser = getActiveUser(context, engineManager);
        MergeRequestConfig.Builder builder = new MergeRequestConfig.Builder(title, createIRI(recordId, vf),
                createIRI(sourceBranchId, vf), createIRI(targetBranchId, vf), activeUser, removeSource);
        if (!StringUtils.isBlank(description)) {
            builder.description(description);
        }
        if (assignees != null ) {
            assignees.forEach(part -> {
                String username = part.getValue();
                Optional<User> assignee = engineManager.retrieveUser(username);
                if (!assignee.isPresent()) {
                    throw ErrorUtils.sendError("User " + username + " does not exist", Response.Status.BAD_REQUEST);
                }
                builder.addAssignee(assignee.get());
            });
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
            String json = groupedModelToString(request.getModel(), getRDFFormat("jsonld"), transformer);
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
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "String representing the JSONLD representation of the updated MergeRequest", required = true)
                    String newMergeRequest) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
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
     * @param context Context of the request.
     * @param requestId String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return Response indicating the status of the acceptance.
     */
    @POST
    @Path("{requestId}")
    @RolesAllowed("user")
    @Operation(
            tags = "merge-requests",
            summary = "Accepts a MergeRequest by performing the merge and changing the type",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the status of the acceptance"),
                    @ApiResponse(responseCode = "400",
                            description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Modify.TYPE)
    @ResourceId(type = ValueType.PROP_PATH, value = "<" + MergeRequest.onRecord_IRI + ">",
            start = @Value(type = ValueType.PATH, value = "requestId"))
    @ActionAttributes(@AttributeValue(type = ValueType.PROP_PATH, value = "<" + MergeRequest.targetBranch_IRI + ">",
            id = VersionedRDFRecord.branch_IRI, start = @Value(type = ValueType.PATH, value = "requestId")))
    public Response acceptMergeRequest(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        User activeUser = getActiveUser(context, engineManager);
        try {
            manager.acceptMergeRequest(requestIdResource, activeUser);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes an existing {@link MergeRequest} that has the {@code requestId}.
     *
     * @param requestId String representing the {@link MergeRequest} ID to delete. NOTE: Assumes ID represents an
     *                  IRI unless String begins with "_:".
     * @return Response indicating the status of the delete.
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
            @Parameter(description = "String representing the MergeRequest ID to delete", required = true)
            @PathParam("requestId") String requestId) {
        Resource requestIdResource = createIRI(requestId, vf);
        try {
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
            List<List<JSONObject>> commentsJson = manager.getComments(requestIdResource).stream().map(
                    commentChain -> commentChain.stream()
                            .map(comment -> getObjectFromJsonld(groupedModelToString(comment.getModel(),
                                    getRDFFormat("jsonld"), transformer)))
                            .collect(Collectors.toList())).collect(Collectors.toList());
            return Response.ok(commentsJson).build();
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
            String json = groupedModelToString(comment.getModel(), getRDFFormat("jsonld"), transformer);
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
     * @param context Context of the request.
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
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the MergeRequest ID", required = true)
            @PathParam("requestId") String requestId,
            @Parameter(description = "Optional IRI of the parent Comment that the newly created "
                    + "Comment is a reply to", required = false)
            @QueryParam("commentId") String commentId,
            @Parameter(description = "String containing comment text for the Comment", required = true)
                    String commentStr) {
        checkStringParam(commentStr, "Comment string is required");
        User activeUser = getActiveUser(context, engineManager);

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
     *
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
            @Parameter(description = "String representing the Comment ID", required = true)
            @PathParam("commentId") String commentId,
            @Parameter(description = "String representing the new description of the updated Comment", required = true)
                    String newCommentStr) {
        Resource commentIdResource = createIRI(commentId, vf);
        Comment comment = manager.getComment(commentIdResource).orElseThrow(() ->
                ErrorUtils.sendError("Comment " + commentId + " could not be found",
                        Response.Status.BAD_REQUEST));
        checkStringParam(newCommentStr, "Comment string is required");
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
     * @param context Context of the request.
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
            @Context ContainerRequestContext context,
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
            Optional<com.mobi.rdf.api.Value> commentUser = comment.getProperty(vf.createIRI(_Thing.creator_IRI));
            User user = getActiveUser(context, engineManager);
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
        Model mergeReqModel = jsonldToModel(jsonMergeRequest, transformer);
        return mergeRequestFactory.getExisting(requestId, mergeReqModel).orElseThrow(() ->
                ErrorUtils.sendError("MergeRequest IDs must match", Response.Status.BAD_REQUEST));
    }

    private Comment jsonToComment(Resource commentId, String jsonComment) {
        Model commentModel = jsonldToModel(jsonComment, transformer);
        return commentFactory.getExisting(commentId, commentModel).orElseThrow(() ->
                ErrorUtils.sendError("Comment IDs must match", Response.Status.BAD_REQUEST));
    }
}
