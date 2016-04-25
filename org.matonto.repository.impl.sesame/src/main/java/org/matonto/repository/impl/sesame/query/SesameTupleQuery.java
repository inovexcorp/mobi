package org.matonto.repository.impl.sesame.query;

import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.TupleQuery;
import org.matonto.query.exception.QueryEvaluationException;

public class SesameTupleQuery extends SesameOperation implements TupleQuery {

    private org.openrdf.query.TupleQuery sesameTupleQuery;

    public SesameTupleQuery(org.openrdf.query.TupleQuery sesameTupleQuery) {
        super(sesameTupleQuery);
        setDelegate(sesameTupleQuery);
    }

    protected void setDelegate(org.openrdf.query.TupleQuery tupleQuery) {
        this.sesameTupleQuery = tupleQuery;
    }

    @Override
    public TupleQueryResult evaluate() throws QueryEvaluationException {
        try {
            return new SesameTupleQueryResult(sesameTupleQuery.evaluate());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameTupleQuery.toString();
    }
}
