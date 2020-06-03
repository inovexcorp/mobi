package com.mobi.sparql.rest;

/*-
 * #%L
 * com.mobi.sparql.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.persistence.utils.rio.Rio;
import com.mobi.persistence.utils.rio.StatementHandler;
import com.mobi.query.GraphQueryResult;
import com.mobi.query.QueryResultsIO;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.MobiWebException;
import com.mobi.rest.util.jaxb.Links;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.parser.ParsedGraphQuery;
import org.eclipse.rdf4j.query.parser.ParsedOperation;
import org.eclipse.rdf4j.query.parser.ParsedQuery;
import org.eclipse.rdf4j.query.parser.ParsedTupleQuery;
import org.eclipse.rdf4j.query.parser.QueryParserUtil;
import org.eclipse.rdf4j.query.resultio.TupleQueryResultFormat;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Optional;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(service = SparqlRest.class, immediate = true)
@Path("/sparql")
@Api( value = "/sparql" )
public class SparqlRest {

    public static final String XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String XLS_MIME_TYPE = "application/vnd.ms-excel";
    public static final String CSV_MIME_TYPE = "text/csv";
    public static final String TSV_MIME_TYPE = "text/tab-separated-values";
    public static final String JSON_MIME_TYPE = "application/json";
    public static final  String TURTLE_MIME_TYPE = "text/turtle";
    public static final  String LDJSON_MIME_TYPE = "application/ld+json";
    public static final  String RDFXML_MIME_TYPE = "application/rdf+xml";

    public static final int UNPAGED_LIMIT = 500;
    public static final String X_LIMIT_EXCEEDED = "X-LIMIT-EXCEEDED";

    private SesameTransformer sesameTransformer;
    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;
    private ValueFactory valueFactory;
    private QueryResultsIO queryResultsIO;

    private final Logger log = LoggerFactory.getLogger(SparqlRest.class);
    private final ObjectMapper mapper = new ObjectMapper();

    @Reference
    public void setSesameTransformer(SesameTransformer sesameTransformer) {
        this.sesameTransformer = sesameTransformer;
    }

    @Reference
    public void setRepository(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    @Reference
    public void setDatasetManager(DatasetManager datasetManager) {
        this.datasetManager = datasetManager;
    }

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    @Reference
    public void setQueryResultsIO(QueryResultsIO queryResultsIO) {
        this.queryResultsIO = queryResultsIO;
    }

    /**
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     * Supports CSV, TSV, Excel 97-2003, and Excel 2013, Turtle, JSON-LD, and RDF/XML file extensions.
     * For select queries the default type is JSON and for construct queries default type is Turtle.
     * If an invalid file type was given for a query, it will change it to the default and log incorrect file type.
     * @param queryString a string representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 results in mime type specified by accept header
     */
    @GET
    @Produces({XLSX_MIME_TYPE, XLS_MIME_TYPE, CSV_MIME_TYPE, TSV_MIME_TYPE,
            JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ApiOperation("Retrieves the results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response queryRdf(@QueryParam("query") String queryString,
                             @QueryParam("dataset") String datasetRecordId,
                             @HeaderParam("accept") String acceptString) {

        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }

        ParsedOperation parsedOperation = getParsedOperation(queryString);
        try {
            if (parsedOperation instanceof ParsedQuery) {
                if (parsedOperation instanceof ParsedTupleQuery) {
                    return handleSelectQuery(queryString, datasetRecordId, acceptString, null, null);
                } else if (parsedOperation instanceof ParsedGraphQuery) {
                    return handleConstructQuery(queryString, datasetRecordId, acceptString, null, null);
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
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
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
     * @param fileName The optional file name for the download file.
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response in the format of fileType query parameter
     */
    @GET
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Query and Download the results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response downloadRdfQuery(@QueryParam("query") String queryString,
                                     @QueryParam("dataset") String datasetRecordId,
                                     @QueryParam("fileType") String fileType,
                                     @HeaderParam("accept") String acceptString,
                                     @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }

        ParsedOperation parsedOperation = getParsedOperation(queryString);

        String mimeType = convertFileExtensionToMimeType(fileType);

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
     * // TODO finish comment
     * Retrieves the paged results of the provided SPARQL query. Parameters can be passed to control paging.
     * Links to next and previous pages are within the Links header and the total size is within the
     * X-Total-Count header. Can optionally limit the query to a Dataset.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return The paginated List of JSONObjects that match the SPARQL query bindings.
     */
    @GET
    @Path("/unpage")
    @Produces({JSON_MIME_TYPE, TURTLE_MIME_TYPE, LDJSON_MIME_TYPE, RDFXML_MIME_TYPE})
    @RolesAllowed("user")
    @ApiOperation("Retrieves the unpaged results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response getUnpagedResults(@QueryParam("query") String queryString, // @Context UriInfo uriInfo,
                                      @QueryParam("dataset") String datasetRecordId,
                                    @HeaderParam("accept") String acceptString) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }

        ParsedOperation parsedOperation = getParsedOperation(queryString);
        try {
            if (parsedOperation instanceof ParsedQuery) {
                if (parsedOperation instanceof ParsedTupleQuery) {
                    Response response = handleSelectQueryEager(queryString, datasetRecordId, acceptString, null, null, UNPAGED_LIMIT);
                    return response;
                } else if (parsedOperation instanceof ParsedGraphQuery) {
                    return handleConstructQueryEager(queryString, datasetRecordId, acceptString, null, null, UNPAGED_LIMIT);
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
        } catch (MobiException ex) {
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
                mimeType = JSON_MIME_TYPE;
                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.JSON);
                break;
            case XLS_MIME_TYPE:
                fileExtension = "xls";
                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = XLS_MIME_TYPE;
                break;
            case XLSX_MIME_TYPE:
                fileExtension = "xlsx";
                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = XLSX_MIME_TYPE;
                break;
            case CSV_MIME_TYPE:
                fileExtension = "csv";
                mimeType = CSV_MIME_TYPE;
                stream = getSelectStream(queryString, datasetRecordId, TupleQueryResultFormat.CSV);
                break;
            case TSV_MIME_TYPE:
                fileExtension = "tsv";
                mimeType = TSV_MIME_TYPE;
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
    private Response handleSelectQueryEager(String queryString, String datasetRecordId,
                                            String mimeType, String fileName, String acceptString, int limit) {
        TupleQueryResult queryResults;
        TupleQueryResultFormat tupleQueryResultFormat;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = "";
        }

        switch (mimeType) {
            case JSON_MIME_TYPE:
                mimeType = JSON_MIME_TYPE;
                tupleQueryResultFormat = TupleQueryResultFormat.JSON;
                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                break;
            default:
                String oldMimeType = mimeType;
                mimeType = JSON_MIME_TYPE;
                tupleQueryResultFormat = TupleQueryResultFormat.JSON;
                log.debug(String.format("Invalid mimeType [%s] Header Accept: [%s]: defaulted to [%s]", oldMimeType,
                        acceptString, mimeType));

                queryResults = getTupleQueryResults(queryString, datasetRecordId);
                break;
        }

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean limitExceeded = false;
        try {
            limitExceeded = queryResultsIO.writeTuple(queryResults, tupleQueryResultFormat, UNPAGED_LIMIT, byteArrayOutputStream);
        } catch (IOException e) {
            e.printStackTrace(); // TODO FINISH
        }


        Response.ResponseBuilder builder = Response.ok(byteArrayOutputStream.toString())
                .header("Content-Type", mimeType);

        if(limitExceeded){
            builder.header(X_LIMIT_EXCEEDED, UNPAGED_LIMIT);  //  TODO CHECK WITH MEGAN
        }

        return builder.build();
    }

    /**
     * Handle Construct Query Eagerly
     * Output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query.
     * @param mimeType used to specify certain media types which are acceptable for the response.
     * @param fileName The optional file name for the download file.
     * @param acceptString used to specify certain media types which are acceptable for the response
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private Response handleConstructQueryEager(String queryString, String datasetRecordId,
                                          String mimeType, String fileName, String acceptString, int limit) {
        RDFFormat format;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = ""; // default value is turtle
        }

        switch (mimeType) {
            case TURTLE_MIME_TYPE:
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;

                break;
            case LDJSON_MIME_TYPE:
                mimeType = LDJSON_MIME_TYPE;
                format = RDFFormat.JSONLD;
                break;
            case RDFXML_MIME_TYPE:
                mimeType = RDFXML_MIME_TYPE;
                format = RDFFormat.RDFXML;
                break;
            default:
                String oldMimeType = mimeType;
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                log.debug(String.format("Invalid mimeType [%s] Header Accept: [%s]: defaulted to [%s]",
                        oldMimeType, acceptString, mimeType));
        }

        boolean limitExceeded = false;

        GraphQueryResult graphQueryResult = getGraphQueryResults(queryString, datasetRecordId);

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();


        RDFWriter writer = org.eclipse.rdf4j.rio.Rio.createWriter(format, byteArrayOutputStream);
        limitExceeded = write(graphQueryResult, writer, sesameTransformer, UNPAGED_LIMIT);
//        os.flush();
//        os.close();



        Response.ResponseBuilder builder = Response.ok(byteArrayOutputStream.toString()).header("Content-Type", mimeType);

        if(limitExceeded){
            builder.header(X_LIMIT_EXCEEDED, UNPAGED_LIMIT);  //  TODO CHECK WITH MEGAN
        }

        return builder.build();
    }

    /**
     * // TODO should put in RIO.java?
     * Copied from com.mobi.persistence.utils.rio.Rio
     * @param iterable
     * @param writer
     * @param transformer
     * @param statementHandlers
     * @param limit
     */
    public static boolean write(Iterable<Statement> iterable, RDFHandler writer, SesameTransformer transformer, int limit,
                                StatementHandler... statementHandlers) {
        boolean limitExceeded = false;
        int limitExceededCounter = 0;
        writer.startRDF();
        if (iterable instanceof Model) {
            for (Namespace nextNamespace : ((Model) iterable).getNamespaces()) {
                writer.handleNamespace(nextNamespace.getPrefix(), nextNamespace.getName());
            }
        }
        for (final Statement st : iterable) {
            limitExceededCounter += 1;
            Statement handledStatement = st;
            for (StatementHandler statementHandler : statementHandlers) {
                handledStatement = statementHandler.handleStatement(handledStatement);
            }

            org.eclipse.rdf4j.model.Statement sesameStatement = transformer.sesameStatement(handledStatement);
            writer.handleStatement(sesameStatement);

            if(limitExceededCounter >= limit){
                limitExceeded = true;
                break;
            }
        }
        writer.endRDF();
        return limitExceeded;
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
                mimeType = TURTLE_MIME_TYPE;
                format = RDFFormat.TURTLE;
                break;
            case LDJSON_MIME_TYPE:
                fileExtension = "jsonld";
                mimeType = LDJSON_MIME_TYPE;
                format = RDFFormat.JSONLD;
                break;
            case RDFXML_MIME_TYPE:
                fileExtension = "rdf";
                mimeType = RDFXML_MIME_TYPE;
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
                    executeGraphQuery(queryString, format, os, conn);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        } else {
            return os -> {
                Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeGraphQuery(queryString, format, os, conn);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        }
    }

    private void executeGraphQuery(String queryString, RDFFormat format, OutputStream os, RepositoryConnection conn)
            throws IOException {
        GraphQuery graphQuery = conn.prepareGraphQuery(queryString);
        GraphQueryResult graphQueryResult = graphQuery.evaluate();
        RDFWriter writer = org.eclipse.rdf4j.rio.Rio.createWriter(format, os);
        Rio.write(graphQueryResult, writer, sesameTransformer);
        os.flush();
        os.close();
    }

    private StreamingOutput getSelectStream(String queryString, String datasetRecordId, TupleQueryResultFormat format) {
        if (!StringUtils.isBlank(datasetRecordId)) {
            return os -> {
                Resource recordId = valueFactory.createIRI(datasetRecordId);
                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    executeTupleQuery(queryString, format, os, conn);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        } else {
            return os -> {
                Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.",
                                Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeTupleQuery(queryString, format, os, conn);
                } catch (IllegalArgumentException ex) {
                    throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
                }
            };
        }
    }

    private void executeTupleQuery(String queryString, TupleQueryResultFormat format, OutputStream os,
                                   RepositoryConnection conn) throws IOException {
        TupleQuery query = conn.prepareTupleQuery(queryString);
        TupleQueryResult queryResults = query.evaluate();
        queryResultsIO.writeTuple(queryResults, format, os);
        os.flush();
        os.close();
    }

    /**
     * Convert the file Extension to mime type.
     *
     * @param fileExtension fileExtension
     * @return String returns the mimeType for file extension, if null default is json
     */
    private static String convertFileExtensionToMimeType(String fileExtension) {
        if (fileExtension == null) { // any switch statement can't be null to prevent a NullPointerException
            fileExtension = "";
        }

        switch (fileExtension) {
            case "xlsx":
                return XLSX_MIME_TYPE;
            case "xls":
                return XLS_MIME_TYPE;
            case "csv":
                return CSV_MIME_TYPE;
            case "tsv":
                return TSV_MIME_TYPE;
            case "ttl":
                return TURTLE_MIME_TYPE;
            case "jsonld":
                return LDJSON_MIME_TYPE;
            case "rdf":
                return RDFXML_MIME_TYPE;
            case "json":
            default:
                return JSON_MIME_TYPE;
        }
    }

    /**
     * Get TupleQueryResults.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return TupleQueryResult results of SPARQL Query
     */
    private TupleQueryResult getTupleQueryResults(String queryString, String datasetRecordId) {
        TupleQueryResult queryResults;
        try {
            if (!StringUtils.isBlank(datasetRecordId)) {
                Resource recordId = valueFactory.createIRI(datasetRecordId);

                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    TupleQuery query = conn.prepareTupleQuery(queryString);
                    queryResults = query.evaluateAndReturn();
                }
            } else {
                Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    TupleQuery query = conn.prepareTupleQuery(queryString);
                    queryResults = query.evaluateAndReturn();
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MalformedQueryException ex) {
            String statusText = "Query is invalid. Please change the query and re-execute.";
            MobiWebException.CustomStatus status = new MobiWebException.CustomStatus(400, statusText);
            ObjectNode entity = mapper.createObjectNode();
            entity.put("details", ex.getMessage());
            Response response = Response.status(status)
                    .entity(entity.toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
        return queryResults;
    }

    /**
     * Get GraphQueryResult.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return GraphQueryResult results of SPARQL Query
     */
    private GraphQueryResult getGraphQueryResults(String queryString, String datasetRecordId) {
        GraphQueryResult queryResults;
        try {
            if (!StringUtils.isBlank(datasetRecordId)) {
                Resource recordId = valueFactory.createIRI(datasetRecordId);

                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    GraphQuery query = conn.prepareGraphQuery(queryString);
                    queryResults = query.evaluate();
                }
            } else {
                Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    GraphQuery query = conn.prepareGraphQuery(queryString);
                    queryResults = query.evaluate();
                }
            }
        } catch (IllegalArgumentException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
        } catch (MalformedQueryException ex) {
            String statusText = "Query is invalid. Please change the query and re-execute.";
            MobiWebException.CustomStatus status = new MobiWebException.CustomStatus(400, statusText);
            ObjectNode entity = mapper.createObjectNode();
            entity.put("details", ex.getMessage());
            Response response = Response.status(status)
                    .entity(entity.toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
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
                Optional<Binding> bindingOpt = bindingSet.getBinding(bindingName);
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
