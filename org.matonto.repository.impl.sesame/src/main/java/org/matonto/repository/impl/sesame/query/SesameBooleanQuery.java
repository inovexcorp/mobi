package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.BooleanQuery;
import org.matonto.query.exception.QueryEvaluationException;

public class SesameBooleanQuery extends SesameOperation implements BooleanQuery {

    private org.openrdf.query.BooleanQuery sesBooleanQuery;

    public SesameBooleanQuery(org.openrdf.query.BooleanQuery sesBooleanQuery) {
        super(sesBooleanQuery);
        this.sesBooleanQuery = sesBooleanQuery;
    }

    @Override
    public boolean evaluate() throws QueryEvaluationException {
        try {
            return sesBooleanQuery.evaluate();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }
}
