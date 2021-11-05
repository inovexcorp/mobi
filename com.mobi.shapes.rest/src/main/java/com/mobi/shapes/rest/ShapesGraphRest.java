package com.mobi.shapes.rest;

/*-
 * #%L
 * com.mobi.shapes.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.api.record.config.VersionedRDFRecordCreateSettings;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.shapes.api.ontologies.shapesgrapheditor.ShapesGraphRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

@Path("/shapes-graphs")
@Component(service = ShapesGraphRest.class, immediate = true)
public class ShapesGraphRest {

    private static final ObjectMapper mapper = new ObjectMapper();

    @Reference
    CatalogConfigProvider configProvider;

    @Reference
    CatalogManager catalogManager;

    @Reference
    EngineManager engineManager;

    @Reference
    SesameTransformer transformer;

    @Reference
    ValueFactory vf;

    /**
     * Ingests/uploads a SHACL Shapes Graph file or the JSON-LD of a SHACL Shapes Graph to a data store and creates and
     * stores a ShapesGraphRecord using the form data in the repository to track the work done on it. A master Branch is
     * created and stored with an initial Commit containing the data provided in the SHACL Shapes Graph file. Only
     * provide either a SHACL Shapes Graph file or SHACL Shapes Graph JSON-LD.
     *
     * @param context         Context of the request.
     * @param fileInputStream SHACL Shapes Graph file to upload.
     * @param json            SHACL Shapes Graph JSON-LD to upload.
     * @param title           Title for the ShapesGraphRecord.
     * @param description     Optional description for the ShapesGraphRecord.
     * @param markdown        Optional markdown abstract for the new ShapesGraphRecord.
     * @param keywords        Optional list of keyword strings for the ShapesGraphRecord.
     * @return CREATED with record ID in the data if persisted, BAD REQUEST if publishers can't be found, or INTERNAL
     *      SERVER ERROR if there is a problem creating the ShapesGraphRecord.
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(
            tags = "shapes-graphs",
            summary = "Uploads a shapes-graph file to the data store",
            description = "Uploads and imports a shapes-graph file to a data store and creates an associated "
                    + "ShapesGraphRecord using the form data. A master Branch is created and stored with an initial "
                    + "Commit containing the data provided in the SHACL Shapes Graph file.",
            responses = {
                    @ApiResponse(responseCode = "201", description = "ShapesGraphRecord created"),
                    @ApiResponse(responseCode = "400", description = "Resource can't be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem creating ShapesGraphRecord")
            }
    )
    @RolesAllowed("user")
    public Response uploadFile(
            @Context ContainerRequestContext context,
            @Parameter(schema = @Schema(type = "string", format = "binary",
                    description = "SHACL Shapes Graph file to upload.", required = true))
            @FormDataParam("file") InputStream fileInputStream,
            @Parameter(description = "File details", hidden = true)
            @FormDataParam("file") FormDataContentDisposition fileDetail,
            @Parameter(schema = @Schema(type = "string",
                    description = "SHACL Shapes Graph JSON-LD to upload"))
            @FormDataParam("json") String json,
            @Parameter(schema = @Schema(type = "string",
                    description = "Title for the ShapesGraphRecord", required = true))
            @FormDataParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the ShapesGraphRecord"))
            @FormDataParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional markdown abstract for the new ShapesGraphRecord"))
            @FormDataParam("markdown") String markdown,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description =
                            "Optional list of keyword strings for the ShapesGraphRecord"),
                    schema = @Schema(implementation = String.class, description = "Keyword")))
            @FormDataParam("keywords") List<FormDataBodyPart> keywords) {
        checkStringParam(title, "The title is missing.");
        if (fileInputStream == null && json == null) {
            throw ErrorUtils.sendError("The SHACL Shapes Graph data is missing.", Response.Status.BAD_REQUEST);
        } else if (fileInputStream != null && json != null) {
            throw ErrorUtils.sendError("Only provide either a SHACL Shapes Graph file or SHACL Shapes Graph json"
                            + "data.", Response.Status.BAD_REQUEST);
        }

        Set<String> keywordSet = Collections.emptySet();
        if (keywords != null) {
            keywordSet = keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet());
        }
        if (fileInputStream != null) {
            RecordOperationConfig config = new OperationConfig();
            config.set(VersionedRDFRecordCreateSettings.INPUT_STREAM, fileInputStream);
            config.set(VersionedRDFRecordCreateSettings.FILE_NAME, fileDetail.getFileName());
            return createShapesGraphRecord(context, title, description, markdown, keywordSet, config);
        } else {
            checkStringParam(json, "The json is missing.");
            RecordOperationConfig config = new OperationConfig();
            Model jsonModel = RestUtils.jsonldToModel(json, transformer);
            config.set(VersionedRDFRecordCreateSettings.INITIAL_COMMIT_DATA, jsonModel);
            return createShapesGraphRecord(context, title, description, markdown, keywordSet, config);
        }
    }

    /**
     * Creates the ShapesGraphRecord using CatalogManager.
     *
     * @param context          Context of the request.
     * @param title            the title for the ShapesGraphRecord.
     * @param description      the description for the ShapesGraphRecord.
     * @param keywordSet       the comma separated list of keywords associated with the ShapesGraphRecord.
     * @param config           the RecordOperationConfig containing the appropriate model or input file.
     * @return a Response indicating the success of the creation with a JSON object containing the shapesGraphId,
     *     recordId, branchId, and commitId.
     */
    private Response createShapesGraphRecord(ContainerRequestContext context, String title, String description,
                                             String markdown, Set<String> keywordSet, RecordOperationConfig config) {
        User user = getActiveUser(context, engineManager);
        Set<User> users = new LinkedHashSet<>();
        users.add(user);
        Resource catalogId = configProvider.getLocalCatalogIRI();
        config.set(RecordCreateSettings.CATALOG_ID, catalogId.stringValue());
        config.set(RecordCreateSettings.RECORD_TITLE, title);
        config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
        config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
        config.set(RecordCreateSettings.RECORD_KEYWORDS, keywordSet);
        config.set(RecordCreateSettings.RECORD_PUBLISHERS, users);
        try {
            ShapesGraphRecord record = catalogManager.createRecord(user, config, ShapesGraphRecord.class);
            Resource branchId = record.getMasterBranch_resource()
                    .orElseThrow(() -> new IllegalStateException("Record master branch resource not found."));
            Resource commitId;
            try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                RepositoryResult<Statement> commitStmt = conn.getStatements(branchId,
                        vf.createIRI(Branch.head_IRI), null);
                if (!commitStmt.hasNext()) {
                    throw ErrorUtils.sendError("The requested instance could not be found.",
                            Response.Status.BAD_REQUEST);
                }
                commitId = (Resource) commitStmt.next().getObject();
                commitStmt.close();
            }

            ObjectNode objectNode = mapper.createObjectNode();
            objectNode.put("shapesGraphId", record.getShapesGraphIRI().get().toString());
            objectNode.put("recordId", record.getResource().stringValue());
            objectNode.put("branchId", branchId.toString());
            objectNode.put("commitId", commitId.toString());

            return Response.status(Response.Status.CREATED).entity(objectNode.toString()).build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MobiException | IllegalStateException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Streams the SHACL Shapes Graph associated with the requested record ID to an OutputStream.
     *
     * @param recordIdStr String representing the Record Resource ID. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:".
     * @param branchIdStr String representing the Branch Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the
     *                    master Branch.
     * @param commitIdStr String representing the Commit Resource id. NOTE: Assumes id represents an IRI unless
     *                    String begins with "_:". NOTE: Optional param - if nothing is specified, it will get the head
     *                    Commit. The provided commitId must be on the Branch identified by the provided branchId;
     *                    otherwise, nothing will be returned.
     * @param rdfFormat   the desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param fileName    the file name for the SHACL Shapes Graph file
     * @return the SHACL Shapes Graph associated with requested record ID to download.
     */
    @GET
    @Path("{recordId}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @Operation(
            tags = "shapes-graphs",
            summary = "Streams the SHACL Shapes Graph associated with the requested record ID to an OutputStream",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SHACL Shapes Graph associated with requested record ID to download"),
                    @ApiResponse(responseCode = "400", description = "Resource can't be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "Problem downloading ShapesGraphRecord")
            }
    )
    @RolesAllowed("user")
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadShapesGraph(
            @Parameter(description = "String representing the Record Resource ID. "
                    + "NOTE: Assumes id represents an IRI unless String begins with \"_:\"", required = true)
            @PathParam("recordId") String recordIdStr,
            @Parameter(description = "Optional String representing the Branch Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to Master branch if missing")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "Optional String representing the Commit Resource id. NOTE: Assumes id "
                    + "represents an IRI unless String begins with \"_:\". Defaults to head commit if missing. The "
                    + "provided commitId must be on the Branch identified by the provided branchId; otherwise, nothing "
                    + "will be returned")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Desired RDF return format",
                    schema = @Schema(allowableValues = {"jsonld", "rdf/xml", "turtle"}))
            @DefaultValue("jsonld") @QueryParam("rdfFormat") String rdfFormat,
            @Parameter(description = "File name for the SHACL Shapes Graph file")
            @DefaultValue("shapesGraph") @QueryParam("fileName") String fileName
    ) {
        checkStringParam(recordIdStr, "The recordIdStr is missing.");
        try {
            Model model = getShapesGraphModel(recordIdStr, branchIdStr, commitIdStr);
            StreamingOutput output = outputStream ->
                    writeShapesGraphToStream(model, RestUtils.getRDFFormat(rdfFormat), outputStream);
            return Response.ok(output).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat)).header("Content-Type",
                    getRDFFormatMimeType(rdfFormat)).build();
        } catch (IllegalArgumentException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException | IllegalStateException e) {
            throw ErrorUtils.sendError(e, e.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the SHACL Shapes Graph as a Model based on the provided IDs.
     *
     * @param recordIdStr the record ID String.
     * @param branchIdStr the branch ID String.
     * @param commitIdStr the commit ID String.
     * @return The SHACL Shapes Graph as a Model.
     */
    private Model getShapesGraphModel(String recordIdStr, String branchIdStr, String commitIdStr) {
        Model model;
        Resource recordId = vf.createIRI(recordIdStr);

        if (StringUtils.isNotBlank(commitIdStr)) {
            if (StringUtils.isNotBlank(branchIdStr)) {
                model = catalogManager.getCompiledResource(recordId, vf.createIRI(branchIdStr),
                        vf.createIRI(commitIdStr));
            } else {
                model = catalogManager.getCompiledResource(vf.createIRI(commitIdStr));
            }
        } else if (StringUtils.isNotBlank(branchIdStr)) {
            Resource branchId = vf.createIRI(branchIdStr);
            Commit head = catalogManager.getHeadCommit(configProvider.getLocalCatalogIRI(), recordId, branchId);
            model = catalogManager.getCompiledResource(recordId, branchId, head.getResource());
        } else {
            Branch branch = catalogManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId);
            Resource headResource = branch.getHead_resource().orElseThrow(() ->
                    new IllegalStateException("Could not retrieve head commit for branch " + branch.getResource()));
            model = catalogManager.getCompiledResource(recordId, branch.getResource(), headResource);
        }

        return model;
    }

    /**
     * Writes to the SHACL Shapes Graph in the provided RDFFormat to an {@link OutputStream}.
     *
     * @param model The {@link Model} to write to the OutputStream.
     * @param format The {@link RDFFormat} to write to the OutputStream.
     * @param outputStream The {@link OutputStream} to write to.
     */
    private void writeShapesGraphToStream(Model model, RDFFormat format, OutputStream outputStream) {
        try {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream));
            com.mobi.persistence.utils.rio.Rio.write(model, rdfWriter, transformer);
        } catch (RDFHandlerException e) {
            throw new MobiException("Error while writing SHACL Shapes Graph.");
        }
    }
}
