package com.mobi.rest.util;

/*-
 * #%L
 * com.mobi.rest.util
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
import static com.mobi.rest.util.RestUtils.getErrorObjInternalServerError;

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.persistence.utils.rio.Rio;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

public class RestQueryUtils {

    private static final Logger logger = LoggerFactory.getLogger(RestQueryUtils.class);
    private static final ValueFactory valueFactory = new ValidatingValueFactory();
    public static final String X_LIMIT_EXCEEDED = "X-LIMIT-EXCEEDED";
    public static final String QUERY_INVALID_MESSAGE = "Query is invalid. Please change the query and re-execute.";
    public static final String REPO_NOT_AVAILABLE_MESSAGE = "Repository is not available";
    public static final IllegalArgumentException QUERY_INVALID_EXCEPTION =
            new IllegalArgumentException(QUERY_INVALID_MESSAGE);
    public static final IllegalArgumentException REPO_NOT_AVAILABLE_EXCEPTION =
            new IllegalArgumentException(REPO_NOT_AVAILABLE_MESSAGE);

    /**
     * Handle SPARQL Query based on query type.  Can handle SELECT AND CONSTRUCT queries.
     * <p>
     * SELECT queries output: JSON, XLS, XLSX, CSV, TSV
     * CONSTRUCT queries output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString    The SPARQL query to execute.
     * @param resourceId     The IRI of the resource to query
     * @param storeType      The type of store to query
     * @param acceptString   used to specify certain media types which are acceptable for the response
     * @param fileName       The optional file name for the download file.
     * @param ontology       Ontology to query from.
     * @param includeImports Should Include Imports for Ontology.
     * @return SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    public static Response handleQuery(String queryString, Resource resourceId, String storeType, String acceptString,
                                       String fileName, Ontology ontology, boolean includeImports,
                                       ConnectionObjects connectionObjects) {
        try {
            ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);
            if (!(parsedOperation instanceof ParsedQuery)) {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
            if (parsedOperation instanceof ParsedTupleQuery) {
                return handleSelectQuery(queryString, resourceId, storeType, acceptString,
                        fileName, ontology, includeImports, connectionObjects).build();
            } else if (parsedOperation instanceof ParsedGraphQuery) {
                return handleConstructQuery(queryString, resourceId, storeType, acceptString,
                        fileName, ontology, includeImports, false, connectionObjects).build();
            } else {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MalformedQueryException ex) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(QUERY_INVALID_MESSAGE + ";;;"
                    + ex.getMessage()));
        } catch (MobiException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }


    /**
     * Handle SPARQL Query eagerly based on query type. Can handle SELECT AND CONSTRUCT queries.
     * <p>
     * SELECT queries output: JSON, XLS, XLSX, CSV, TSV
     * CONSTRUCT queries output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString    The SPARQL query to execute.
     * @param resourceId     The IRI of the resource to query
     * @param storeType      The type of store to query
     * @param mimeType       used to specify certain media types which are acceptable for the response
     * @param ontology       Ontology to query from.
     * @param includeImports Should Include Imports for Ontology.
     * @return SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    public static Response handleQueryEagerly(String queryString, Resource resourceId, String storeType, String mimeType,
                                              int limit, Ontology ontology, boolean includeImports,
                                              ConnectionObjects connectionObjects) {
        try {
            ParsedOperation parsedOperation = QueryParserUtil.parseOperation(QueryLanguage.SPARQL, queryString, null);
            if (!(parsedOperation instanceof ParsedQuery)) {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
            if (parsedOperation instanceof ParsedTupleQuery) {
                return handleSelectQueryEagerly(queryString, resourceId, storeType, mimeType, limit, ontology, includeImports, connectionObjects);
            } else if (parsedOperation instanceof ParsedGraphQuery) {
                return handleConstructQueryEagerly(queryString, resourceId, storeType, mimeType, limit,ontology, includeImports, connectionObjects);
            } else {
                throw RestUtils.getErrorObjBadRequest(QUERY_INVALID_EXCEPTION);
            }
        } catch (IllegalArgumentException ex) {
            throw RestUtils.getErrorObjBadRequest(ex);
        } catch (MalformedQueryException ex) {
            throw RestUtils.getErrorObjBadRequest(new IllegalArgumentException(QUERY_INVALID_MESSAGE + ";;;" + ex.getMessage()));
        } catch (MobiException | IOException ex) {
            throw RestUtils.getErrorObjInternalServerError(ex);
        }
    }

    /**
     * Handle Select Query. Defaults to json if mimeType is invalid
     * Output: JSON, XLS, XLSX, CSV, TSV
     *
     * @param queryString    The SPARQL query to execute.
     * @param resourceId     The Resource of the resource to query
     * @param storeType      The type of store to query
     * @param mimeType       used to specify certain media types which are acceptable for the response.
     * @param fileName       The optional file name for the download file.
     * @param ontology       Ontology to query from.
     * @param includeImports Should Include Imports for Ontology.
     * @return SPARQL 1.1 ResponseBuilder in the format of ACCEPT Header mime type
     */
    public static Response.ResponseBuilder handleSelectQuery(String queryString, Resource resourceId,
                                                             String storeType, String mimeType, String fileName,
                                                             Ontology ontology, boolean includeImports,
                                                             ConnectionObjects connectionObjects) {
        StreamingOutput stream;
        String fileExtension;

        if (mimeType == null) { // any switch statement can't be null to prevent a NullPointerException
            mimeType = "";
        }
        TupleQueryResult tupleQueryResult;

        switch (mimeType) {
            case JSON_MIME_TYPE:
                fileExtension = "json";
                stream = getSelectStream(queryString, resourceId, storeType, ontology, includeImports, TupleQueryResultFormat.JSON, connectionObjects);
                break;
            case XLS_MIME_TYPE:
                fileExtension = "xls";
                if (ontology != null) {
                    tupleQueryResult = ontology.getTupleQueryResults(queryString, includeImports);
                } else {
                    tupleQueryResult = getTupleQueryResults(queryString, resourceId, storeType, connectionObjects);
                }
                stream = createExcelResults(tupleQueryResult, fileExtension);
                break;
            case XLSX_MIME_TYPE:
                fileExtension = "xlsx";
                if (ontology != null) {
                    tupleQueryResult = ontology.getTupleQueryResults(queryString, includeImports);
                } else {
                    tupleQueryResult = getTupleQueryResults(queryString, resourceId, storeType, connectionObjects);
                }
                stream = createExcelResults(tupleQueryResult, fileExtension);
                break;
            case CSV_MIME_TYPE:
                fileExtension = "csv";
                stream = getSelectStream(queryString, resourceId, storeType, ontology, includeImports, TupleQueryResultFormat.CSV, connectionObjects);
                break;
            case TSV_MIME_TYPE:
                fileExtension = "tsv";
                stream = getSelectStream(queryString, resourceId, storeType, ontology, includeImports, TupleQueryResultFormat.TSV, connectionObjects);
                break;
            default:
                fileExtension = "json";
                String oldMimeType = mimeType;
                mimeType = JSON_MIME_TYPE;
                logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", oldMimeType,
                        mimeType));
                stream = getSelectStream(queryString, resourceId, storeType, ontology, includeImports, TupleQueryResultFormat.JSON, connectionObjects);
                break;
        }

        Response.ResponseBuilder builder = Response.ok(stream)
                .type(mimeType);

        if (StringUtils.isNotBlank(fileName)) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName + "." + fileExtension);
        }

        return builder;
    }

    /**
     * Handle Select Query Eagerly.
     * Output: JSON
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response
     * @param ontology        Ontology to query from.
     * @param includeImports  Should Include Imports for Ontology.
     * @return The SPARQL 1.1 Response in the format of ACCEPT Header mime type
     */
    private static Response handleSelectQueryEagerly(String queryString, Resource resourceId, String storeType,
                                                     String mimeType, int limit, Ontology ontology,
                                                     boolean includeImports, ConnectionObjects connectionObjects)
            throws IOException {
        if (!JSON_MIME_TYPE.equals(mimeType)) {
            logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", mimeType, JSON_MIME_TYPE));
        }
        return getSelectQueryResponseEagerly(queryString, resourceId, storeType,
                TupleQueryResultFormat.JSON, JSON_MIME_TYPE, limit, ontology, includeImports, connectionObjects);
    }

    /**
     * Get SelectQueryResponse Eagerly.
     *
     * @param queryString    The SPARQL query to execute.
     * @param resourceId     The Resource of the resource to query
     * @param storeType      The type of store to query
     * @param tupleQueryResultFormat TupleQueryResultFormat used to convert TupleQueryResults for response
     * @param mimeType               used to specify certain media types which are acceptable for the response
     * @param ontology        Ontology to query from.
     * @param includeImports  Should Include Imports for Ontology.
     * @return Response in TupleQueryResultFormat of SPARQL Query
     */
    private static Response getSelectQueryResponseEagerly(String queryString, Resource resourceId, String storeType,
                                                          TupleQueryResultFormat tupleQueryResultFormat,
                                                          String mimeType, Integer limit, Ontology ontology,
                                                          boolean includeImports,
                                                          ConnectionObjects connectionObjects)throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        boolean limitExceeded;

        if (ontology != null) {
            limitExceeded = false;
            TupleQueryResult queryResults = ontology.getTupleQueryResults(queryString, includeImports);
            if (limit != null) {
                limitExceeded = QueryResultIOLimited.writeTuple(queryResults, tupleQueryResultFormat, byteArrayOutputStream, limit);
            } else {
                QueryResultIO.writeTuple(queryResults, tupleQueryResultFormat, byteArrayOutputStream);
            }
            queryResults.close();
            byteArrayOutputStream.flush();
            byteArrayOutputStream.close();
        } else if ("dataset-record".equals(storeType)) {
            DatasetManager datasetManager = connectionObjects.getDatasetManager();
            try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else if ("repository".equals(storeType)) {
            // TODO: Will be removed in future ticket when repository manager is used
            if (!"https://mobi.solutions/repos/system".equals(resourceId.stringValue())) {
                throw new IllegalArgumentException("Unsupported repository provided.");
            }

            RepositoryManager repositoryManager = connectionObjects.getRepositoryManager();
            OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                    getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeTupleQuery(queryString, tupleQueryResultFormat, byteArrayOutputStream, conn,
                        limit);
            } catch (IllegalArgumentException ex) {
                throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else {
            throw new IllegalArgumentException("Unsupported storeType: " + storeType);
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
     * @param resourceId     The Resource of the resource to query
     * @param storeType      The type of store to query
     * @param mimeType        used to specify certain media types which are acceptable for the response.
     * @param ontology        Ontology to query from.
     * @param includeImports  Should Include Imports for Ontology.
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    private static Response handleConstructQueryEagerly(String queryString, Resource resourceId, String storeType,
                                                        String mimeType, int limit, Ontology ontology,
                                                        boolean includeImports, ConnectionObjects connectionObjects)
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
                logger.debug(String.format("Invalid mimeType [%s]: defaulted to [%s]", oldMimeType, mimeType));
        }
        return getGraphQueryResponseEagerly(queryString, resourceId, storeType, format, mimeType, limit,
                ontology, includeImports, connectionObjects);
    }

    /**
     * Get GraphQueryResponse Eagerly.
     *
     * @param queryString     The SPARQL query to execute.
     * @param resourceId      The Resource of the resource to query
     * @param storeType       The type of store to query
     * @param format          RDFFormat used to convert GraphQueryResults for response
     * @param mimeType        used to specify certain media types which are acceptable for the response
     * @param ontology        Ontology to query from.
     * @param includeImports  Should Include Imports for Ontology.
     * @return Response in RDFFormat of SPARQL Query
     */
    private static Response getGraphQueryResponseEagerly(String queryString, Resource resourceId, String storeType,
                                                         RDFFormat format, String mimeType, int limit,
                                                         Ontology ontology, boolean includeImports,
                                                         ConnectionObjects connectionObjects) throws IOException {
        boolean limitExceeded = false;
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        if (ontology != null) {
            limitExceeded = ontology.getGraphQueryResultsStream(queryString, includeImports, format, false, limit, byteArrayOutputStream);
        } else if ("dataset-record".equals(storeType)) {
            DatasetManager datasetManager = connectionObjects.getDatasetManager();
            try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
        } else if ("repository".equals(storeType)) {
            // TODO: Will be removed in future ticket when repository manager is used
            if (!"https://mobi.solutions/repos/system".equals(resourceId.stringValue())) {
                throw new IllegalArgumentException("Unsupported repository provided.");
            }

            RepositoryManager repositoryManager = connectionObjects.getRepositoryManager();
            OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                    ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
            try (RepositoryConnection conn = repository.getConnection()) {
                limitExceeded = executeGraphQuery(queryString, format, byteArrayOutputStream, conn, limit);
            }
        } else {
            throw new IllegalArgumentException("Unsupported storeType: " + storeType);
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
     * @param queryString    The SPARQL query to execute.
     * @param resourceId     The Resource of the resource to query
     * @param storeType      The type of store to query
     * @param mimeType       used to specify certain media types which are acceptable for the response.
     * @param fileName       The optional file name for the download file.
     * @param ontology       Ontology to query from.
     * @param includeImports Should Include Imports for Ontology.
     * @return The SPARQL 1.1 Response from ACCEPT Header
     */
    public static Response.ResponseBuilder handleConstructQuery(String queryString, Resource resourceId,
                                                                String storeType, String mimeType, String fileName,
                                                                Ontology ontology, boolean includeImports,
                                                                boolean skolemize, ConnectionObjects connectionObjects) {
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
                logger.debug(String.format("Invalid mimeType [%s] : defaulted to [%s]",
                        oldMimeType, mimeType));
        }

        StreamingOutput stream = getConstructStream(queryString, resourceId, storeType, format, ontology,
                includeImports, skolemize, connectionObjects);

        Response.ResponseBuilder builder = Response.ok(stream)
                .type(mimeType);
        if (StringUtils.isNotBlank(fileName)) {
            builder.header("Content-Disposition", "attachment;filename=" + fileName + "." + fileExtension);
        }
        return builder;
    }

    private static StreamingOutput getConstructStream(String queryString, Resource resourceId, String storeType,
                                                      RDFFormat format, Ontology ontology, boolean includeImports,
                                                      boolean skolemize, ConnectionObjects connectionObjects) {
        if (ontology != null) {
            return os -> {
                ontology.getGraphQueryResultsStream(queryString, includeImports, format, skolemize, os);
            };
        } else if ("dataset-record".equals(storeType)) {
            return os -> {
                DatasetManager datasetManager = connectionObjects.getDatasetManager();
                try (DatasetConnection conn = datasetManager.getConnection(resourceId)) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else if ("repository".equals(storeType)) {
            // TODO: Will be removed in future ticket when repository manager is used
            if (!"https://mobi.solutions/repos/system".equals(resourceId.stringValue())) {
                throw new IllegalArgumentException("Unsupported repository provided.");
            }

            return os -> {
                RepositoryManager repositoryManager = connectionObjects.getRepositoryManager();
                OsgiRepository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeGraphQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else {
            throw new IllegalArgumentException("Unsupported storeType: " + storeType);
        }
    }

    private static boolean executeGraphQuery(String queryString, RDFFormat format, OutputStream os,
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

    private static StreamingOutput getSelectStream(String queryString, Resource resourceId,
                                                   String storeType, Ontology ontology, boolean includeImports,
                                                   TupleQueryResultFormat format, ConnectionObjects connectionObjects) {
        if (ontology != null) {
            return os -> {
                TupleQueryResult queryResults = ontology.getTupleQueryResults(queryString, includeImports);
                QueryResultIO.writeTuple(queryResults, format, os);
                queryResults.close();
                os.flush();
                os.close();
            };
        } else if ("dataset-record".equals(storeType)) {
            return os -> {
                try (DatasetConnection conn = connectionObjects.getDatasetManager().getConnection(resourceId)) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else if ("repository".equals(storeType)) {
            // TODO: Will be removed in future ticket when repository manager is used
            if (!"https://mobi.solutions/repos/system".equals(resourceId.stringValue())) {
                throw new IllegalArgumentException("Unsupported repository provided.");
            }

            return os -> {
                // TODO: Use different getRepository method for IRI
                OsgiRepository repository = connectionObjects.getRepositoryManager().getRepository("system")
                        .orElseThrow(() -> getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
                try (RepositoryConnection conn = repository.getConnection()) {
                    executeTupleQuery(queryString, format, os, conn, null);
                } catch (IllegalArgumentException ex) {
                    throw RestUtils.getErrorObjBadRequest(ex);
                }
            };
        } else {
            throw new IllegalArgumentException("Unsupported storeType: " + storeType);
        }
    }

    private static boolean executeTupleQuery(String queryString, TupleQueryResultFormat format, OutputStream os,
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
     * @param resourceId     The Resource of the resource to query
     * @param storeType      The type of store to query
     * @return TupleQueryResult results of SPARQL Query
     */
    private static TupleQueryResult getTupleQueryResults(String queryString, Resource resourceId,
                                                         String storeType, ConnectionObjects connectionObjects) {
        TupleQueryResult queryResults;

        if ("dataset-record".equals(storeType)) {
            try (DatasetConnection conn = connectionObjects.getDatasetManager().getConnection(resourceId)) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = new MutableTupleQueryResult(query.evaluate());
                // MutableTupleQueryResult - stores the complete query result in memory
                if (logger.isTraceEnabled()) {
                    logger.trace(query.explain(Explanation.Level.Timed).toString());
                }
            }
        } else if ("repository".equals(storeType)) {
            // TODO: Will be removed in future ticket when repository manager is used
            if (!"https://mobi.solutions/repos/system".equals(resourceId.stringValue())) {
                throw new IllegalArgumentException("Unsupported repository provided.");
            }

            OsgiRepository repository = connectionObjects.getRepositoryManager().getRepository("system")
                    .orElseThrow(() -> getErrorObjInternalServerError(REPO_NOT_AVAILABLE_EXCEPTION));
            try (RepositoryConnection conn = repository.getConnection()) {
                TupleQuery query = conn.prepareTupleQuery(queryString);
                queryResults = new MutableTupleQueryResult(query.evaluate());
                if (logger.isTraceEnabled()) {
                    logger.trace(query.explain(Explanation.Level.Timed).toString());
                }
            }
        } else {
            throw new IllegalArgumentException("Unsupported storeType: " + storeType);
        }

        return queryResults;
    }

    /**
     * Create Excel Format Streaming Output Results.
     * HSSF is the POI Project's pure Java implementation of the Excel '97(-2007) file format.
     * XSSF is the POI Project's pure Java implementation of the Excel 2007 OOXML (.xlsx) file format.
     *
     * @param result TupleQueryResult
     * @param type   the excel spreadsheet format, accepts xls, xlsx
     * @return StreamingOutput creates a binary stream for Workbook data
     */
    private static StreamingOutput createExcelResults(TupleQueryResult result, String type) {
        List<String> bindings = result.getBindingNames();

        return os -> {
            try (Workbook wb = type.equals("xls") ? new HSSFWorkbook() : new XSSFWorkbook()) {
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

                wb.write(os);
                os.flush();
                os.close();
            } catch (IOException e) {
                // Exception can be thrown when closing the workbook.
                throw new MobiException("Encountered issue creating excel results!", e);
            }
        };
    }
}
