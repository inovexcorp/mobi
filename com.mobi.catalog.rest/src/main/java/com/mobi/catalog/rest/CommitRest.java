package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Path("/commits")
@Api(value = "/commits")
public interface CommitRest {

    /**
     * Gets the Commit identified by the provided ID.
     *
     * @param commitId The String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     with "_:".
     * @param format the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return A Response with the Commit identified by the provided IDs.
     */
    @GET
    @Path("{commitId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Commit specified by the provided ID.")
    Response getCommit(@PathParam("commitId") String commitId,
            @DefaultValue("jsonld") @QueryParam("format") String format);

    /**
     * Gets a List of Commits ordered by date descending within the repository which represents the Commit chain from
     * the specified commit. The Commit identified by the provided commitId is the first item in the List and it was
     * informed by the previous Commit in the List. If a limit is passed which is greater than zero, will paginate the
     * results.
     *
     * @param uriInfo The UriInfo of the request.
     * @param commitId The String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     * with "_:".
     * @param offset An optional offset for the results.
     * @param limit An optional limit for the results.
     * @return A list of Commits starting with the provided commitId which represents the Commit chain.
     */
    @GET
    @Path("{commitId}/history")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Commit history specified by the provided ID.")
    Response getCommitHistory(@Context UriInfo uriInfo,
            @PathParam("commitId") String commitId,
            @QueryParam("offset") int offset,
            @QueryParam("limit") int limit);

    /**
     * Retrieves the difference between the commit histories specified by the provided IDs.
     *
     * @param source The string representing the source Commit ID.
     * @param target The string representing the target Commit ID (optional).
     * @param rdfFormat the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return A list of Commits starting with the provided source Commit ID which represents the Commit chain that
     * terminates at the target Commit ID.
     */
    @GET
    @Path("{source}/difference")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the difference between the commit histories specified by the provided IDs.")
    Response getDifference(@PathParam("source") String source,
            @QueryParam("target") String target,
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat);
}
