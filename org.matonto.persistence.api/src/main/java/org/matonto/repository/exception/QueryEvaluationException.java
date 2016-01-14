package org.matonto.repository.exception;

import org.matonto.exception.MatOntoException;

public class QueryEvaluationException extends MatOntoException {

    public QueryEvaluationException() {
        super();
    }

    public QueryEvaluationException(String message) {
        super(message);
    }

    public QueryEvaluationException(Throwable t) {
        super(t);
    }

    public QueryEvaluationException(String message, Throwable t) {
        super(message, t);
    }

}
