package org.matonto.repository.impl.sesame;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.impl.sesame.Values;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

public class SesameRepositoryConnectionWrapper implements RepositoryConnection {

    org.openrdf.repository.RepositoryConnection sesameConn;

    public SesameRepositoryConnectionWrapper(org.openrdf.repository.RepositoryConnection conn) {
        setDelegate(conn);
    }

    protected void setDelegate(org.openrdf.repository.RepositoryConnection conn) {
        this.sesameConn = conn;
    }

    public void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        try {
            if (contexts.length <= 0) {
                sesameConn.add(Values.sesameResource(subject), Values.sesameIRI(predicate), Values.sesameValue(object));
            } else {
                sesameConn.add(Values.sesameResource(subject), Values.sesameIRI(predicate),
                        Values.sesameValue(object), Values.sesameResources(contexts));
            }
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    public void clear(Resource... contexts) throws RepositoryException {
        try {
            if (contexts.length > 0) {
                sesameConn.clear(Values.sesameResources(contexts));
            } else {
                sesameConn.clear();
            }
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    public void close() throws RepositoryException {
        try {
            sesameConn.close();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public long size(Resource... contexts) throws RepositoryException {
        try {
            return sesameConn.size(Values.sesameResources(contexts));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryResult getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException {
        try {
            org.openrdf.repository.RepositoryResult<org.openrdf.model.Statement> sesameResults =
                    sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate), Values.sesameValue(object));

            return new SesameRepositoryResult(sesameResults);
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }
}
