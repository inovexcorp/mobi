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
import static com.mobi.rest.util.RestUtils.createPaginatedResponseJackson;
import static com.mobi.rest.util.RestUtils.createPaginatedResponseWithJsonNode;
import static com.mobi.rest.util.RestUtils.createPaginatedThingResponseJackson;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getRDFFormatFileExtension;
import static com.mobi.rest.util.RestUtils.getRDFFormatMimeType;
import static com.mobi.rest.util.RestUtils.jsonldToDeskolemizedModel;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedJsonld;
import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.thingToSkolemizedObjectNode;
import static com.mobi.rest.util.RestUtils.validatePaginationParams;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.catalog.api.CatalogManager;
import com.mobi.catalog.api.CatalogProvUtils;
import com.mobi.catalog.api.CatalogUtilsService;
import com.mobi.catalog.api.PaginatedSearchParams;
import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.catalog.api.builder.Conflict;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.catalog.api.builder.DistributionConfig;
import com.mobi.catalog.api.builder.RecordConfig;
import com.mobi.catalog.api.ontologies.mcat.Branch;
import com.mobi.catalog.api.ontologies.mcat.Catalog;
import com.mobi.catalog.api.ontologies.mcat.Commit;
import com.mobi.catalog.api.ontologies.mcat.CommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Distribution;
import com.mobi.catalog.api.ontologies.mcat.DistributionFactory;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommitFactory;
import com.mobi.catalog.api.ontologies.mcat.Modify;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.ontologies.mcat.Tag;
import com.mobi.catalog.api.ontologies.mcat.UserBranch;
import com.mobi.catalog.api.ontologies.mcat.Version;
import com.mobi.catalog.api.ontologies.mcat.VersionedRDFRecord;
import com.mobi.catalog.api.versioning.VersioningManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontologies.dcterms._Thing;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.prov.api.ontologies.mobiprov.CreateActivity;
import com.mobi.prov.api.ontologies.mobiprov.DeleteActivity;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.OrmFactoryRegistry;
import com.mobi.rdf.orm.Thing;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.rest.security.annotations.ActionAttributes;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.glassfish.jersey.media.multipart.FormDataBodyPart;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
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
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(service = CatalogRest.class, immediate = true)
@Path("/catalogs")
public class CatalogRest {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogRest.class);
    private static final Set<String> SORT_RESOURCES;
    private static final ObjectMapper mapper = new ObjectMapper();

    private OrmFactoryRegistry factoryRegistry;
    private SesameTransformer transformer;
    private CatalogConfigProvider configProvider;
    private CatalogManager catalogManager;
    private CatalogUtilsService catalogUtilsService;
    private ValueFactory vf;
    private ModelFactory mf;
    private VersioningManager versioningManager;
    private BNodeService bNodeService;
    private CatalogProvUtils provUtils;

    protected EngineManager engineManager;
    protected DistributionFactory distributionFactory;
    protected CommitFactory commitFactory;
    protected InProgressCommitFactory inProgressCommitFactory;

    static {
        Set<String> sortResources = new HashSet<>();
        sortResources.add(DCTERMS.MODIFIED.stringValue());
        sortResources.add(DCTERMS.ISSUED.stringValue());
        sortResources.add(DCTERMS.TITLE.stringValue());
        SORT_RESOURCES = Collections.unmodifiableSet(sortResources);
    }

    @Reference
    void setEngineManager(EngineManager engineManager) {
        this.engineManager = engineManager;
    }

    @Reference
    void setTransformer(SesameTransformer transformer) {
        this.transformer = transformer;
    }

    @Reference
    void setConfigProvider(CatalogConfigProvider configProvider) {
        this.configProvider = configProvider;
    }

    @Reference
    void setCatalogManager(CatalogManager catalogManager) {
        this.catalogManager = catalogManager;
    }

    @Reference
    void setCatalogUtilsService(CatalogUtilsService catalogUtilsService) {
        this.catalogUtilsService = catalogUtilsService;
    }

    @Reference
    void setVf(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setMf(ModelFactory mf) {
        this.mf = mf;
    }

    @Reference
    void setFactoryRegistry(OrmFactoryRegistry factoryRegistry) {
        this.factoryRegistry = factoryRegistry;
    }

    @Reference
    void setDistributionFactory(DistributionFactory distributionFactory) {
        this.distributionFactory = distributionFactory;
    }

    @Reference
    void setCommitFactory(CommitFactory commitFactory) {
        this.commitFactory = commitFactory;
    }

    @Reference
    void setInProgressCommitFactory(InProgressCommitFactory inProgressCommitFactory) {
        this.inProgressCommitFactory = inProgressCommitFactory;
    }

    @Reference
    void setVersioningManager(VersioningManager versioningManager) {
        this.versioningManager = versioningManager;
    }

    @Reference
    void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

    @Reference
    void setProvUtils(CatalogProvUtils provUtils) {
        this.provUtils = provUtils;
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
            @ApiResponse(responseCode = "200", description = "List of Catalogs within the repository"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getCatalogs(
            @Parameter(description = "Type of Catalog you want back (local or distributed)", required = false)
            @QueryParam("type") String catalogType) {
        try {
            Set<Catalog> catalogs = new HashSet<>();
            Catalog localCatalog = catalogManager.getLocalCatalog();
            Catalog distributedCatalog = catalogManager.getDistributedCatalog();
            if (catalogType == null) {
                catalogs.add(localCatalog);
                catalogs.add(distributedCatalog);
            } else if (catalogType.equals("local")) {
                catalogs.add(localCatalog);
            } else if (catalogType.equals("distributed")) {
                catalogs.add(distributedCatalog);
            }

            ArrayNode array = mapper.valueToTree(catalogs.stream()
                    .map(catalog -> thingToSkolemizedObjectNode(catalog, Catalog.TYPE, transformer, bNodeService))
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
            @ApiResponse(responseCode = "200", description = "Specific Catalog from the repository"),
            @ApiResponse(responseCode = "404", description = "Catalog does not exist"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getCatalog(
            @Parameter(description = "String representing the Catalog ID", required = true)
            @PathParam("catalogId") String catalogId) {
        try {
            Resource catalogIri = vf.createIRI(catalogId);
            if (catalogIri.equals(configProvider.getLocalCatalogIRI())) {
                return Response.ok(thingToSkolemizedObjectNode(catalogManager.getLocalCatalog(),
                        Catalog.TYPE, transformer, bNodeService).toString()).build();
            } else if (catalogIri.equals(configProvider.getDistributedCatalogIRI())) {
                return Response.ok(thingToSkolemizedObjectNode(catalogManager.getDistributedCatalog(),
                        Catalog.TYPE, transformer, bNodeService).toString()).build();
            } else {
                throw ErrorUtils.sendError("Catalog " + catalogId + " does not exist", Response.Status.NOT_FOUND);
            }
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a list of all the Records in the Catalog. An optional type parameter filters the returned Records.
     * Parameters can be passed to control paging.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param sort The field with sort order specified.
     * @param recordType The type of Records you want to get back (unversioned, versioned, ontology, mapping, or
     *                   dataset).
     * @param offset The offset for the page.
     * @param limit The number of Records to return in one page.
     * @param asc Whether or not the list should be sorted ascending or descending.
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
            @ApiResponse(responseCode = "200", description = "List of Records that match the search criteria"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getRecords(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "Field with sort order specified (MODIFIED, ISSUED, TITLE)")
            @QueryParam("sort") String sort,
            @Parameter(description = "The type of Records you want to get back (unversioned, versioned, ontology, mapping, or dataset)")
            @QueryParam("type") String recordType,
            @Parameter(description = "Offset for the page")
            @QueryParam("offset") int offset,
            @Parameter(description = "Number of Records to return in one page")
            @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "String used to filter out Records")
            @QueryParam("searchText") String searchText) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);

            PaginatedSearchParams.Builder builder = new PaginatedSearchParams.Builder().offset(offset).ascending(asc);

            if (limit > 0) {
                builder.limit(limit);
            }
            if (sort != null) {
                builder.sortBy(vf.createIRI(sort));
            }
            if (recordType != null) {
                builder.typeFilter(vf.createIRI(recordType));
            }
            if (searchText != null) {
                builder.searchText(searchText);
            }

            PaginatedSearchResults<Record> records = catalogManager.findRecord(vf.createIRI(catalogId),
                    builder.build());

            return createPaginatedResponseJackson(uriInfo, records.getPage(), records.getTotalSize(), limit, offset,
                    Record.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Record in the repository using the passed form data. Determines the type of the new Record
     * based on the `type` field. Requires the `title` and `identifier` fields to be set.
     *
     * @param context Context of the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param typeIRI The required IRI of the type for the new Record. Must be a valid IRI for a Record or one of its
     *                subclasses.
     * @param title The required title for the new Record.
     * @param identifier The required identifier for the new Record. Must be a valid IRI.
     * @param description The optional description for the new Record.
     * @param markdown The optional markdown abstract for the new Record.
     * @param keywords The optional list of keywords strings for the new Record.
     * @return Response with the IRI string of the created Record.
     */
    @POST
    @Path("{catalogId}/records")
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Creates a new Record in the Catalog",
        responses = {
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Record"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionAttributes(
            @AttributeValue(id = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", value = "type",
                    type = ValueType.BODY))
    @ResourceId(value = "catalogId", type = ValueType.PATH)
    public Response createRecord(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "Required IRI of the type for the new Record. " +
                    "Must be a valid IRI for a Record or one of its subclasses", required = true)
            @FormDataParam("type") String typeIRI,
            @Parameter(description = "Required title for the new Record", required = true)
            @FormDataParam("title") String title,
            @Parameter(description = "Required identifier for the new Record. Must be a valid IRI.")
            @FormDataParam("identifier") String identifier,
            @Parameter(description = "Optional description for the new Record")
            @FormDataParam("description") String description,
            @Parameter(description = "Optional markdown abstract for the new Record")
            @FormDataParam("markdown") String markdown,
            @Parameter(description = "Optional list of keywords strings for the new Record")
            @FormDataParam("keywords") List<FormDataBodyPart> keywords) {
        checkStringParam(title, "Record title is required");
        Map<String, OrmFactory<? extends Record>> recordFactories = getRecordFactories();
        if (typeIRI == null || !recordFactories.keySet().contains(typeIRI)) {
            throw ErrorUtils.sendError("Invalid Record type", Response.Status.BAD_REQUEST);
        }
        User activeUser = getActiveUser(context, engineManager);
        CreateActivity createActivity = null;
        try {
            createActivity = provUtils.startCreateActivity(activeUser);
            RecordConfig.Builder builder = new RecordConfig.Builder(title, Collections.singleton(activeUser));
            if (StringUtils.isNotEmpty(identifier)) {
                builder.identifier(identifier);
            }
            if (StringUtils.isNotEmpty(description)) {
                builder.description(description);
            }
            if (StringUtils.isNotEmpty(markdown)) {
                builder.markdown(markdown);
            }
            if (keywords != null && keywords.size() > 0) {
                builder.keywords(keywords.stream().map(FormDataBodyPart::getValue).collect(Collectors.toSet()));
            }

            Record newRecord = catalogManager.createRecord(builder.build(), recordFactories.get(typeIRI));
            catalogManager.addRecord(vf.createIRI(catalogId), newRecord);
            provUtils.endCreateActivity(createActivity, newRecord.getResource());
            return Response.status(201).entity(newRecord.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            provUtils.removeActivity(createActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } catch (Exception ex) {
            provUtils.removeActivity(createActivity);
            throw ex;
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
            @ApiResponse(responseCode = "200", description = "Array with the contents of the Record’s named graph, " +
                    "including the Record object"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "404", description = "Record could not be found"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getRecord(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID")
            @PathParam("recordId") String recordId) {
        try {
            Record record = catalogManager.getRecord(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Record " + recordId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(modelToSkolemizedJsonld(removeContext(record.getModel()), transformer,
                    bNodeService)).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Deletes a Record from the repository.
     *
     * @param context Context of the request
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the Record ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @return A Response indicating whether or not the Record was deleted.
     */
    @DELETE
    @Path("{catalogId}/records/{recordId}")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Deletes the Catalog Record by its ID",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether or not the Record was deleted"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteRecord(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID")
            @PathParam("recordId") String recordId) {
        User activeUser = getActiveUser(context, engineManager);
        IRI recordIri = vf.createIRI(recordId);
        DeleteActivity deleteActivity = null;
        try {
            deleteActivity = provUtils.startDeleteActivity(activeUser, recordIri);
            Record record = catalogManager.removeRecord(vf.createIRI(catalogId), recordIri,
                    factoryRegistry.getFactoryOfType(Record.class).get());
            provUtils.endDeleteActivity(deleteActivity, record);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            provUtils.removeActivity(deleteActivity);
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            provUtils.removeActivity(deleteActivity);
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
     * @return A Response indicating whether or not the Record was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Updates the Catalog Record by its ID using the provided Record JSON-LD",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether or not the Record was updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateRecord(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the Record ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "JSON-LD of the new Record which will replace the existing Record")
            String newRecordJson) {
        try {
            Record newRecord = getNewThing(newRecordJson, vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Record.class).get());
            catalogManager.updateRecord(vf.createIRI(catalogId), newRecord);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
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
     * @param asc Whether or not the list should be sorted ascending or descending.
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
            @ApiResponse(responseCode = "200", description = "Response with a list of all the Distributions of the" +
                    " requested UnversionedRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getUnversionedDistributions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Field with sort order specified (MODIFIED, ISSUED, TITLE)")
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Distributions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = catalogManager.getUnversionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId));
            return createPaginatedThingResponseJackson(uriInfo, distributions, vf.createIRI(sort), offset,
                    limit, asc, null,
                    Distribution.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Distribution for the provided UnversionedRecord using the passed form data. Requires the "title"
     * field to be set.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the UnversionedRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param title The required title for the new Distribution.
     * @param description The optional description for the new Distribution.
     * @param format The optional format string for the new Distribution. Expects a MIME type.
     * @param accessURL The optional access URL for the new Distribution.
     * @param downloadURL The optional download URL for the new Distribution.
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
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Distribution"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response createUnversionedDistribution(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Required title for the new Distribution", required = true)
            @FormDataParam("title") String title,
            @Parameter(description = "Optional description for the new Distribution")
            @FormDataParam("description") String description,
            @Parameter(description = "Optional format string for the new Distribution. Expects a MIME type")
            @FormDataParam("format") String format,
            @Parameter(description = "Optional access URL for the new Distribution")
            @FormDataParam("accessURL") String accessURL,
            @Parameter(description = "Optional download URL for the new Distribution")
            @FormDataParam("downloadURL") String downloadURL) {
        try {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    context);
            catalogManager.addUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId), newDistribution);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "200", description = "Distribution that was identified by the provided IDs"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId) {
        try {
            Distribution distribution = catalogManager.getUnversionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(distributionId)).orElseThrow(() ->
                    ErrorUtils.sendError("Distribution " + distributionId + " could not be found",
                            Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(distribution, Distribution.TYPE, transformer, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "200", description = "Response indicating if the Distribution was deleted"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response deleteUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId) {
        try {
            catalogManager.removeUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(distributionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
        summary = "Updates a specific Distribution for an UnversionedRecord identified by the provided IDs " +
                "using the modifications in the provided JSON-LD",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating if the Distribution was updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response updateUnversionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the UnversionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId,
            @Parameter(description = "JSON-LD of the new Distribution which will replace the existing Distribution")
            String newDistributionJson) {
        try {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            catalogManager.updateUnversionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    newDistribution);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
     * @param asc Whether or not the list should be sorted ascending or descending.
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
            @ApiResponse(responseCode = "200", description = "List of all the Versions associated with a VersionedRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVersions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Field with sort order specified")
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Versions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Version> versions = catalogManager.getVersions(vf.createIRI(catalogId), vf.createIRI(recordId));
            return createPaginatedThingResponseJackson(uriInfo, versions, vf.createIRI(sort), offset, limit,
                    asc, null, Version.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Version for the identified VersionedRecord using the passed form data and stores it in the repository.
     * This Version will become the latest Version for the identified VersionedRecord.
     *
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
        summary = "Creates a Version for the identified VersionedRecord using the passed form data and stores" +
                " it in the repository. This Version will become the latest Version for the identified VersionedRecord",
        responses = {
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Version"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createVersion(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Required IRI of the type for the new Version. Must be a valid IRI for a " +
                    "Version or one of its subclasses", required = true)
            @FormDataParam("type") String typeIRI,
            @Parameter(description = "Required title for the new Version", required = true)
            @FormDataParam("title") String title,
            @Parameter(description = "Optional description for the new Version", required = false)
            @FormDataParam("description") String description) {
        try {
            checkStringParam(title, "Version title is required");
            Map<String, OrmFactory<? extends Version>> versionFactories = getVersionFactories();
            if (typeIRI == null || !versionFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Version type", Response.Status.BAD_REQUEST);
            }

            Version newVersion = catalogManager.createVersion(title, description, versionFactories.get(typeIRI));
            newVersion.setProperty(getActiveUser(context, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            catalogManager.addVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion);
            return Response.status(201).entity(newVersion.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Tag for the identified VersionedRecord on the identified Commit using the passed form data and stores
     * it in the repository. Requires the IRI for the Tag and the IRI of the Commit to attach it to. This Tag will
     * become the latest Version for the identified VersionedRecord
     *
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
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Tag"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST, likely to be parameter is not set"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createTag(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Required title for the new Tag")
            @FormDataParam("title") String title,
            @Parameter(description = "optional description for the new Tag")
            @FormDataParam("description") String description,
            @Parameter(description = "required IRI for the new Tag. Must be unique in the repository")
            @FormDataParam("iri") String iri,
            @Parameter(description = "required String representing the Commit ID")
            @FormDataParam("commit") String commitId) {
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(iri, "Tag iri is required");
            checkStringParam(title, "Tag title is required");
            checkStringParam(commitId, "Tag commit is required");
            IRI recordIri = vf.createIRI(recordId);
            IRI commitIri = vf.createIRI(commitId);
            IRI tagIri = vf.createIRI(iri);
            if (!catalogUtilsService.commitInRecord(recordIri, commitIri, conn)) {
                throw ErrorUtils.sendError("Commit " + commitId + " is not in record " + recordId,
                        Response.Status.BAD_REQUEST);
            }

            OrmFactory<Tag> factory = factoryRegistry.getFactoryOfType(Tag.class).orElseThrow(() ->
                    ErrorUtils.sendError("Tag Factory not found", Response.Status.INTERNAL_SERVER_ERROR));
            OffsetDateTime now = OffsetDateTime.now();
            Tag tag = factory.createNew(tagIri);
            tag.setProperty(vf.createLiteral(title), vf.createIRI(_Thing.title_IRI));
            if (description != null) {
                tag.setProperty(vf.createLiteral(description), vf.createIRI(_Thing.description_IRI));
            }
            tag.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.issued_IRI));
            tag.setProperty(vf.createLiteral(now), vf.createIRI(_Thing.modified_IRI));
            tag.setProperty(getActiveUser(context, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            tag.setCommit(commitFactory.createNew(commitIri));
            catalogManager.addVersion(vf.createIRI(catalogId), recordIri, tag);
            return Response.status(201).entity(tag.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
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
            @ApiResponse(responseCode = "200", description = "Latest Version for the identified VersionedRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getLatestVersion(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId) {
        try {
            Version version = catalogManager.getLatestVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    factoryRegistry.getFactoryOfType(Version.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Latest Version could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(version, Version.TYPE, transformer, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getVersion(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("versionId") String versionId) {
        try {
            Version version = catalogManager.getVersion(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), factoryRegistry.getFactoryOfType(Version.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Version " + versionId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(version, Version.TYPE, transformer, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
        summary = "Removes a specific Version from a VersionedRecord. If that Version happens to be the latest Version," +
                " the latest Version will be updated to be the previous Version",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether the Version was deleted"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response deleteVersion(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("versionId") String versionId) {
        try {
            catalogManager.removeVersion(vf.createIRI(catalogId), vf.createIRI(recordId), vf.createIRI(versionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
        summary = "Updates the Version identified by the provided IDs using the modifications in the provided JSON-LD",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether the Version was updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateVersion(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "JSON-LD of the new Version which will replace the existing Version")
            String newVersionJson) {
        try {
            Version newVersion = getNewThing(newVersionJson, vf.createIRI(versionId),
                    factoryRegistry.getFactoryOfType(Version.class).get());
            catalogManager.updateVersion(vf.createIRI(catalogId), vf.createIRI(recordId), newVersion);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
     * @param asc Whether or not the list should be sorted ascending or descending.
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
            @ApiResponse(responseCode = "200", description = "List of Distributions for the identified Version"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getVersionedDistributions(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "Field with sort order specified")
            @QueryParam("sort") String sort,
            @Parameter(description = "Offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Distributions to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Distribution> distributions = catalogManager.getVersionedDistributions(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId));
            return createPaginatedThingResponseJackson(uriInfo, distributions, vf.createIRI(sort), offset,
                    limit, asc, null,
                    Distribution.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a new Distribution for the identified Version using the passed form data.
     *
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
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Distribution"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response createVersionedDistribution(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Version ID")
            @FormDataParam("title") String title,
            @Parameter(description = "Required title for the new Distribution", required = true)
            @FormDataParam("description") String description,
            @Parameter(description = "Optional format string for the new Distribution. Expects a MIME type")
            @FormDataParam("format") String format,
            @Parameter(description = "Optional access URL for the new Distribution")
            @FormDataParam("accessURL") String accessURL,
            @Parameter(description = "Optional download URL for the new Distribution")
            @FormDataParam("downloadURL") String downloadURL) {
        try {
            Distribution newDistribution = createDistribution(title, description, format, accessURL, downloadURL,
                    context);
            catalogManager.addVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution);
            return Response.status(201).entity(newDistribution.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "200", description = "Distribution for the Version identified by the IDs"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId) {
        try {
            Distribution distribution = catalogManager.getVersionedDistribution(vf.createIRI(catalogId),
                    vf.createIRI(recordId), vf.createIRI(versionId), vf.createIRI(distributionId)).orElseThrow(() ->
                    ErrorUtils.sendError("Distribution " + distributionId + " could not be found",
                            Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(distribution, Distribution.TYPE, transformer, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "200", description = "Response identifying whether the Distribution was deleted"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response deleteVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId) {
        try {
            catalogManager.removeVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), vf.createIRI(distributionId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
        summary = "Updates a specific Distribution of the identified Version with the modifications in the " +
                "provided newDistribution",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response identifying whether the Distribution was updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response updateVersionedDistribution(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "String representing the Distribution ID")
            @PathParam("distributionId") String distributionId,
            @Parameter(description = "JSON-LD of the new Distribution which will replace the existing Distribution")
            String newDistributionJson) {
        try {
            Distribution newDistribution = getNewThing(newDistributionJson, vf.createIRI(distributionId),
                    distributionFactory);
            catalogManager.updateVersionedDistribution(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId), newDistribution);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getVersionCommit(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Version ID")
            @PathParam("versionId") String versionId,
            @Parameter(description = "Optional format string")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try {
            Commit commit = catalogManager.getTaggedCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(versionId));
            return createCommitResponse(commit, catalogManager.getCommitDifference(commit.getResource()), format,
                    transformer, bNodeService);
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
     * @param context Context of the request.
     * @param uriInfo The URI information of the request to be used in creating links to other pages of branches
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param sort The field with sort order specified.
     * @param offset The offset for the page.
     * @param limit The number of Branches to return in one page.
     * @param asc Whether or not the list should be sorted ascending or descending.
     * @param applyUserFilter Whether or not the list should be filtered to Branches associated with the user making
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
            @ApiResponse(responseCode = "200", description = "List of Branches for the identified VersionedRDFRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranches(
            @Context ContainerRequestContext context,
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Field with sort order specified")
            @DefaultValue("http://purl.org/dc/terms/title") @QueryParam("sort") String sort,
            @Parameter(description = "offset for the page")
            @DefaultValue("0") @QueryParam("offset") int offset,
            @Parameter(description = "Number of Branches to return in one page")
            @DefaultValue("100") @QueryParam("limit") int limit,
            @Parameter(description = "Whether or not the list should be sorted ascending or descending")
            @DefaultValue("true") @QueryParam("ascending") boolean asc,
            @Parameter(description = "Whether or not the list should be filtered to Branches associated with the user " +
                    "making the request")
            @DefaultValue("false") @QueryParam("applyUserFilter") boolean applyUserFilter) {
        try {
            validatePaginationParams(sort, SORT_RESOURCES, limit, offset);
            Set<Branch> branches = catalogManager.getBranches(vf.createIRI(catalogId), vf.createIRI(recordId));
            Function<Branch, Boolean> filterFunction = null;
            if (applyUserFilter) {
                User activeUser = getActiveUser(context, engineManager);
                filterFunction = branch -> {
                    Set<String> types = branch.getProperties(vf.createIRI(RDF.TYPE.stringValue())).stream()
                            .map(Value::stringValue)
                            .collect(Collectors.toSet());
                    return !types.contains(UserBranch.TYPE)
                           || branch.getProperty(vf.createIRI(DCTERMS.PUBLISHER.stringValue())).get()
                                    .stringValue().equals(activeUser.getResource().stringValue());
                };
            }
            return createPaginatedThingResponseJackson(uriInfo, branches, vf.createIRI(sort), offset, limit,
                    asc, filterFunction,
                    Branch.TYPE, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Creates a Branch for a VersionedRDFRecord identified by the IDs using the passed form data.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param typeIRI The required IRI of the type for the new Branch. Must be a valid IRI for a Branch or one of its
     *                subclasses.
     * @param title The required title for the new Branch.
     * @param description The optional description for the new Branch.
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
            @ApiResponse(responseCode = "201", description = "Response with the IRI string of the created Branch"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response createBranch(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Required IRI of the type for the new Branch")
            @FormDataParam("type") String typeIRI,
            @Parameter(description = "Required title for the new Branch")
            @FormDataParam("title") String title,
            @Parameter(description = "Optional description for the new Branch")
            @FormDataParam("description") String description,
            @Parameter(description = "String representing the Commit ID")
            @FormDataParam("commitId") String commitId) {
        try ( RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            checkStringParam(title, "Branch title is required");
            checkStringParam(commitId, "Commit ID is required");
            IRI recordIri = vf.createIRI(recordId);
            IRI commitIri = vf.createIRI(commitId);
            if (!catalogUtilsService.commitInRecord(recordIri, commitIri, conn)) {
                throw ErrorUtils.sendError("Commit not in Record", Response.Status.BAD_REQUEST);
            }
            Map<String, OrmFactory<? extends Branch>> branchFactories = getBranchFactories();
            if (typeIRI == null || !branchFactories.keySet().contains(typeIRI)) {
                throw ErrorUtils.sendError("Invalid Branch type", Response.Status.BAD_REQUEST);
            }

            Branch newBranch = catalogManager.createBranch(title, description, branchFactories.get(typeIRI));
            newBranch.setProperty(getActiveUser(context, engineManager).getResource(),
                    vf.createIRI(DCTERMS.PUBLISHER.stringValue()));
            Commit newCommit = catalogManager.getCommit(commitIri).orElseThrow(() -> ErrorUtils.sendError("Commit "
                    + commitId + " could not be found", Response.Status.BAD_REQUEST));
            newBranch.setHead(newCommit);
            catalogManager.addBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch);
            return Response.status(201).entity(newBranch.getResource().stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the master Branch of a VersionedRDFRecord identified by the provided IDs.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @return The master Branch for the identified VersionedRDFRecord.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/master")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Gets the master Branch of a VersionedRDFRecord identified by the provided IDs",
        responses = {
            @ApiResponse(responseCode = "200", description = "Master Branch for the identified VersionedRDFRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getMasterBranch(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRDFRecord ID")
            @PathParam("recordId") String recordId) {
        try {
            Branch masterBranch = catalogManager.getMasterBranch(vf.createIRI(catalogId), vf.createIRI(recordId));
            return Response.ok(thingToSkolemizedObjectNode(masterBranch, Branch.TYPE, transformer, bNodeService)
                    .toString()).build();
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
            @ApiResponse(responseCode = "200", description = "Identified Branch for the specific VersionedRDFRecord"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranch(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId) {
        try {
            Branch branch = catalogManager.getBranch(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), factoryRegistry.getFactoryOfType(Branch.class).get()).orElseThrow(() ->
                    ErrorUtils.sendError("Branch " + branchId + " could not be found", Response.Status.NOT_FOUND));
            return Response.ok(thingToSkolemizedObjectNode(branch, Branch.TYPE, transformer, bNodeService)
                    .toString()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
            @ApiResponse(responseCode = "200", description = "Response identifying whether the Branch was deleted"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(type = ValueType.PATH, id = VersionedRDFRecord.branch_IRI, value = "branchId")
    )
    public Response deleteBranch(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId) {
        try {
            catalogManager.removeBranch(vf.createIRI(catalogId), vf.createIRI(recordId), vf.createIRI(branchId));
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
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
        summary = "Updates the specified Branch using the modifications in the provided newBranch for a " +
                "specific VersionedRDFRecord",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response identifying whether the Branch was " +
                    "successfully updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateBranch(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRDFRecord ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Branch ID")
            String newBranchJson) {
        try {
            Branch newBranch = getNewThing(newBranchJson, vf.createIRI(branchId),
                    factoryRegistry.getFactoryOfType(Branch.class).get());
            catalogManager.updateBranch(vf.createIRI(catalogId), vf.createIRI(recordId), newBranch);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets a list of Commits associated with the Branch identified by the provided IDs which represents the Commit
     * chain for that Branch. If a limit is passed which is greater than zero, will paginate the results. If a
     * targetId is passed, then only commits between the HEAD commits of the branchId and targetId will be returned.
     *
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
        summary = "Gets a list of Commits associated with the Branch identified by the provided IDs which represents " +
                "the Commit chain for that Branch. If a limit is passed which is greater than zero, will paginate the " +
                "results. If a targetId is passed, then only commits between the HEAD commits of the branchId and " +
                "targetId will be returned.",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of Commits for the identified Branch which represents" +
                    " the Commit chain"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getCommitChain(
            @Context UriInfo uriInfo,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the target Branch ID")
            @QueryParam("targetId") String targetId,
            @Parameter(description = "Optional offset for the results")
            @QueryParam("offset") int offset,
            @Parameter(description = "Optional limit for the results")
            @QueryParam("limit") int limit) {
        LinksUtils.validateParams(limit, offset);

        try {
            ArrayNode commitChain = mapper.createArrayNode();

            final List<Commit> commits;
            if (StringUtils.isBlank(targetId)) {
                commits = catalogManager.getCommitChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId));
            } else {
                commits = catalogManager.getCommitChain(vf.createIRI(catalogId), vf.createIRI(recordId),
                        vf.createIRI(branchId), vf.createIRI(targetId));
            }
            Stream<Commit> result = commits.stream();
            if (limit > 0) {
                result = result.skip(offset)
                        .limit(limit);
            }
            result.map(r -> createCommitJson(r, vf, engineManager)).forEach(commitChain::add);
            return createPaginatedResponseWithJsonNode(uriInfo, commitChain, commits.size(), limit, offset);
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
     * @param context Context of the request.
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
        summary = "Creates a new Commit in the repository for a specific Branch using the InProgressCommit " +
                "associated with the user making this request. The HEAD Commit is updated to be this new Commit",
        responses = {
            @ApiResponse(responseCode = "201", description = "Response with the IRI of the new Commit added to the " +
                    "Branch"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    @ActionAttributes(
            @AttributeValue(type = ValueType.PATH, id = VersionedRDFRecord.branch_IRI, value = "branchId")
    )
    public Response createBranchCommit(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "Message for the new Commit")
            @QueryParam("message") String message) {
        try {
            checkStringParam(message, "Commit message is required");
            User activeUser = getActiveUser(context, engineManager);
            Resource newCommitId = versioningManager.commit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), activeUser, message);
            return Response.status(201).entity(newCommitId.stringValue()).build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Gets the HEAD Commit associated with a Branch.
     *
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param branchId String representing the Branch ID. NOTE: Assumes ID represents an IRI unless String begins
     *                 with "_:".
     * @param format Desired RDF return format. NOTE: Optional param - defaults to "jsonld".
     * @return Response with the Commit which is the HEAD of the identified Branch.
     */
    @GET
    @Path("{catalogId}/records/{recordId}/branches/{branchId}/commits/head")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Gets the HEAD Commit for a specific Branch",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response with the Commit which is the HEAD of the " +
                    "identified Branch"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getHead(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch I")
            @PathParam("branchId") String branchId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try {
            Commit headCommit = catalogManager.getHeadCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId));
            return createCommitResponse(headCommit, catalogManager.getCommitDifference(headCommit.getResource()),
                    format, transformer, bNodeService);
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (IllegalStateException | MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        } finally {
            LOG.trace("getHead took {}ms", System.currentTimeMillis() - start);
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
            @ApiResponse(responseCode = "200", description = "Response with the Commit identified by the provided IDs"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "404", description = "Commit could not be found"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getBranchCommit(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID")
            @PathParam("commitId") String commitId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        long start = System.currentTimeMillis();
        try {
            Commit commit = catalogManager.getCommit(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(branchId), vf.createIRI(commitId)).orElseThrow(() ->
                    ErrorUtils.sendError("Commit " + commitId + " could not be found", Response.Status.NOT_FOUND));
            return createCommitResponse(commit, catalogManager.getCommitDifference(commit.getResource()), format,
                    transformer, bNodeService);
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
     * @param branchId String representing the source Branch ID. NOTE: Assumes ID represents an IRI unless String
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
        summary = "Gets the Difference between the HEAD Commit of the Branch identified by the provided IDs in the " +
                "path and the HEAD Commit of the Branch identified by the query parameter. For this comparison " +
                "to be done, the Commits must have an ancestor Commit in common.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response with the Difference between the identified" +
                    " Branches' HEAD Commits as a JSON object"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getDifference(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the source Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the target Branch ID")
            @QueryParam("targetId") String targetBranchId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        try {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Commit sourceHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(branchId));
            Commit targetHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(targetBranchId));
            Difference diff = catalogManager.getDifference(sourceHead.getResource(), targetHead.getResource());
            return Response.ok(getDifferenceJsonString(diff, rdfFormat, transformer, bNodeService),
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
        summary = "Gets the Conflicts between the HEAD Commit of the Branch identified by the provided IDs in the " +
                "path and the HEAD Commit of the Branch identified by the query parameter. For this comparison to " +
                "be done, the Commits must have an ancestor Commit in common",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response with the list of Conflicts between the " +
                    "identified Branches' HEAD Commits"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getConflicts(
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRDFRecord ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the target Branch ID")
            @QueryParam("targetId") String targetBranchId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat) {
        long start = System.currentTimeMillis();
        try {
            checkStringParam(targetBranchId, "Target branch is required");
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Commit sourceHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(branchId));
            Commit targetHead = catalogManager.getHeadCommit(catalogIRI, recordIRI, vf.createIRI(targetBranchId));
            Set<Conflict> conflicts = catalogManager.getConflicts(sourceHead.getResource(), targetHead.getResource());
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
     * @param context Context of the request.
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
        summary = "Performs a merge between the two Branches identified by the provided IDs. The addition and " +
                "deletion statements that are required to resolve any conflicts will be used to create the " +
                "merged Commit. The target Branch will point to the new merge commit, but the source Branch will " +
                "still point to the original head commit. ",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether the Commits were" +
                    " successfully merged"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ActionAttributes(
            @AttributeValue(type = ValueType.QUERY, id = VersionedRDFRecord.branch_IRI, value = "targetId")
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response merge(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the VersionedRDFRecord ID")
            @PathParam("branchId") String sourceBranchId,
            @Parameter(description = "String representing the target Branch ID")
            @QueryParam("targetId") String targetBranchId,
            @Parameter(description = "String of JSON-LD that corresponds to the statements that were added to the entity")
            @FormDataParam("additions") String additionsJson,
            @Parameter(description = "String of JSON-LD that corresponds to the statements that were deleted in the entity")
            @FormDataParam("deletions") String deletionsJson) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            Resource newCommitId = versioningManager.merge(vf.createIRI(catalogId), vf.createIRI(recordId),
                    vf.createIRI(sourceBranchId), vf.createIRI(targetBranchId), activeUser, additions, deletions);
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
     * @param context Context of the request.
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
        summary = "Gets the Commit identified by the provided IDs and returns the compiled Resource " +
                "following the Commit chain which terminates at the identified Commit",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response the compiled Resource for the entity at " +
                    "the specific Commit"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response getCompiledResource(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID")
            @PathParam("commitId") String commitId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat,
            @Parameter(description = "Boolean value identifying whether the InProgressCommit associated with " +
                    "identified Record should be  applied to the result")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply) {
        try {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource commitIRI = vf.createIRI(commitId);
            catalogManager.getCommit(catalogIRI, recordIRI, vf.createIRI(branchId), commitIRI);
            Model resource = catalogManager.getCompiledResource(commitIRI);
            if (apply) {
                User activeUser = getActiveUser(context, engineManager);
                Optional<InProgressCommit> inProgressCommit = catalogManager.getInProgressCommit(catalogIRI, recordIRI,
                        activeUser);
                if (inProgressCommit.isPresent()) {
                    resource = catalogManager.applyInProgressCommit(inProgressCommit.get().getResource(), resource);
                }
            }
            return Response.ok(modelToSkolemizedString(resource, rdfFormat, transformer, bNodeService)).build();
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
     * @param context Context of the request.
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
            @ApiResponse(responseCode = "200", description = "Response with the compiled Resource for the entity" +
                    " at the specific Commit to download"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response downloadCompiledResource(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String representing the Branch ID")
            @PathParam("branchId") String branchId,
            @Parameter(description = "String representing the Commit ID")
            @PathParam("commitId") String commitId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String rdfFormat,
            @Parameter(description = "Boolean value identifying whether the InProgressCommit associated with " +
                    "the identified Record and User making the request should be applied to the result")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean apply,
            @Parameter(description = "Desired name of the generated file. " +
                    "NOTE: Optional param - defaults to \"resource\"")
            @DefaultValue("resource") @QueryParam("fileName") String fileName) {
        try {
            Resource catalogIRI = vf.createIRI(catalogId);
            Resource recordIRI = vf.createIRI(recordId);
            Resource commitIRI = vf.createIRI(commitId);
            catalogManager.getCommit(catalogIRI, recordIRI, vf.createIRI(branchId), commitIRI);
            Model resource;
            Model temp = catalogManager.getCompiledResource(vf.createIRI(commitId));
            if (apply) {
                User activeUser = getActiveUser(context, engineManager);
                Optional<InProgressCommit> inProgressCommit = catalogManager.getInProgressCommit(catalogIRI, recordIRI,
                        activeUser);
                resource = inProgressCommit.map(inProgressCommit1 ->
                        catalogManager.applyInProgressCommit(inProgressCommit1.getResource(), temp)).orElse(temp);
            } else {
                resource = temp;
            }
            StreamingOutput stream = os -> {
                try (Writer writer = new BufferedWriter(new OutputStreamWriter(os))) {
                    writer.write(modelToSkolemizedString(resource, rdfFormat, transformer, bNodeService));
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
     * @param context Context of the request.
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
            @ApiResponse(responseCode = "200", description = "Response indicating whether the InProgressCommit" +
                    " was created successfully"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response createInProgressCommit(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRDFRecord ID")
            @PathParam("recordId") String recordId) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            InProgressCommit inProgressCommit = catalogManager.createInProgressCommit(activeUser);
            catalogManager.addInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), inProgressCommit);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves the current changes the user making the request has made in the InProgressCommit identified by the
     * provided IDs.
     *
     * @param context Context of the request.
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
            @ApiResponse(responseCode = "200", description = "Response with the changes from the specific InProgressCommit"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getInProgressCommit(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "Desired RDF return format. NOTE: Optional param - defaults to \"jsonld\"")
            @DefaultValue("jsonld") @QueryParam("format") String format) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            InProgressCommit inProgressCommit = catalogManager.getInProgressCommit(vf.createIRI(catalogId),
                    vf.createIRI(recordId), activeUser).orElseThrow(() ->
                    ErrorUtils.sendError("InProgressCommit could not be found", Response.Status.NOT_FOUND));
            return Response.ok(getCommitDifferenceObject(inProgressCommit.getResource(), format).toString(),
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
     * @param context Context of the request.
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
        summary = "Deletes the changes made in the User's current InProgressCommit for a specific VersionedRDFRecord",
        responses = {
            @ApiResponse(responseCode = "200", description = "RResponse indicating whether the InProgressCommit " +
                    "was deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response deleteInProgressCommit(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "tring representing the VersionedRDFRecord ID")
            @PathParam("recordId") String recordId) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            catalogManager.removeInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser);
            return Response.ok().build();
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Updates the InProgressCommit for a user identified by the provided IDs using the statements found in the provided
     * form data. If the user does not have an InProgressCommit, one will be created with the provided data.
     *
     * @param context Context of the request.
     * @param catalogId String representing the Catalog ID. NOTE: Assumes ID represents an IRI unless String begins
     *                  with "_:".
     * @param recordId String representing the VersionedRDFRecord ID. NOTE: Assumes ID represents an IRI unless
     *                 String begins with "_:".
     * @param additionsJson String of JSON-LD that corresponds to the statements that were added to the entity.
     * @param deletionsJson String of JSON-LD that corresponds to the statements that were deleted in the entity.
     * @return A Response indicating whether or not the InProgressCommit was updated.
     */
    @PUT
    @Path("{catalogId}/records/{recordId}/in-progress-commit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RolesAllowed("user")
    @Operation(
        tags = "catalogs",
        summary = "Updates the InProgressCommit for a user identified by the provided IDs using the statements " +
                "found in the provided form data. If the user does not have an InProgressCommit, one will be" +
                " created with the provided data.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Response indicating whether or not the " +
                    "InProgressCommit was updated"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    @ActionId(value = Modify.TYPE)
    @ResourceId(type = ValueType.PATH, value = "recordId")
    public Response updateInProgressCommit(
            @Context ContainerRequestContext context,
            @Parameter(description = "String representing the Catalog ID")
            @PathParam("catalogId") String catalogId,
            @Parameter(description = "String representing the VersionedRecord ID")
            @PathParam("recordId") String recordId,
            @Parameter(description = "String of JSON-LD that corresponds to the statements that were added to the entity")
            @FormDataParam("additions") String additionsJson,
            @Parameter(description = "String of JSON-LD that corresponds to the statements that were deleted in the entity")
            @FormDataParam("deletions") String deletionsJson) {
        try {
            User activeUser = getActiveUser(context, engineManager);
            Model additions = StringUtils.isEmpty(additionsJson) ? null : convertJsonld(additionsJson);
            Model deletions = StringUtils.isEmpty(deletionsJson) ? null : convertJsonld(deletionsJson);
            catalogManager.updateInProgressCommit(vf.createIRI(catalogId), vf.createIRI(recordId), activeUser,
                    additions, deletions);
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
            @ApiResponse(responseCode = "200", description = "All the available record types"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getRecordTypes() {
        try {
            return Response.ok(mapper.valueToTree(getRecordFactories().keySet()).toString()).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
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
            @ApiResponse(responseCode = "200", description = "All the available sorting options"),
            @ApiResponse(responseCode = "400", description = "Response indicating BAD_REQUEST"),
            @ApiResponse(responseCode = "500", description = "Response indicating INTERNAL_SERVER_ERROR"),
        }
    )
    public Response getSortOptions() {
        try {
            return Response.ok(mapper.valueToTree(SORT_RESOURCES).toString()).build();
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format of the Commit with the specified
     * value. Key "additions" has value of the Commit's addition statements and key "deletions" has value of the
     * Commit's deletion statements.
     *
     * @param commitId The value of the Commit to retrieve the Difference of.
     * @param format   A string representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Commit's addition statements and a key for the Commit's deletion
     *         statements.
     */
    private ObjectNode getCommitDifferenceObject(Resource commitId, String format) {
        long start = System.currentTimeMillis();
        try {
            return getDifferenceJson(catalogManager.getCommitDifference(commitId), format);
        } finally {
            LOG.trace("getCommitDifferenceObject took {}ms", System.currentTimeMillis() - start);
        }
    }

    /**
     * Creates a JSONObject for the Difference statements in the specified RDF format. Key "additions" has value of the
     * Difference's addition statements and key "deletions" has value of the Difference's deletion statements.
     *
     * @param difference The Difference to convert into a JSONObject.
     * @param format     A String representing the RDF format to return the statements in.
     *
     * @return A JSONObject with a key for the Difference's addition statements and a key for the Difference's deletion
     *         statements.
     */
    private ObjectNode getDifferenceJson(Difference difference, String format) {
        long start = System.currentTimeMillis();
        try {
            ObjectNode differenceJson = mapper.createObjectNode();
            if (format.equals("jsonld")) {
                differenceJson.set("additions", mapper.readTree(modelToSkolemizedString(difference.getAdditions(),
                        format, transformer, bNodeService)));
                differenceJson.set("deletions", mapper.readTree(modelToSkolemizedString(difference.getDeletions(),
                        format, transformer, bNodeService)));
            } else {
                differenceJson.put("additions", modelToSkolemizedString(difference.getAdditions(),
                        format, transformer, bNodeService));
                differenceJson.put("deletions", modelToSkolemizedString(difference.getDeletions(),
                        format, transformer, bNodeService));
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
     * @param title       The required title for the new Distribution.
     * @param description The optional description for the new Distribution.
     * @param format      The optional format string for the new Distribution.
     * @param accessURL   The optional access URL for the new Distribution.
     * @param downloadURL The optional download URL for the Distribution.
     *
     * @return The new Distribution if passed a title.
     */
    private Distribution createDistribution(String title, String description, String format, String accessURL,
                                            String downloadURL, ContainerRequestContext context) {
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
        Distribution distribution = catalogManager.createDistribution(builder.build());
        distribution.setProperty(getActiveUser(context, engineManager).getResource(),
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
     * @param rdfFormat A string representing the RDF format to return the statements in.
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

    /**
     * Converts a JSON-LD string into a Model.
     *
     * @param jsonld String of JSON-LD to convert.
     *
     * @return A Model containing the statements from the JSON-LD string.
     */
    private Model convertJsonld(String jsonld) {
        return jsonldToDeskolemizedModel(jsonld, transformer, bNodeService);
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
        Model result = mf.createModel();
        model.forEach(statement -> result.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
        return result;
    }


}
