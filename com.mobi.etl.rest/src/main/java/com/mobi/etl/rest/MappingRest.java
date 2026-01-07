package com.mobi.etl.rest;

/*-
 * #%L
 * com.mobi.etl.rest
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
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormat;
import static com.mobi.rest.util.RestUtils.groupedModelToString;
import static com.mobi.rest.util.RestUtils.jsonldToModel;

import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.etl.api.delimited.MappingManager;
import com.mobi.etl.api.delimited.MappingWrapper;
import com.mobi.etl.api.delimited.record.config.MappingRecordCreateSettings;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.FileUpload;
import com.mobi.rest.util.RestUtils;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Component(service = MappingRest.class, immediate = true)
@JaxrsResource
@Path("/mappings")
public class MappingRest {

    private final Logger logger = LoggerFactory.getLogger(MappingRest.class);

    private final ValueFactory vf = new ValidatingValueFactory();

    private static final String JSON_LD = "jsonld";

    @Reference
    protected MappingManager manager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected RecordManager recordManager;

    @Reference
    protected EngineManager engineManager;

    /**
     * Uploads a mapping sent as form data or a JSON-LD string into a data store with a UUID local name and creates
     * a new MappingRecord in the catalog.
     *
     * @param servletRequest The HttpServletRequest
     * @return Response with the MappingRecord Resource ID
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "mappings",
            summary = "Upload mapping sent as form data",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Response with the MappingRecord Resource ID"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA, encoding = {
                                    @Encoding(name = "keywords", explode = true)
                                }, schema = @Schema(implementation = MappingFileUpload.class)
                            )
                    }
            )
    )
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = MappingRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response upload(@Context HttpServletRequest servletRequest) {
        Map<String, List<Class<?>>> fields = new HashMap<>();
        fields.put("title", List.of(String.class));
        fields.put("description", List.of(String.class));
        fields.put(JSON_LD, List.of(String.class));
        fields.put("markdown", List.of(String.class));
        fields.put("keywords", List.of(Set.class, String.class));

        Map<String, Object> formData = RestUtils.getFormData(servletRequest, fields);
        String title = (String) formData.get("title");
        String description = (String) formData.get("description");
        String jsonld = (String) formData.get(JSON_LD);
        String markdown = (String) formData.get("markdown");
        Set<String> keywords = (Set<String>) formData.get("keywords");
        FileUpload file = (FileUpload) formData.getOrDefault("file", new FileUpload());
        InputStream inputStream = file.getStream();
        String filename = file.getFilename();

        if ((inputStream == null && jsonld == null) || (inputStream != null && jsonld != null)) {
            throw ErrorUtils.sendError("Must provide either a file or a JSON-LD string", Response.Status.BAD_REQUEST);
        }
        checkStringParam(title, "Title is required");
        User user = getActiveUser(servletRequest, engineManager);
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        RecordOperationConfig config = new OperationConfig();
        Resource catalogId = configProvider.getLocalCatalogIRI();
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        if (StringUtils.isNotEmpty(title)) {
            config.set(RecordCreateSettings.RECORD_TITLE, title);
        }
        if (StringUtils.isNotEmpty(description)) {
            config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
        }
        if (keywords != null && keywords.size() > 0) {
            config.set(RecordCreateSettings.RECORD_KEYWORDS, new HashSet<>(keywords));
        }
        MappingRecord record;
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            if (inputStream != null) {
                RDFFormat format = Rio.getParserFormatForFileName(filename).orElseThrow(() ->
                        new IllegalArgumentException("File is not in a valid RDF format"));
                config.set(MappingRecordCreateSettings.INPUT_STREAM, inputStream);
                config.set(MappingRecordCreateSettings.RDF_FORMAT, format);
            } else {
                config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonldToModel(jsonld));
            }
            record = recordManager.createRecord(user, config, MappingRecord.class, conn);
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private static class MappingFileUpload {
        @Schema(type = "string", format = "binary", description = "Mapping file to upload.")
        public String file;

        @Schema(type = "string", description = "Mapping serialized as JSON-LD", required = true)
        public String jsonld;

        @Schema(type = "string", description = "Required title for the new MappingRecord", required = true)
        public String title;

        @Schema(type = "string", description = "Optional description for the new MappingRecord")
        public String description;

        @Schema(type = "string", description = "Optional markdown abstract for the new MappingRecord")
        public String markdown;

        @ArraySchema(arraySchema = @Schema(description = "Optional list of keywords strings for the new MappingRecord"),
                schema = @Schema(implementation = String.class, description = "keyword")
        )
        public List<String> keywords;
    }

    /**
     * Collects the JSON-LD from an uploaded mapping and returns it as JSON.
     *
     * @param recordId the id of an uploaded mapping
     * @return Response with the JSON-LD from the uploaded mapping
     */
    @GET
    @Path("{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "mappings",
            summary = "Retrieve JSON-LD of an uploaded mapping",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response with the uploaded mapping JSON-LD"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getMapping(
            @Parameter(description = "ID of an uploaded mapping", required = true)
            @PathParam("recordId") String recordId) {
        try {
            logger.info("Getting mapping " + recordId);
            MappingWrapper mapping = manager.retrieveMapping(vf.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND));
            String mappingJsonld = groupedModelToString(mapping.getModel(), getRDFFormat(JSON_LD));
            return Response.ok(mappingJsonld).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Downloads an uploaded mapping.
     *
     * @param recordId the id of an uploaded mapping
     * @param format the RDFFormat the file should be
     * @return a response with mapping to download
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @Operation(
            tags = "mappings",
            summary = "Download an uploaded mapping",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response with mapping to download"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadMapping(
            @Parameter(description = "Id of an uploaded mapping", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "RDFFormat the file should be")
            @DefaultValue(JSON_LD) @QueryParam("format") String format) {
        try {
            logger.info("Downloading mapping " + recordId);
            MappingWrapper mapping = manager.retrieveMapping(vf.createIRI(recordId)).orElseThrow(() ->
                    ErrorUtils.sendError("Mapping not found", Response.Status.NOT_FOUND));
            RDFFormat rdfFormat = getRDFFormat(format);
            String mappingJsonld = groupedModelToString(mapping.getModel(), rdfFormat);
            StreamingOutput stream = os -> {
                Writer writer = new BufferedWriter(new OutputStreamWriter(os));
                writer.write(mappingJsonld);
                writer.flush();
                writer.close();
            };

            return Response.ok(stream).header("Content-Disposition", "attachment; filename="
                    + vf.createIRI(mapping.getId().getMappingIdentifier().stringValue()).getLocalName() + "."
                    + rdfFormat.getDefaultFileExtension()).header("Content-Type", rdfFormat.getDefaultMIMEType())
                    .build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes an uploaded mapping from the data store.
     *
     * @param servletRequest The HttpServletRequest
     * @param recordId the id of an uploaded mapping
     * @return Response indicating the success or failure of the request
     */
    @DELETE
    @Path("{recordId}")
    @RolesAllowed("user")
    @Operation(
            tags = "mappings",
            summary = "Delete an uploaded mapping",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response indicating the success or failure of "
                            + "the request"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(Delete.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteMapping(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "ID of an uploaded mapping", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogId = configProvider.getLocalCatalogIRI();
            recordManager.removeRecord(catalogId, vf.createIRI(recordId), getActiveUser(servletRequest, engineManager),
                    MappingRecord.class, conn);
        } catch (MobiException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        }
        return Response.ok().build();
    }
}
