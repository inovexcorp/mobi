package org.matonto.query.api;

import org.matonto.query.GraphQueryResult;
import org.matonto.query.exception.QueryEvaluationException;

public interface GraphQuery extends Operation {

    /**
     * Evaluates a SPARQL Graph Query.
     * @return a GraphQueryResult based on the graph query given
     * @throws QueryEvaluationException If there is an error processing the query
     */
    GraphQueryResult evaluate() throws QueryEvaluationException;

}
