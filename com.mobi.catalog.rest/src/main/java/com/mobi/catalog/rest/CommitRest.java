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
     * Gets the {@link Commit} identified by the provided ID.
     *
     * @param commitId {@link String} value of the {@link Commit} ID. NOTE: Assumes an {@link IRI} unless {@link String}
     * starts with "{@code _:}".
     * @param format {@link String} representation of the desired {@link RDFFormat}. Default value is {@code "jsonld"}.
     * @return A {@link Response} with the {@link Commit} identified by the provided ID.
     */
    @GET
    @Path("{commitId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Commit specified by the provided ID.")
    Response getCommit(@PathParam("commitId") String commitId,
            @DefaultValue("jsonld") @QueryParam("format") String format);

    /**
     * Gets a {@link List} of {@link Commit}s, in descending order by date, within the repository which represents the
     * {@link Commit} history starting from the specified {@link Commit}. The {@link Commit} identified by the provided
     * {@code commitId} is the first item in the {@link List} and it was informed by the previous {@link Commit} in the
     * {@link List}. If a limit is passed which is greater than zero, will paginate the results.
     *
     * @param uriInfo The {@link UriInfo} of the request.
     * @param commitId {@link String} value of the {@link Commit} ID. NOTE: Assumes an {@link IRI} unless {@link String}
     * starts with "{@code _:}".
     * @param offset An optional offset for the results.
     * @param limit An optional limit for the results.
     * @return A {@link Response} containing a {@link List} of {@link Commit}s starting with the provided
     * {@code commitId} which represents the {@link Commit} history.
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
     * Gets the {@link Difference} between the two specified {@link Commit}s.
     *
     * @param source {@link String} value of the source {@link Commit} ID. NOTE: Assumes an {@link IRI} unless
     * {@link String} starts with "{@code _:}".
     * @param target {@link String} value of the target {@link Commit} ID. NOTE: Assumes an {@link IRI} unless
     * {@link String} starts with "{@code _:}".
     * @param rdfFormat {@link String} representation of the desired {@link RDFFormat}. Default value is
     * {@code "jsonld"}.
     *
     * @return A {@link Response} containing the {@link Difference} between the {@code source} and {@code target}
     * {@link Commit}s.
     */
    @GET
    @Path("{source}/difference")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the Commit history specified by the provided ID.")
    Response getDifference(@PathParam("source") String source,
            @QueryParam("target") String target,
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat);
}
