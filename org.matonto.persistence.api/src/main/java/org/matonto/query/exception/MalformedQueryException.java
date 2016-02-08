package org.matonto.query.exception;

import org.matonto.exception.MatOntoException;

public class MalformedQueryException extends MatOntoException {

    public MalformedQueryException() {
        super();
    }

    public MalformedQueryException(String message) {
        super(message);
    }

    public MalformedQueryException(Throwable exception) {
        super(exception);
    }

    public MalformedQueryException(String message, Throwable exception) {
        super(message, exception);
    }

}
