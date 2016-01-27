package org.matonto.query.exception;

import org.matonto.exception.MatOntoException;

public class UpdateInterruptedException extends MatOntoException {

    public UpdateInterruptedException() {
        super();
    }

    public UpdateInterruptedException(String message) {
        super(message);
    }

    public UpdateInterruptedException(Throwable exception) {
        super(exception);
    }

    public UpdateInterruptedException(String message, Throwable exception) {
        super(message, exception);
    }

}
