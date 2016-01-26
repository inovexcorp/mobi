package org.matonto.query.api;

import org.matonto.query.GraphQueryResult;
import org.matonto.repository.exception.QueryEvaluationException;

public interface GraphQuery extends Query{

    /**
     * Evaluates a SPARQL Graph Query
     * @return a GraphQueryResult based on the graph query given
     * @throws QueryEvaluationException If there is an error processing the query
     */
    GraphQueryResult evaluate() throws QueryEvaluationException;

}
