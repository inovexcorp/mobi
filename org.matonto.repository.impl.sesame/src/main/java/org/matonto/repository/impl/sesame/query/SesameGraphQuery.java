package org.matonto.repository.impl.sesame.query;

import org.matonto.query.GraphQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.api.GraphQuery;
import org.matonto.query.exception.QueryEvaluationException;
import org.matonto.rdf.api.Value;

public class SesameGraphQuery extends SesameOperation implements GraphQuery {

    private org.openrdf.query.GraphQuery sesameGraphQuery;

    public SesameGraphQuery( org.openrdf.query.GraphQuery sesameGraphQuery) {
        super(sesameGraphQuery);
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
