package org.matonto.repository.impl.sesame.query;

import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.repository.exception.QueryEvaluationException;

public class SesameTupleQuery implements TupleQuery {

    org.openrdf.query.TupleQuery sesameTupleQuery;

    public SesameTupleQuery(org.openrdf.query.TupleQuery sesameTupleQuery) {
        setDelegate(sesameTupleQuery);
    }

    protected void setDelegate(org.openrdf.query.TupleQuery tupleQuery) {
        this.sesameTupleQuery = tupleQuery;
    }


    public TupleQueryResult evaluate() throws QueryEvaluationException {
        return null;
    }
}
