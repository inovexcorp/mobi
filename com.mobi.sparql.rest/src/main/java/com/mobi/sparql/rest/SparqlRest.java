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
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.BindingSet;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.MalformedQueryException;
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
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
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

    // private static final int QUERY_TIME_OUT_SECONDS = 120;

    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;
    private ValueFactory valueFactory;

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

    @Reference
    public void setValueFactory(ValueFactory valueFactory) {
        this.valueFactory = valueFactory;
    }

    private TupleQueryResult getDatasetQueryResults(String queryString, Resource recordId) {
        try (DatasetConnection conn = datasetManager.getConnection(recordId)) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            return query.evaluateAndReturn();
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
    }

    private TupleQueryResult getQueryResults(String queryString) {
        Repository repository = repositoryManager.getRepository("system").orElseThrow(() ->
                ErrorUtils.sendError("Repository is not available.", Response.Status.INTERNAL_SERVER_ERROR));

        try (RepositoryConnection conn = repository.getConnection()) {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            return query.evaluateAndReturn();
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
     * Retrieves the results of the provided SPARQL query. Can optionally limit the query to a Dataset.
     *
     * @param queryString a string representing a SPARQL query.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @return The SPARQL 1.1 results in JSON format.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @RolesAllowed("user")
    @ApiOperation("Retrieves the results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response queryRdf(@QueryParam("query") String queryString,
                      @QueryParam("dataset") String datasetRecordId) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }

        // TODO: Handle timeout
        //        final Thread queryThread = Thread.currentThread();
        //
        //        Timer timer = new Timer();
        //        timer.schedule(new TimerTask() {
        //
        //            @Override
        //            public void run() {
        //                log.info(String.format("Interrupting query on thread %d", queryThread.getId()));
        //                queryThread.interrupt();
        //            }
        //        }, QUERY_TIME_OUT_SECONDS * 1000);

        TupleQueryResult queryResults;
        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);
            queryResults = getDatasetQueryResults(queryString, recordId);
        } else {
            queryResults = getQueryResults(queryString);
        }

        if (queryResults.hasNext()) {
            try {
                ObjectNode json = JSONQueryResults.getResponse(queryResults);
                return Response.ok().entity(json.toString()).build();
            } catch (MobiException ex) {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else {
            return Response.noContent().build();
        }
    }

    /**
     * Downloads a delimited file with the results of the provided SPARQL query. Supports CSV, TSV,
     * Excel 97-2003, and Excel 2013 files extensions. Can optionally limit the query to a Dataset.
     *
     * @param queryString The SPARQL query to execute.
     * @param datasetRecordId an optional DatasetRecord IRI representing the Dataset to query
     * @param fileExtension The desired extension of the download file.
     * @param fileName The optional file name for the download file.
     * @return A download stream of a file with the results of the provided SPARQL query.
     */
    @GET
    @Produces({MediaType.APPLICATION_OCTET_STREAM, "text/*", "application/*"})
    @RolesAllowed("user")
    @ApiOperation("Download the results of the provided SPARQL query.")
    @ResourceId(type = ValueType.QUERY, value = "dataset", defaultValue = @DefaultResourceId("http://mobi.com/system-repo"))
    public Response downloadQuery(@QueryParam("query") String queryString,
                           @QueryParam("dataset") String datasetRecordId,
                           @QueryParam("fileType") String fileExtension,
                           @DefaultValue("results") @QueryParam("fileName") String fileName) {
        if (queryString == null) {
            throw ErrorUtils.sendError("Parameter 'queryString' must be set.", Response.Status.BAD_REQUEST);
        }
        TupleQueryResult queryResults;
        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);
            queryResults = getDatasetQueryResults(queryString, recordId);
        } else {
            queryResults = getQueryResults(queryString);
        }
        StreamingOutput stream;
        String mimeType;
        switch (fileExtension) {
            case "xls":
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = "application/vnd.ms-excel";
                break;
            case "xlsx":
                stream = createExcelResults(queryResults, fileExtension);
                mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                break;
            case "csv":
                stream = createDelimitedResults(queryResults, ",");
                mimeType = "text/csv";
                break;
            case "tsv":
                stream = createDelimitedResults(queryResults, "\t");
                mimeType = "text/tab-separated-values";
                break;
            default:
                throw ErrorUtils.sendError("Invalid file type", Response.Status.BAD_REQUEST);
        }
        return Response.ok(stream).header("Content-Disposition", "attachment;filename=" + fileName
                +  "." + fileExtension).header("Content-Type", mimeType).build();
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
        TupleQueryResult queryResults;
        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);
            queryResults = getDatasetQueryResults(queryString, recordId);
        } else {
            queryResults = getQueryResults(queryString);
        }
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
            Response.ResponseBuilder builder = Response.ok(response.toString()).header("X-Total-Count", bindings.size());
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

    private StreamingOutput createDelimitedResults(TupleQueryResult result, String delimiter) {
        List<String> bindings = result.getBindingNames();
        StringBuilder file = new StringBuilder(String.join(delimiter, bindings));
        BindingSet bindingSet;
        Iterator<String> bindingIt;
        while (result.hasNext()) {
            file.append("\n");
            bindingSet = result.next();
            bindingIt = bindings.iterator();
            while (bindingIt.hasNext()) {
                bindingSet.getBinding(bindingIt.next()).ifPresent(binding ->
                        file.append(binding.getValue().stringValue()));
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

    private StreamingOutput createExcelResults(TupleQueryResult result, String type) {
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
