package org.matonto.exception;

/**
 * General superclass of all unchecked exceptions that parts of MatOnto can throw.
 */
public class MatOntoException extends RuntimeException {

    private static final long serialVersionUID = -1446928426692064348L;

    public MatOntoException() {
        super();
    }

    public MatOntoException(String msg) {
        super(msg);
    }

    public MatOntoException(Throwable t) {
        super(t);
    }

    public MatOntoException(String msg, Throwable t) {
        super(msg, t);
    }
}
