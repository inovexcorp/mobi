package org.matonto.query.api;

import org.matonto.query.TupleQueryResult;
import org.matonto.query.exception.QueryEvaluationException;

public interface TupleQuery extends Operation {

    /**
     * Evaluates the SPARQL tuple query and returns the result.
     * @return a TupleQueryResult with the results of the query
     * @throws QueryEvaluationException if there is an error processing the query
     */
    TupleQueryResult evaluate() throws QueryEvaluationException;

}
