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

import static com.mobi.rest.util.RestUtils.modelToSkolemizedString;
import static com.mobi.rest.util.RestUtils.modelToString;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.security.annotations.DefaultResourceId;
import com.mobi.rest.security.annotations.ValueType;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.MobiWebException;
import com.mobi.rest.util.jaxb.Links;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import com.mobi.rest.security.annotations.ResourceId;
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
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import javax.annotation.Nullable;
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

    // private static final int QUERY_TIME_OUT_SECONDS = 120;
    private ModelFactory modelFactory;
    private BNodeService bNodeService;
    private SesameTransformer sesameTransformer;

    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;
    private ValueFactory valueFactory;

    private final Logger log = LoggerFactory.getLogger(SparqlRest.class);
    private final ObjectMapper mapper = new ObjectMapper();

    @Reference
    public void setModelFactory(ModelFactory modelFactory) {
        this.modelFactory = modelFactory;
    }

    @Reference
    public void setbNodeService(BNodeService bNodeService) {
        this.bNodeService = bNodeService;
    }

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

    /**
    * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
    *
    * @param queryString a string representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return The SPARQL 1.1 results in JSON format.
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
        log.trace(String.format("queryRdf(%s, %s, %s)",queryString, datasetRecordId, acceptString));

        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }

        ParsedOperation parsedOperation = getParsedOperation(queryString);

        String fileType = convertAcceptType(acceptString);

        if (parsedOperation instanceof ParsedQuery) {
            if (parsedOperation instanceof ParsedTupleQuery) { // select queries
                return handleSelectQuery(queryString, datasetRecordId, fileType, null, acceptString);
            } else if (parsedOperation instanceof ParsedGraphQuery) { // construct queries
                return handleConstructQuery(queryString, datasetRecordId, fileType, null, acceptString);
            } else {
                throw ErrorUtils.sendError("Unsupported query type used", Response.Status.BAD_REQUEST);
            }
        } else {
            throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     *
     * <p>Downloads a delimited file with the results of the provided SPARQL query.</p>
     * <p>Supports CSV, TSV, Excel 97-2003, and Excel 2013 files extensions.</p>
     * <p>https://github.com/eclipse/rdf4j/blob/master/core/rio/api/src/main/java/org/eclipse/rdf4j/rio/RDFFormat.java</p>
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file.
     * @return The SPARQL 1.1 results in the specified file format
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
        log.trace(String.format("downloadRdfQuery(%s, %s, %s, %s)",queryString, datasetRecordId, fileType, fileName));

        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }
        //  TODO: Handle timeout
        //  final Thread queryThread = Thread.currentThread();
        //
        //  Timer timer = new Timer();
        //  timer.schedule(new TimerTask() {
        //      @Override
        //      public void run() {
        //          log.info(String.format("Interrupting query on thread %d", queryThread.getId()));
        //          queryThread.interrupt();
        //      }
        //  }, QUERY_TIME_OUT_SECONDS * 1000);

        ParsedOperation parsedOperation = getParsedOperation(queryString);

        if (parsedOperation instanceof ParsedQuery) {
            if (parsedOperation instanceof ParsedTupleQuery) { // select queries
                return handleSelectQuery(queryString, datasetRecordId, fileType, fileName, acceptString);
            } else if (parsedOperation instanceof ParsedGraphQuery) { // construct queries
                return handleConstructQuery(queryString, datasetRecordId, fileType, fileName, acceptString);
            } else {
                throw ErrorUtils.sendError("Unsupported query type used", Response.Status.BAD_REQUEST);
            }
        } else {
            throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Handel Select Query.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file.
     * @return
     */
    private Response handleSelectQuery(String queryString, String datasetRecordId,
                                       String fileType, String fileName, String acceptString) {
        TupleQueryResult queryResults = getTupleQueryResults(queryString, datasetRecordId);
        StreamingOutput stream;
        String mimeType;
        String fileExtension;

        if (fileType == null) { // any switch statement can't be null to prevent a NullPointerException
            fileType = "";
        }

        switch (fileType) {
            case "json":
                fileExtension = "json";
                mimeType = JSON_MIME_TYPE;

                if (!queryResults.hasNext()) {
                    return Response.noContent().build();
                }

                stream = getJsonResults(queryResults);
                break;
            case "xls":
                fileExtension = "xls";
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = XLS_MIME_TYPE;
                break;
            case "xlsx":
                fileExtension = "xlsx";
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = XLSX_MIME_TYPE;
                break;
            case "csv":
                fileExtension = "csv";
                stream = createDelimitedResults(queryResults, ",");
                mimeType = CSV_MIME_TYPE;
                break;
            case "tsv":
                fileExtension = "tsv";
                stream = createDelimitedResults(queryResults, "\t");
                mimeType = TSV_MIME_TYPE;
                break;
            default:
                fileExtension = "json";
                mimeType = JSON_MIME_TYPE;
                log.debug(String.format("Invalid file type [%s] Header Accept: [%s]: defaulted to [%s]", fileType, acceptString, mimeType));

                if (!queryResults.hasNext()) {
                    return Response.noContent().build();
                }

                stream = getJsonResults(queryResults);
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
     * Handle Construct Query.
     * Output: Turtle, JSON-LD, and RDF/XML
     *
     * @param queryString The SPARQL query to execute.
     * @param fileType used to specify certain media types which are acceptable for the response
     * @param fileName The optional file name for the download file.
     * @return
     */
    private Response handleConstructQuery(String queryString, String datasetRecordId,
                                          String fileType, String fileName, String acceptString) {
        String mimeType;
        String format;
        String fileExtension;

        if (fileType == null) { // any switch statement can't be null to prevent a NullPointerException
            fileType = ""; // default value is turtle
        }

        switch (fileType) {
            case "ttl":
                fileExtension = "ttl";
                mimeType = TURTLE_MIME_TYPE;
                format = "turtle";
                break;
            case "jsonld":
                fileExtension = "jsonld";
                mimeType = LDJSON_MIME_TYPE;
                format = "jsonld";
                break;
            case "rdf":
                fileExtension = "rdf";
                mimeType = RDFXML_MIME_TYPE;
                format = "rdf/xml";
                break;
            default:
                fileExtension = "ttl";
                mimeType = TURTLE_MIME_TYPE;
                format = "turtle";
                log.debug(String.format("Invalid file type [%s] Header Accept: [%s]: defaulted to [%s]", fileType, acceptString, mimeType));
        }

        Model entityData = getGraphResults(queryString, datasetRecordId);
        boolean skolemize = format.equalsIgnoreCase("jsonld");

        if (entityData.size() >= 1) {
            String modelStr;
            if (skolemize) {
                modelStr = modelToSkolemizedString(entityData, format, sesameTransformer, bNodeService);
            } else {
                modelStr = modelToString(entityData, format, sesameTransformer);
            }

            Response.ResponseBuilder builder = Response.ok(modelStr)
                    .header("Content-Type", mimeType);

            if (fileName != null) {
                builder.header("Content-Disposition", "attachment;filename=" + fileName +  "." + fileExtension);
            }

            return builder.build();
        } else {
            return Response.noContent().build();
        }
    }

    /**
     * Retrieves the paged results of the provided SPARQL query. Parameters can be passed to control paging.
     * Links to next and previous pages are within the Links header and the total size is within the
     * X-Total-Count header. Can optionally limit the query to a Dataset.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param limit The number of resources to return in one page.
     * @param offset The offset for the page.
     * @return The paginated List of JSONObjects that match the SPARQL query bindings.
     */
    @GET
    @Path("/page")
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the paged results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response getPagedResults(@Context UriInfo uriInfo,
                             @QueryParam("query") String queryString,
                             @QueryParam("dataset") String datasetRecordId,
                             @DefaultValue("100") @QueryParam("limit") int limit,
                             @DefaultValue("0") @QueryParam("offset") int offset) {

        LinksUtils.validateParams(limit, offset);

        ParsedOperation parsedOperation = getParsedOperation(queryString);

        if (parsedOperation instanceof ParsedQuery) {
            if (parsedOperation instanceof ParsedTupleQuery) { // select queries
                return handleSelectPagedResults(uriInfo, queryString, datasetRecordId, limit, offset);
            } else if (parsedOperation instanceof ParsedGraphQuery) { // construct queries
                throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
            } else {
                throw ErrorUtils.sendError("Unsupported query type used", Response.Status.BAD_REQUEST);
            }
        } else {
            throw ErrorUtils.sendError("Unsupported query type use.", Response.Status.BAD_REQUEST);
        }
    }

    /**
     * Convert AcceptType to FileType
     * @param acceptString MimeType
     * @return String
     */
    private static String convertAcceptType(String acceptString){
        if (acceptString == null) { // any switch statement can't be null to prevent a NullPointerException
            acceptString = "";
        }

        switch (acceptString) {
            case XLSX_MIME_TYPE:
                return "xlsx";
            case XLS_MIME_TYPE:
                return "xls";
            case CSV_MIME_TYPE:
                return "csv";
            case TSV_MIME_TYPE:
                return "tsv";
            case TURTLE_MIME_TYPE:
                return "ttl";
            case LDJSON_MIME_TYPE:
                return "jsonld";
            case RDFXML_MIME_TYPE:
                return "rdf";
            case JSON_MIME_TYPE:
            default:
                return "json";
        }
    }

    /**
     * Handles SelectPagedResults.
     *
     * @param uriInfo URIInfo Context
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param limit The number of resources to return in one page.
     * @param offset The offset for the page.
     * @return The paginated List of JSONObjects that match the SPARQL query bindings.
     */
    private Response handleSelectPagedResults(UriInfo uriInfo, String queryString, String datasetRecordId,
                                              int limit, int offset) {
        TupleQueryResult queryResults = getTupleQueryResults(queryString, datasetRecordId);

        if (queryResults.hasNext()) {
            List<ObjectNode> bindings = JSONQueryResults.getBindings(queryResults);
            if (offset > bindings.size()) {
                throw ErrorUtils.sendError("Offset exceeds total size", Response.Status.BAD_REQUEST);
            }
            ArrayNode results;
            int size;
            if ((offset + limit) > bindings.size()) {
                results = mapper.valueToTree(bindings.subList(offset, bindings.size()));
                size = bindings.size() - offset;
            } else {
                results = mapper.valueToTree(bindings.subList(offset, offset + limit));
                size = limit;
            }

            ObjectNode response = mapper.createObjectNode();
            response.set("data", results);
            response.set("bindings",mapper.valueToTree(queryResults.getBindingNames()));
            Response.ResponseBuilder builder = Response.ok(response.toString())
                    .header("X-Total-Count", bindings.size());

            Links links = LinksUtils.buildLinks(uriInfo, size, bindings.size(), limit, offset);
            if (links.getNext() != null) {
                builder = builder.link(links.getBase() + links.getNext(), "next");
            }
            if (links.getPrev() != null) {
                builder = builder.link(links.getBase() + links.getPrev(), "prev");
            }
            return builder.build();
        } else {
            return Response.ok().header("X-Total-Count", 0).build();
        }
    }

    /**
     * getTupleQueryResults.
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return TupleQueryResult
     */
    private TupleQueryResult getTupleQueryResults(String queryString, String datasetRecordId) {
        TupleQueryResult queryResults;
        try {
            if (!StringUtils.isBlank(datasetRecordId)) {
                Resource recordId = valueFactory.createIRI(datasetRecordId);
                queryResults = getDatasetQueryResults(queryString, recordId);
            } else {
                queryResults = getRepoQueryResults(queryString);
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
     * Get DatasetQueryResults.
     *
     * @param queryString The SPARQL query to execute.
     * @param recordId DatasetRecord IRI representing the Dataset to query
     * @return
     */
    private TupleQueryResult getDatasetQueryResults(String queryString, Resource recordId) {
        try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            return query.evaluateAndReturn();
        }
    }

    /**
     * GetRepoQueryResults.
     * @param queryString The SPARQL query to execute.
     * @return
     */
    private TupleQueryResult getRepoQueryResults(String queryString) {
        Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));

        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            return query.evaluateAndReturn();
        }
    }

    /**
     * Execute Construct Queries.
     * @param queryString The SPARQL query to execute.
     * @return
     */
    private Model getGraphResults(String queryString, String datasetRecordId) {
        try {
            if (!StringUtils.isBlank(datasetRecordId)) {
                Resource recordId = valueFactory.createIRI(datasetRecordId);
                try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
                    return executeGraphQuery(conn.prepareGraphQuery(queryString));
                }
            } else {
                Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                        ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));
                try (RepositoryConnection conn = repository.getConnection()) {
                    return executeGraphQuery(conn.prepareGraphQuery(queryString));
                }
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
     * Execute Graph Query.
     *
     * @param graphQuery The SPARQL query to execute.
     * @return
     */
    private Model executeGraphQuery(GraphQuery graphQuery) {
        GraphQuery query = graphQuery;
        // TODO important to have below
        // @param addBinding     the binding to add to the query, if needed
        // @param methodName     the name of the method to provide more accurate logging messages
        // @param includeImports whether to include imported ontologies in the query
        //
        // if (includeImports) {
        //    query = conn.prepareGraphQuery(queryString);
        // } else {
        //    query = conn.prepareGraphQuery(queryString, conn.getSystemDefaultNamedGraph());
        // }
        // if (addBinding != null) {
        //    query = addBinding.apply(query);
        // }
        Model model = QueryResults.asModel(query.evaluate(), modelFactory);

        return model;
    }

    /**
     * Get ParsedOperation from query.
     *
     * @param queryString The SPARQL query to execute.
     * @return
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
     * Create delimited formatted StreamingOutput for Tuple query results using the provided results and delimiter string.
     *
     * @param result TupleQueryResult
     * @param delimiter accepts the delimiter for file
     * @return StreamingOutput
     */
    private static StreamingOutput createDelimitedResults(TupleQueryResult result, String delimiter) {
        List<String> bindings = result.getBindingNames();
        StringBuilder file = new StringBuilder(String.join(delimiter, bindings));
        BindingSet bindingSet;
        Iterator<String> bindingIt;
        while (result.hasNext()) {
            file.append("\n");
            bindingSet = result.next();
            bindingIt = bindings.iterator();
            while (bindingIt.hasNext()) {
                bindingSet.getBinding(bindingIt.next()).ifPresent(binding -> {
                    String currentValue = binding.getValue().stringValue();
                    file.append(String.format("%s", binding.getValue().stringValue()));
                });

                if (bindingIt.hasNext()) {
                    file.append(delimiter);
                }
            }
        }
        return os -> {
            Writer writer = new BufferedWriter(new OutputStreamWriter(os));
            writer.write(file.toString());
            writer.flush();
            writer.close();
        };
    }

    /**
     * Create JSON Streaming Output Results.
     *
     * @param queryResults TupleQueryResult
     * @return StreamingOutput
     */
    private static StreamingOutput getJsonResults(TupleQueryResult queryResults) {
        return out -> {
            Writer writer = new BufferedWriter(new OutputStreamWriter(out));

            ObjectNode json = JSONQueryResults.getResponse(queryResults);
            writer.write(json.toString());
            writer.flush();
        };
    }

    /**
     * Create Excel Format Streaming Output Results.
     *
     * <p>HSSF is the POI Project's pure Java implementation of the Excel '97(-2007) file format.</p>
     * <p>XSSF is the POI Project's pure Java implementation of the Excel 2007 OOXML (.xlsx) file format.</p>
     *
     * @param result TupleQueryResult
     * @param type the excel spreadsheet format, accepts xls, xlsx
     * @return StreamingOutput
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
