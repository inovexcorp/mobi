package org.matonto.query.api;

import org.matonto.query.GraphQueryResult;
import org.matonto.repository.exception.QueryEvaluationException;

public interface GraphQuery extends Query{

    GraphQueryResult evaluate() throws QueryEvaluationException;

}
