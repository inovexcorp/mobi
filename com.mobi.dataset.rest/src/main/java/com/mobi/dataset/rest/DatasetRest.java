package com.mobi.dataset.rest;

/*-
 * #%L
 * com.mobi.dataset.rest
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

import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.modelToJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;

import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordCreateSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.api.builder.OntologyIdentifier;
import com.mobi.dataset.api.record.config.DatasetRecordCreateSettings;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.etl.api.config.rdf.ImportServiceConfig;
import com.mobi.etl.api.rdf.RDFImportService;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.jaxb.Links;
import com.mobi.security.policy.api.ontologies.policy.Delete;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import net.sf.json.JSONArray;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;

import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

@Component(service = DatasetRest.class, immediate = true)
@JaxrsResource
@Path("/datasets")
public class DatasetRest {
    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    @Reference
    protected DatasetManager manager;

    @Reference
    protected EngineManager engineManager;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected CatalogManager catalogManager;

    @Reference
    protected BNodeService bNodeService;

    @Reference
    protected RDFImportService importService;

    /**
     * Retrieves all the DatasetRecords in the local Catalog in a JSON array. Can optionally be paged if passed a
     * limit and offset. Can optionally be sorted by property value if passed a sort IRI.
     *
     * @param uriInfo URI information of the request to be used in creating links to other pages of DatasetRecords
     * @param offset Offset for a page of DatasetRecords
     * @param limit Number of DatasetRecords to return in one page
     * @param sort IRI of the property to sort by
     * @param asc Whether the list should be sorted ascending or descending. Default is ascending
     * @param searchText Optional search text for the query
     * @return Response with a JSON array of DatasetRecords
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Retrieves all DatasetRecords in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response with a JSON array of DatasetRecords"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getDatasetRecords(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "Offset for a page of DatasetRecords", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of DatasetRecords to return in one page", required = true)
            @QueryParam("limit") int limit,
            @Parameter(description = "IRI of the property to sort by", required = true)
            @QueryParam("sort") String sort,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Optional search text for the query")
            @QueryParam("searchText") String searchText) {
        try {
            LinksUtils.validateParams(limit, offset);
            DatasetPaginatedSearchParams params = new DatasetPaginatedSearchParams(vf).setOffset(offset)
                    .setAscending(asc);
            if (limit > 0) {
                params.setLimit(limit);
            }
            if (sort != null && !sort.isEmpty()) {
                params.setSortBy(vf.createIRI(sort));
            }
            if (searchText != null && !searchText.isEmpty()) {
                params.setSearchText(searchText);
            }

            PaginatedSearchResults<Record> results = catalogManager.findRecord(configProvider.getLocalCatalogIRI(),
                    params.build(), getActiveUser(servletRequest, engineManager));

            JSONArray array = JSONArray.fromObject(results.getPage().stream()
                    .map(datasetRecord -> removeContext(datasetRecord.getModel()))
                    .map(model -> modelToSkolemizedJsonld(model, bNodeService))
                    .collect(Collectors.toList()));

            Links links = LinksUtils.buildLinks(uriInfo, array.size(), results.getTotalSize(), limit, offset);
            Response.ResponseBuilder response = Response.ok(array).header("X-Total-Count", results.getTotalSize());
            if (links.getNext() != null) {
                response = response.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                response = response.link(links.getBase() + links.getPrev(), "prev");
            }
            return response.build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new DatasetRecord in the local Catalog using the passed information and Dataset with the passed
     * IRI in the repository with the passed id.
     *
     * @param servletRequest The HttpServletRequest
     * @param title The required title for the new DatasetRecord
     * @param repositoryId The required id of a repository in Mobi
     * @param datasetIRI The optional IRI for the new Dataset
     * @param description The optional description for the new DatasetRecord
     * @param markdown The optional markdown abstract for the new DatasetRecord.
     * @param keywords The optional list of keywords strings for the new DatasetRecord
     * @param ontologies The optional list of OntologyRecord IRI strings for the new DatasetRecord
     * @return A Response with the IRI string of the created DatasetRecord
     */
    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Creates a new DatasetRecord in the local Catalog and Dataset in the specified repository",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created DatasetRecord",
                            content = @Content(schema = @Schema(type = "string"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionAttributes(@AttributeValue(id = com.mobi.ontologies.rdfs.Resource.type_IRI, value = DatasetRecord.TYPE))
    @ResourceId("http://mobi.com/catalog-local")
    public Response createDatasetRecord(
            @Context HttpServletRequest servletRequest,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new DatasetRecord", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required ID of a repository in Mobi", required = true))
            @FormParam("repositoryId") String repositoryId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional IRI for the new Dataset"))
            @FormParam("datasetIRI") String datasetIRI,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new DatasetRecord"))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional markdown abstract for the new DatasetRecord"))
            @FormParam("markdown") String markdown,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description =
                            "Optional list of keywords strings for the new DatasetRecord"),
                    schema = @Schema(implementation = String.class, description = "Keyword")))
            @FormParam("keywords") List<String> keywords,
            @Parameter(array = @ArraySchema(
                    arraySchema = @Schema(description =
                            "Optional list of OntologyRecord IRI strings for the new DatasetRecord"),
                    schema = @Schema(implementation = String.class, description = "OntologyRecord IRI")))
            @FormParam("ontologies") List<String> ontologies) {
        checkStringParam(title, "Title is required");
        checkStringParam(repositoryId, "Repository id is required");
        User user = getActiveUser(servletRequest, engineManager);
        try {
            RecordOperationConfig config = new OperationConfig();
            config.set(RecordCreateSettings.CATALOG_ID, configProvider.getLocalCatalogIRI().stringValue());
            config.set(RecordCreateSettings.RECORD_TITLE, title);
            config.set(RecordCreateSettings.RECORD_DESCRIPTION, description);
            config.set(RecordCreateSettings.RECORD_MARKDOWN, markdown);
            if (keywords != null) {
                config.set(RecordCreateSettings.RECORD_KEYWORDS, new HashSet<>(keywords));
            }
            config.set(RecordCreateSettings.RECORD_PUBLISHERS, Stream.of(user).collect(Collectors.toSet()));
            config.set(DatasetRecordCreateSettings.DATASET, datasetIRI);
            config.set(DatasetRecordCreateSettings.REPOSITORY_ID, repositoryId);
            if (ontologies != null) {
                Set<OntologyIdentifier> ontologyIdentifiers = ontologies.stream().map(ontology ->
                        getOntologyIdentifier(vf.createIRI(ontology))).collect(Collectors.toSet());
                config.set(DatasetRecordCreateSettings.ONTOLOGIES, ontologyIdentifiers);
            }
            DatasetRecord record = catalogManager.createRecord(user, config, DatasetRecord.class);
            return Response.status(201).entity(record.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a specific DatasetRecord from the local Catalog.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @return A Response indicating the success of the request
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Gets a specific DatasetRecord from the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Success",
                            content = @Content(schema = @Schema(type = "object"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "datasetRecordId")
    public Response getDatasetRecord(
            @Parameter(description = "IRI of a DatasetRecord", required = true)
            @PathParam("datasetRecordId") String datasetRecordId) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            DatasetRecord datasetRecord = manager.getDatasetRecord(recordIRI).orElseThrow(() ->
                    ErrorUtils.sendError("DatasetRecord " + datasetRecordId + " could not be found",
                            Response.Status.NOT_FOUND));
            Model copy = mf.createEmptyModel();
            datasetRecord.getModel().forEach(st -> copy.add(st.getSubject(), st.getPredicate(), st.getObject()));
            return Response.ok(modelToJsonld(copy)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a specific DatasetRecord and its Dataset from the local Catalog. By default only removes named graphs
     * that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param servletRequest The HttpServletRequest
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether the delete should be forced
     * @return A Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}")
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Deletes a specific DatasetRecord in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Delete.TYPE)
    @ResourceId(type = ValueType.PATH, value = "datasetRecordId")
    public Response deleteDatasetRecord(
            @Context HttpServletRequest servletRequest,
            @Parameter(schema = @Schema(description = "DatasetRecord IRI", required = true,
                    ref = "#/components/schemas/IRI"))
            @PathParam("datasetRecordId") String datasetRecordId,
            @Parameter(description = "Whether or not the delete should be forced")
            @DefaultValue("false") @QueryParam("force") boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        User activeUser = getActiveUser(servletRequest, engineManager);
        try {
            DatasetRecord record = (force
                    ? manager.deleteDataset(recordIRI, activeUser)
                    : manager.safeDeleteDataset(recordIRI, activeUser));

        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    /**
     * Deletes all named graphs associated with the Dataset of a specific DatasetRecord. By default only removes named
     * graphs that aren't used by another Dataset, but can be forced to delete them.
     *
     * @param datasetRecordId The IRI of a DatasetRecord
     * @param force Whether or not the clear should be forced
     * @return Response indicating the success of the request
     */
    @DELETE
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Clears the data within a specific DatasetRecord in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "datasetRecordId")
    public Response clearDatasetRecord(
            @Parameter(description = "IRI of a DatasetRecord", required = true)
            @PathParam("datasetRecordId") String datasetRecordId,
            @Parameter(description = "Whether or not the clear should be forced")
            @DefaultValue("false") @QueryParam("force") boolean force) {
        Resource recordIRI = vf.createIRI(datasetRecordId);
        try {
            if (force) {
                manager.clearDataset(recordIRI);
            } else {
                manager.safeClearDataset(recordIRI);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return Response.ok().build();
    }

    /**
     * Uploads all RDF data in the provided file into the Dataset of a specific DatasetRecord.
     *
     * @param servletRequest The HttpServletRequest
     * @param datasetRecordId The IRI of a DatasetRecord
     * @return A Response indicating the success of the request
     */
    @POST
    @Path("{datasetRecordId}/data")
    @RolesAllowed("user")
    @Operation(
            tags = "datasets",
            summary = "Uploads the data within an RDF file to a specific DatasetRecord in the local Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Success"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(mediaType = MediaType.MULTIPART_FORM_DATA,
                                    schema = @Schema(implementation = DatasetFileUpload.class)
                            )
                    }
            )
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "datasetRecordId")
    public Response uploadData(@Context HttpServletRequest servletRequest,
                               @Parameter(description = "IRI of a DatasetRecord", required = true)
                               @PathParam("datasetRecordId") String datasetRecordId) {
        Map<String, Object> formData = RestUtils.getFormData(servletRequest, new HashMap<>());
        InputStream inputStream = (InputStream) formData.get("stream");
        String filename = (String) formData.get("filename");

        if (inputStream == null) {
            throw ErrorUtils.sendError("Must provide a file", Response.Status.BAD_REQUEST);
        }
        RDFFormat format = Rio.getParserFormatForFileName(filename).orElseThrow(() ->
                ErrorUtils.sendError("File is not in a valid RDF format", Response.Status.BAD_REQUEST));

        ImportServiceConfig.Builder builder = new ImportServiceConfig.Builder()
                .dataset(vf.createIRI(datasetRecordId))
                .format(format)
                .logOutput(true);
        try {
            importService.importInputStream(builder.build(), inputStream, true);
            return Response.ok().build();
        } catch (IllegalArgumentException | RDFParseException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (Exception ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Class used for OpenAPI documentation for file upload endpoint.
     */
    private static class DatasetFileUpload {
        @Schema(type = "string", format = "binary", description = "Dataset RDF file to upload.")
        public String file;
    }

    private OntologyIdentifier getOntologyIdentifier(Resource recordId) {
        Branch masterBranch = catalogManager.getMasterBranch(configProvider.getLocalCatalogIRI(), recordId);
        Resource commitId = masterBranch.getHead_resource().orElseThrow(() ->
                ErrorUtils.sendError("Branch " + masterBranch.getResource() + " has no head Commit set.",
                        Response.Status.INTERNAL_SERVER_ERROR));
        return new OntologyIdentifier(recordId, masterBranch.getResource(), commitId, vf, mf);
    }

    private Model removeContext(Model model) {
        Model result = mf.createEmptyModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }
}
