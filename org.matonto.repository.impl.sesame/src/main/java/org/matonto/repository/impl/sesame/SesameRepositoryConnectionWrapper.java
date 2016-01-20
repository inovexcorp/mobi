package org.matonto.repository.impl.sesame;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.utils.Values;
import org.matonto.rdf.core.impl.sesame.factory.ResourceValueFactory;
import org.matonto.rdf.core.impl.sesame.factory.StatementValueFactory;
import org.matonto.repository.api.Repository;
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

    @Override
    public void add(Statement stmt, Resource... contexts) throws RepositoryException {
        try {
            if (contexts.length > 0) {
                sesameConn.add(Values.sesameStatement(stmt), Values.sesameResources(contexts));
            } else {
                sesameConn.add(Values.sesameStatement(stmt));
            }
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        if (contexts.length > 0) {
            statements.forEach(stmt -> add(stmt, contexts));
        } else {
            statements.forEach(this::add);
        }
    }

    @Override
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

    @Override
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

    @Override
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
    public RepositoryResult<Statement> getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException {
        try {
            org.openrdf.repository.RepositoryResult<org.openrdf.model.Statement> sesameResults;

            if (contexts.length > 0) {
                sesameResults = sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                        Values.sesameValue(object), Values.sesameResources(contexts));
            } else {
                 sesameResults = sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                         Values.sesameValue(object));
            }

            return new SesameRepositoryResult<>(sesameResults, new StatementValueFactory());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryResult<Resource> getContextIDs() throws RepositoryException {
        try {
            return new SesameRepositoryResult<>(sesameConn.getContextIDs(), new ResourceValueFactory());
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void begin() throws RepositoryException {
        try{
            sesameConn.begin();
        } catch (org.openrdf.repository.RepositoryException e){
            throw new RepositoryException(e);
        }
    }

    @Override
    public void commit() throws RepositoryException {
        try{
            sesameConn.commit();
        } catch (org.openrdf.repository.RepositoryException e){
            throw new RepositoryException(e);
        }
    }

    @Override
    public void rollback() throws RepositoryException {
        try{
            sesameConn.rollback();
        } catch (org.openrdf.repository.RepositoryException e){
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean isActive() throws RepositoryException {
        try{
            return sesameConn.isActive();
        } catch (org.openrdf.repository.RepositoryException e){
            throw new RepositoryException(e);
        }
    }

}
