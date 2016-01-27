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
        try {
            return tupleQueryResult.getBindingNames();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void close() throws QueryEvaluationException {
        try {
            tupleQueryResult.close();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public boolean hasNext() throws QueryEvaluationException {
        try {
            return tupleQueryResult.hasNext();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public BindingSet next() throws QueryEvaluationException {
        try {
            return new SesameBindingSet(tupleQueryResult.next());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void remove() throws QueryEvaluationException {
        try {
            tupleQueryResult.close();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

}
