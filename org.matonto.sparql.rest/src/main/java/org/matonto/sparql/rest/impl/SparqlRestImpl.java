package org.matonto.sparql.rest.impl;

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import net.sf.json.JSONObject;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.JSONQueryResults;
import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.api.RepositoryManager;
import org.matonto.rest.util.ErrorUtils;
import org.matonto.rest.util.jaxb.Links;
import org.matonto.rest.util.jaxb.PaginatedResults;
import org.matonto.sparql.rest.SparqlRest;
import org.matonto.sparql.rest.jaxb.SparqlPaginatedResults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;
import java.util.List;

@Component(immediate = true)
public class SparqlRestImpl implements SparqlRest {

//    private static final int QUERY_TIME_OUT_SECONDS = 120;

    private RepositoryManager repositoryManager;

    private final Logger log = LoggerFactory.getLogger(SparqlRestImpl.class);

    @Reference
    public void setRepository(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
    }

    private TupleQueryResult getQueryResults(String queryString) {
        Repository repository = repositoryManager.getRepository("system")
                .orElseThrow(() -> ErrorUtils.sendError("Repository is not available.", Response.Status.BAD_REQUEST));
        RepositoryConnection conn = repository.getConnection();

        TupleQuery query = conn.prepareTupleQuery(queryString);
        return query.evaluate();
    }

    @Override
    public Response queryRdf(String queryString) {
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

        TupleQueryResult queryResults = getQueryResults(queryString);

        if (queryResults.hasNext()) {
            try {
                JSONObject json = JSONQueryResults.getResponse(queryResults);
                return Response.ok().entity(json.toString()).build();
            } catch (MatOntoException ex) {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else {
            return null;
        }
    }

    @Override
    public SparqlPaginatedResults<JSONObject> getPagedResults(String queryString, UriInfo uriInfo, int limit,
                                                              int start) {
        TupleQueryResult queryResults = getQueryResults(queryString);

        if (queryResults.hasNext()) {
            List<JSONObject> bindings = JSONQueryResults.getBindings(queryResults);

            PaginatedResults<JSONObject> paginatedResults = new PaginatedResults<>();

            if((start + limit) > bindings.size()) {
                paginatedResults.setResults(bindings);
            } else {
                paginatedResults.setResults(bindings.subList(start, start + limit));
            }

            paginatedResults.setLimit(limit);
            paginatedResults.setStart(start);
            paginatedResults.setTotalSize(bindings.size());
            // TODO: this depends on the size parameter we don't have at the moment
            paginatedResults.setLinks(new Links());
            // TODO: get size which will stop at some point
            paginatedResults.setSize(0);

            SparqlPaginatedResults<JSONObject> response = new SparqlPaginatedResults<>();
            response.setBindingNames(queryResults.getBindingNames());
            response.setPaginatedResults(paginatedResults);

            return response;
        } else {
            return null;
        }
    }
}
