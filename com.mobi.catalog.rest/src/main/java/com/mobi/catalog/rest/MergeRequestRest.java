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
import com.mobi.jaas.api.ontologies.usermanagement.User;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;

import java.util.List;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Path("/merge-requests")
@Api(value = "/merge-requests")
public interface MergeRequestRest {

    /**
     * Retrieves a list of all the {@link MergeRequest}s in Mobi.
     *
     * @return The list of all {@link MergeRequest}s
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves all MergeRequests in the application")
    Response getMergeRequests();

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
                                 @FormDataParam("assignees") List<FormDataBodyPart> assignees);

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
     *
     */
    @PUT
    @Path("{requestId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Updates a MergeRequest by its ID using the provided JSON-LD")
    Response updateMergeRequest(@PathParam("requestId") String requestId, String newMergeRequest);
}
