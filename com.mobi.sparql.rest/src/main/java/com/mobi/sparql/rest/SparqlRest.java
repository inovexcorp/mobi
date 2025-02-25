package com.mobi.sparql.rest;

/*-
 * #%L
 * com.mobi.sparql.rest
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

import static com.mobi.rest.util.RestUtils.CSV_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.JSON_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.LDJSON_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.RDFXML_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.TSV_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.TURTLE_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.XLSX_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.XLS_MIME_TYPE;
import static com.mobi.rest.util.RestUtils.convertFileExtensionToMimeType;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getErrorObjBadRequest;

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceAttributes;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ConnectionObjects;
import com.mobi.rest.util.RestQueryUtils;
import com.mobi.rest.util.VersionedRDFRecordParams;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.security.policy.api.ontologies.policy.Read;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.osgi.service.metatype.annotations.Designate;

import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = SparqlRest.class, immediate = true, configurationPolicy = ConfigurationPolicy.OPTIONAL)
@JaxrsResource
@Designate(ocd = SparqlRestConfig.class)
@Path("/sparql")
public class SparqlRest {
    private final ValueFactory vf = new ValidatingValueFactory();
    private int limitResults;

    @Reference
    public RepositoryManager repositoryManager;
    
    @Reference
    public DatasetManager datasetManager;
    
    @Reference
    public OntologyManager ontologyManager;

    @Reference
    public EngineManager engineManager;

    @Reference
    public CatalogConfigProvider configProvider;

    @Reference
    public CommitManager commitManager;

    @Activate
    @Modified
    protected void start(final SparqlRestConfig sparqlRestConfig) {
        this.setLimitResults(sparqlRestConfig.limit());
    }

    /**
     * Set Limit Results.
     * @param limitResults the size to limit sparql query results to on the limited endpoints
     */
    public void setLimitResults(int limitResults) {
        this.limitResults = limitResults;
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @GET
    @Path("/{storeType}/{id}")
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @Operation(
            tags = "sparql",
            operationId = "rdfQuery",
            summary = "Retrieves the results of the provided SPARQL query",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SPARQL 1.1 results in mime type specified by accept header",
                            content = {
                                    @Content(mediaType = "*/*"),
                                    @Content(mediaType = TURTLE_MIME_TYPE),
                                    @Content(mediaType = LDJSON_MIME_TYPE),
                                    @Content(mediaType = RDFXML_MIME_TYPE),
                                    @Content(mediaType = JSON_MIME_TYPE),
                                    @Content(mediaType = XLSX_MIME_TYPE),
                                    @Content(mediaType = XLS_MIME_TYPE),
                                    @Content(mediaType = CSV_MIME_TYPE),
                                    @Content(mediaType = TSV_MIME_TYPE),
                                    @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM)
                            }
                    ),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    })
            }
    )
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response queryRdf(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "String representing a SPARQL query", required = true)
            @QueryParam("query") String queryString,
            @Parameter(description = "The string value representing what type of store is being queried (dataset, "
                    + "repository, etc.)", required = true)
            @PathParam("storeType") String storeType,
            @Parameter(description = "The IRI representing what resource to query (Repository IRI, DatasetRecord IRI, "
                    + "etc.", required = true)
            @PathParam("id") String resourceId,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether imports should be included in the query")
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute.
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @GET
    @Path("/{storeType}/{id}")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response downloadRdfQuery(
            @Context HttpServletRequest servletRequest,
            @QueryParam("query") String queryString,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @QueryParam("branchId") String branchIdStr,
            @QueryParam("commitId") String commitIdStr,
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @QueryParam("fileType") String fileType,
            @HeaderParam("accept") String acceptString,
            @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Path("/{storeType}/{id}")
    @Consumes("application/sparql-query")
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postQueryRdf(
            @Context HttpServletRequest servletRequest,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @QueryParam("branchId") String branchIdStr,
            @QueryParam("commitId") String commitIdStr,
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @HeaderParam("accept") String acceptString,
            String queryString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("SPARQL query must be provided in request body."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @POST
    @Path("/{storeType}/{id}")
    @Consumes("application/sparql-query")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postDownloadRdfQuery(
            @Context HttpServletRequest servletRequest,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @QueryParam("branchId") String branchIdStr,
            @QueryParam("commitId") String commitIdStr,
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @QueryParam("fileType") String fileType,
            @HeaderParam("accept") String acceptString,
            @DefaultValue("results") @QueryParam("fileName") String fileName,
            String queryString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Body must contain a query."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Path("/{storeType}/{id}")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @Operation(
            tags = "sparql",
            operationId = "postRdfQuery",
            summary = "Retrieves the results of the provided SPARQL query",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SPARQL 1.1 Response in the format of fileType query parameter",
                            content = {
                                    @Content(mediaType = "*/*"),
                                    @Content(mediaType = TURTLE_MIME_TYPE),
                                    @Content(mediaType = LDJSON_MIME_TYPE),
                                    @Content(mediaType = RDFXML_MIME_TYPE),
                                    @Content(mediaType = JSON_MIME_TYPE),
                                    @Content(mediaType = XLSX_MIME_TYPE),
                                    @Content(mediaType = XLS_MIME_TYPE),
                                    @Content(mediaType = CSV_MIME_TYPE),
                                    @Content(mediaType = TSV_MIME_TYPE),
                                    @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM),
                                    @Content(mediaType = "text/*"),
                                    @Content(mediaType = "application/*")
                            }
                    ),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    })
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(
                                    mediaType = "application/sparql-query",
                                    schema = @Schema(
                                            name = "query", type = "string",
                                            description = "A sparql query",
                                            example = "SELECT * WHERE { ?s ?p ?o . }"
                                    )
                            ),
                            @Content(
                                    mediaType = MediaType.APPLICATION_FORM_URLENCODED,
                                    schema = @Schema(implementation = EncodedParams.class)
                            )
                    }
            ),
            parameters = {
                    @Parameter(name = "storeType", description = "The string value representing what type of store is "
                            + "being queried (dataset, repository, etc.)", required = true, in = ParameterIn.PATH),
                    @Parameter(name = "id", description = "The IRI representing what resource to query (Repository IRI,"
                            + " DatasetRecord IRI, etc.", required = true, in = ParameterIn.PATH)
            }
    )
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postUrlEncodedQueryRdf(
            @Context HttpServletRequest servletRequest,
            @FormParam("query") String queryString,
            @Parameter(description = "The string value representing what type of store is being queried (dataset, "
                    + "repository, etc.)", required = true)
            @PathParam("storeType") String storeType,
            @Parameter(description = "The IRI representing what resource to query (Repository IRI, DatasetRecord IRI, "
                    + "etc.", required = true)
            @PathParam("id") String resourceId,
            @Parameter(description = "String representing the Branch Resource ID")
            @FormParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @FormParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether imports should be included in the query")
            @DefaultValue("false") @FormParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("false") @FormParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Form parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @POST
    @Path("/{storeType}/{id}")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postUrlEncodedDownloadRdfQuery(
            @Context HttpServletRequest servletRequest,
            @FormParam("query") String queryString,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @FormParam("branchId") String branchIdStr,
            @FormParam("commitId") String commitIdStr,
            @DefaultValue("false") @FormParam("includeImports") boolean includeImports,
            @DefaultValue("false") @FormParam("applyInProgressCommit") boolean applyInProgressCommit,
            @QueryParam("fileType") String fileType,
            @HeaderParam("accept") String acceptString,
            @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Form parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig for the given {@code storeType} with the IRI {@code id}.
     * Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @GET
    @Path("/{storeType}/{id}/limited-results")
    @Produces({JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @Operation(
            tags = "sparql",
            summary = "Retrieves the limited results of the provided SPARQL query",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SPARQL 1.1 results in mime type specified by accept header",
                            content = {
                                    @Content(mediaType = "*/*"),
                                    @Content(mediaType = TURTLE_MIME_TYPE),
                                    @Content(mediaType = LDJSON_MIME_TYPE),
                                    @Content(mediaType = RDFXML_MIME_TYPE),
                                    @Content(mediaType = JSON_MIME_TYPE)
                            }),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    })
            }
    )
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response getLimitedResults(
            @Context HttpServletRequest servletRequest,
            @Parameter(description = "The SPARQL query to execute", required = true)
            @QueryParam("query") String queryString,
            @Parameter(description = "The string value representing what type of store is being queried (dataset, "
                    + "repository, etc.)", required = true)
            @PathParam("storeType") String storeType,
            @Parameter(description = "The IRI representing what resource to query (Repository IRI, DatasetRecord IRI, "
                    + "etc.", required = true)
            @PathParam("id") String resourceId,
            @Parameter(description = "String representing the Branch Resource ID")
            @QueryParam("branchId") String branchIdStr,
            @Parameter(description = "String representing the Commit Resource ID")
            @QueryParam("commitId") String commitIdStr,
            @Parameter(description = "Boolean indicating whether imports should be included in the query")
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @Parameter(description = "Whether or not to apply the in progress commit for the user making the request")
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType,
                acceptString, this.limitResults, rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig for the given {@code storeType} with the IRI {@code id}.
     * Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes("application/sparql-query")
    @Path("/{storeType}/{id}/limited-results")
    @Produces({JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postLimitedResults(
            @Context HttpServletRequest servletRequest,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @QueryParam("branchId") String branchIdStr,
            @QueryParam("commitId") String commitIdStr,
            @DefaultValue("false") @QueryParam("includeImports") boolean includeImports,
            @DefaultValue("false") @QueryParam("applyInProgressCommit") boolean applyInProgressCommit,
            @HeaderParam("accept") String acceptString,
            String queryString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Body must contain a query."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType,
                acceptString, this.limitResults, rdfRecordParams, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig for the given {@code storeType} with the IRI {@code id}.
     * Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute
     * @param storeType the type of store to query
     * @param resourceId the IRI of the resource to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Path("/{storeType}/{id}/limited-results")
    @Produces({JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @Operation(
            tags = "sparql",
            operationId = "postRdfQueryLimited",
            summary = "Retrieves the results of the provided SPARQL query",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "The SPARQL 1.1 Response in the format of fileType query parameter",
                            content = {
                                    @Content(mediaType = "*/*"),
                                    @Content(mediaType = TURTLE_MIME_TYPE),
                                    @Content(mediaType = LDJSON_MIME_TYPE),
                                    @Content(mediaType = RDFXML_MIME_TYPE),
                                    @Content(mediaType = JSON_MIME_TYPE),
                                    @Content(mediaType = XLSX_MIME_TYPE),
                                    @Content(mediaType = XLS_MIME_TYPE),
                                    @Content(mediaType = CSV_MIME_TYPE),
                                    @Content(mediaType = TSV_MIME_TYPE),
                                    @Content(mediaType = MediaType.APPLICATION_OCTET_STREAM),
                                    @Content(mediaType = "text/*"),
                                    @Content(mediaType = "application/*")
                            }
                    ),
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR", content = {
                            @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema = @Schema(implementation = ErrorObjectSchema.class)
                            )
                    }),
            },
            requestBody = @RequestBody(
                    content = {
                            @Content(
                                    mediaType = "application/sparql-query",
                                    schema = @Schema(
                                            name = "query", type = "string",
                                            description = "A sparql query",
                                            example = "SELECT * WHERE { ?s ?p ?o . }"
                                    )
                            ),
                            @Content(
                                    mediaType = MediaType.APPLICATION_FORM_URLENCODED,
                                    schema = @Schema(implementation = EncodedParams.class)
                            )
                    }
            ),
            parameters = {
                    @Parameter(name = "storeType", description = "The string value representing what type of store is "
                            + "being queried (dataset, repository, etc.)", required = true, in = ParameterIn.PATH),
                    @Parameter(name = "id", description = "The IRI representing what resource to query (Repository IRI,"
                            + " DatasetRecord IRI, etc.", required = true, in = ParameterIn.PATH)
            }
    )
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(type = ValueType.PATH, id = "https://mobi.solutions/store-type",
            value = "storeType"))
    @ResourceId(type = ValueType.PATH, value = "id")
    public Response postUrlEncodedLimitedResults(
            @Context HttpServletRequest servletRequest,
            @FormParam("query") String queryString,
            @PathParam("storeType") String storeType,
            @PathParam("id") String resourceId,
            @FormParam("branchId") String branchIdStr,
            @FormParam("commitId") String commitIdStr,
            @DefaultValue("false") @FormParam("includeImports") boolean includeImports,
            @DefaultValue("false") @FormParam("applyInProgressCommit") boolean applyInProgressCommit,
            @Parameter(hidden = true) @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw getErrorObjBadRequest(new IllegalArgumentException("Form parameter 'query' must be set."));
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager,
                this.ontologyManager);
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager), configProvider,
                commitManager);
        return RestQueryUtils.handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType, acceptString,
                this.limitResults, rdfRecordParams, connectionObjects);
    }

    /**
     * Class used for OpenAPI documentation for encoded url endpoint.
     */
    private static class EncodedParams {
        @Schema(type = "string", description = "The SPARQL query to execute", required = true)
        public String query;

        @Schema(type = "string", description = "String representing the Branch Resource ID")
        public String branchId;

        @Schema(type = "string", description = "String representing the Commit Resource ID")
        public String commitId;

        @Schema(type = "boolean", description = "Boolean indicating whether ontology imports should be included in "
                + "the query")
        public boolean includeImports;

        @Schema(type = "boolean", description = "Whether or not to apply the in progress commit for the user making"
                + " the request")
        public boolean applyInProgressCommit;
    }
}
