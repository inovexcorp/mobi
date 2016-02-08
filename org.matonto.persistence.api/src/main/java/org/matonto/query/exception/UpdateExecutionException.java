package org.matonto.query.exception;

import org.matonto.exception.MatOntoException;

public class UpdateExecutionException extends MatOntoException {

    public UpdateExecutionException() {
        super();
    }

    public UpdateExecutionException(String message) {
        super(message);
    }

    public UpdateExecutionException(Throwable exception) {
        super(exception);
    }

    public UpdateExecutionException(String message, Throwable exception) {
        super(message, exception);
    }
    
}
