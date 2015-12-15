package org.matonto.repository.impl.sesame;

import org.matonto.repository.api.Repository;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.config.RepositoryConfig;
import org.matonto.repository.exception.RepositoryException;

import java.io.File;
import java.util.Optional;

public class SesameRepositoryWrapper implements Repository {

    org.openrdf.repository.Repository sesameRepository;
    RepositoryConfig config;

    public SesameRepositoryWrapper() {
    }

    public SesameRepositoryWrapper(org.openrdf.repository.Repository repository) {
        setDelegate(repository);
    }

    protected void setDelegate(org.openrdf.repository.Repository repository) {
        this.sesameRepository = repository;
    }

    public RepositoryConnection getConnection() throws RepositoryException {
        try {
            return new SesameRepositoryConnectionWrapper(sesameRepository.getConnection());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryConfig getConfig() {
        return config;
    }

    public void setConfig(RepositoryConfig config) {
        this.config = config;
    }

    public Optional<File> getDataDir() {
        File file = sesameRepository.getDataDir();

        return file == null ? Optional.empty() : Optional.of(file);
    }

    @Override
    public void initialize() throws RepositoryException {
        try {
            sesameRepository.initialize();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    public boolean isInitialized() {
        return sesameRepository.isInitialized();
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