package org.matonto.repository.base;

import org.matonto.repository.api.DelegatingRepositoryConnection;
import org.matonto.repository.api.RepositoryConnection;

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
}
