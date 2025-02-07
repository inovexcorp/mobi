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

import com.mobi.dataset.api.DatasetManager;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.AttributeValue;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceAttributes;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ConnectionObjects;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.RestQueryUtils;
import com.mobi.rest.util.swagger.ErrorObjectSchema;
import com.mobi.security.policy.api.ontologies.policy.Read;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.ConfigurationPolicy;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.jaxrs.whiteboard.propertytypes.JaxrsResource;
import org.osgi.service.metatype.annotations.Designate;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

@Component(service = SparqlRest.class, immediate = true, configurationPolicy = ConfigurationPolicy.OPTIONAL)
@JaxrsResource
@Designate(ocd = SparqlRestConfig.class)
@Path("/sparql")
public class SparqlRest {

    private int limitResults;

    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;

    @Reference
    public void setRepository(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

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
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @GET
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response queryRdf(
            @QueryParam("query") String queryString,
            @QueryParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, acceptString, null, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL.query Can optionally limit the query to a Dataset.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @GET
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
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
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response downloadRdfQuery(
            @Parameter(description = "String representing a SPARQL query", required = true)
            @QueryParam("query") String queryString,
            @Parameter(description = "An optional DatasetRecord IRI representing the Dataset to query")
            @QueryParam("dataset") String datasetRecordId,
            @Parameter(description = "Format of the downloaded results file when the `ACCEPT` header is set to "
                    + "`application/octet-stream`",
                    schema = @Schema(allowableValues = {"xlsx", "csv", "tsv", "ttl", "jsonld", "rdf", "json"}))
            @QueryParam("fileType") String fileType,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString,
            @Parameter(description = "File name of the downloaded results file when the `ACCEPT` header is set to "
                    + "`application/octet-stream`")
            @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType),
                fileName, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes("application/sparql-query")
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postQueryRdf(
            @QueryParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString,
            String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("SPARQL query must be provided in request body.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, acceptString, null, null, false,connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL.query Can optionally limit the query to a Dataset.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @POST
    @Consumes("application/sparql-query")
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postDownloadRdfQuery(
            @QueryParam("dataset") String datasetRecordId,
            @QueryParam("fileType") String fileType,
            @HeaderParam("accept") String acceptString,
            @DefaultValue("results") @QueryParam("fileName") String fileName,
            String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Body must contain a query.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType),
                fileName, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString String representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.BODY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postUrlEncodedQueryRdf(
            @FormParam("query") String queryString,
            @FormParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Form parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, acceptString,
                null, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL.query Can optionally limit the query to a Dataset.
     * Downloads a delimited, binary file, or text file with the results of the provided SPARQL query.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
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
                    @Parameter(name = "dataset", description = "Optional DatasetRecord IRI representing the Dataset to "
                            + "query when the `CONTENT-TYPE` is **NOT** set to `application/x-www-form-urlencoded`",
                            in = ParameterIn.QUERY)
            }
    )
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.BODY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postUrlEncodedDownloadRdfQuery(
            @FormParam("query") String queryString,
            @FormParam("dataset") String datasetRecordId,
            @Parameter(description = "Format of the downloaded results file when the `ACCEPT` header is set to "
                    + "`application/octet-stream`",
                    schema = @Schema(allowableValues = {"xlsx", "csv", "tsv", "ttl", "jsonld", "rdf", "json"}))
            @QueryParam("fileType") String fileType,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString,
            @Parameter(description = "File name of the downloaded results file when the `ACCEPT` header is set to "
                    + "`application/octet-stream`")
            @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Form parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType),
                fileName, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig.
     * Can optionally limit the query to a Dataset. Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @GET
    @Path("/limited-results")
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
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response getLimitedResults(
            @Parameter(description = "The SPARQL query to execute", required = true)
            @QueryParam("query") String queryString,
            @Parameter(description = "Optional DatasetRecord IRI representing the Dataset to query")
            @QueryParam("dataset") String datasetRecordId,
            @Parameter(hidden = true)
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQueryEagerly(queryString, datasetRecordId, acceptString,
                this.limitResults, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig.
     * Can optionally limit the query to a Dataset. Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes("application/sparql-query")
    @Path("/limited-results")
    @Produces({JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postLimitedResults(@QueryParam("dataset") String datasetRecordId,
                                       @HeaderParam("accept") String acceptString, String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Body must contain a query.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQueryEagerly(queryString, datasetRecordId, acceptString,
                this.limitResults, null, false, connectionObjects);
    }

    /**
     * Retrieves the results of the provided SPARQL query, number of records limited to configurable
     * limit field variable under SparqlRestConfig.
     * Can optionally limit the query to a Dataset. Supports JSON, Turtle, JSON-LD, and RDF/XML mime types.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Path("/limited-results")
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
                    @Parameter(name = "dataset", description = "Optional DatasetRecord IRI representing the Dataset to "
                            + "query when the `CONTENT-TYPE` is **NOT** set to `application/x-www-form-urlencoded`",
                            in = ParameterIn.QUERY)
            }
    )
    @ActionId(value = Read.TYPE)
    @ResourceAttributes(@AttributeValue(id = "https://mobi.solutions/store-type", value = "repository"))
    @ResourceId(type = ValueType.BODY, value = "dataset",defaultValue = @DefaultResourceId("https://mobi.solutions/repos/system"))
    public Response postUrlEncodedLimitedResults(@FormParam("query") String queryString,
                                                 @FormParam("dataset") String datasetRecordId,
                                                 @Parameter(hidden = true) @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Form parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }
        ConnectionObjects connectionObjects = new ConnectionObjects(this.repositoryManager, this.datasetManager);
        return RestQueryUtils.handleQueryEagerly(queryString, datasetRecordId, acceptString,
                this.limitResults, null, false, connectionObjects);
    }

    /**
     * Class used for OpenAPI documentation for encoded url endpoint.
     */
    private static class EncodedParams {
        @Schema(type = "string", description = "The SPARQL query to execute", required = true)
        public String query;
        @Schema(type = "string", description = "Optional DatasetRecord IRI representing the Dataset to query")
        public String dataset;
    }


}
