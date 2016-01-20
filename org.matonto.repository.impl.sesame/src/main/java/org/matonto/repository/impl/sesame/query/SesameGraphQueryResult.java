package org.matonto.repository.impl.sesame.query;

import org.openrdf.model.Statement;
import org.openrdf.query.GraphQueryResult;
import org.openrdf.query.QueryEvaluationException;

import java.util.Map;

public class SesameGraphQueryResult implements GraphQueryResult {

    @Override
    public Map<String, String> getNamespaces() throws QueryEvaluationException {
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
    public Statement next() throws QueryEvaluationException {
        return null;
    }

    @Override
    public void remove() throws QueryEvaluationException {

    }
}
