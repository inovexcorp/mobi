package com.mobi.server.rest;

/*-
 * #%L
 * com.mobi.server.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.rest.util.RestUtils;
import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import com.mobi.server.api.logs.LogViewerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

/**
 * Provides all the REST endpoints underneath the /mobirest/logs path. Enables viewing of log files.
 */
@Path("/logs")
@Component(service = LogViewerRest.class, immediate = true)
@JaxrsResource
public class LogViewerRest {
    private static final Logger logger = LoggerFactory.getLogger(LogViewerRest.class);

    @Reference
    LogViewerService logViewerService;

    /**
     * Get list of available log files.
     */
    @GET
    @Path("/files")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "logs",
            summary = "Retrieves the list of log file names as a string array",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "An array of file names corresponding to the logs files for the application"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem fetching log file names")
            }
    )
    @RolesAllowed("admin")
    public Response getLogFiles() {
        try {
            List<String> files = logViewerService.getAvailableLogFiles();
            return Response.ok(files).build();
        } catch (IOException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Get log file metadata.
     */
    @GET
    @Path("/files/{fileName}/metadata")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "logs",
            summary = "Retrieves metadata in JSON format about a specific log file referenced by name",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object containing metadata about the specified log file"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem fetching log file metadata")
            }
    )
    @RolesAllowed("admin")
    public Response getLogFileMetadata(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName) {
        try {
            LogFileMetadata metadata = logViewerService.getLogFileMetadata(fileName);
            return Response.ok(metadata).build();
        } catch (IOException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Read log file with pagination.
     */
    @GET
    @Path("/files/{fileName}")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "logs",
            summary = "Reads lines out of a specific log file in a paginated fashion and returns as a JSON object",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object containing the specified log lines from the specified log "
                                    + "file"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem fetching log file content")
            }
    )
    @RolesAllowed("admin")
    public Response readLogFile(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName,
            @Parameter(description = "The 0-based index of the page to retrieve")
            @QueryParam("page") @DefaultValue("0") int page,
            @Parameter(description = "The number of lines that should be included in a page")
            @QueryParam("pageSize") @DefaultValue("100") int pageSize) {

        try {
            LogPage logPage = logViewerService.readLogFile(fileName, page, pageSize);
            return Response.ok(logPage).build();
        } catch (IOException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Download a log file.
     */
    @GET
    @Path("/files/{fileName}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("admin")
    public Response downloadLogFile(@PathParam("fileName") String fileName) {
        try {
            // Validate and get input stream
            InputStream inputStream = logViewerService.getLogFileInputStream(fileName);

            // Create streaming output for efficient transfer
            StreamingOutput streamingOutput = output -> {
                try (InputStream input = inputStream) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }
                    output.flush();
                } catch (IOException e) {
                    logger.error("Error streaming log file: {}", fileName, e);
                    throw e;
                }
            };

            // Determine content type based on file extension
            String contentType = MediaType.TEXT_PLAIN;
            if (fileName.endsWith(".gz")) {
                contentType = "application/gzip";
            } else if (fileName.endsWith(".zip")) {
                contentType = "application/zip";
            }

            return Response.ok(streamingOutput)
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .header("Content-Type", contentType)
                    .build();

        } catch (IOException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Get tail of log file (most recent entries).
     */
    @GET
    @Path("/files/{fileName}/tail")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "logs",
            summary = "Retrieves the last X lines from a specific log file like a tail function and returns as a JSON"
                    + "object",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object containing the specified log lines from the specified log "
                                    + "file"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem fetching log file content")
            }
    )
    @RolesAllowed("admin")
    public Response tailLogFile(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName,
            @Parameter(description = "The number of lines to fetch from the latest content of the log file")
            @QueryParam("lines") @DefaultValue("100") int lines) {

        try {
            List<String> tailLines = logViewerService.tailLogFile(fileName, lines);

            Map<String, Object> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("lines", tailLines);
            response.put("count", tailLines.size());

            return Response.ok(response).build();
        } catch (IOException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }

    /**
     * Search log file for a term.
     */
    @GET
    @Path("/files/{fileName}/search")
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "logs",
            summary = "Searches the specified log file for a search term and returns as a JSON object",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "A JSON object containing the search results from the specified log file"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem fetching log file content")
            }
    )
    @RolesAllowed("admin")
    public Response searchLogFile(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName,
            @Parameter(description = "The search term to find in the log file", required = true)
            @QueryParam("term") String searchTerm,
            @Parameter(description = "The maximum number of search results to retrieve")
            @QueryParam("maxResults") @DefaultValue("100") int maxResults) {

        checkStringParam(searchTerm, "Search term cannot be empty");

        try {
            List<LogEntry> results = logViewerService.searchLogFile(fileName, searchTerm, maxResults);

            Map<String, Object> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("searchTerm", searchTerm);
            response.put("results", results);
            response.put("count", results.size());

            return Response.ok(response).build();
        } catch (IOException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        }
    }
}
