package com.mobi.sparql.rest;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import static com.mobi.rest.util.RestUtils.convertFileExtensionToMimeType;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.rio.Rio;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.ActionId;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.MobiWebException;
import com.mobi.security.policy.api.ontologies.policy.Read;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.SimpleValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BindingSet;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.GraphQueryResult;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
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
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Optional;
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
import javax.ws.rs.core.StreamingOutput;

@Component(service = SparqlRest.class, immediate = true, configurationPolicy = ConfigurationPolicy.OPTIONAL,
        property = { "osgi.jaxrs.resource=true" })
@Designate(ocd = SparqlRestConfig.class)
@Path("/sparql")
public class SparqlRest {

    public static final String XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String XLS_MIME_TYPE = "application/vnd.ms-excel";
    public static final String CSV_MIME_TYPE = "text/csv";
    public static final String TSV_MIME_TYPE = "text/tab-separated-values";
    public static final String JSON_MIME_TYPE = "application/json";
    public static final  String TURTLE_MIME_TYPE = "text/turtle";
    public static final  String LDJSON_MIME_TYPE = "application/ld+json";
    public static final  String RDFXML_MIME_TYPE = "application/rdf+xml";

    private int limitResults;

    public static final String X_LIMIT_EXCEEDED = "X-LIMIT-EXCEEDED";

    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;
    private final ValueFactory valueFactory = SimpleValueFactory.getInstance();

    private final Logger log = LoggerFactory.getLogger(SparqlRest.class);
    private final ObjectMapper mapper = new ObjectMapper();

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
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response queryRdf(
            @QueryParam("query") String queryString,
            @QueryParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }

        return handleQuery(queryString, datasetRecordId, acceptString, null, null);
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
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
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

        return handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType), fileName,
                acceptString);
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
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response postQueryRdf(
            @QueryParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString,
            String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("SPARQL query must be provided in request body.", Response.Status.BAD_REQUEST);
        }

        return handleQuery(queryString, datasetRecordId, acceptString, null, null);
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
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response postDownloadRdfQuery(
            @QueryParam("dataset") String datasetRecordId,
            @QueryParam("fileType") String fileType,
            @HeaderParam("accept") String acceptString,
            @DefaultValue("results") @QueryParam("fileName") String fileName,
            String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Body must contain a query.", Response.Status.BAD_REQUEST);
        }

        return handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType), fileName,
                acceptString);
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
    @ResourceId(type = ValueType.BODY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response postUrlEncodedQueryRdf(
            @FormParam("query") String queryString,
            @FormParam("dataset") String datasetRecordId,
            @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Form parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }

        return handleQuery(queryString, datasetRecordId, acceptString, null, null);
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
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
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
    @ResourceId(type = ValueType.BODY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
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

        return handleQuery(queryString, datasetRecordId, convertFileExtensionToMimeType(fileType), fileName,
                acceptString);
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
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
            }
    )
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
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

        return handleQueryEagerly(queryString, datasetRecordId, acceptString);
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
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response postLimitedResults(@QueryParam("dataset") String datasetRecordId,
                                       @HeaderParam("accept") String acceptString, String queryString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Body must contain a query.", Response.Status.BAD_REQUEST);
        }

        return handleQueryEagerly(queryString, datasetRecordId, acceptString);
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
                    @ApiResponse(responseCode = "400", description = "BAD REQUEST"),
                    @ApiResponse(responseCode = "403", description = "Permission Denied"),
                    @ApiResponse(responseCode = "500", description = "INTERNAL SERVER ERROR"),
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
    @ResourceId(type = ValueType.BODY, value = "dataset",defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response postUrlEncodedLimitedResults(@FormParam("query") String queryString,
                                                 @FormParam("dataset") String datasetRecordId,
                                                 @Parameter(hidden = true) @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Form parameter 'query' must be set.", Response.Status.BAD_REQUEST);
        }

        return handleQueryEagerly(queryString, datasetRecordId, acceptString);
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

    /**
     * Handle SPARQL Query based on query type.
     * Output: JSON, XLS, XLSX, CSV, TSV
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file.
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    public Response handleQuery(String queryString, String datasetRecordId, String mimeType, String fileName,
                                String acceptString) {
        ParsedOperation parsedOperation = getParsedOperation(queryString);

        try {
            if (parsedOperation instanceof ParsedQuery) {
                if (parsedOperation instanceof ParsedTupleQuery) { // select queries
                    return handleSelectQuery(queryString, datasetRecordId, mimeType, fileName, acceptString);
                } else if (parsedOperation instanceof ParsedGraphQuery) { // construct queries
                    return handleConstructQuery(queryString, datasetRecordId, mimeType, fileName, acceptString);
                } else {
                    throw ErrorUtils.sendError("Unsupported query type used", Response.Status.BAD_REQUEST);
                }
            } else {
                throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MalformedQueryException ex) {
            String statusText = "Query is invalid. Please change the query and re-execute.";
            MobiWebException.CustomStatus status = new MobiWebException.CustomStatus(400, statusText);
            ObjectNode entity = mapper.createObjectNode();
            entity.put("details", ex.getCause().getMessage());
            Response response = Response.status(status)
                    .entity(entity.toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handle SPARQL Query eagerly based on query type.
     * Output: JSON
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    public Response handleQueryEagerly(String queryString, String datasetRecordId, String mimeType) {
        ParsedOperation parsedOperation = getParsedOperation(queryString);
        try {
            if (parsedOperation instanceof ParsedQuery) {
                if (parsedOperation instanceof ParsedTupleQuery) {
                    return handleSelectQueryEagerly(queryString, datasetRecordId, mimeType, limitResults);
                } else if (parsedOperation instanceof ParsedGraphQuery) {
                    return handleConstructQueryEagerly(queryString, datasetRecordId, mimeType, limitResults);
                } else {
                    throw ErrorUtils.sendError("Unsupported query type used.", Response.Status.BAD_REQUEST);
                }
            } else {
                throw ErrorUtils.sendError("Unsupported query type used.", Response.Status.BAD_REQUEST);
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MalformedQueryException ex) {
            String statusText = "Query is invalid. Please change the query and re-execute.";
            MobiWebException.CustomStatus status = new MobiWebException.CustomStatus(400, statusText);
            ObjectNode entity = mapper.createObjectNode();
            entity.put("details", ex.getCause().getMessage());
            Response response = Response.status(status)
                    .entity(entity.toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        } catch (MobiException | IOException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Handle Select Query.
     * Output: JSON, XLS, XLSX, CSV, TSV
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file.
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private Response handleSelectQuery(String queryString, String datasetRecordId,
                                       String mimeType, String fileName, String acceptString) {
        TupleQueryResult queryResults;
        StreamingOutput stream;
        String fileExtension;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = "";
        }

        switch (mimeType) {
            case JSON_MIME_TYPE:
                fileExtension = "json";
                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.JSON);
                break;
            case XLS_MIME_TYPE:
                fileExtension = "xls";
                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                stream = createExcelResults(queryResults, fileExtension);
                break;
            case XLSX_MIME_TYPE:
                fileExtension = "xlsx";
                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                stream = createExcelResults(queryResults, fileExtension);
                break;
            case CSV_MIME_TYPE:
                fileExtension = "csv";
                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.CSV);
                break;
            case TSV_MIME_TYPE:
                fileExtension = "tsv";
                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.TSV);
                break;
            default:
                fileExtension = "json";
                String oldMimeType = mimeType;
                mimeType = JSON_MIME_TYPE;
                log.debug(String.format("Invalid mimeType [%s] Header Accept: [%s]: defaulted to [%s]", oldMimeType,
                        acceptString, mimeType));

                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.JSON);
                break;
        }

        Response.ResponseBuilder builder = Response.ok(stream)
                .header("Content-Type", mimeType);

        if (fileName != null) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName +  "." + fileExtension);
        }

        return builder.build();
    }

    /**
     * Handle Select Query Eagerly.
     * Output: JSON
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private Response handleSelectQueryEagerly(String queryString, String datasetRecordId, String mimeType, int limit)
            throws IOException {
        if (!JSON_MIME_TYPE.equals(mimeType)) {
            log.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", mimeType, JSON_MIME_TYPE));
        }
        return getSelectQueryResponseEagerly(queryString, datasetRecordId,
                TupleQueryResultFormat.JSON, JSON_MIME_TYPE, limit);
    }

    /**
     * Get SelectQueryResponse Eagerly.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param tupleQueryResultFormat TupleQueryResultFormat used to convert TupleQueryResults for response
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @return Response in TupleQueryResultFormat of SPARQL Query
     */
    private Response getSelectQueryResponseEagerly(String queryString, String datasetRecordId,
                                                   TupleQueryResultFormat tupleQueryResultFormat, String mimeType,
                                                   int limit) throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean limitExceeded;

        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);
            try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
            }

        } else {
            OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                    ErrorUtils.sendError("Repository is not available.",
                            Response.Status.INTERNAL_SERVER_ERROR));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
            }
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
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query.
     * @param mimeType used to specify certain media types which are acceptable for the response.
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private Response handleConstructQueryEagerly(String queryString, String datasetRecordId, String mimeType, int limit)
            throws IOException {
        RDFFormat format;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = ""; // default value is turtle
        }

        switch (mimeType) {
            case TURTLE_MIME_TYPE:
                format = RDFFormat.TURTLE;
                break;
            case LDJSON_MIME_TYPE:
                format = RDFFormat.JSONLD;
                break;
            case RDFXML_MIME_TYPE:
                format = RDFFormat.RDFXML;
                break;
            default:
                String oldMimeType = mimeType;
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                log.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", oldMimeType, mimeType));
        }
        return getGraphQueryResponseEagerly(queryString, datasetRecordId, format, mimeType, limit);
    }

    /**
     * Get GraphQueryResponse Eagerly.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param format RDFFormat used to convert GraphQueryResults for response
     * @param mimeType used to specify certain media types which are acceptable for the response
     * @return Response in RDFFormat of SPARQL Query
     */
    private Response getGraphQueryResponseEagerly(String queryString, String datasetRecordId, RDFFormat format,
                                                  String mimeType, int limit) throws IOException {
        boolean limitExceeded;
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);

            try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
        } else {
            OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                    ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
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
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query.
     * @param mimeType used to specify certain media types which are acceptable for the response.
     * @param fileName The optional file name for the download file.
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private Response handleConstructQuery(String queryString, String datasetRecordId,
                                          String mimeType, String fileName, String acceptString) {
        RDFFormat format;
        String fileExtension;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = ""; // default value is turtle
        }

        switch (mimeType) {
            case TURTLE_MIME_TYPE:
                fileExtension = "ttl";
                format = RDFFormat.TURTLE;
                break;
            case LDJSON_MIME_TYPE:
                fileExtension = "jsonld";
                format = RDFFormat.JSONLD;
                break;
            case RDFXML_MIME_TYPE:
                fileExtension = "rdf";
                format = RDFFormat.RDFXML;
                break;
            default:
                fileExtension = "ttl";
                String oldMimeType = mimeType;
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                log.debug(String.format("Invalid mimeType [%s] Header Accept: [%s]: defaulted to [%s]",
                        oldMimeType, acceptString, mimeType));
        }

        StreamingOutput stream = getConstructStream(queryString, datasetRecordId, format);

        Response.ResponseBuilder builder = Response.ok(stream).header("Content-Type", mimeType);
        if (fileName != null) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName + "." + fileExtension);
        }
        return builder.build();
    }

    private StreamingOutput getConstructStream(String queryString, String datasetRecordId, RDFFormat format) {
        if (!StringUtils.isBlank(datasetRecordId)) {
            return os -> {
                Resource recordId = valueFactory.createIRI(datasetRecordId);
                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        } else {
            return os -> {
                OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
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

    private StreamingOutput getSelectStream(String queryString, String datasetRecordId, TupleQueryResultFormat format) {
        if (!StringUtils.isBlank(datasetRecordId)) {
            return os -> {
                Resource recordId = valueFactory.createIRI(datasetRecordId);
                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        } else {
            return os -> {
                OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.",
                                Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
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

        queryResults.close();
        os.flush();
        os.close();
        return limitExceeded;
    }

    /**
     * Get TupleQueryResults.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return TupleQueryResult results of SPARQL Query
     */
    private TupleQueryResult getTupleQueryResults(String queryString, String datasetRecordId) {
        TupleQueryResult queryResults;

        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);

            try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = query.evaluate(); // TODO: NOT SURE evaluateAndReturn
            }
        } else {
            OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                    ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
            try (RepositoryConnection conn = repository.getConnection()) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = query.evaluate(); // TODO: NOT SURE evaluateAndReturn
            }
        }

        return queryResults;
    }

    /**
     * Get ParsedOperation from query string.
     *
     * @param queryString The SPARQL query to execute.
     * @return ParsedOperation: it will parse query string and return parsedOperation object
     */
    private ParsedOperation getParsedOperation(String queryString) {
        try {
            return QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException ex) {
            String statusText = "Query is invalid. Please change the query and re-execute.";
            MobiWebException.CustomStatus status = new MobiWebException.CustomStatus(400, statusText);
            ObjectNode entity = mapper.createObjectNode();
            entity.put("details", ex.getCause().getMessage());
            Response response = Response.status(status)
                    .entity(entity.toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        }
    }

    /**
     * Create Excel Format Streaming Output Results.
     * HSSF is the POI Project's pure Java implementation of the Excel '97(-2007) file format.
     * XSSF is the POI Project's pure Java implementation of the Excel 2007 OOXML (.xlsx) file format.
     *
     * @param result TupleQueryResult
     * @param type the excel spreadsheet format, accepts xls, xlsx
     * @return StreamingOutput creates a binary stream for Workbook data
     */
    private static StreamingOutput createExcelResults(TupleQueryResult result, String type) {
        List<String> bindings = result.getBindingNames();
        Workbook wb;
        if (type.equals("xls")) {
            wb = new HSSFWorkbook();
        } else {
            wb = new XSSFWorkbook();
        }
        Sheet sheet = wb.createSheet();
        Row row;
        Cell cell;
        BindingSet bindingSet;
        int rowIt = 0;
        int cellIt = 0;

        row = sheet.createRow(rowIt);
        for (String bindingName : bindings) {
            cell = row.createCell(cellIt);
            cell.setCellValue(bindingName);
            cellIt++;
        }
        rowIt++;
        while (result.hasNext()) {
            bindingSet = result.next();
            cellIt = 0;
            row = sheet.createRow(rowIt);
            for (String bindingName : bindings) {
                cell = row.createCell(cellIt);
                Optional<Binding> bindingOpt = Optional.ofNullable(bindingSet.getBinding(bindingName));
                if (bindingOpt.isPresent()) {
                    cell.setCellValue(bindingOpt.get().getValue().stringValue());
                }
                cellIt++;
            }
            rowIt++;
        }

        return os -> {
            wb.write(os);
            os.flush();
            os.close();
        };
    }
}
