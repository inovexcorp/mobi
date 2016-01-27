package org.matonto.repository.impl.sesame.query;

import org.matonto.query.TupleQueryResult;
import org.matonto.query.api.BindingSet;
import org.matonto.query.exception.QueryEvaluationException;

import java.util.List;

public class SesameTupleQueryResult extends TupleQueryResult {

    private org.openrdf.query.TupleQueryResult tupleQueryResult;

    public SesameTupleQueryResult(org.openrdf.query.TupleQueryResult tupleQueryResult) {
        this.tupleQueryResult = tupleQueryResult;
    }

    @Override
    public List<String> getBindingNames() throws QueryEvaluationException {
        return null;
    }

    @Override
    public void close() throws QueryEvaluationException {

    }

    @Override
    public boolean hasNext() throws QueryEvaluationException {
        return false;
    }

    @Override
    public BindingSet next() throws QueryEvaluationException {
        return null;
    }

    @Override
    public void remove() throws QueryEvaluationException {

    }

}
