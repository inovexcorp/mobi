package org.matonto.query;

import org.matonto.query.api.BindingSet;
import org.matonto.query.api.QueryResult;
import org.matonto.query.exception.QueryEvaluationException;

import java.util.List;

public abstract class TupleQueryResult extends QueryResult<BindingSet> {

    /**
     * Gets the names of the bindings, in order of projection.
     *
     * @return The binding names, in order of projection.
     * @throws QueryEvaluationException when the query can not be properly evaluated
     */
    public abstract List<String> getBindingNames()
            throws QueryEvaluationException;

}
