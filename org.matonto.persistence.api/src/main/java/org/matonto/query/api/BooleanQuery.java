package org.matonto.query.api;

import org.matonto.query.exception.QueryEvaluationException;

public interface BooleanQuery extends Operation {

    boolean evaluate()
            throws QueryEvaluationException;

}
