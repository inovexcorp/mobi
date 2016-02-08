package org.matonto.query;

import org.matonto.query.api.QueryResult;
import org.matonto.rdf.api.Statement;
import org.matonto.query.exception.QueryEvaluationException;

import java.util.Map;


public abstract class GraphQueryResult extends QueryResult<Statement> {

    /**
     * Retrieves relevant namespaces from the query result.
     *
     * @return a Map< String, String > object containing (prefix, namespace) pairs
     * @throws QueryEvaluationException when the query can not be properly evaluated
     */
    public abstract Map<String, String> getNamespaces() throws QueryEvaluationException;

}
