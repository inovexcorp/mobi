package org.matonto.query.exception;

import org.matonto.exception.MatOntoException;

public class QueryInterruptedException extends MatOntoException {

    public QueryInterruptedException() {
        super();
    }

    public QueryInterruptedException(String message) {
        super(message);
    }

    public QueryInterruptedException(Throwable exception) {
        super(exception);
    }

    public QueryInterruptedException(String message, Throwable exception) {
        super(message, exception);
    }

}
