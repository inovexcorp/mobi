package com.mobi.sparql.rest.impl;

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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.persistence.utils.JSONQueryResults;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.BindingSet;
import com.mobi.rest.util.MobiWebException;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.query.api.Binding;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.api.RepositoryManager;
import com.mobi.rest.util.ErrorUtils;
import com.mobi.rest.util.LinksUtils;
import com.mobi.rest.util.jaxb.Links;
import com.mobi.sparql.rest.SparqlRest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Component(immediate = true)
public class SparqlRestImpl implements SparqlRest {

    // private static final int QUERY_TIME_OUT_SECONDS = 120;

    private RepositoryManager repositoryManager;
    private DatasetManager datasetManager;
    private ValueFactory valueFactory;

    private final Logger log = LoggerFactory.getLogger(SparqlRestImpl.class);

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
            Response response = Response.status(status)
                    .entity(new JSONObject().element("details", ex.getMessage()).toString())
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
            Response response = Response.status(status)
                    .entity(new JSONObject().element("details", ex.getCause().getMessage()).toString())
                    .build();
            throw ErrorUtils.sendError(ex, statusText, response);
        } catch (MobiException ex) {
            throw ErrorUtils.sendError(ex, ex.getMessage(), Response.Status.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Response queryRdf(String queryString, String datasetRecordId) {
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
                JSONObject json = JSONQueryResults.getResponse(queryResults);
                return Response.ok().entity(json).build();
            } catch (MobiException ex) {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else {
            return Response.noContent().build();
        }
    }

    @Override
    public Response downloadQuery(String queryString, String datasetRecordId, String fileExtension, String fileName) {
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

    @Override
    public Response getPagedResults(UriInfo uriInfo, String queryString, String datasetRecordId, int limit,
                                    int offset) {
        LinksUtils.validateParams(limit, offset);
        TupleQueryResult queryResults;
        if (!StringUtils.isBlank(datasetRecordId)) {
            Resource recordId = valueFactory.createIRI(datasetRecordId);
            queryResults = getDatasetQueryResults(queryString, recordId);
        } else {
            queryResults = getQueryResults(queryString);
        }
        if (queryResults.hasNext()) {
            List<JSONObject> bindings = JSONQueryResults.getBindings(queryResults);
            if (offset > bindings.size()) {
                throw ErrorUtils.sendError("Offset exceeds total size", Response.Status.BAD_REQUEST);
            }
            JSONArray results;
            int size;
            if ((offset + limit) > bindings.size()) {
                results = JSONArray.fromObject(bindings.subList(offset, bindings.size()));
                size = bindings.size() - offset;
            } else {
                results = JSONArray.fromObject(bindings.subList(offset, offset + limit));
                size = limit;
            }
            JSONObject response = new JSONObject().element("data", results)
                    .element("bindings", JSONArray.fromObject(queryResults.getBindingNames()));
            Response.ResponseBuilder builder = Response.ok(response).header("X-Total-Count", bindings.size());
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
                bindingSet.getBinding(bindingIt.next()).ifPresent(binding -> file.append(binding.getValue().stringValue()));
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
