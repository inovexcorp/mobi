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

import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitJson;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitResponse;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.getDifferenceJsonString;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createPaginatedResponseWithJsonNode;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;

import aQute.bnd.service.diff.Diff;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
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
@Path("/commits")
@Api(value = "/commits")
public class CommitRest {

    private static final Logger logger = LoggerFactory.getLogger(CommitRest.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    private BNodeService bNodeService;
    private CatalogManager catalogManager;
    private SesameTransformer transformer;
    private ValueFactory vf;

    protected EngineManager engineManager;

    @Reference
    void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

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
    @ApiOperation("Retrieves the Commit specified by the provided ID.")
    public Response getCommit(@PathParam("commitId") String commitId,
                       @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try {
            Optional<Commit> optCommit = catalogManager.getCommit(vf.createIRI(commitId));

            if (optCommit.isPresent()) {
                return createCommitResponse(optCommit.get(), transformer, bNodeService);
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
    @ApiOperation("Retrieves the Commit history specified by the provided ID.")
    public Response getCommitHistory(@Context UriInfo uriInfo,
                              @PathParam("commitId") String commitId,
                              @QueryParam("targetId") String targetId,
                              @QueryParam("entityId") String entityId,
                              @QueryParam("offset") int offset,
                              @QueryParam("limit") int limit) {
        long start = System.currentTimeMillis();
        try {
            LinksUtils.validateParams(limit, offset);

            try {
                final List<Commit> commits;

                if (StringUtils.isBlank(targetId) && StringUtils.isBlank(entityId)) {
                    commits = catalogManager.getCommitChain(vf.createIRI(commitId));
                } else if (StringUtils.isNotBlank(targetId) && StringUtils.isBlank(entityId)) {
                    commits = catalogManager.getCommitChain(vf.createIRI(commitId), vf.createIRI(targetId));
                } else if (StringUtils.isBlank(targetId) && StringUtils.isNotBlank(entityId)) {
                    commits = catalogManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(entityId));
                } else {
                    commits = catalogManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(targetId),
                            vf.createIRI(entityId));
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
            }
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
    @ApiOperation("Retrieves the Commit specified by the provided ID.")
    public Response getCompiledResource(@PathParam("commitId") String commitId,
                                 @QueryParam("entityId") String entityId) {
        long start = System.currentTimeMillis();
        try {
            checkStringParam(commitId, "Commit ID is required");
            Model model;
            try {
                final List<Commit> commits;
                if (StringUtils.isNotBlank(entityId)) {
                    commits = catalogManager.getCommitEntityChain(vf.createIRI(commitId), vf.createIRI(entityId));
                    Model entityModel = catalogManager.getCompiledResource(commits);
                    model = entityModel.filter(vf.createIRI(entityId), null,null);
                } else {
                    commits = catalogManager.getCommitChain(vf.createIRI(commitId));
                    model = catalogManager.getCompiledResource(commits);
                }

                return Response.ok(modelToSkolemizedString(model, RDFFormat.JSONLD, transformer, bNodeService))
                        .build();
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
            } catch (IllegalStateException | MobiException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
            }
        } finally {
            logger.trace("getCompiledResource took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets the {@link Difference} for the specified commit or between the two specified {@link Commit}s.
     *
     * @param sourceId  {@link String} value of the source {@link Commit} ID. NOTE: Assumes an {@link IRI} unless
     *                  {@link String} starts with "{@code _:}".
     * @param targetId  Optional {@link String} value of the target {@link Commit} ID. NOTE: Assumes an {@link IRI}
     *                  unless {@link String} starts with "{@code _:}".
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
    @ApiOperation("Retrieves the Difference of the two specified Commits.")
    public Response getDifference(@PathParam("sourceId") String sourceId,
                                  @QueryParam("targetId") String targetId,
                                  @DefaultValue("-1") @QueryParam("limit") int limit,
                                  @QueryParam("offset") int offset,
                                  @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        long start = System.currentTimeMillis();
        try {
            checkStringParam(sourceId, "Source commit is required");

            if (StringUtils.isBlank(targetId)) {
                Optional<Commit> optCommit = catalogManager.getCommit(vf.createIRI(sourceId));
                if (optCommit.isPresent()) {
                    if (limit == -1) {
                        return createCommitResponse(optCommit.get(),
                                catalogManager.getCommitDifferenceModified(optCommit.get().getResource(), limit, offset),
                                rdfFormat, transformer, bNodeService);
                    } else {
                        boolean hasMoreResults = catalogManager.hasMoreResults(optCommit.get().getResource(), limit, offset);
                        return Response.fromResponse(createCommitResponse(optCommit.get(),
                                catalogManager.getCommitDifferenceModified(optCommit.get().getResource(), limit, offset),
                                rdfFormat, transformer, bNodeService)).header("Has-More-Results", hasMoreResults).build();
                    }
                } else {
                    return Response.status(Response.Status.NOT_FOUND).build();
                }
            } else {
                Difference diff = (limit == -1) ? catalogManager.getDifference(vf.createIRI(sourceId), vf.createIRI(targetId)) :
                            catalogManager.getDifferenceModified(vf.createIRI(sourceId), vf.createIRI(targetId), limit, offset);
                return Response.ok(getDifferenceJsonString(diff, rdfFormat, transformer, bNodeService),
                        MediaType.APPLICATION_JSON).build();
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
