package com.mobi.server.rest;

/*-
 * #%L
 * com.mobi.server.rest
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

import static com.mobi.rest.util.RestUtils.checkStringParam;

import com.mobi.exception.MobiException;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.server.api.logs.LogEntry;
import com.mobi.server.api.logs.LogFileMetadata;
import com.mobi.server.api.logs.LogPage;
import com.mobi.server.api.logs.LogViewerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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

    public static final String TAG_NAME = "Logs";
    public static final String TAG_DESC = "Operations related to application logs including log levels";

    @Reference
    LogViewerService logViewerService;

    /**
     * Get list of available log files.
     */
    @GET
    @Path("/files")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves the list of log file names as a string array",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "An array of file names corresponding to the log files for the application",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = String.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching log file names",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
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
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves metadata in JSON format about a specific log file referenced by name",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object containing metadata about the specified log file",
                    content = @Content(schema = @Schema(implementation = LogFileMetadata.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching log file metadata",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
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
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves the contents of a log file as paginated JSON "
                    + "or a file download depending on the Accept header",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object containing the specified log lines from the specified log file",
                    content = {
                            @Content(
                                    schema = @Schema(implementation = LogPage.class)
                            ),
                            // Not showing up in Swagger UI, but unfortunately stuck with it
                            @Content(
                                    mediaType = MediaType.APPLICATION_OCTET_STREAM,
                                    schema = @Schema(type = "string", format = "binary")
                            )
                    },
                    headers = {
                            @Header(
                                    name = "Content-Disposition",
                                    description = "Attachment header for log file download",
                                    schema = @Schema(type = "string", example = "attachment; filename=\"karaf.log\"")
                            ),
                            @Header(
                                    name = "Content-Type",
                                    description = "The media type of the downloaded log file",
                                    schema = @Schema(type = "string")
                            )
                    }
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching log file content",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response readLogFile(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName,
            @Parameter(description = "The 0-based index of the page to retrieve")
            @QueryParam("page") @DefaultValue("0") int page,
            @Parameter(description = "The number of lines that should be included in a page")
            @QueryParam("pageSize") @DefaultValue("100") int pageSize) {
        try {
            LogPage logPage = logViewerService.readLogFile(fileName, page, pageSize);
            return Response.ok(logPage).type(MediaType.APPLICATION_JSON).build();
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
    @Operation(hidden = true) // Hide from Swagger docs since captured in annotations of other method
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
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves the last N lines from a specific log file as a JSON object",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object containing the specified log lines from the specified log file",
                    content = @Content(schema = @Schema(implementation = LogTailResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching log file content",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response tailLogFile(
            @Parameter(description = "The filename of a log file", required = true)
            @PathParam("fileName") String fileName,
            @Parameter(description = "The number of lines to fetch from the latest content of the log file")
            @QueryParam("lines") @DefaultValue("100") int lines) {
        try {
            List<String> tailLines = logViewerService.tailLogFile(fileName, lines);

            LogTailResponse response = new LogTailResponse(fileName, tailLines, tailLines.size());
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
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Searches a log file for a specified term and returns as a JSON object",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object containing the search results from the specified log file",
                    content = @Content(schema = @Schema(implementation = LogSearchResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching log file content",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
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

    /**
     * Get all configured loggers and their levels.
     * GET /logs/levels
     */
    @GET
    @Path("/levels")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves all configured loggers as pairs of package names and log levels",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object with keys of package names and values of log levels",
                    content = @Content(
                            schema = @Schema(
                                    type = "object",
                                    description = "Map where keys are either 'ROOT' or Java package names "
                                            + "(e.g., 'com.example.package')",
                                    example = "{\"ROOT\": \"WARN\", \"com.example.package\": \"DEBUG\", "
                                            + "\"org.another.package\": \"INFO\"}",
                                    additionalProperties = Schema.AdditionalPropertiesValue.TRUE
                            )
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getAllLoggers() {
        try {
            Map<String, String> loggers = logViewerService.getAllLoggerLevels();
            return Response.ok(loggers).build();
        } catch (Exception ex) {
            logger.error("Error retrieving loggers", ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Get log level for a specific logger.
     * GET /logs/levels/{loggerName}
     */
    @GET
    @Path("/levels/{loggerName}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves the log level for a specific logger (aka package)",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object with the logger name and the log level",
                    content = @Content(schema = @Schema(implementation = LoggerNameWithLevelResponse.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "The specified logger in the path could not be found",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getLoggerLevel(@PathParam("loggerName") String loggerName) {
        try {
            String level = logViewerService.getLoggerLevel(loggerName);

            if (level == null) {
                throw new MobiException("Logger not found: " + loggerName);
            }

            LoggerNameWithLevelResponse response = new LoggerNameWithLevelResponse(loggerName, level);

            return Response.ok(response).build();
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjNotFound(ex);
        } catch (Exception ex) {
            logger.error("Error retrieving logger level for: {}", loggerName, ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Set log level for a logger.
     * PUT /logs/levels/{loggerName}
     * Body: { "level": "DEBUG" }
     */
    @PUT
    @Path("/levels/{loggerName}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Sets the log level for a specific logger (aka package)",
            description = "Requires the 'admin' role.",
            requestBody = @RequestBody(
                    description = "Map containing the logger name and the level to set for the logger.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = LoggerNameWithLevelResponse.class))
            )
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object with the logger name, the log level, and a success message",
                    content = @Content(schema = @Schema(implementation = LoggerNameWithLevelAndMessageResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "The request is missing required information",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response setLoggerLevel(
            @PathParam("loggerName") String loggerName,
            Map<String, String> request) {
        try {
            if (request == null) {
                throw new MobiException("Request body is required");
            }
            String level = request.get("level");

            if (level == null || level.trim().isEmpty()) {
                throw new MobiException("Level is required");
            }

            // Validate level
            if (isNotValidLogLevel(level)) {
                throw new MobiException("Invalid log level: " + level
                        + ". Valid levels are: OFF, ERROR, WARN, INFO, DEBUG, TRACE");
            }

            logViewerService.setLoggerLevel(loggerName, level.toUpperCase());

            LoggerNameWithLevelAndMessageResponse response = new LoggerNameWithLevelAndMessageResponse(loggerName,
                    "Logger level updated successfully", level.toUpperCase());

            return Response.ok(response).build();

        } catch (MobiException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (Exception ex) {
            logger.error("Error setting logger level for: {}", loggerName, ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Create a new logger configuration
     * POST /logs/levels
     * Body: { "loggerName": "org.apache.karaf", "level": "DEBUG" }
     */
    @POST
    @Path("/levels")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Creates a new logger with the provided package name and log level",
            description = "Requires the 'admin' role.",
            requestBody = @RequestBody(
                    description = "Map containing the logger name and the level to set for the logger.",
                    required = true,
                    content = @Content(schema = @Schema(implementation = LoggerNameWithLevelResponse.class))
            )
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "A JSON object with the logger name, the log level, and a success message",
                    content = @Content(schema = @Schema(implementation = LoggerNameWithLevelAndMessageResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "The request is missing required information",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response createLogger(Map<String, String> request) {
        try {
            if (request == null) {
                throw new MobiException("Request body is required");
            }
            String loggerName = request.get("loggerName");
            String level = request.get("level");

            if (loggerName == null || loggerName.trim().isEmpty()) {
                throw new MobiException("Logger name is required");
            }

            if (level == null || level.trim().isEmpty()) {
                throw new MobiException("Level is required");
            }

            if (isNotValidLogLevel(level)) {
                throw new MobiException("Invalid log level: " + level);
            }

            logViewerService.setLoggerLevel(loggerName, level);

            LoggerNameWithLevelAndMessageResponse response = new LoggerNameWithLevelAndMessageResponse(loggerName,
                    "Logger created successfully", level.toUpperCase());

            return Response.status(Response.Status.CREATED).entity(response).build();
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (Exception ex) {
            logger.error("Error creating logger", ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Delete a logger configuration.
     * DELETE /logs/levels/{loggerName}
     */
    @DELETE
    @Path("/levels/{loggerName}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Removes the specified logger",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "A JSON object with the logger name and a success message",
                    content = @Content(schema = @Schema(implementation = LoggerNameWithMessageResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Attempted to delete the ROOT logger",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response deleteLogger(@PathParam("loggerName") String loggerName) {
        try {
            if ("ROOT".equals(loggerName)) {
                throw new MobiException("Cannot delete ROOT logger");
            }

            logViewerService.deleteLogger(loggerName);

            Map<String, String> response = new HashMap<>();
            response.put("loggerName", loggerName);
            response.put("message", "Logger deleted successfully");

            return Response.ok(response).build();
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (Exception ex) {
            logger.error("Error deleting logger: {}", loggerName, ex);
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Get available log levels.
     * GET /logs/levels/available
     */
    @GET
    @Path("/levels/available")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("admin")
    @Tag(name = TAG_NAME, description = TAG_DESC)
    @Operation(
            summary = "Retrieves the list of supported log levels",
            description = "Requires the 'admin' role."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "An array of strings containing the supported log levels",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = String.class)))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "User is not authenticated or session has expired",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Permission Denied: Authenticated user does not have the admin role",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Problem fetching loggers",
                    content = @Content(schema = @Schema(implementation = ErrorObjectSchema.class))
            )
    })
    public Response getAvailableLevels() {
        String[] levels = {"OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"};
        return Response.ok(levels).build();
    }

    private boolean isNotValidLogLevel(String level) {
        if (level == null) {
            return true;
        }
        String upper = level.toUpperCase();
        return !"OFF".equals(upper) && !"ERROR".equals(upper) && !"WARN".equals(upper)
                && !"INFO".equals(upper) && !"DEBUG".equals(upper) && !"TRACE".equals(upper);
    }

    // Swagger Schemas
    @Schema(description = "Response containing tailed log lines")
    private static class LogTailResponse {

        @Schema(description = "Name of the log file", example = "karaf.log")
        private final String fileName;

        @Schema(description = "List of log lines from the file")
        private final List<String> lines;

        @Schema(description = "Number of lines returned", example = "100")
        private Integer count;

        public LogTailResponse(String fileName, List<String> lines, Integer count) {
            this.fileName = fileName;
            this.lines = lines;
            this.count = count;
        }

        public String getFileName() {
            return fileName;
        }

        public List<String> getLines() {
            return lines;
        }

        public Integer getCount() {
            return count;
        }
    }

    @Schema(description = "Response containing search results of a log file")
    private static class LogSearchResponse {

        @Schema(description = "Name of the log file", example = "karaf.log")
        private final String fileName;

        @Schema(description = "The search term that created the results")
        private final String searchTerm;

        @Schema(description = "List of log entries from the file matching the search term")
        private final List<LogEntry> lines;

        @Schema(description = "Number of log entries returned", example = "100")
        private Integer count;

        public LogSearchResponse(String fileName, String searchTerm, List<LogEntry> lines, Integer count) {
            this.fileName = fileName;
            this.searchTerm = searchTerm;
            this.lines = lines;
            this.count = count;
        }

        public String getFileName() {
            return fileName;
        }

        public String getSearchTerm() {
            return searchTerm;
        }

        public List<LogEntry> getLines() {
            return lines;
        }

        public Integer getCount() {
            return count;
        }
    }

    @Schema(description = "Object with a logger name")
    private static class LoggerNameResponse {
        @Schema(description = "Name of the logger", example = "com.example.package")
        protected final String loggerName;

        private LoggerNameResponse() {
            this.loggerName = "";
        }

        public LoggerNameResponse(String loggerName) {
            this.loggerName = loggerName;
        }

        public String getLoggerName() {
            return loggerName;
        }
    }

    @Schema(description = "Object with a logger name and a relevant message")
    private static class LoggerNameWithMessageResponse extends LoggerNameResponse {
        @Schema(description = "The message about the logger")
        protected final String message;

        private LoggerNameWithMessageResponse() {
            super();
            this.message = "";
        }

        public LoggerNameWithMessageResponse(String loggerName, String message) {
            super(loggerName);
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    @Schema(description = "Object with a logger name and a log level")
    private static class LoggerNameWithLevelResponse extends LoggerNameResponse {
        @Schema(description = "The log level of the logger", example = "INFO")
        protected final String level;

        public LoggerNameWithLevelResponse(String loggerName, String level) {
            super(loggerName);
            this.level = level;
        }

        public String getLevel() {
            return level;
        }
    }

    @Schema(description = "Object with a logger name, a log level, and a relevant message")
    private static class LoggerNameWithLevelAndMessageResponse extends LoggerNameWithMessageResponse {
        @Schema(description = "The log level of the logger", example = "INFO")
        protected final String level;

        public LoggerNameWithLevelAndMessageResponse(String loggerName, String message, String level) {
            super(loggerName, message);
            this.level = level;
        }

        public String getLevel() {
            return level;
        }
    }
}
