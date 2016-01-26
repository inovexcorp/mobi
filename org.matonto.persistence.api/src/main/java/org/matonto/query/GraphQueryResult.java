package org.matonto.query;

import org.matonto.query.api.QueryResult;
import org.matonto.rdf.api.Statement;
import org.matonto.repository.exception.QueryEvaluationException;

import java.util.Map;


public abstract class GraphQueryResult extends QueryResult<Statement> {

    /**
     * Retrieves relevant namespaces from the query result.
     *
     * @return a Map<String, String> object containing (prefix, namespace) pairs.
     * @throws QueryEvaluationException
     */
    public abstract Map<String, String> getNamespaces() throws QueryEvaluationException;

}
