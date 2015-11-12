package org.matonto.repository.config;

import org.matonto.exception.MatOntoException;

public class RepositoryConfigException extends MatOntoException {

    private static final long serialVersionUID = 5046054081775405906L;

    public RepositoryConfigException() {
        super();
    }

    public RepositoryConfigException(String message) {
        super(message);
    }

    public RepositoryConfigException(Throwable t) {
        super(t);
    }

    public RepositoryConfigException(String message, Throwable t) {
        super(message, t);
    }
}
