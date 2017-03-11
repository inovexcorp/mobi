package org.matonto.repository.api;

public interface DelegatingRepositoryConnection extends RepositoryConnection {

    /**
     * Gets the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     *
     * @return the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     */
    RepositoryConnection getDelegate();

    /**
     * Sets the RepositoryConnection wrapped by this DelegatingRepositoryConnection.
     *
     * @param delegate - The RepositoryConnection to be wrapped by this DelegatingRepositoryConnection.
     */
    void setDelegate(RepositoryConnection delegate);
}
