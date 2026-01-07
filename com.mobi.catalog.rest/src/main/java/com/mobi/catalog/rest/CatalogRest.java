package com.mobi.catalog.rest;

/*-
 * #%L
 * com.mobi.catalog.rest
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

import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitJson;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.createCommitResponse;
import static com.mobi.catalog.rest.utils.CatalogRestUtils.getDifferenceJsonString;
import static com.mobi.rest.util.RestUtils.checkStringParam;
import static com.mobi.rest.util.RestUtils.createPaginatedResponse;
import static com.mobi.rest.util.RestUtils.createPaginatedThingResponse;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.jsonldToDeskolemizedModel;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.modelToString;
import static com.mobi.rest.util.RestUtils.thingToSkolemizedObjectNode;
import static com.mobi.rest.util.RestUtils.validatePaginationParams;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.BranchManager;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.CompiledResourceManager;
import com.mobi.catalog.api.DifferenceManager;
import com.mobi.catalog.api.DistributionManager;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.VersionManager;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.KeywordCount;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.MasterBranch;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.record.EntityMetadata;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.statistic.Statistic;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.RestUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.sail.SailException;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.Encoded;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(service = CatalogRest.class, immediate = true)
@JaxrsResource
@Path("/catalogs")
public class CatalogRest {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogRest.class);
    private static final Set<String> SORT_RESOURCES;
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String COULD_NOT_BE_FOUND = " could not be found";
    private static final String COMMIT = "Commit ";
    private static final String DELETIONS = "deletions";
    private static final String ADDITIONS = "additions";

    private final ValueFactory vf = new ValidatingValueFactory();
    private final ModelFactory mf = new DynamicModelFactory();

    @Reference
    protected OrmFactoryRegistry factoryRegistry;

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    protected CatalogManager catalogManager;

    @Reference
    protected RecordManager recordManager;

    @Reference
    public DatasetManager datasetManager;

    @Reference
    protected BranchManager branchManager;

    @Reference
    protected CommitManager commitManager;

    @Reference
    protected DistributionManager distributionManager;

    @Reference
    protected VersionManager versionManager;

    @Reference
    protected DifferenceManager differenceManager;

    @Reference
    protected CompiledResourceManager compiledResourceManager;

    @Reference
    protected VersioningManager versioningManager;

    @Reference
    protected BNodeService bNodeService;

    @Reference
    protected CatalogProvUtils provUtils;

    @Reference
    protected EngineManager engineManager;

    @Reference
    protected DistributionFactory distributionFactory;

    @Reference
    protected CommitFactory commitFactory;

    static {
        Set<String> sortResources = new HashSet<>();
        sortResources.add(DCTERMS.MODIFIED.stringValue());
        sortResources.add(DCTERMS.ISSUED.stringValue());
        sortResources.add(DCTERMS.TITLE.stringValue());
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    /**
     * Retrieves a list of the Catalogs (two) available in the system. These Catalogs will be the distributed and
     * local Catalog which contain different Records depending on the situation.
     *
     * @param catalogType The type of Catalog you want back (local or distributed).
     * @return The list of Catalogs within the repository.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the distributed and local Catalogs",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Catalogs within the repository",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObjects"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. Could not retrieve catalogs"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getCatalogs(
            @Parameter(description = "Optional Type of Catalog you want back (local or distributed)")
            @QueryParam("type") String catalogType) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Set<Catalog> catalogs = new HashSet<>();
            Catalog localCatalog = catalogManager.getLocalCatalog(conn);
            Catalog distributedCatalog = catalogManager.getDistributedCatalog(conn);
            if (catalogType == null) {
                catalogs.add(localCatalog);
                catalogs.add(distributedCatalog);
            } else if (catalogType.equals("local")) {
                catalogs.add(localCatalog);
            } else if (catalogType.equals("distributed")) {
                catalogs.add(distributedCatalog);
            }

            ArrayNode array = mapper.valueToTree(catalogs.stream()
                    .map(catalog -> thingToSkolemizedObjectNode(catalog, Catalog.TYPE, bNodeService))
                    .collect(Collectors.toList()));

            return Response.ok(array.toString()).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the specified Catalog based on the provided ID.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return The specific Catalog from the repository.
     */
    @GET
    @Path("{catalogId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the Catalog specified by the provided ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Specific Catalog from the repository",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObject"))),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Catalog does not exist"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getCatalog(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIri = vf.createIRI(catalogId);
            if (catalogIri.equals(configProvider.getLocalCatalogIRI())) {
                return Response.ok(thingToSkolemizedObjectNode(catalogManager.getLocalCatalog(conn),
                        Catalog.TYPE, bNodeService).toString()).build();
            } else if (catalogIri.equals(configProvider.getDistributedCatalogIRI())) {
                return Response.ok(thingToSkolemizedObjectNode(catalogManager.getDistributedCatalog(conn),
                        Catalog.TYPE, bNodeService).toString()).build();
            } else {
                throw ErrorUtils.sendError("Catalog " + catalogId + " does not exist", Response.Status.NOT_FOUND);
            }
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Search for existing definitions of an entity across all records.
     * An optional type parameter filters the returned Entities.  Parameters can be passed to control paging.
     *
     * @param servletRequest The HTTP servlet request context.
     * @param uriInfo The URI context for the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param offset The offset for the page.
     * @param limit The number of Records to return in one page.
     * @param searchText The String used to filter out Records.
     * @return List of Records that match the search criteria.
     */
    @GET
    @Path("{catalogId}/entities")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Search for existing definitions of an entity across all records",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Entities that match the search criteria",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/Entity"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId could not"
                            + " be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getEntities(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "Offset for the page", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Records to return in one page", required = true)
            @QueryParam("limit") int limit,
            @Parameter(description = "String used to filter out Records", required = true)
            @QueryParam("searchText") String searchText,
            @Parameter(schema = @Schema(description = "The name of the field to use for sort order",
                    allowableValues = {"entityName"}))
            @DefaultValue("entityName") @QueryParam("sort") String sort,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "List of record types to filter over")
            @QueryParam("type") List<String> recordTypes,
            @Parameter(description = "List of keywords")
            @QueryParam("keywords") List<String> keywords) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            LinksUtils.validateParams(limit, offset);
            User activeUser = getActiveUser(servletRequest, engineManager);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder();
            builder.offset(offset);
            builder.limit(limit);
            builder.ascending(asc);
            if (sort != null) {
                builder.sortBy(sort);
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }
            if (recordTypes != null && !recordTypes.isEmpty()) {
                builder.typeFilter(recordTypes.stream().map(vf::createIRI).collect(Collectors.toList()));
            } else {
                builder.typeFilter(List.of(vf.createIRI(VersionedRDFRecord.TYPE)));
            }
            if (keywords != null && !keywords.isEmpty()) {
                builder.keywords(keywords);
            }
            PaginatedSearchResults<EntityMetadata> searchResults = recordManager.findEntities(vf.createIRI(catalogId),
                    builder.build(), activeUser, conn);

            ArrayNode entities = mapper.createArrayNode();
            searchResults.page().forEach(entityMetadata->{
                entities.add(entityMetadata.toObjectNode());
            });
            return createPaginatedResponse(uriInfo, entities, searchResults.totalSize(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Retrieves a list of all the Records in the Catalog. An optional type parameter filters the returned Records.
     * Parameters can be passed to control paging.
     *
     * @param servletRequest The HTTP servlet request context.
     * @param uriInfo The URI context for the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param sort IRI field with sort order specified.
     * @param recordTypes A list of IRIs representing the types of Records to return.
     * @param keywords Optional list of keywords to filter the Records.
     * @param creators Optional list of creator IRIs to filter the Records.
     * @param offset The offset for the page.
     * @param limit The number of Records to return in one page.
     * @param asc Whether the list should be sorted ascending or descending.
     * @param searchText The String used to filter out Records.
     * @return List of Records that match the search criteria.
     */
    @GET
    @Path("{catalogId}/records")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the Records in the Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Records that match the search criteria",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObjects"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId could not"
                            + " be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getRecords(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(schema = @Schema(description = "IRI of the field to use for sort order",
                    allowableValues = {"http://purl.org/dc/terms/modified",
                            "http://purl.org/dc/terms/issued",
                            "http://purl.org/dc/terms/title"},
                    required = true))
            @QueryParam("sort") String sort,
            @Parameter(schema = @Schema(description = "IRIs of the Record Types you want to get back",
                    allowableValues = {"http://mobi.com/ontologies/catalog#VersionedRecord",
                            "http://mobi.com/ontologies/catalog#VersionedRDFRecord",
                            "http://mobi.com/ontologies/catalog#Record",
                            "http://mobi.com/ontologies/ontology-editor#OntologyRecord",
                            "http://mobi.com/ontologies/shapes-graph-editor#ShapesGraphRecord",
                            "http://mobi.com/ontologies/delimited#MappingRecord",
                            "http://mobi.com/ontologies/catalog#UnversionedRecord",
                            "http://mobi.com/ontologies/dataset#DatasetRecord"}))
            @QueryParam("type") List<String> recordTypes,
            @Parameter(description = "List of keywords")
            @QueryParam("keywords") List<String> keywords,
            @Parameter(description = "List of creator IRIs")
            @QueryParam("creators") List<String> creators,
            @Parameter(description = "Offset for the page", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Records to return in one page", required = true)
            @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "String used to filter out Records")
            @QueryParam("searchText") String searchText) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder().offset(offset).ascending(asc);

            if (limit > 0) {
                builder.limit(limit);
            }
            if (sort != null) {
                builder.sortBy(vf.createIRI(sort));
            }
            if (recordTypes != null && !recordTypes.isEmpty()) {
                builder.typeFilter(recordTypes.stream().map(vf::createIRI).collect(Collectors.toList()));
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }
            if (keywords != null && !keywords.isEmpty()) {
                builder.keywords(keywords);
            }
            if (creators != null && !creators.isEmpty()) {
                builder.creators(creators.stream().map(vf::createIRI).collect(Collectors.toList()));
            }
            PaginatedSearchResults<Record> records = recordManager.findRecord(vf.createIRI(catalogId),
                    builder.build(), getActiveUser(servletRequest, engineManager), conn);
            return createPaginatedResponse(uriInfo, records.page(), records.totalSize(), limit, offset,
                    Record.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the contents of the Record’s named graph, including the Record object.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return An array with the contents of the Record’s named graph, including the Record object
     */
    @GET
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the Catalog record by its ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Array with the contents of the "
                            + "Record’s named graph, including the Record object"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Record could not be found"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getRecord(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Record record = recordManager.getRecordOpt(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get(), conn).orElseThrow(() ->
                    ErrorUtils.sendError("Record " + recordId + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            return Response.ok(modelToSkolemizedJsonld(removeContext(record.getModel()),
                    bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a Record from the repository.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId The String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response indicating whether the Record was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Deletes the Catalog Record by its ID",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether or not the Record was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteRecord(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID", required = true)
            @PathParam("recordId") String recordId) {
        User activeUser = getActiveUser(servletRequest, engineManager);
        IRI recordIri = vf.createIRI(recordId);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.removeRecord(vf.createIRI(catalogId), recordIri, activeUser, Record.class, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates a Record based on the ID contained within the provided Catalog using the modifications from the provided
     * JSON-LD.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param newRecordJson The JSON-LD of the new Record which will replace the existing Record.
     * @return A Response indicating whether the Record was updated along with the updated model represented
     *         as JSON if successful
     */
    @PUT
    @Path("{catalogId}/records/{recordId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates the Catalog Record by its ID using the provided Record JSON-LD ",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Returns the updated model represented as Json"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateRecord(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "JSON-LD of the new Record which will replace the existing Record",
                    required = true)
                    String newRecordJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Record newRecord = getNewThing(newRecordJson, vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get());
            recordManager.updateRecord(vf.createIRI(catalogId), newRecord, conn);
            return Response.ok(modelToSkolemizedJsonld(removeContext(newRecord.getModel()),
                    bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves statistics for a record from the repository.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return Array containing the statistics in JSON format, or a 204 status code if no statistics are found
     */
    @GET
    @Path("{catalogId}/records/{recordId}/statistics")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the Catalog record statistics by its ID",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Array with the contents of the "
                            + "statistics"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Record could not be found"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getRecordStatistics(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            OrmFactory<Record> factoryOfType = factoryRegistry.getFactoryOfType(Record.class).orElseThrow(() ->
                    ErrorUtils.sendError("Factory Of Type Record could not be found",
                            Response.Status.INTERNAL_SERVER_ERROR));
            Record record = recordManager.getRecordOpt(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryOfType, conn).orElseThrow(() ->
                    ErrorUtils.sendError("Record " + recordId + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            RecordService<?> recordService = recordManager.getRecordService(record.getResource(), conn);
            List<Statistic> statistics;
            if (recordService.getType() == DatasetRecord.class) {
                try (DatasetConnection dataConn = datasetManager.getConnection(record.getResource())) {
                    statistics = recordService.getStatistics(record.getResource(), dataConn);
                }
            } else {
                statistics = recordService.getStatistics(record.getResource(), conn);
            }
            if (statistics.isEmpty()) {
                return Response.status(204).build();
            } else {
                return Response.ok(statisticsToJson(statistics).toString()).build();
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a list of all the Keywords in the Catalog.
     * Parameters can be passed to control paging.
     *
     * @param uriInfo The URI context for the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param searchText The String used to filter out Records.
     * @param offset The offset for the page.
     * @param limit The number of Records to return in one page.
     * @return List of Keywords in the catalog.
     */
    @GET
    @Path("{catalogId}/keywords")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the Keywords in the Catalog",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Keywords in catalog"),
                    @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Response indicating user does not have access"),
                    @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
            }
    )
    public Response getKeywords(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String used to filter out Keywords")
            @QueryParam("searchText") String searchText,
            @Parameter(description = "Offset for the page", required = true)
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Keywords to return in one page", required = true)
            @QueryParam("limit") int limit) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            LinksUtils.validateParams(limit, offset);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder().offset(offset);

            if (limit > 0) {
                builder.limit(limit);
            }
            if (StringUtils.isNotEmpty(StringUtils.stripToEmpty(searchText))) {
                builder.searchText(searchText);
            }

            PaginatedSearchResults<KeywordCount> keywordCounts = recordManager.getKeywords(vf.createIRI(catalogId),
                    builder.build(), conn);

            ArrayNode keywordsArrayNode = serializeKeywordCount(keywordCounts);

            return createPaginatedResponse(uriInfo, keywordsArrayNode, keywordCounts.totalSize(),
                    limit, offset);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    private ArrayNode serializeKeywordCount(PaginatedSearchResults<KeywordCount> keywordCounts) {
        ArrayNode keywordsArrayNode = mapper.createArrayNode();

        for (KeywordCount keywordCount: keywordCounts.page()) {
            ObjectNode keywordObject = mapper.createObjectNode();
            keywordObject.put(Record.keyword_IRI, keywordCount.getKeyword().stringValue());
            keywordObject.put("count", keywordCount.getKeywordCount());
            keywordsArrayNode.add(keywordObject);
        }
        return keywordsArrayNode;
    }

    /**
     * Retrieves a list of all the Distributions associated with a specific UnversionedRecord. Parameters can be passed
     * to control paging.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of distributions
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Distributions to return in one page.
     * @param asc Whether the list should be sorted ascending or descending.
     * @return Response with a list of all the Distributions of the requested UnversionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves the list of Distributions associated with an UnversionedRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with a list of all the Distributions of the"
                                    + " requested UnversionedRecord"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getUnversionedDistributions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(description = "Field with sort order specified",
                    allowableValues = {"http://purl.org/dc/terms/modified", "http://purl.org/dc/terms/issued",
                            "http://purl.org/dc/terms/title"},
                    required = true))
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Distributions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = distributionManager.getUnversionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId), conn);
            return createPaginatedThingResponse(uriInfo, distributions, vf.createIRI(sort), offset,
                    limit, asc, null,
                    Distribution.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Distribution for the provided UnversionedRecord using the passed form data. Requires the "title"
     * field to be set. Returns a Response with the IRI of the new Distribution.
     *
     * @param servletRequest The HttpServletRequest
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param title Required title for the new Distribution.
     * @param description Optional description for the new Distribution.
     * @param format Optional format string for the new Distribution. Expects a MIME type.
     * @param accessURL Optional access URL for the new Distribution.
     * @param downloadURL Optional download URL for the new Distribution.
     * @return Response with the IRI string of the created Distribution.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/distributions")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a new Distribution for the provided UnversionedRecord",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Distribution"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createUnversionedDistribution(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new Distribution", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new Distribution"))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional format string for the new Distribution. Expects a MIME type"))
            @FormParam("format") String format,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional access URL for the new Distribution"))
            @FormParam("accessURL") String accessURL,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional download URL for the new Distribution"))
            @FormParam("downloadURL") String downloadURL) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    servletRequest);
            distributionManager.addUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    newDistribution, conn);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns the Distribution of the UnversionedRecord identified using the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return The Distribution that was identified by the provided IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a specific Distribution of an UnversionedRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Distribution that was identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response getUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution distribution = distributionManager.getUnversionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(distributionId), conn);
            return Response.ok(thingToSkolemizedObjectNode(distribution, Distribution.TYPE, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a specific Distribution identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return A Response indicating if the Distribution was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Deletes a specific Distribution of an UnversionedRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating if the Distribution was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response deleteUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            distributionManager.removeUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(distributionId), conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates a specific Distribution for an UnversionedRecord identified by the provided IDs using the modifications
     * in the provided JSON-LD.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param newDistributionJson The JSON-LD of the new Distribution which will replace the existing Distribution.
     * @return A Response indicating if the Distribution was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/distributions/{distributionId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates a specific Distribution for an UnversionedRecord identified by the provided IDs "
                    + "using the modifications in the provided JSON-LD",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating if the Distribution was updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response updateUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId,
            @Parameter(description = "JSON-LD of the new Distribution which will replace the existing Distribution",
                    required = true) String newDistributionJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            distributionManager.updateUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    newDistribution, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a list of all Versions for a VersionedRecord. Parameters can be passed to control paging.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of versions
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Versions to return in one page.
     * @param asc Whether the list should be sorted ascending or descending.
     * @return A list of all the Versions associated with a VersionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a list of Versions for a VersionedRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "List of all the Versions associated with a VersionedRecord"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVersions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "Field with sort order specified", required = true)
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Versions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Version> versions = versionManager.getVersions(vf.createIRI(catalogId), vf.createIRI(recordId), conn);
            return createPaginatedThingResponse(uriInfo, versions, vf.createIRI(sort), offset, limit,
                    asc, null, Version.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Version for the identified VersionedRecord using the passed form data and stores it in the repository.
     * This Version will become the latest Version for the identified VersionedRecord.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param typeIRI The required IRI of the type for the new Version. Must be a valid IRI for a Version or one of its
     *                subclasses.
     * @param title The required title for the new Version.
     * @param description The optional description for the new Version.
     * @return Response with the IRI string of the created Version.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/versions")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a Version for the identified VersionedRecord using the passed form data and "
                    + "stores it in the repository. This Version will become the latest Version for the "
                    + "identified VersionedRecord",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Version"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createVersion(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the type for the new Version. Must be a valid IRI for a "
                    + "Version or one of its subclasses", required = true))
            @FormParam("type") String typeIRI,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new Version", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new Version"))
            @FormParam("description") String description) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(title, "Version title is required");
            Map<String, OrmFactory<? extends Version>> versionFactories = getVersionFactories();
            if (typeIRI == null || !versionFactories.containsKey(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Version type", Response.Status.BAD_REQUEST);
            }

            Version newVersion = versionManager.createVersion(title, description, versionFactories.get(typeIRI));
            newVersion.setProperty(getActiveUser(servletRequest, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            versionManager.addVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion, conn);
            return Response.status(201).entity(newVersion.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Tag for the identified VersionedRecord on the identified Commit using the passed form data and stores
     * it in the repository. Requires the IRI for the Tag and the IRI of the Commit to attach it to. This Tag will
     * become the latest Version for the identified VersionedRecord
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param title The required title for the new Tag.
     * @param description The optional description for the new Tag.
     * @param iri The required IRI for the new Tag. Must be unique in the repository.
     * @param commitId The required String representing the Commit ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return Response with the IRI string of the created Tag.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/tags")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a Tag for the identified VersionedRecord",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Tag"),
                    @ApiResponse(responseCode = "400",
                            description = "Response indicating BAD_REQUEST, likely to be parameter is not set"),
                    @ApiResponse(responseCode = "403",
                            description = "Permission Denied"),
                    @ApiResponse(responseCode = "500",
                            description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createTag(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new Tag", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new Tag"))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI for the new Tag. Must be unique in the repository", required = true))
            @FormParam("iri") String iri,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required String representing the Commit ID", required = true))
            @FormParam("commit") String commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(iri, "Tag iri is required");
            checkStringParam(title, "Tag title is required");
            checkStringParam(commitId, "Tag commit is required");
            IRI recordIri = vf.createIRI(recordId);
            IRI commitIri = vf.createIRI(commitId);
            IRI tagIri = vf.createIRI(iri);
            if (!commitManager.commitInRecord(recordIri, commitIri, conn)) {
                throw new IllegalArgumentException(COMMIT + commitId + " is not in record " + recordId);
            }
            OrmFactory<Tag> factory = factoryRegistry.getFactoryOfType(Tag.class).orElseThrow(() ->
                    new IllegalStateException("Tag Factory not found"));
            OffsetDateTime now = OffsetDateTime.now();
            Tag tag = factory.createNew(tagIri);
            tag.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
            if (description != null) {
                tag.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
            }
            tag.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
            tag.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
            tag.setProperty(getActiveUser(servletRequest, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            tag.setCommit(commitFactory.createNew(commitIri));
            versionManager.addVersion(vf.createIRI(catalogId), recordIri, tag, conn);
            return Response.status(201).entity(tag.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Gets the latest Version of a VersionedRecord identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return The latest Version for the identified VersionedRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/latest")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the latest Version of a VersionedRecord identified by the provided IDs",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Latest Version for the identified VersionedRecord"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId "
                            + "could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getLatestVersion(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = versionManager.getLatestVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Version.class).get(), conn).orElseThrow(() ->
                    ErrorUtils.sendError("Latest Version could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(version, Version.TYPE, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a specific Version identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return The requested Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a specific Version for the identified VersionedRecord",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Requested Version"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVersion(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("versionId") String versionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version version = versionManager.getVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), factoryRegistry.getFactoryOfType(Version.class)
                            .orElseThrow(() -> new IllegalArgumentException("Version factory not found")), conn);
            return Response.ok(thingToSkolemizedObjectNode(version, Version.TYPE, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Removes a specific Version from a VersionedRecord. If that Version happens to be the latest Version, the latest
     * Version will be updated to be the previous Version.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return A Response indicating whether the Version was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Removes a specific Version from a VersionedRecord. If that Version happens to be "
                    + "the latest Version, the latest Version will be updated to be the previous Version",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether the Version was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteVersion(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("versionId") String versionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            versionManager.removeVersion(vf.createIRI(catalogId), vf.createIRI(recordId), vf.createIRI(versionId),
                    conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the Version identified by the provided IDs using the modifications in the provided JSON-LD.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param newVersionJson The JSON-LD of the new Version which will replace the existing Version.
     * @return A Response indicating whether the Version was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/versions/{versionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates the Version identified by the provided IDs using the "
                    + "modifications in the provided JSON-LD",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether the Version was updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateVersion(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "JSON-LD of the new Version which will replace the existing Version",
                    required = true)
                    String newVersionJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Version newVersion = getNewThing(newVersionJson, vf.createIRI(versionId),
                    factoryRegistry.getFactoryOfType(Version.class).get());
            versionManager.updateVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a list of all the Distributions associated with a specific Version. Parameters can be passed to control
     * paging.
     *
     * @param uriInfo The URI information of the request to be used in creating links to other pages of distributions
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Distributions to return in one page.
     * @param asc Whether the list should be sorted ascending or descending.
     * @return Returns a list of Distributions for the identified Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the list of all Distributions for the identified Version",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "List of Distributions for the identified Version"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getVersionedDistributions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "Field with sort order specified", required = true)
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Distributions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = distributionManager.getVersionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId), conn);
            return createPaginatedThingResponse(uriInfo, distributions, vf.createIRI(sort), offset,
                    limit, asc, null,
                    Distribution.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Distribution for the identified Version using the passed form data.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param title The required title for the new Distribution.
     * @param description The optional description for the new Distribution.
     * @param format The optional format string for the new Distribution. Expects a MIME type.
     * @param accessURL The optional access URL for the new Distribution.
     * @param downloadURL The optional download URL for the new Distribution.
     * @return Response with the IRI string of the created Distribution.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a Distribution for the identified Version",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Distribution"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createVersionedDistribution(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(schema = @Schema(type = "string",
                    description = "String representing the Version ID", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new Distribution. " +
                            "If the title is null, throws a 400 Response", required = true))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional format string for the new Distribution. Expects a MIME type"))
            @FormParam("format") String format,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional access URL for the new Distribution"))
            @FormParam("accessURL") String accessURL,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional download URL for the new Distribution"))
            @FormParam("downloadURL") String downloadURL) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    servletRequest);
            distributionManager.addVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution, conn);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a specific Distribution for the Version identified by the IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return The Distribution for the Version identified by the IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a specific Distribution for the Version identified by the IDs",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Distribution for the Version identified by the IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "versionId, or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response getVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution distribution = distributionManager.getVersionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId), vf.createIRI(distributionId), conn);
            return Response.ok(thingToSkolemizedObjectNode(distribution, Distribution.TYPE, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes the Distribution from the Version identified by the IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @return A Response identifying whether the Distribution was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Deletes a specific Distribution of the identified Version",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response identifying whether the Distribution was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "versionId, or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response deleteVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            distributionManager.removeVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), vf.createIRI(distributionId), conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the specified Distribution with the modifications in the provided newDistribution.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param distributionId String representing the Distribution ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param newDistributionJson The JSON-LD of the new Distribution which will replace the existing Distribution.
     * @return A Response identifying whether the Distribution was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates a specific Distribution of the identified Version with the modifications in the "
                    + "provided newDistribution",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response identifying whether the Distribution was updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "versionId, or distributionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR")
            }
    )
    public Response updateVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID", required = true)
            @PathParam("distributionId") String distributionId,
            @Parameter(description = "JSON-LD of the new Distribution which will replace the existing Distribution", required = true)
                    String newDistributionJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            distributionManager.updateVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the Commit associated with the identified Version using the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param versionId String representing the Version ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @return The Commit associated with the identified Version.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/versions/{versionId}/commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the Commit associated with the identified Version using the provided IDs",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Commit associated with the identified Version"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or versionId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getVersionCommit(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID", required = true)
            @PathParam("versionId") String versionId,
            @Parameter(description = "Optional format string")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Commit commit = commitManager.getTaggedCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), conn);
            return createCommitResponse(commit, differenceManager.getCommitDifference(commit.getResource(), conn),
                    format, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getVersionCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets a list of Branches associated with a VersionedRDFRecord identified by the provided IDs.
     *
     * @param servletRequest The HttpServletRequest.
     * @param uriInfo The URI information of the request to be used in creating links to other pages of branches
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Branches to return in one page.
     * @param asc Whether the list should be sorted ascending or descending.
     * @param applyUserFilter Whether the list should be filtered to Branches associated with the user making
     *                        the request.
     * @return A list of Branches for the identified VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a list of Branches associated with a VersionedRDFRecord identified by the provided IDs",
            responses = {
                    @ApiResponse(responseCode = "200", description = "List of Records that match the search criteria",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/JsonLdObjects"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranches(
            @Context HttpServletRequest servletRequest,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "Field with sort order specified")
            @DefaultValue("http://purl.org/dc/terms/title") @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Branches to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Whether or not the list should be filtered to Branches associated "
                    + "with the user making the request")
            @DefaultValue("false") @QueryParam("applyUserFilter") boolean applyUserFilter) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Branch> branches = branchManager.getBranches(vf.createIRI(catalogId), vf.createIRI(recordId), conn);
            Function<Branch, Boolean> filterFunction = null;
            if (applyUserFilter) {
                User activeUser = getActiveUser(servletRequest, engineManager);
                filterFunction = branch -> {
                    Set<String> types = branch.getProperties(vf.createIRI(RDF.TYPE.stringValue())).stream()
                            .map(Value::stringValue)
                            .collect(Collectors.toSet());
                    return !types.contains(UserBranch.TYPE)
                            || branch.getProperty(vf.createIRI(DCTERMS.PUBLISHER.stringValue())).get()
                            .stringValue().equals(activeUser.getResource().stringValue());
                };
            }
            return createPaginatedThingResponse(uriInfo, branches, vf.createIRI(sort), offset, limit,
                    asc, filterFunction,
                    Branch.TYPE, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Branch for a VersionedRDFRecord identified by the IDs using the passed form data.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param typeIRI Required IRI of the type for the new Branch. Must be a valid IRI for a Branch or one of its
     *                subclasses.
     * @param title Required title for the new Branch.
     * @param description Optional description for the new Branch.
     * @param commitId String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return Response with the IRI string of the created Branch.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a Branch for a VersionedRDFRecord identified by the IDs using the passed form data",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI string of the created Branch"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createBranch(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required IRI of the type for the new Branch", required = true))
            @FormParam("type") String typeIRI,
            @Parameter(schema = @Schema(type = "string",
                    description = "Required title for the new Branch", required = true))
            @FormParam("title") String title,
            @Parameter(schema = @Schema(type = "string",
                    description = "Optional description for the new Branch"))
            @FormParam("description") String description,
            @Parameter(schema = @Schema(type = "string",
                    description = "String representing the Commit ID", required = true))
            @FormParam("commitId") String commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(title, "Branch title is required");
            checkStringParam(commitId, "Commit ID is required");
            IRI recordIri = vf.createIRI(recordId);
            IRI commitIri = vf.createIRI(commitId);
            if (!commitManager.commitInRecord(recordIri, commitIri, conn)) {
                throw ErrorUtils.sendError("Commit not in Record", Response.Status.BAD_REQUEST);
            }
            Map<String, OrmFactory<? extends Branch>> branchFactories = getBranchFactories();
            if (typeIRI == null || !branchFactories.containsKey(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Branch type", Response.Status.BAD_REQUEST);
            }

            Branch newBranch = branchManager.createBranch(title, description, branchFactories.get(typeIRI));
            newBranch.setProperty(getActiveUser(servletRequest, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            Commit newCommit = commitManager.getCommit(commitIri, conn)
                    .orElseThrow(() -> ErrorUtils.sendError(COMMIT + commitId + COULD_NOT_BE_FOUND,
                            Response.Status.BAD_REQUEST));
            newBranch.setHead(newCommit);
            branchManager.addBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch, conn);
            return Response.status(201).entity(newBranch.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a specific Branch of a VersionedRDFRecord identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return The identified Branch for the specific VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Get a specific Branch for a specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Identified Branch for the specific VersionedRDFRecord"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId does not exist"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranch(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            OrmFactory<Branch> branchOrmFactory = factoryRegistry.getFactoryOfType(Branch.class)
                    .orElseThrow(() -> new MobiException("Branch factory not found"));
            Resource branchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            Branch branch = branchManager.getBranch(vf.createIRI(catalogId), vf.createIRI(recordId),
                    branchIRI, branchOrmFactory, conn);
            return Response.ok(thingToSkolemizedObjectNode(branch, Branch.TYPE, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a specific Branch of a VersionedRDFRecord.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response identifying whether the Branch was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Deletes a specific Branch for a specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response identifying whether the Branch was deleted"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId, "
                            + "or branchId does not exist"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(type = ValueType.PATH, id = VersionedRDFRecord.branch_IRI, value = "branchId")
    )
    public Response deleteBranch(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource deleteBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            branchManager.removeBranch(vf.createIRI(catalogId), vf.createIRI(recordId), deleteBranchIRI, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the specified Branch using the modifications in the provided newBranch for a specific VersionedRDFRecord.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param newBranchJson The JSON-LD of the new Branch which will replace the existing Branch.
     * @return A Response identifying whether the Branch was successfully updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/branches/{branchId}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates the specified Branch using the modifications in the provided newBranch for a "
                    + "specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Response identifying whether the Branch was "
                            + "successfully updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId does not exist"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateBranch(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Branch JSON", required = true)
                String newBranchJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource branchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            Branch newBranch = getNewThing(newBranchJson, branchIRI,
                    factoryRegistry.getFactoryOfType(Branch.class).get());
            branchManager.updateBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a list of Commits associated with the Branch identified by the provided IDs which represents the Commit
     * chain for that Branch. If a limit is passed which is greater than zero, will paginate the results. If a
     * targetId is passed, then only commits between the HEAD commits of the branchId and targetId will be returned.
     *
     * @param uriInfo The URI context for the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param targetId String representing the target Branch ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param offset An optional offset for the results.
     * @param limit An optional limit for the results.
     * @return A list of Commits for the identified Branch which represents the Commit chain.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets a list of Commits associated with the Branch identified by the provided IDs "
                    + "which represents the Commit chain for that Branch. If a limit is passed which is "
                    + "greater than zero, will paginate the results. If a targetId is passed, then only "
                    + "commits between the HEAD commits of the branchId and "
                    + "targetId will be returned.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "List of Commits for the identified Branch which represents"
                                    + " the Commit chain",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/CommitDataArr"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getCommitChain(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the target Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @QueryParam("targetId") String targetId,
            @Parameter(description = "Optional offset for the results")
            @QueryParam("offset") int offset,
            @Parameter(description = "Optional limit for the results")
            @QueryParam("limit") int limit) {
        LinksUtils.validateParams(limit, offset);

        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            ArrayNode commitChain = mapper.createArrayNode();

            final List<Commit> commits;
            branchId = checkBranchId(catalogId, recordId, branchId, conn);
            if (StringUtils.isBlank(targetId)) {
                commits = commitManager.getCommitChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId), conn);
            } else {
                targetId = checkBranchId(catalogId, recordId, targetId, conn);
                commits = commitManager.getDifferenceChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId), vf.createIRI(targetId), conn);
            }
            Stream<Commit> result = commits.stream();
            if (limit > 0) {
                result = result.skip(offset)
                        .limit(limit);
            }
            result.map(r -> createCommitJson(r, vf, engineManager)).forEach(commitChain::add);
            return createPaginatedResponse(uriInfo, commitChain, commits.size(), limit, offset);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Commit in the repository for a specific Branch using the InProgressCommit associated with the user
     * making this request. The HEAD Commit is updated to be this new Commit.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param message Message for the new Commit.
     * @return Response with the IRI of the new Commit added to the Branch.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits")
    @Produces(MediaType.TEXT_PLAIN)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a new Commit in the repository for a specific Branch using the InProgressCommit "
                    + "associated with the user making this request. The HEAD Commit is updated to be this new Commit",
            responses = {
                    @ApiResponse(responseCode = "201",
                            description = "Response with the IRI of the new Commit added to the Branch"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(type = ValueType.PATH, id = VersionedRDFRecord.branch_IRI, value = "branchId")
    )
    public Response createBranchCommit(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "Message for the new Commit", required = true)
            @QueryParam("message") String message) {
        try {
            checkStringParam(message, "Commit message is required");
            User activeUser = getActiveUser(servletRequest, engineManager);
            try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                Resource resolvedBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
                Resource newCommitId = versioningManager.commit(vf.createIRI(catalogId), vf.createIRI(recordId),
                        resolvedBranchIRI, activeUser, message, conn);
                return Response.status(201).entity(newCommitId.stringValue()).build();
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | SailException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Gets the Commit identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param format Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return Response with the Commit identified by the provided IDs.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the Commit identified by the provided IDs",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the Commit identified by the provided IDs"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " branchId, or commitId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "404", description = "Commit could not be found"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranchCommit(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID. "
                    + "Keyword 'head' (case-insensitive) may be used to resolve to the HEAD Commit IRI for the branch.",
                    required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource branchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            Resource commitIRI = vf.createIRI(checkCommitId(catalogId, recordId, branchIRI.stringValue(), commitId, conn));
            Commit commit = commitManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI, conn).orElseThrow(() ->
                    ErrorUtils.sendError(COMMIT + commitIRI.stringValue() + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            return createCommitResponse(commit, differenceManager.getCommitDifference(commit.getResource(), conn),
                    format, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getBranchCommit took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Gets the Difference between the HEAD Commit of the Branch identified by the provided IDs in the path and the
     * HEAD Commit of the Branch identified by the query parameter. For this comparison to be done, the Commits must
     * have an ancestor Commit in common.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sourceBranchId String representing the source Branch ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:".
     * @param targetBranchId String representing the target Branch ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param rdfFormat Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return Response with the Difference between the identified Branches' HEAD Commits as a JSON object.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/difference")
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the Difference between the HEAD Commit of the Branch identified by the "
                    + "provided IDs in the path and the HEAD Commit of the Branch identified by the "
                    + "query parameter. For this comparison to be done, the Commits must have an ancestor "
                    + "Commit in common.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the Difference between the identified"
                                    + " Branches' HEAD Commits as a JSON object"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDifference(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the source Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String sourceBranchId,
            @Parameter(description = "String representing the target Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @QueryParam("targetId") String targetBranchId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource sourceBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, sourceBranchId, conn));
            Resource targetBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, targetBranchId, conn));
            Commit sourceHead = commitManager.getHeadCommit(catalogIRI, recordIRI, sourceBranchIRI, conn);
            Commit targetHead = commitManager.getHeadCommit(catalogIRI, recordIRI, targetBranchIRI, conn);
            Difference diff = differenceManager.getDifference(sourceHead.getResource(), targetHead.getResource(), conn);
            return Response.ok(getDifferenceJsonString(diff, rdfFormat, bNodeService),
                    MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the Conflicts between the HEAD Commit of the Branch identified by the provided IDs in the path and the
     * HEAD Commit of the Branch identified by the query parameter. For this comparison to be done, the Commits must
     * have an ancestor Commit in common.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the source Branch ID. NOTE: Assumes ID represents an IRI unless String
     *                 begins with "_:".
     * @param targetBranchId String representing the target Branch ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param rdfFormat Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return Response with the list of Conflicts between the identified Branches' HEAD Commits.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/conflicts")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the Conflicts between the HEAD Commit of the Branch identified by the "
                    + "provided IDs in the path and the HEAD Commit of the Branch identified by the "
                    + "query parameter. For this comparison to be done, the Commits must have an "
                    + "ancestor Commit in common",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the list of Conflicts between the "
                                    + "identified Branches' HEAD Commits"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConflicts(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the source Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the target Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @QueryParam("targetId") String targetBranchId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        long start = System.currentTimeMillis();
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource sourceBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            Resource targetBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, targetBranchId, conn));
            Commit sourceHead = commitManager.getHeadCommit(catalogIRI, recordIRI, sourceBranchIRI, conn);
            Commit targetHead = commitManager.getHeadCommit(catalogIRI, recordIRI, targetBranchIRI, conn);
            Set<Conflict> conflicts = differenceManager.getConflicts(sourceHead.getResource(), targetHead.getResource(), conn);
            ArrayNode array = mapper.createArrayNode();
            conflicts.stream()
                    .map(conflict -> conflictToJson(conflict, rdfFormat))
                    .forEach(array::add);
            return Response.ok(array.toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getConflicts took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Performs a merge between the two Branches identified by the provided IDs. The addition and deletion statements
     * that are required to resolve any conflicts will be used to create the merged Commit. The target Branch will
     * point to the new merge commit, but the source Branch will still point to the original head commit.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sourceBranchId String representing the source Branch ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param targetBranchId String representing the target Branch ID. NOTE: Assumes ID represents an IRI unless
     *                       String begins with "_:".
     * @param additionsJson String of JSON-LD that corresponds to the statements that were added to the entity.
     * @param deletionsJson String of JSON-LD that corresponds to the statements that were deleted in the entity.
     * @return A Response indicating whether the Commits were successfully merged.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/conflicts/resolution")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Performs a merge between the two Branches identified by the provided IDs. The addition and "
                    + "deletion statements that are required to resolve any conflicts will be used to create the "
                    + "merged Commit. The target Branch will point to the new merge commit, but the source Branch  "
                    + "will still point to the original head commit.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Commits were successfully merged"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " or branchId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(type = ValueType.QUERY, id = VersionedRDFRecord.branch_IRI, value = "targetId")
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response merge(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "Catalog IRI", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "VersionedRecord IRI", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "Source Branch IRI. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String sourceBranchId,
            @Parameter(description = "Target Branch IRI. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @QueryParam("targetId") String targetBranchId,
            @Parameter(schema = @Schema(type = "string",
                    description = "String of JSON-LD that corresponds to the statements that"
                    + "were added to the entity"))
            @Encoded @FormParam(ADDITIONS) String additionsJson,
            @Parameter(schema = @Schema(type = "string",
                    description = "String of JSON-LD that corresponds to the statements that "
                    + "were deleted in the entity"))
            @Encoded @FormParam(DELETIONS) String deletionsJson,
            @Parameter(schema = @Schema(type = "string",
                    description = "String of JSON-LD array that corresponds to conflicts associated with the merge"))
            @FormParam("conflicts") String conflictsJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            User activeUser = getActiveUser(servletRequest, engineManager);
            Resource sourceBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, sourceBranchId, conn));
            Resource targetBranchIRI = vf.createIRI(checkBranchId(catalogId, recordId, targetBranchId, conn));
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            Map<Resource, Conflict> conflicts = jsonToConflict(conflictsJson);
            Resource newCommitId = versioningManager.merge(vf.createIRI(catalogId), vf.createIRI(recordId),
                    sourceBranchIRI, targetBranchIRI, activeUser, additions, deletions,
                    conflicts, conn);
            return Response.ok(newCommitId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the Commit identified by the provided IDs and returns the compiled Resource following the Commit chain
     * which terminates at the identified Commit.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param rdfFormat Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param apply Boolean value identifying whether the InProgressCommit associated with identified Record should be
     *              applied to the result.
     * @return A Response the compiled Resource for the entity at the specific Commit.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource")
    @Produces({MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN})
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the Commit identified by the provided IDs and returns the compiled Resource "
                    + "following the Commit chain which terminates at the identified Commit",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response the compiled Resource for the entity at the specific Commit"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " branchId, or commitId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getCompiledResource(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID. "
                    + "Keyword 'head' (case-insensitive) may be used to resolve to the HEAD Commit IRI for the branch.",
                    required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat,
            @Parameter(description = "Boolean value identifying whether the InProgressCommit associated with "
                    + "identified Record should be  applied to the result")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply,
            @Parameter(description = "Boolean value identifying whether to skolemize blank nodes")
            @DefaultValue("true") @QueryParam("skolemize") boolean skolemize) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            final Resource commitIRI;
            if (StringUtils.isNotEmpty(branchId)) {
                Resource branchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
                commitIRI = vf.createIRI(checkCommitId(catalogId, recordId, branchIRI.stringValue(), commitId, conn));
                commitManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI, conn).orElseThrow(() ->
                        ErrorUtils.sendError(COMMIT + commitIRI.stringValue() + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            } else {
                commitIRI = vf.createIRI(commitId);
                commitManager.getCommit(commitIRI, conn).orElseThrow(() ->
                        ErrorUtils.sendError(COMMIT + commitIRI.stringValue() + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            }
            Model resource = compiledResourceManager.getCompiledResource(commitIRI, conn);
            if (apply) {
                User activeUser = getActiveUser(servletRequest, engineManager);
                Optional<InProgressCommit> inProgressCommit = commitManager.getInProgressCommitOpt(catalogIRI, recordIRI,
                        activeUser, conn);
                if (inProgressCommit.isPresent()) {
                    resource = differenceManager.applyInProgressCommit(inProgressCommit.get().getResource(), resource,
                            conn);
                }
            }
            String result;
            if (skolemize) {
                result = modelToSkolemizedString(resource, rdfFormat, bNodeService);
            } else {
                result = modelToString(resource, rdfFormat);
            }
            return Response.ok(result).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the Commit identified by the provided IDs and creates an OutputStream of the compiled Resource following the
     * Commit chain which terminates at the identified Commit.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param commitId String representing the Commit ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param rdfFormat Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @param apply Boolean value identifying whether the InProgressCommit associated with the identified Record and
     *              User making the request should be applied to the result.
     * @param fileName The Desired name of the generated file. NOTE: Optional param - defaults to "resource".
     * @return Response with the compiled Resource for the entity at the specific Commit to download.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the compiled resource for a the entity identified by a specific Commit",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the compiled Resource for the entity"
                                    + " at the specific Commit to download"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId, recordId,"
                            + " branchId, or commitId could not be found"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadCompiledResource(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID. "
                    + "Keyword 'master' (case-insensitive) may be used to resolve to the Master branch IRI.",
                    required = true)
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID. "
                    + "Keyword 'head' (case-insensitive) may be used to resolve to the HEAD Commit IRI for the branch.",
                    required = true)
            @PathParam("commitId") String commitId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat,
            @Parameter(description = "Boolean value identifying whether the InProgressCommit associated with "
                    + "the identified Record and User making the request should be applied to the result")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply,
            @Parameter(description = "Desired name of the generated file. "
                    + "NOTE: Optional param - defaults to \"resource\"")
            @DefaultValue("resource") @QueryParam("fileName") String fileName) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource branchIRI = vf.createIRI(checkBranchId(catalogId, recordId, branchId, conn));
            Resource commitIRI = vf.createIRI(checkCommitId(catalogId, recordId, branchIRI.stringValue(), commitId, conn));
            commitManager.getCommit(catalogIRI, recordIRI, branchIRI, commitIRI, conn).orElseThrow(() ->
                    ErrorUtils.sendError(COMMIT + commitIRI.stringValue() + COULD_NOT_BE_FOUND, Response.Status.NOT_FOUND));
            Model resource;
            Model temp = compiledResourceManager.getCompiledResource(commitIRI, conn);
            if (apply) {
                User activeUser = getActiveUser(servletRequest, engineManager);
                Optional<InProgressCommit> inProgressCommit = commitManager.getInProgressCommitOpt(catalogIRI, recordIRI,
                        activeUser, conn);
                resource = inProgressCommit.map(inProgressCommit1 ->
                        differenceManager.applyInProgressCommit(inProgressCommit1.getResource(), temp, conn))
                        .orElse(temp);
            } else {
                resource = temp;
            }
            StreamingOutput stream = os -> {
                try (Writer writer = new BufferedWriter(new OutputStreamWriter(os))) {
                    writer.write(modelToSkolemizedString(resource, rdfFormat, bNodeService));
                    writer.flush();
                }
            };
            return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                    + "." + getRDFFormatFileExtension(rdfFormat))
                    .header("Content-Type", getRDFFormatMimeType(rdfFormat)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new InProgressCommit in the repository for the User making this request.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return Response indicating whether the InProgressCommit was created successfully.
     */
    @POST
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Creates a InProgressCommit linked to a specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether the InProgressCommit"
                                   +  " was created successfully"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response createInProgressCommit(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRDFRecord ID", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            User activeUser = getActiveUser(servletRequest, engineManager);
            InProgressCommit inProgressCommit = commitManager.createInProgressCommit(activeUser);
            commitManager.addInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), inProgressCommit, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the current changes the user making the request has made in the InProgressCommit identified by the
     * provided IDs.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param format Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return Response with the changes from the specific InProgressCommit.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Gets the changes made in the User's current InProgressCommit for a specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response with the changes from the specific InProgressCommit"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getInProgressCommit(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(description = "Optional RDF return format")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            User activeUser = getActiveUser(servletRequest, engineManager);
            InProgressCommit inProgressCommit = commitManager.getInProgressCommitOpt(vf.createIRI(catalogId),
                    vf.createIRI(recordId), activeUser, conn).orElseThrow(() ->
                    ErrorUtils.sendError("InProgressCommit could not be found", Response.Status.NOT_FOUND));
            return Response.ok(getCommitDifferenceObject(inProgressCommit.getResource(), format, conn).toString(),
                    MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes the InProgressCommit identified by the provided IDs and associated with the User making the request from
     * the repository.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return A Response indicating whether the InProgressCommit was deleted successfully.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Deletes the changes made in the User's current InProgressCommit for a "
                    + "specific VersionedRDFRecord",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Response indicating whether the InProgressCommit "
                                    + "was deleted successfully"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response deleteInProgressCommit(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRDFRecord ID", required = true)
            @PathParam("recordId") String recordId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            User activeUser = getActiveUser(servletRequest, engineManager);
            commitManager.removeInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the InProgressCommit for a user identified by the provided IDs using the statements found in the provided
     * form data. If the user does not have an InProgressCommit, one will be created with the provided data.
     *
     * @param servletRequest The HttpServletRequest.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param additionsJson String of JSON-LD that corresponds to the statements that were added to the entity.
     * @param deletionsJson String of JSON-LD that corresponds to the statements that were deleted in the entity.
     * @return A Response indicating whether the InProgressCommit was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Updates the InProgressCommit for a user identified by the provided IDs using the statements "
                    + "found in the provided form data. If the user does not have an InProgressCommit, one will be"
                    + " created with the provided data.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "InProgressCommit was updated"),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST. The requested catalogId or recordId"
                            + COULD_NOT_BE_FOUND),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateInProgressCommit(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID", required = true)
            @PathParam("recordId") String recordId,
            @Parameter(schema = @Schema(type = "string",
                    description = "String of JSON-LD that corresponds to the statements that"
                    + " were added to the entity", required = true))
            @Encoded @FormParam(ADDITIONS) String additionsJson,
            @Parameter(schema = @Schema(type = "string",
                    description = "String of JSON-LD that corresponds to the statements that"
                    + " were deleted in the entity", required = true))
            @Encoded @FormParam(DELETIONS) String deletionsJson) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            User activeUser = getActiveUser(servletRequest, engineManager);
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            commitManager.updateInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser,
                    additions, deletions, conn);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns all the available record types for both Catalogs.
     *
     * @return All the available record types
     */
    @GET
    @Path("record-types")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves all the available record types",
            responses = {
                    @ApiResponse(responseCode = "200", description = "All the available record types",
                            content = @Content(schema = @Schema(ref = "#/components/schemas/IRIs"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getRecordTypes() {
        try {
            ObjectNode returnObject = mapper.createObjectNode();
            getRecordFactories().forEach((iri, factory) -> {
                Set<String> parentIRIs = factory.getParentTypeIRIs().stream()
                        .map(IRI::stringValue)
                        .collect(Collectors.toSet());
                returnObject.set(iri, mapper.valueToTree(parentIRIs));
            });
            return Response.ok(returnObject).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Returns all the available sorting options for both Catalogs.
     *
     * @return All the available sorting options.
     */
    @GET
    @Path("sort-options")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
            tags = "catalogs",
            summary = "Retrieves all the available sorting options",
            responses = {
                    @ApiResponse(responseCode = "200", description = "All the available sorting options",
                        content = @Content(schema = @Schema(ref = "#/components/schemas/IRIs"))),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    public Response getSortOptions() {
        try {
            return Response.ok(mapper.valueToTree(SORT_RESOURCES).toString()).build();
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format of the Commit with the specified
     * value. Key "additions" has value of the Commit's addition statements and key "deletions" has value of the
     * Commit's deletion statements.
     *
     * @param commitId The value of the Commit to retrieve the Difference of.
     * @param format   String representing the RDF format to return the statements in.
     * @param conn     A RepositoryConnection to use for lookup.
     * @return A JSONObject with a key for the Commit's addition statements and a key for the Commit's deletion
     * statements.
     */
    private ObjectNode getCommitDifferenceObject(Resource commitId, String format, RepositoryConnection conn) {
        long start = System.currentTimeMillis();
        try {
            return getDifferenceJson(differenceManager.getCommitDifference(commitId, conn), format);
        } finally {
            LOG.trace("getCommitDifferenceObject took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format. Key "additions" has value of the
     * Difference's addition statements and key "deletions" has value of the Difference's deletion statements.
     *
     * @param difference The Difference to convert into a JSONObject.
     * @param format     String representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Difference's addition statements and a key for the Difference's deletion
     *         statements.
     */
    private ObjectNode getDifferenceJson(Difference difference, String format) {
        long start = System.currentTimeMillis();
        try {
            ObjectNode differenceJson = mapper.createObjectNode();
            if (format.equals("jsonld")) {
                differenceJson.set(ADDITIONS, mapper.readTree(modelToSkolemizedString(difference.getAdditions(),
                        format, bNodeService)));
                differenceJson.set(DELETIONS, mapper.readTree(modelToSkolemizedString(difference.getDeletions(),
                        format, bNodeService)));
            } else {
                differenceJson.put(ADDITIONS, modelToSkolemizedString(difference.getAdditions(),
                        format, bNodeService));
                differenceJson.put(DELETIONS, modelToSkolemizedString(difference.getDeletions(),
                        format, bNodeService));
            }
            return differenceJson;
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            LOG.trace("getDifferenceJson took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a Distribution object using the provided metadata strings. If the title is null, throws a 400 Response.
     *
     * @param title       Required title for the new Distribution.
     * @param description Optional description for the new Distribution.
     * @param format      Optional format string for the new Distribution.
     * @param accessURL   Optional access URL for the new Distribution.
     * @param downloadURL Optional download URL for the Distribution.
     * @param servletRequest The HttpServletRequest.
     *
     * @return The new Distribution if passed a title.
     */
    private Distribution createDistribution(String title, String description, String format, String accessURL,
                                            String downloadURL, HttpServletRequest servletRequest) {
        checkStringParam(title, "Distribution title is required");
        DistributionConfig.Builder builder = new DistributionConfig.Builder(title);
        if (description != null) {
            builder.description(description);
        }
        if (format != null) {
            builder.format(format);
        }
        if (accessURL != null) {
            builder.accessURL(vf.createIRI(accessURL));
        }
        if (downloadURL != null) {
            builder.downloadURL(vf.createIRI(downloadURL));
        }
        Distribution distribution = distributionManager.createDistribution(builder.build());
        distribution.setProperty(getActiveUser(servletRequest, engineManager).getResource(),
                vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
        return distribution;
    }

    /**
     * Attempts to retrieve a new Thing from the passed JSON-LD string based on the type of the passed OrmFactory. If
     * the passed JSON-LD does not contain the passed ID Resource defined as the correct type, throws a 400 Response.
     *
     * @param newThingJson The JSON-LD of the new Thing.
     * @param thingId      The ID Resource to confirm.
     * @param factory      The OrmFactory to use when creating the new Thing.
     * @param <T>          A class that extends Thing.
     *
     * @return The new Thing if the JSON-LD contains the correct ID Resource; throws a 400 otherwise.
     */
    private <T extends Thing> T getNewThing(String newThingJson, Resource thingId, OrmFactory<T> factory) {
        Model newThingModel = convertJsonld(newThingJson);
        return factory.getExisting(thingId, newThingModel).orElseThrow(() ->
                ErrorUtils.sendError(factory.getTypeIRI().getLocalName() + " IDs must match",
                        Response.Status.BAD_REQUEST));
    }

    /**
     * Creates a JSONObject representing the provided Conflict in the provided RDF format. Key "original" has value of
     * the serialized original Model of a conflict, key "left" has a value of an object with the additions and
     *
     * @param conflict  The Conflict to turn into a JSONObject
     * @param rdfFormat String representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Conflict's original Model, a key for the Conflict's left Difference, and
     *         a key for the Conflict's right Difference.
     */
    private ObjectNode conflictToJson(Conflict conflict, String rdfFormat) {
        ObjectNode object = mapper.createObjectNode();
        object.put("iri", conflict.getIRI().stringValue());
        object.set("left", getDifferenceJson(conflict.getLeftDifference(), rdfFormat));
        object.set("right", getDifferenceJson(conflict.getRightDifference(), rdfFormat));
        return object;
    }

    private Map<Resource, Conflict> jsonToConflict(String conflictsJson) {
        try {
            Map<Resource, Conflict> conflictMap = new HashMap<>();
            if (StringUtils.isBlank(conflictsJson)) {
                return conflictMap;
            }
            JsonNode arrNode = mapper.readTree(conflictsJson);
            if (arrNode != null && arrNode.isArray()) {
                for (final JsonNode objNode : arrNode) {
                    IRI iri = vf.createIRI(objNode.get("iri").asText());
                    Difference left = getDifference(objNode.get("left"));
                    Difference right = getDifference(objNode.get("right"));
                    Conflict conflict = new Conflict.Builder(iri)
                            .leftDifference(left)
                            .rightDifference(right)
                            .build();
                    conflictMap.put(iri, conflict);
                }
            }
            return conflictMap;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Difference getDifference(JsonNode differenceNode) {
        JsonNode additions = differenceNode.get(ADDITIONS);
        JsonNode deletions = differenceNode.get(DELETIONS);
        return new Difference.Builder()
                .additions(convertJsonld(additions.toString()))
                .deletions(convertJsonld(deletions.toString()))
                .build();
    }

    /**
     * Converts a JSON-LD string into a Model.
     *
     * @param jsonld String of JSON-LD to convert.
     *
     * @return A Model containing the statements from the JSON-LD string.
     */
    private Model convertJsonld(String jsonld) {
        return jsonldToDeskolemizedModel(jsonld, bNodeService);
    }

    private Map<String, OrmFactory<? extends Record>> getRecordFactories() {
        return getThingFactories(Record.class);
    }

    private Map<String, OrmFactory<? extends Version>> getVersionFactories() {
        return getThingFactories(Version.class);
    }

    private Map<String, OrmFactory<? extends Branch>> getBranchFactories() {
        return getThingFactories(Branch.class);
    }

    private <T extends Thing> Map<String, OrmFactory<? extends T>> getThingFactories(Class<T> clazz) {
        Map<String, OrmFactory<? extends T>> factoryMap = new HashMap<>();
        factoryRegistry.getFactoriesOfType(clazz).forEach(factory ->
                factoryMap.put(factory.getTypeIRI().stringValue(), factory));
        return factoryMap;
    }

    private Model removeContext(Model model) {
        Model result = mf.createEmptyModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }

    protected ArrayNode statisticsToJson(List<Statistic> statistics) {
        ArrayNode jsonArray = mapper.createArrayNode();
        for (Statistic statistic : statistics) {
            ObjectNode statisticsJson = mapper.createObjectNode();
            statisticsJson.put("name", statistic.definition().name());
            statisticsJson.put("description", statistic.definition().description());
            statisticsJson.put("value", statistic.value());
            jsonArray.add(statisticsJson);
        }
        return jsonArray;
    }

    /**
     * Checks for keyword MASTER in the provided branchId (case-insensitive) if present returns IRI to MASTER branch,
     * otherwise, returns branchId string
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param conn A repository connection
     * @return A string of the appropriate branchId
     */
    private String checkBranchId(String catalogId, String recordId, String branchId, RepositoryConnection conn) {
        if ("master".equals(branchId.toLowerCase().trim())) {
            MasterBranch branch = branchManager.getMasterBranch(vf.createIRI(catalogId), vf.createIRI(recordId), conn);
            return branch.getResource().stringValue();
        } else {
            return branchId;
        }
    }

    /**
     * Checks for keyword HEAD in the provided commitID (case-insensitive) if present returns IRI to HEAD Commit for
     * branch, otherwise, returns commitId string
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param conn A repository connection
     * @return A string of the appropriate commit
     */
    private String checkCommitId(String catalogId, String recordId, String branchId, String commitId,
                                 RepositoryConnection conn) {
        if ("head".equals(commitId.toLowerCase().trim())) {
            Commit headCommit = commitManager.getHeadCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), conn);
            return headCommit.getResource().stringValue();
        } else {
            return commitId;
        }
    }
}
