package org.matonto.repository.impl.sesame.query;

import org.matonto.query.GraphQueryResult;
import org.matonto.query.exception.QueryEvaluationException;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.core.utils.Values;

import java.util.Map;

public class SesameGraphQueryResult extends GraphQueryResult {

    org.openrdf.query.GraphQueryResult graphQueryResult;

    public SesameGraphQueryResult(org.openrdf.query.GraphQueryResult graphQueryResult) {
        this.graphQueryResult = graphQueryResult;
    }

    @Override
    public Map<String, String> getNamespaces() throws QueryEvaluationException {
        try {
            return graphQueryResult.getNamespaces();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void close() throws QueryEvaluationException {
        try {
            graphQueryResult.close();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public boolean hasNext() throws QueryEvaluationException {
        try {
            return graphQueryResult.hasNext();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public Statement next() throws QueryEvaluationException {
        try {
            return Values.matontoStatement(graphQueryResult.next());
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    @Override
    public void remove() throws QueryEvaluationException {
        try {
            graphQueryResult.remove();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }
}
