package org.matonto.repository.impl.sesame.query;

import org.openrdf.query.BindingSet;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.TupleQueryResult;

import java.util.List;

public class SesameTupleQueryResult implements TupleQueryResult {

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
