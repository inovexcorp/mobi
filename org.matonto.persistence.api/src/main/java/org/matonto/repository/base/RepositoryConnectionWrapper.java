package org.matonto.repository.base;

import org.matonto.repository.api.DelegatingRepositoryConnection;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.exception.RepositoryException;

public abstract class RepositoryConnectionWrapper implements DelegatingRepositoryConnection {

    private volatile RepositoryConnection delegate;

    public RepositoryConnectionWrapper() {
    }

    public RepositoryConnectionWrapper(RepositoryConnection delegate) {
        setDelegate(delegate);
    }

    @Override
    public RepositoryConnection getDelegate() {
        return this.delegate;
    }

    @Override
    public void setDelegate(RepositoryConnection delegate) {
        this.delegate = delegate;
    }

    @Override
    public void close() throws RepositoryException {
        getDelegate().close();
    }

    @Override
    public void begin() throws RepositoryException {
        getDelegate().begin();
    }

    @Override
    public void commit() throws RepositoryException {
        getDelegate().commit();
    }

    @Override
    public void rollback() throws RepositoryException {
        getDelegate().rollback();
    }

    @Override
    public boolean isActive() throws RepositoryException {
        return getDelegate().isActive();
    }
}
