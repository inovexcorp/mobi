package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitJson;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitResponse;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.getDifferenceJsonString;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createPaginatedResponseWithJsonNode;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.PagedDifference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
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

@Component(service = CommitRest.class, immediate = true)
@JaxrsResource
@Path("/commits")
public class CommitRest {

    private static final Logger logger = LoggerFactory.getLogger(CommitRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected BNodeService bNodeService;
    
    @Reference
    protected CommitManager commitManager;

    @Reference
    protected DifferenceManager differenceManager;

    @Reference
    protected CompiledResourceManager compiledResourceManager;
    
    @Reference
    protected EngineManager engineManager;

    private final ValueFactory vf = new ValidatingValueFactory();

    /**
     * Gets the {@link Commit} identified by the provided ID.
     *
     * @param commitId {@link String} value of the {@link Commit} ID. NOTE: Assumes an {@link IRI} unless {@link String}
     *                 starts with "{@code _:}".
     * @param format   {@link String} representation of the desired {@link RDFFormat}. Default value is
     *                 {@code "jsonld"}.
     * @return A {@link Response} with the {@link Commit} identified by the provided ID.
     */
    @GET
    @Path("{commitId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "commits",
            summary = "Retrieves the Commit specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the Commit identified by the provided ID"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "404",
                            description = "Response indicating NOT_FOUND"),
            }
    )
    public Response getCommit(
            @Parameter(description = "String value of the Commit ID. "
                    + "NOTE: Assumes an IRI unless String starts with \"_:\"", required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "String representation of the desired RDFFormat", required = false)
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Optional<Commit> optCommit = commitManager.getCommit(vf.createIRI(commitId), conn);

            if (optCommit.isPresent()) {
                return createCommitResponse(optCommit.get(), bNodeService);
            } else {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
        } finally {
            logger.trace("getCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets a {@link List} of {@link Commit}s, in descending order by date, within the repository which represents the
     * {@link Commit} history starting from the specified {@link Commit}. The {@link Commit} identified by the provided
     * {@code commitId} is the first item in the {@link List} and it was informed by the previous {@link Commit} in the
     * {@link List}. The {@link List} is then filtered by {@link Commit Commits} containing an entity in its additions
     * or deletions. If a limit is passed which is greater than zero, will paginate the results.
     *
     * @param uriInfo  The {@link UriInfo} of the request.
     * @param commitId {@link String} value of the {@link Commit} ID. NOTE: Assumes an {@link IRI} unless {@link String}
     *                 starts with "{@code _:}".
     * @param targetId {@link String} value of the target {@link Commit} ID. NOTE: Assumes an {@link IRI} unless
     *                 {@link String} starts with "{@code _:}".
     * @param entityId An optional {@link String} value of the entity ID. NOTE: Assumes an {@link IRI} unless
     *                 {@link String} starts with "{@code _:}".
     * @param offset   An optional offset for the results.
     * @param limit    An optional limit for the results.
     * @return A {@link Response} containing a {@link List} of {@link Commit}s starting with the provided
     * {@code commitId} which represents the {@link Commit} history.
     */
    @GET
    @Path("{commitId}/history")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "commits",
            summary = "Retrieves the Commit history specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response containing a List of "
                            + "Commits starting with the provided commitId which represents "
                            + "the Commit history."),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getCommitHistory(
            @Context UriInfo uriInfo,
            @Parameter(description = "String value of the Commit ID"
                    + "NOTE: Assumes an IRI unless String starts with \"_:\"", required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "String value of the target Commit ID"
                    + "NOTE: Assumes an IRI unless String starts with \"_:\"", required = true)
            @QueryParam("targetId") String targetId,
            @Parameter(description = "Optional String value of the Entity ID"
                    + "NOTE: Assumes an IRI unless String starts with \"_:\"", required = false)
            @QueryParam("entityId") String entityId,
            @Parameter(description = "Optional offset for the results", required = false)
            @QueryParam("offset") int offset,
            @Parameter(description = "Optional limit for the results", required = false)
            @QueryParam("limit") int limit) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            LinksUtils.validateParams(limit, offset);
            final List<Commit> commits;

            if (StringUtils.isBlank(targetId) && StringUtils.isBlank(entityId)) {
                commits = commitManager.getCommitChain(vf.createIRI(commitId), conn);
            } else if (StringUtils.isNotBlank(targetId) && StringUtils.isBlank(entityId)) {
                commits = commitManager.getCommitChain(vf.createIRI(commitId), vf.createIRI(targetId), conn);
            } else if (StringUtils.isBlank(targetId) && StringUtils.isNotBlank(entityId)) {
                commits = commitManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(entityId), conn);
            } else {
                commits = commitManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(targetId),
                        vf.createIRI(entityId), conn);
            }

            Stream<Commit> result = commits.stream();

            if (limit > 0) {
                result = result.skip(offset)
                        .limit(limit);
            }

            ArrayNode commitChain = mapper.createArrayNode();

            result.map(r -> createCommitJson(r, vf, engineManager))
                    .forEach(commitChain::add);

            return createPaginatedResponseWithJsonNode(uriInfo, commitChain, commits.size(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);

        } finally {
            logger.trace("getCommitHistory took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets the Compiled Resource of {@link Commit} and or of a specific Entity IRI in that {@link Commit} if present.
     *
     * @param commitId {@link String} value of the {@link Commit} ID. NOTE: Assumes an {@link IRI} unless {@link String}
     *                 starts with "{@code _:}".
     * @param entityId An Optional Resource identifying the Entity to filter the chain of Commit.
     * @return a {@link Response} containing a {@link List} of Compiled {@link Resource}s.
     * @throws IllegalArgumentException Thrown if a CommitId could not be found.
     */
    @GET
    @Path("{commitId}/resource")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "commits",
            summary = "Retrieves the Commit specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "400",
                            description = "Response indicating BAD_REQUEST, Thrown if a CommitId could not be found"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getCompiledResource(
            @Parameter(description = "String value of the Commit ID", required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "Optional Resource identifying the Entity to filter the chain of Commit",
                    required = false)
            @QueryParam("entityId") String entityId) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(commitId, "Commit ID is required");
            Model model;
            if (StringUtils.isNotBlank(entityId)) {
                List<Commit> commits = commitManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(entityId), conn);
                List<Resource> commitIds = commits.stream().map(Thing::getResource).toList();
                model = compiledResourceManager.getCompiledResource(commitIds, conn, vf.createIRI(entityId));
            } else {
                List<Commit> commits = commitManager.getCommitChain(vf.createIRI(commitId), conn);
                List<Resource> commitIds = commits.stream().map(Thing::getResource).toList();
                model = compiledResourceManager.getCompiledResource(commitIds, conn);
            }

            return Response.ok(modelToSkolemizedString(model, RDFFormat.JSONLD, bNodeService))
                    .build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            logger.trace("getCompiledResource took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets the {@link Difference} for the specified commit or between the two specified {@link Commit}s. If a limit and
     * offset are passed in, retrieve the differences for the paged subjects using the limit and offset. If the offset
     * is greater than the number of subjects, the additions and deletions arrays of the response object will be empty
     * arrays. If limit and offset are provided, a header called has-more-results will be added to the response object
     * that indicates whether more pages of results exist.
     *
     * @param sourceId  {@link String} value of the source {@link Commit} ID. NOTE: Assumes an {@link IRI} unless
     *                  {@link String} starts with "{@code _:}".
     * @param targetId  Optional {@link String} value of the target {@link Commit} ID. NOTE: Assumes an {@link IRI}
     *                  unless {@link String} starts with "{@code _:}".
     * @param limit     An optional limit of the number of subjects to retrieve the differences for.
     *                  The number of subjects in the response object may be less than the limit due to the way
     *                  some blank nodes are skolemized.
     * @param offset    An optional integer offset of the subject to start collecting differences from.
     * @param rdfFormat {@link String} representation of the desired {@link RDFFormat}. Default value is
     *                  {@code "jsonld"}.
     * @return A {@link Response} containing the {@link Difference} for the specified commit or between the
     * {@code sourceId} and {@code targetId}
     * {@link Commit}s.
     */
    @GET
    @Path("{sourceId}/difference")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "commits",
            summary = "Gets the Difference for the specified commit or between the two "
                    + "specified Commits. If a limit and offset are passed in, retrieve the "
                    + "differences for the paged subjects using the limit and offset. If the offset is "
                    + "greater than the number of subjects, the additions and deletions arrays of the "
                    + "response object will be empty arrays. If limit and offset are provided, a header "
                    + "called has-more-results will be added to the response object that indicates whether more "
                    + "pages of results exist.",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response containing the Difference for the specified commit or "
                                    + "between the sourceId and targetId"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getDifference(
            @Parameter(description = "String value of the source Commit", required = true)
            @PathParam("sourceId") String sourceId,
            @Parameter(description = "Optional String value of the target Commit ID", required = false)
            @QueryParam("targetId") String targetId,
            @Parameter(description = "Optional limit of the number of subjects to retrieve the differences for. "
                    + "The number of subjects in the response object may be less than the limit "
                    + "due to the way some blank nodes are skolemized", required = false)
            @DefaultValue("-1") @QueryParam("limit") int limit,
            @Parameter(description = "Optional integer offset of the subject to start collecting differences from",
                    required = false)
            @QueryParam("offset") int offset,
            @Parameter(description = "String representation of the desired RDFFormat", required = false)
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(sourceId, "Source commit is required");

            if (StringUtils.isBlank(targetId)) {
                Optional<Commit> optCommit = commitManager.getCommit(vf.createIRI(sourceId), conn);
                if (optCommit.isPresent()) {
                    if (limit == -1) {
                        return createCommitResponse(optCommit.get(),
                                differenceManager.getCommitDifference(optCommit.get().getResource(), conn),
                                rdfFormat, bNodeService);
                    } else {
                        PagedDifference pagedDifference = differenceManager.getCommitDifferencePaged(
                                optCommit.get().getResource(), limit, offset, conn);
                        return Response.fromResponse(createCommitResponse(optCommit.get(),
                                pagedDifference.getDifference(),
                                rdfFormat, bNodeService)).header("Has-More-Results",
                                pagedDifference.hasMoreResults()).build();
                    }
                } else {
                    return Response.status(Response.Status.NOT_FOUND).build();
                }
            } else {
                if (limit == -1) {
                    Difference diff = differenceManager.getDifference(vf.createIRI(sourceId), vf.createIRI(targetId),
                            conn);
                    return Response.ok(getDifferenceJsonString(diff, rdfFormat, bNodeService),
                            MediaType.APPLICATION_JSON).build();
                } else {
                    PagedDifference pagedDifference = differenceManager.getCommitDifferencePaged(
                            vf.createIRI(sourceId), vf.createIRI(targetId), limit, offset, conn);
                    return Response.ok(getDifferenceJsonString(pagedDifference.getDifference(),
                            rdfFormat, bNodeService),
                            MediaType.APPLICATION_JSON).header("Has-More-Results",
                            pagedDifference.hasMoreResults()).build();
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            logger.trace("getDifference took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Get Difference For Subject.
     * @param sourceId {@link String} value of the source {@link Commit} ID
     * @param subjectId String value of the subjectId
     * @param rdfFormat String representation of the desired RDFFormat
     * @return Results
     */
    @GET
    @Path("{sourceId}/difference/{subjectId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "commits",
            summary = "Retrieves the Difference in the specified commit for the specified subject",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getDifferenceForSubject(
            @Parameter(description = "String value of the source Commit", required = true)
            @PathParam("sourceId") String sourceId,
            @Parameter(description = "String value of the subjectId", required = true)
            @PathParam("subjectId") String subjectId,
            @Parameter(description = "String representation of the desired RDFFormat", required = true)
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(sourceId, "Source commit is required");
            Optional<Commit> optCommit = commitManager.getCommit(vf.createIRI(sourceId), conn);
            if (optCommit.isPresent()) {
                Difference difference = differenceManager.getCommitDifferenceForSubject(vf.createIRI(subjectId),
                        optCommit.get().getResource(), conn);
                return createCommitResponse(optCommit.get(), difference, rdfFormat, bNodeService);
            } else {
                throw ErrorUtils.sendError("Commit " + sourceId + " could not be found",
                        Response.Status.NOT_FOUND);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            logger.trace("getDifference took {}ms", System.currentTimeMillis() - start);
        }
    }
}
