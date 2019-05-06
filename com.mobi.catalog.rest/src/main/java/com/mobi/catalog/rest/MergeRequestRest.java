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

import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.ontologies.mergerequests.MergeRequest;
import com.mobi.catalog.api.ontologies.mergerequests.Comment;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;

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

@Path("/merge-requests")
@Api(value = "/merge-requests")
public interface MergeRequestRest {

    /**
     * Retrieves a list of all the {@link MergeRequest}s in Mobi sorted according to the provided parameters
     * and optionally filtered by whether or not they are accepted.
     *
     * @param sort The IRI of the predicate to sort by
     * @param asc Whether the results should be sorted ascending or descending. Default is false.
     * @param accepted Whether the results should only be accepted or open requests
     * @return The list of all {@link MergeRequest}s that match the criteria
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all MergeRequests in the application")
    Response getMergeRequests(@QueryParam("sort") String sort,
                              @DefaultValue("false") @QueryParam("ascending") boolean asc,
                              @DefaultValue("false") @QueryParam("accepted") boolean accepted);

    /**
     * Creates a new {@link MergeRequest} in the repository with the passed form data. Requires the `title`, `recordId`,
     * `sourceBranchId`, and `targetBranchId` fields to be set. Returns a Response with the IRI of the new
     * {@link MergeRequest}.
     *
     * @param context The context of the request.
     * @param title The required title for the new {@link MergeRequest}.
     * @param description The optional description for the new {@link MergeRequest}.
     * @param recordId The required IRI of the {@link VersionedRDFRecord} to associate with the new
     *                 {@link MergeRequest}. NOTE: Assumes ID represents an IRI unless String begins with "_:".
     * @param sourceBranchId The required IRI of the source {@link Branch} with the new commits to add to the target
     *                       {@link Branch} of the new {@link MergeRequest}. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param targetBranchId The required IRI of the target {@link Branch} which will receive the new commits from the
     *                       source {@link Branch} of the new {@link MergeRequest}. NOTE: Assumes ID represents an IRI
     *                       unless String begins with "_:".
     * @param assignees The list of username of {@link User}s to assign the new {@link MergeRequest} to
     * @return A Response with the IRI string of the created {@link MergeRequest}.
     */
    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @ApiOperation("Creates a new MergeRequest in the application with the provided information")
    Response createMergeRequests(@Context ContainerRequestContext context,
                                 @FormDataParam("title") String title,
                                 @FormDataParam("description") String description,
                                 @FormDataParam("recordId") String recordId,
                                 @FormDataParam("sourceBranchId") String sourceBranchId,
                                 @FormDataParam("targetBranchId") String targetBranchId,
                                 @FormDataParam("assignees") List<FormDataBodyPart> assignees,
                                 @FormDataParam("removeSource") @DefaultValue("false") boolean removeSource);

    /**
     * Returns a {@link MergeRequest} with the provided ID.
     *
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return A Response with the {@link MergeRequest} with the provided ID
     */
    @GET
    @Path("{requestId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a MergeRequest from the application by its ID")
    Response getMergeRequest(@PathParam("requestId") String requestId);

    /**
     * Updates an existing {@link MergeRequest} that has the {@code requestId} with the provided JSONLD of
     * {@code newMergeRequest}.
     *
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param newMergeRequest The String representing the JSONLD representation of the updated {@link MergeRequest}.
     * @return A Response indicating the status of the update.
     */
    @PUT
    @Path("{requestId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a MergeRequest by its ID using the provided JSON-LD")
    Response updateMergeRequest(@PathParam("requestId") String requestId, String newMergeRequest);

    /**
     * Accepts a {@link MergeRequest} with the provided ID by completing the merge it represents and changing the
     * type to an {@link com.mobi.catalog.api.ontologies.mergerequests.AcceptedMergeRequest}.
     *
     * @param context The context of the request.
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return A Response indicating the status of the acceptance.
     */
    @POST
    @Path("{requestId}")
    @RolesAllowed("user")
    @ApiOperation("Accepts a MergeRequest by performing the merge and changing the type")
    Response acceptMergeRequest(@Context ContainerRequestContext context,
                                @PathParam("requestId") String requestId);

    /**
     * Deletes an existing {@link MergeRequest} that has the {@code requestId}.
     *
     * @param requestId The String representing the {@link MergeRequest} ID to delete. NOTE: Assumes ID represents an
     *                  IRI unless String begins with "_:".
     * @return A Response indicating the status of the delete.
     */
    @DELETE
    @Path("{requestId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes a MergeRequest that has the provided requestId")
    Response deleteMergeRequest(@PathParam("requestId") String requestId);

    /**
     * Retrieves a list of all the {@link Comment} chains in Mobi on the provided {@code requestId} sorted by issued
     * date of the head of each comment chain.
     *
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @return The list of all {@link Comment} chains for the specified {@link MergeRequest}
     */
    @GET
    @Path("{requestId}/comments")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all Comment threads on a MergeRequest")
    Response getComments(@PathParam("requestId") String requestId);

    /**
     * Returns a {@link MergeRequest} with the provided ID.
     *
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param commentId The String representing the {@link Comment} ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:".
     * @return A Response with the {@link Comment} with the provided ID
     */
    @GET
    @Path("{requestId}/comments/{commentId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves a Comment from the application by its ID")
    Response getComment(@PathParam("requestId") String requestId, @PathParam("commentId") String commentId);

    /**
     * Creates a new {@link Comment} in the repository with the passed form data. Requires the `commentStr` to be set.
     * If a `commentId` is provided, the the created comment is made as a reply comment to the Comment specified. If
     * the `commentId` already has a reply comment, the newly created comment is added to the bottom of the comment
     * chain. Returns a Response with the IRI of the new {@link Comment}.
     *
     * @param context The context of the request.
     * @param requestId The String representing the {@link MergeRequest} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param commentId The optional IRI of the parent {@link Comment} that the newly created Comment is a reply
     *                       to. NOTE: Assumes ID represents an IRI unless String begins with "_:".
     * @param commentStr The string containing comment text for the {@link Comment}.
     * @return A Response with the IRI string of the created {@link Comment}.
     */
    @POST
    @Path("{requestId}/comments")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Creates a new Comment on the MergeRequest in the application with the provided information")
    Response createComment(@Context ContainerRequestContext context,
                           @PathParam("requestId") String requestId,
                           @QueryParam("commentId") String commentId,
                           String commentStr);


    /**
     * Updates an existing {@link Comment} that has the {@code commentId} with the provided JSONLD of
     * {@code newComment}.
     *
     * @param commentId The String representing the {@link Comment} ID. NOTE: Assumes ID represents an IRI unless
     *                  String begins with "_:".
     * @param newComment The String representing the JSONLD representation of the updated {@link Comment}.
     * @return A Response indicating the status of the update.
     */
    @PUT
    @Path("{requestId}/comments/{commentId}")
    @Consumes(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @ApiOperation("Updates a Comment by its ID using the provided JSON-LD")
    Response updateComment(@PathParam("commentId") String commentId, String newComment);

    /**
     * Deletes an existing {@link Comment} that has the {@code commentId} if it belongs to the active {@link User}.
     *
     * @param context The context of the request.
     * @param requestId The String representing the {@link MergeRequest} ID the comment is on. NOTE: Assumes ID
     *                  represents an IRI unless String begins with "_:".
     * @param commentId The String representing the {@link Comment} ID to delete. NOTE: Assumes ID represents an IRI
     *                  unless String begins with "_:".
     * @return A Response indicating the status of the delete.
     */
    @DELETE
    @Path("{requestId}/comments/{commentId}")
    @RolesAllowed("user")
    @ApiOperation("Deletes a Comment that has the provided commentId")
    Response deleteComment(@Context ContainerRequestContext context,
                           @PathParam("requestId") String requestId,
                           @PathParam("commentId") String commentId);
}
