package org.matonto.query.exception;

import org.matonto.exception.MatOntoException;

public class QueryEvaluationException extends MatOntoException {

    public QueryEvaluationException() {
        super();
    }

    public QueryEvaluationException(String message) {
        super(message);
    }

    public QueryEvaluationException(Throwable exception) {
        super(exception);
    }

    public QueryEvaluationException(String message, Throwable exception) {
        super(message, exception);
    }

}
