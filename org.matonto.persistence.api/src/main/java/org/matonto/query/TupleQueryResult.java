package org.matonto.query;

import org.matonto.query.api.BindingSet;
import org.matonto.query.api.QueryResult;
import org.matonto.repository.exception.QueryEvaluationException;

import java.util.List;

public abstract class TupleQueryResult extends QueryResult<BindingSet> {

    /**
     * Gets the names of the bindings, in order of projection.
     *
     * @return The binding names, in order of projection.
     * @throws QueryEvaluationException
     */

    public abstract List<String> getBindingNames()
            throws QueryEvaluationException;

}
