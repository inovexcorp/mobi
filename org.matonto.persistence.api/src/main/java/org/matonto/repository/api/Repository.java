package org.matonto.repository.api;

import org.matonto.repository.exception.RepositoryException;

public interface Repository {

    void initialize() throws RepositoryException;

    void shutDown() throws RepositoryException;
}
