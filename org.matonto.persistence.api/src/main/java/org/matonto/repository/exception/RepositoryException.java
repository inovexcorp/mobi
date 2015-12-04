package org.matonto.repository.exception;

import org.matonto.exception.MatOntoException;

public class RepositoryException extends MatOntoException {

    private static final long serialVersionUID = -6163996571635121845L;

    public RepositoryException() {
        super();
    }

    public RepositoryException(String message) {
        super(message);
    }

    public RepositoryException(Throwable t) {
        super(t);
    }

    public RepositoryException(String message, Throwable t) {
        super(message, t);
    }
}
