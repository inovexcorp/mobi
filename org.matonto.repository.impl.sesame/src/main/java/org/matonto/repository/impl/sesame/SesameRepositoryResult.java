package org.matonto.repository.impl.sesame;

import org.matonto.rdf.core.impl.sesame.factory.SesameMatOntoValueFactory;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

public class SesameRepositoryResult<T, U> extends RepositoryResult<T> {

    private org.openrdf.repository.RepositoryResult<U> sesameResults;
    private SesameMatOntoValueFactory<T, U> factory;

    public SesameRepositoryResult(org.openrdf.repository.RepositoryResult<U> results, SesameMatOntoValueFactory<T, U> factory) {
        this.sesameResults = results;
        this.factory = factory;
    }

    @Override
    public boolean hasNext() {
        try {
            return sesameResults.hasNext();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public T next() {
        try {
            return factory.asMatOntoObject(sesameResults.next());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }
}
