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
import org.matonto.sparql.rest.SparqlRest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ws.rs.core.Response;
import java.util.Timer;
import java.util.TimerTask;

@Component(immediate = true)
public class SparqlRestImpl implements SparqlRest {

//    private static final int QUERY_TIME_OUT_SECONDS = 120;

    private RepositoryManager repositoryManager;

    private final Logger log = LoggerFactory.getLogger(SparqlRestImpl.class);

    @Reference
    public void setRepository(RepositoryManager repositoryManager) {
        this.repositoryManager = repositoryManager;
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

        Repository repository = repositoryManager.getRepository("system")
                .orElseThrow(() -> new MatOntoException("Repository is not available."));
        RepositoryConnection conn = repository.getConnection();

        TupleQuery query = conn.prepareTupleQuery(queryString);
        TupleQueryResult queryResults = query.evaluate();

        if (queryResults.hasNext()) {
            try {
                JSONObject json = JSONQueryResults.getResults(queryResults);
                return Response.ok().entity(json.toString()).build();
            } catch (MatOntoException ex) {
                throw ErrorUtils.sendError(ex.getMessage(), Response.Status.BAD_REQUEST);
            }
        } else {
            return null;
        }
    }
}
