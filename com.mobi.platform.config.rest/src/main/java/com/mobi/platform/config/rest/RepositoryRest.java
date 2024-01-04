package com.mobi.platform.config.rest;

/*-
 * #%L
 * com.mobi.platform.config.rest
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.util.ErrorUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
    @Operation(
            tags = "repositories",
            summary = "Retrieves all the configured repositories",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getRepositories() {
        Map<String, OsgiRepository> repos = repositoryManager.getAllRepositories();
        ArrayNode array = mapper.createArrayNode();
        repos.forEach((key, value) -> {
            ObjectNode repo = createRepoJson(value);
            array.add(repo);
        });
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
    @Operation(
            tags = "repositories",
            summary = "Retrieves a repository based on its id",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating the success or failure of the request"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
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
        return obj;
    }
}
