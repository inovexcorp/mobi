package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.platform.config.rest.response.RepositoryResponse;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.util.Map;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = RepositoryRest.class, immediate = true)
@JaxrsResource
@Path("/repositories")
public class RepositoryRest {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String SWAGGER_REPO = "repositories";
    private static final String SWAGGER_REPO_DESC = "Operations related to Repositories";


    @Reference
    protected RepositoryManager repositoryManager;

    /**
     * Retrieves a JSON array of all the repositories configured in this Mobi installation. Each repository is
     * represented with its id, title, and type as a simple string.
     *
     * @return a Response with an JSON array of objects representing individual repositories
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Tag(name = RepositoryRest.SWAGGER_REPO, description = RepositoryRest.SWAGGER_REPO_DESC)
    @Operation(
            summary = "Retrieves all the configured repositories",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "The repository details",
                            content = @Content(
                                    mediaType = "application/json",
                                    array = @ArraySchema(schema = @Schema(implementation = RepositoryResponse.class)
                                    )
                            )
                    ),
                    @ApiResponse(
                            responseCode = "403",
                            description = "Permission Denied",
                            content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "INTERNAL SERVER ERROR",
                            content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
                    )
            }
    )
    public Response getRepositories() {
        Map<String, OsgiRepository> repos = repositoryManager.getAllRepositories();
        ArrayNode array = repos.values().stream()
                .sorted((repo1, repo2) -> repo1.getRepositoryID().compareToIgnoreCase(repo2.getRepositoryID()))
                .map(this::createRepoJson)
                .collect(mapper::createArrayNode, ArrayNode::add, ArrayNode::add);
        return Response.ok(array.toString()).build();
    }

    /**
     * Retrieve a JSON object representing the repository matching the given id.
     *
     * @return a Response with an JSON object of an individual repository
     */
    @GET
    @Path("{repoId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Tag(name = RepositoryRest.SWAGGER_REPO, description = RepositoryRest.SWAGGER_REPO_DESC)
    @Operation(
            summary = "Retrieves a repository based on its id",
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "The repository details",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = RepositoryResponse.class)
                            )
                    ),
                    @ApiResponse(
                            responseCode = "403",
                            description = "Permission Denied",
                            content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
                    ),
                    @ApiResponse(
                            responseCode = "500",
                            description = "INTERNAL SERVER ERROR",
                            content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
                    )
            }
    )
    public Response getRepository(@PathParam("repoId") String repoId) {
        OsgiRepository repo = repositoryManager.getRepository(repoId).orElseThrow(() ->
                ErrorUtils.sendError("No repository found for that id", Response.Status.BAD_REQUEST));
        ObjectNode obj = createRepoJson(repo);
        return Response.ok(obj.toString()).build();
    }

    private ObjectNode createRepoJson(OsgiRepository repo) {
        ObjectNode obj = mapper.createObjectNode();
        obj.put("id", repo.getRepositoryID());
        obj.put("title", repo.getRepositoryTitle());
        obj.put("type", repo.getRepositoryType());
        repositoryManager.getRepositoryIRI(repo.getRepositoryID())
                .ifPresent(iri -> obj.put("iri", iri.stringValue()));
        repo.getLimit().ifPresent(limit -> obj.put("limit", limit));
        repo.getTripleCount().ifPresent(tripleCount -> obj.put("tripleCount", tripleCount));
        return obj;
    }
}
