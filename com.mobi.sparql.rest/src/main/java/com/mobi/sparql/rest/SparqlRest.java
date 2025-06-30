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
import static com.mobi.rest.util.RestUtils.convertFileExtensionToMimeType;
import static com.mobi.rest.util.RestUtils.getActiveUser;
import static com.mobi.rest.util.RestUtils.getErrorObjBadRequest;
import static com.mobi.rest.util.RestUtils.getErrorObjInternalServerError;

import com.mobi.catalog.api.CommitManager;
import com.mobi.catalog.api.ontologies.mcat.InProgressCommit;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.jaas.api.engines.EngineManager;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.persistence.utils.Models;
import com.mobi.persistence.utils.rio.Rio;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.ResourceAttributes;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.QueryResultIOLimited;
import com.mobi.rest.util.RestUtils;
import com.mobi.rest.util.VersionedRDFRecordParams;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.security.policy.api.ontologies.policy.Read;
import com.mobi.shapes.api.ShapesGraph;
import com.mobi.shapes.api.ShapesGraphManager;
import com.mobi.versionedrdf.api.QueryableVersionedRDF;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.explanation.Explanation;
import org.eclipse.rdf4j.query.impl.MutableTupleQueryResult;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedOperation;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.query.resultio.QueryResultIO;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Optional;
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
import javax.ws.rs.core.StreamingOutput;

@Component(service = SparqlRest.class, immediate = true, configurationPolicy = ConfigurationPolicy.OPTIONAL)
@JaxrsResource
@Designate(ocd = SparqlRestConfig.class)
@Path("/sparql")
public class SparqlRest {
    private static final Logger logger = LoggerFactory.getLogger(SparqlRest.class);
    private static final String X_LIMIT_EXCEEDED = "X-LIMIT-EXCEEDED";
    private static final String QUERY_INVALID_MESSAGE = "Query is invalid. Please change the query and re-execute.";
    private static final String REPO_NOT_AVAILABLE_MESSAGE = "Repository is not available";
    private static final IllegalArgumentException QUERY_INVALID_EXCEPTION =
            new IllegalArgumentException(QUERY_INVALID_MESSAGE);
    private static final IllegalArgumentException REPO_NOT_AVAILABLE_EXCEPTION =
            new IllegalArgumentException(REPO_NOT_AVAILABLE_MESSAGE);
    private static final String REPOSITORY_STORE_TYPE = "repository";
    private static final String DATASET_STORE_TYPE = "dataset-record";
    private static final String ONTOLOGY_STORE_TYPE = "ontology-record";
    private static final String SHAPES_GRAPH_STORE_TYPE = "shapes-graph-record";
    
    private final ValueFactory vf = new ValidatingValueFactory();
    private int limitResults;

    @Reference
    public RepositoryManager repositoryManager;
    
    @Reference
    public DatasetManager datasetManager;
    
    @Reference
    public OntologyManager ontologyManager;

    @Reference
    public ShapesGraphManager shapesGraphManager;

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
     *
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
    @Produces({XLSX_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE, JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE,
            RDFXML_MIME_TYPE})
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 2007, Turtle, JSON-LD, and RDF/XML file extensions.
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Supports CSV, TSV, Excel 2007, Turtle, JSON-LD, and RDF/XML file extensions.
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
    @Produces({XLSX_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE, JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE,
            RDFXML_MIME_TYPE})
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 2007, Turtle, JSON-LD, and RDF/XML file extensions.
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Supports CSV, TSV, Excel 2007, Turtle, JSON-LD, and RDF/XML file extensions.
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
    @Produces({XLSX_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE, JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE,
            RDFXML_MIME_TYPE})
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType, acceptString, null,
                rdfRecordParams);
    }

    /**
     * Retrieves the results of the provided SPARQL query for the given {@code storeType} with the IRI {@code id}.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 2007, Turtle, JSON-LD, and RDF/XML file extensions.
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQuery(queryString, vf.createIRI(resourceId), storeType,
                convertFileExtensionToMimeType(fileType), fileName, rdfRecordParams);
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType,
                acceptString, this.limitResults, rdfRecordParams);
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType,
                acceptString, this.limitResults, rdfRecordParams);
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
        
        VersionedRDFRecordParams rdfRecordParams = new VersionedRDFRecordParams(branchIdStr, commitIdStr,
                includeImports, applyInProgressCommit, getActiveUser(servletRequest, engineManager));
        return handleQueryEagerly(queryString, vf.createIRI(resourceId), storeType, acceptString,
                this.limitResults, rdfRecordParams);
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

    // Query logic

    /**
     * Handle SPARQL Query based on query type.  Can handle SELECT AND CONSTRUCT queries.
     * SELECT queries output: JSON, XLSX, CSV, TSV
     * CONSTRUCT queries output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The IRI of the resource to query
     * @param storeType       The type of store to query
     * @param acceptString    used to specify certain media types which are acceptable for the response
     * @param fileName        The optional file name for the download file.
     * @param rdfRecordParams Ontology to query from.
     * @return SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private Response handleQuery(String queryString, Resource resourceId, String storeType, String acceptString,
                                 String fileName, VersionedRDFRecordParams rdfRecordParams) {
        try {
            ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);
            if (!(parsedOperation instanceof ParsedQuery)) {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
            if (parsedOperation instanceof ParsedTupleQuery) {
                return handleSelectQuery(queryString, resourceId, storeType, acceptString,
                        fileName, rdfRecordParams).build();
            } else if (parsedOperation instanceof ParsedGraphQuery) {
                return handleConstructQuery(queryString, resourceId, storeType, acceptString,
                        fileName, rdfRecordParams).build();
            } else {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MalformedQueryException ex) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(QUERY_INVALID_MESSAGE
                    + Models.ERROR_OBJECT_DELIMITER + ex.getMessage()));
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Handle SPARQL Query eagerly based on query type. Can handle SELECT AND CONSTRUCT queries.
     * SELECT queries output: JSON, XLSX, CSV, TSV
     * CONSTRUCT queries output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The IRI of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response
     * @param rdfRecordParams Ontology to query from.
     * @return SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private Response handleQueryEagerly(String queryString, Resource resourceId, String storeType,
                                        String mimeType, int limit, VersionedRDFRecordParams rdfRecordParams) {
        try {
            ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);
            if (!(parsedOperation instanceof ParsedQuery)) {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
            if (parsedOperation instanceof ParsedTupleQuery) {
                return handleSelectQueryEagerly(queryString, resourceId, storeType, mimeType, limit, rdfRecordParams);
            } else if (parsedOperation instanceof ParsedGraphQuery) {
                return handleConstructQueryEagerly(queryString, resourceId, storeType, mimeType, limit,
                        rdfRecordParams);
            } else {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MalformedQueryException ex) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(QUERY_INVALID_MESSAGE
                    + Models.ERROR_OBJECT_DELIMITER + ex.getMessage()));
        } catch (MobiException | IOException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Handle Select Query. Defaults to json if mimeType is invalid
     * Output: JSON, XLSX, CSV, TSV
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response.
     * @param fileName        The optional file name for the download file.
     * @param rdfRecordParams Ontology to query from.
     * @return SPARQL 1.1 ResponseBuilder in the format of ACCEPT Header mime type
     */
    private Response.ResponseBuilder handleSelectQuery(String queryString, Resource resourceId,
                                                       String storeType, String mimeType, String fileName,
                                                       VersionedRDFRecordParams rdfRecordParams) {
        StreamingOutput stream;
        String fileExtension;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = "";
        }

        switch (mimeType) {
            case JSON_MIME_TYPE -> {
                fileExtension = "json";
                stream = getSelectStream(queryString, resourceId, storeType, rdfRecordParams,
                        TupleQueryResultFormat.JSON);
            }
            case XLSX_MIME_TYPE -> {
                fileExtension = "xlsx";
                stream = getStreamingOutputExcel(queryString, resourceId, storeType, rdfRecordParams, fileExtension);
            }
            case CSV_MIME_TYPE -> {
                fileExtension = "csv";
                stream = getSelectStream(queryString, resourceId, storeType, rdfRecordParams,
                        TupleQueryResultFormat.CSV);
            }
            case TSV_MIME_TYPE -> {
                fileExtension = "tsv";
                stream = getSelectStream(queryString, resourceId, storeType, rdfRecordParams,
                        TupleQueryResultFormat.TSV);
            }
            default -> {
                fileExtension = "json";
                String oldMimeType = mimeType;
                mimeType = JSON_MIME_TYPE;
                logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", oldMimeType, mimeType));
                stream = getSelectStream(queryString, resourceId, storeType, rdfRecordParams,
                        TupleQueryResultFormat.JSON);
            }
        }

        Response.ResponseBuilder builder = Response.ok(stream)
                .type(mimeType);

        if (StringUtils.isNotBlank(fileName)) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName + "." + fileExtension);
        }

        return builder;
    }

    private StreamingOutput getStreamingOutputExcel(String queryString, Resource resourceId, String storeType,
                                                    VersionedRDFRecordParams rdfRecordParams, String fileExtension) {
        TupleQueryResult tupleQueryResult;
        if (ONTOLOGY_STORE_TYPE.equals(storeType) || SHAPES_GRAPH_STORE_TYPE.equals(storeType)) {
            QueryableVersionedRDF queryable = getQueryable(resourceId, rdfRecordParams, storeType);
            tupleQueryResult = queryable.getTupleQueryResults(queryString, rdfRecordParams.includeImports());
        } else {
            tupleQueryResult = getTupleQueryResults(queryString, resourceId, storeType);
        }
        return createExcelResults(tupleQueryResult);
    }

    /**
     * Handle Select Query Eagerly.
     * Output: JSON
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response
     * @param rdfRecordParams Ontology to query from.
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private Response handleSelectQueryEagerly(String queryString, Resource resourceId, String storeType,
                                              String mimeType, int limit,VersionedRDFRecordParams rdfRecordParams)
            throws IOException {
        if (!JSON_MIME_TYPE.equals(mimeType)) {
            logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", mimeType, JSON_MIME_TYPE));
        }
        return getSelectQueryResponseEagerly(queryString, resourceId, storeType,
                TupleQueryResultFormat.JSON, JSON_MIME_TYPE, limit, rdfRecordParams);
    }

    /**
     * Get SelectQueryResponse Eagerly.
     *
     * @param queryString            The SPARQL query to execute.
     * @param resourceId             The Resource of the resource to query
     * @param storeType              The type of store to query
     * @param tupleQueryResultFormat TupleQueryResultFormat used to convert TupleQueryResults for response
     * @param mimeType               used to specify certain media types which are acceptable for the response
     * @param rdfRecordParams        Ontology to query from.
     * @return Response in TupleQueryResultFormat of SPARQL Query
     */
    private Response getSelectQueryResponseEagerly(String queryString, Resource resourceId, String storeType,
                                                   TupleQueryResultFormat tupleQueryResultFormat,
                                                   String mimeType, Integer limit,
                                                   VersionedRDFRecordParams rdfRecordParams) throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean limitExceeded;

        if (ONTOLOGY_STORE_TYPE.equals(storeType) || SHAPES_GRAPH_STORE_TYPE.equals(storeType)) {
            limitExceeded = false;
            QueryableVersionedRDF queryable = getQueryable(resourceId, rdfRecordParams, storeType);
            TupleQueryResult queryResults = queryable.getTupleQueryResults(queryString,
                    rdfRecordParams.includeImports());
            if (limit != null) {
                limitExceeded = QueryResultIOLimited.writeTuple(queryResults, tupleQueryResultFormat,
                        byteArrayOutputStream, limit);
            } else {
                QueryResultIO.writeTuple(queryResults, tupleQueryResultFormat, byteArrayOutputStream);
            }
            queryResults.close();
            byteArrayOutputStream.flush();
            byteArrayOutputStream.close();
        } else if (DATASET_STORE_TYPE.equals(storeType)) {
            try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw getErrorObjBadRequest(ex);
            }
        } else if (REPOSITORY_STORE_TYPE.equals(storeType)) {
            OsgiRepository repository = repositoryManager.getRepository((IRI) resourceId).orElseThrow(() ->
                    getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw getErrorObjBadRequest(ex);
            }
        } else {
            throw getErrorObjInternalServerError(new IllegalArgumentException("Unsupported storeType: " + storeType));
        }

        Response.ResponseBuilder builder = Response.ok(byteArrayOutputStream.toString())
                .header("Content-Type", mimeType);

        if (limitExceeded) {
            builder.header(X_LIMIT_EXCEEDED, limit);
        }

        return builder.build();
    }

    /**
     * Handle Construct Query Eagerly.
     * Output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response.
     * @param rdfRecordParams Ontology to query from.
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private Response handleConstructQueryEagerly(String queryString, Resource resourceId, String storeType,
                                                 String mimeType, int limit, VersionedRDFRecordParams rdfRecordParams)
            throws IOException {
        RDFFormat format;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = ""; // default value is turtle
        }

        switch (mimeType) {
            case TURTLE_MIME_TYPE -> format = RDFFormat.TURTLE;
            case LDJSON_MIME_TYPE -> format = RDFFormat.JSONLD;
            case RDFXML_MIME_TYPE -> format = RDFFormat.RDFXML;
            default -> {
                String oldMimeType = mimeType;
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", oldMimeType, mimeType));
            }
        }
        return getGraphQueryResponseEagerly(queryString, resourceId, storeType, format, mimeType, limit,
                rdfRecordParams);
    }

    /**
     * Get GraphQueryResponse Eagerly.
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param format          RDFFormat used to convert GraphQueryResults for response
     * @param mimeType        used to specify certain media types which are acceptable for the response
     * @param rdfRecordParams Ontology to query from.
     * @return Response in RDFFormat of SPARQL Query
     */
    private Response getGraphQueryResponseEagerly(String queryString, Resource resourceId, String storeType,
                                                  RDFFormat format, String mimeType, int limit,
                                                  VersionedRDFRecordParams rdfRecordParams) throws IOException {
        boolean limitExceeded;
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        if (ONTOLOGY_STORE_TYPE.equals(storeType) || SHAPES_GRAPH_STORE_TYPE.equals(storeType)) {
            QueryableVersionedRDF queryable = getQueryable(resourceId, rdfRecordParams, storeType);
            limitExceeded = queryable.getGraphQueryResultsStream(queryString, rdfRecordParams.includeImports(), format,
                    false, limit,
                    byteArrayOutputStream);
        } else if (DATASET_STORE_TYPE.equals(storeType)) {
            try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
        } else if (REPOSITORY_STORE_TYPE.equals(storeType)) {
            OsgiRepository repository = repositoryManager.getRepository((IRI) resourceId).orElseThrow(() ->
                    getErrorObjInternalServerError(new IllegalArgumentException(REPO_NOT_AVAILABLE_MESSAGE)));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
        } else {
            throw getErrorObjInternalServerError(new IllegalArgumentException("Unsupported storeType: " + storeType));
        }

        Response.ResponseBuilder builder = Response.ok(byteArrayOutputStream.toString())
                .header("Content-Type", mimeType);

        if (limitExceeded) {
            builder.header(X_LIMIT_EXCEEDED, limit);
        }

        return builder.build();
    }

    /**
     * Handle Construct Query.
     * Output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response.
     * @param fileName        The optional file name for the download file.
     * @param rdfRecordParams Ontology to query from.
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private Response.ResponseBuilder handleConstructQuery(String queryString, Resource resourceId,
                                                          String storeType, String mimeType, String fileName,
                                                          VersionedRDFRecordParams rdfRecordParams) {
        RDFFormat format;
        String fileExtension;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = ""; // default value is turtle
        }

        switch (mimeType) {
            case TURTLE_MIME_TYPE -> {
                fileExtension = "ttl";
                format = RDFFormat.TURTLE;
            }
            case LDJSON_MIME_TYPE -> {
                fileExtension = "jsonld";
                format = RDFFormat.JSONLD;
            }
            case RDFXML_MIME_TYPE -> {
                fileExtension = "rdf";
                format = RDFFormat.RDFXML;
            }
            default -> {
                fileExtension = "ttl";
                String oldMimeType = mimeType;
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                logger.debug(String.format("Invalid mimeType [%s] : defaulted to [%s]", oldMimeType, mimeType));
            }
        }

        StreamingOutput stream = getConstructStream(queryString, resourceId, storeType, format, rdfRecordParams
        );

        Response.ResponseBuilder builder = Response.ok(stream)
                .type(mimeType);
        if (StringUtils.isNotBlank(fileName)) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName + "." + fileExtension);
        }
        return builder;
    }

    private StreamingOutput getConstructStream(String queryString, Resource resourceId, String storeType,
                                               RDFFormat format, VersionedRDFRecordParams rdfRecordParams) {
        if (ONTOLOGY_STORE_TYPE.equals(storeType) || SHAPES_GRAPH_STORE_TYPE.equals(storeType)) {
            QueryableVersionedRDF queryable = getQueryable(resourceId, rdfRecordParams, storeType);
            return os -> {
                queryable.getGraphQueryResultsStream(queryString, rdfRecordParams.includeImports(), format, false, os);
            };
        } else if (DATASET_STORE_TYPE.equals(storeType)) {
            return os -> {
                try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else if (REPOSITORY_STORE_TYPE.equals(storeType)) {
            return os -> {
                OsgiRepository repository = repositoryManager.getRepository((IRI) resourceId).orElseThrow(() ->
                        getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else {
            throw getErrorObjInternalServerError(new IllegalArgumentException("Unsupported storeType: " + storeType));
        }
    }

    private boolean executeGraphQuery(String queryString, RDFFormat format, OutputStream os,
                                      RepositoryConnection conn, Integer limit)
            throws IOException {
        boolean limitExceeded = false;
        GraphQuery graphQuery = conn.prepareGraphQuery(queryString);
        GraphQueryResult graphQueryResult = graphQuery.evaluate();
        RDFWriter writer = org.eclipse.rdf4j.rio.Rio.createWriter(format, os);
        if (limit != null) {
            limitExceeded = Rio.write(graphQueryResult, writer, limit);
        } else {
            Rio.write(graphQueryResult, writer);
        }

        graphQueryResult.close();
        os.flush();
        os.close();
        return limitExceeded;
    }

    private StreamingOutput getSelectStream(String queryString, Resource resourceId,
                                            String storeType, VersionedRDFRecordParams rdfRecordParams,
                                            TupleQueryResultFormat format) {
        if (ONTOLOGY_STORE_TYPE.equals(storeType) || SHAPES_GRAPH_STORE_TYPE.equals(storeType)) {
            QueryableVersionedRDF queryable = getQueryable(resourceId, rdfRecordParams, storeType);
            return os -> {
                TupleQueryResult queryResults = queryable.getTupleQueryResults(queryString,
                        rdfRecordParams.includeImports());
                QueryResultIO.writeTuple(queryResults, format, os);
                queryResults.close();
                os.flush();
                os.close();
            };
        } else if (DATASET_STORE_TYPE.equals(storeType)) {
            return os -> {
                try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else if (REPOSITORY_STORE_TYPE.equals(storeType)) {
            return os -> {
                OsgiRepository repository = repositoryManager.getRepository((IRI) resourceId)
                        .orElseThrow(() -> getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else {
            throw getErrorObjInternalServerError(new IllegalArgumentException("Unsupported storeType: " + storeType));
        }
    }

    private boolean executeTupleQuery(String queryString, TupleQueryResultFormat format, OutputStream os,
                                      RepositoryConnection conn, Integer limit) throws IOException {
        boolean limitExceeded = false;
        TupleQuery query = conn.prepareTupleQuery(queryString);
        TupleQueryResult queryResults = query.evaluate();
        if (limit != null) {
            limitExceeded = QueryResultIOLimited.writeTuple(queryResults, format, os, limit);
        } else {
            QueryResultIO.writeTuple(queryResults, format, os);
        }
        if (logger.isTraceEnabled()) {
            logger.trace(query.explain(Explanation.Level.Timed).toString());
        }
        queryResults.close();
        os.flush();
        os.close();
        return limitExceeded;
    }

    /**
     * Get TupleQueryResults.
     *
     * @param queryString The SPARQL query to execute.
     * @param resourceId  The Resource of the resource to query
     * @param storeType   The type of store to query
     * @return TupleQueryResult results of SPARQL Query
     */
    private TupleQueryResult getTupleQueryResults(String queryString, Resource resourceId, String storeType) {
        TupleQueryResult queryResults;

        if (DATASET_STORE_TYPE.equals(storeType)) {
            try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = new MutableTupleQueryResult(query.evaluate());
                // MutableTupleQueryResult - stores the complete query result in memory
                if (logger.isTraceEnabled()) {
                    logger.trace(query.explain(Explanation.Level.Timed).toString());
                }
            }
        } else if (REPOSITORY_STORE_TYPE.equals(storeType)) {
            OsgiRepository repository = repositoryManager.getRepository((IRI) resourceId)
                    .orElseThrow(() -> getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
            try (RepositoryConnection conn = repository.getConnection()) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = new MutableTupleQueryResult(query.evaluate());
                if (logger.isTraceEnabled()) {
                    logger.trace(query.explain(Explanation.Level.Timed).toString());
                }
            }
        } else {
            throw getErrorObjInternalServerError(new IllegalArgumentException("Unsupported storeType: " + storeType));
        }

        return queryResults;
    }

    /**
     * Create Excel Format Streaming Output Results. Fastexcel only supports output as Excel 2007 OOXML (.xlsx) format.
     *
     * @param result TupleQueryResult
     * @return StreamingOutput creates a binary stream for Workbook data
     */
    private StreamingOutput createExcelResults(TupleQueryResult result) {
        List<String> bindings = result.getBindingNames();

        return os -> {
            try (Workbook wb = new Workbook(os, "test", "1.0")) {
                Worksheet sheet = wb.newWorksheet("Sheet 1");
                BindingSet bindingSet;
                int rowIt = 0;
                int cellIt = 0;

                for (String bindingName : bindings) {
                    sheet.value(0, cellIt, bindingName);
                    cellIt++;
                }
                rowIt++;
                while (result.hasNext()) {
                    bindingSet = result.next();
                    cellIt = 0;
                    for (String bindingName : bindings) {
                        Optional<Binding> bindingOpt = Optional.ofNullable(bindingSet.getBinding(bindingName));
                        if (bindingOpt.isPresent()) {
                            sheet.value(rowIt, cellIt, bindingOpt.get().getValue().stringValue());
                        }
                        cellIt++;
                    }
                    rowIt++;
                }

                wb.finish();
                os.flush();
                os.close();
            } catch (IOException e) {
                // Exception can be thrown when closing the workbook.
                throw getErrorObjInternalServerError(new MobiException("Encountered issue creating excel results!", e));
            }
        };
    }

    private QueryableVersionedRDF getQueryable(Resource recordId, VersionedRDFRecordParams rdfRecordParams,
                                               String storeType) {
        boolean isOnt = ONTOLOGY_STORE_TYPE.equals(storeType);
        Optional<? extends QueryableVersionedRDF> queryableRDFOpt;
        String commitIdStr = rdfRecordParams.commitId();
        String branchIdStr = rdfRecordParams.branchId();
        boolean applyInProgressCommit = rdfRecordParams.applyInProgressCommit();
        try {
            if (StringUtils.isNotBlank(commitIdStr)) {
                Resource commitIRI = vf.createIRI(commitIdStr);
                if (StringUtils.isNotBlank(branchIdStr)) {
                    Resource branchIRI = vf.createIRI(branchIdStr);
                    queryableRDFOpt = isOnt ? ontologyManager.retrieveOntology(recordId, branchIRI, commitIRI) :
                            shapesGraphManager.retrieveShapesGraph(recordId, branchIRI, commitIRI);
                } else {
                    queryableRDFOpt = isOnt ? ontologyManager.retrieveOntologyByCommit(recordId, commitIRI) :
                            shapesGraphManager.retrieveShapesGraphByCommit(recordId, commitIRI);
                }
            } else if (StringUtils.isNotBlank(branchIdStr)) {
                Resource branchIRI = vf.createIRI(branchIdStr);
                queryableRDFOpt = isOnt ? ontologyManager.retrieveOntology(recordId, branchIRI) :
                        shapesGraphManager.retrieveShapesGraph(recordId, branchIRI);
            } else {
                queryableRDFOpt = isOnt ? ontologyManager.retrieveOntology(recordId) :
                        shapesGraphManager.retrieveShapesGraph(recordId);
            }

            if (queryableRDFOpt.isPresent() && applyInProgressCommit) {
                User user = rdfRecordParams.user();
                Optional<InProgressCommit> inProgressCommitOpt;
                try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
                    inProgressCommitOpt = commitManager.getInProgressCommitOpt(configProvider.getLocalCatalogIRI(),
                                    recordId, user, conn);
                }

                if (inProgressCommitOpt.isPresent()) {
                    queryableRDFOpt = isOnt ? Optional.of(ontologyManager.applyChanges((Ontology) queryableRDFOpt.get(),
                                    inProgressCommitOpt.get())) :
                            Optional.of(shapesGraphManager.applyChanges((ShapesGraph) queryableRDFOpt.get(),
                                    inProgressCommitOpt.get()));
                }
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (IllegalStateException | MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }

        return queryableRDFOpt.orElseThrow(() -> RestUtils.getErrorObjBadRequest(
                new IllegalArgumentException("The ontology could not be found.")));
    }
}
