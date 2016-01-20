package org.matonto.repository.impl.sesame.query;

import org.matonto.query.GraphQueryResult;
import org.matonto.query.api.GraphQuery;
import org.matonto.repository.exception.QueryEvaluationException;

public class SesameGraphQuery implements GraphQuery {

    private org.openrdf.query.GraphQuery sesameGraphQuery;

    public SesameGraphQuery( org.openrdf.query.GraphQuery sesameGraphQuery) {
        setDelegate(sesameGraphQuery);
    }

    protected void setDelegate(org.openrdf.query.GraphQuery sesameGraphQuery) {
        this.sesameGraphQuery = sesameGraphQuery;
    }

    @Override
    public GraphQueryResult evaluate() throws QueryEvaluationException {
        return null;
    }

}
