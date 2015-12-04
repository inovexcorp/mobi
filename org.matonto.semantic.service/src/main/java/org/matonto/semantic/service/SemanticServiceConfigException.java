package org.matonto.semantic.service;

import org.matonto.exception.MatOntoException;

public class SemanticServiceConfigException extends MatOntoException {

    public SemanticServiceConfigException() {
        super();
    }

    public SemanticServiceConfigException(String message) {
        super(message);
    }

    public SemanticServiceConfigException(Throwable t) {
        super(t);
    }

    public SemanticServiceConfigException(String message, Throwable t) {
        super(message, t);
    }
}
