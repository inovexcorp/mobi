package org.matonto.repository.impl.sesame;

import org.matonto.repository.api.Repository;
import org.matonto.repository.exception.RepositoryException;

public class SesameRepositoryWrapper implements Repository {

    org.openrdf.repository.Repository sesameRepository;

    public SesameRepositoryWrapper() {}

    public SesameRepositoryWrapper(org.openrdf.repository.Repository repository) {
        setDelegate(repository);
    }

    protected void setDelegate(org.openrdf.repository.Repository repository) {
        this.sesameRepository = repository;
    }

    @Override
    public void initialize() throws RepositoryException {
        try {
            sesameRepository.initialize();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void shutDown() throws RepositoryException {
        try {
            sesameRepository.shutDown();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }
}
