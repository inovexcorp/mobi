package org.matonto.repository.impl.sesame.query;

import org.matonto.query.api.BooleanQuery;
import org.matonto.query.exception.QueryEvaluationException;

public class SesameBooleanQuery extends SesameOperation implements BooleanQuery {

    private org.openrdf.query.BooleanQuery sesameBooleanQuery;

    public SesameBooleanQuery(org.openrdf.query.BooleanQuery sesameBooleanQuery) {
        super(sesameBooleanQuery);
        this.sesameBooleanQuery = sesameBooleanQuery;
    }

    @Override
    public boolean evaluate() throws QueryEvaluationException {
        try {
            return sesameBooleanQuery.evaluate();
        } catch (org.openrdf.query.QueryEvaluationException e) {
            throw new QueryEvaluationException(e);
        }
    }

    public String toString() {
        return sesameBooleanQuery.toString();
    }
}
