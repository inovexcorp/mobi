package com.mobi.repository.impl.sesame;

/*-
 * #%L
 * com.mobi.repository.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.exception.MobiException;
import com.mobi.query.api.BooleanQuery;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.Operation;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.api.Update;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.core.impl.sesame.factory.ResourceValueFactory;
import com.mobi.rdf.core.impl.sesame.factory.StatementValueFactory;
import com.mobi.rdf.core.utils.SesameStatementIterable;
import com.mobi.rdf.core.utils.Values;
import com.mobi.repository.api.IsolationLevels;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;
import com.mobi.repository.impl.sesame.query.SesameBooleanQuery;
import com.mobi.repository.impl.sesame.query.SesameGraphQuery;
import com.mobi.repository.impl.sesame.query.SesameOperation;
import com.mobi.repository.impl.sesame.query.SesameTupleQuery;
import com.mobi.repository.impl.sesame.query.SesameUpdate;
import org.eclipse.rdf4j.OpenRDFException;
import org.eclipse.rdf4j.query.QueryLanguage;

public class SesameRepositoryConnectionWrapper implements RepositoryConnection {

    org.eclipse.rdf4j.repository.RepositoryConnection sesameConn;

    public SesameRepositoryConnectionWrapper(org.eclipse.rdf4j.repository.RepositoryConnection conn) {
        setDelegate(conn);
    }

    protected void setDelegate(org.eclipse.rdf4j.repository.RepositoryConnection conn) {
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
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        try {
            SesameStatementIterable iterable = new SesameStatementIterable(statements);

            if (contexts.length > 0) {
                sesameConn.add(iterable, Values.sesameResources(contexts));
            } else {
                sesameConn.add(iterable);
            }
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
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
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void remove(Statement stmt, Resource... contexts) throws RepositoryException {
        try {
            if (contexts.length > 0) {
                sesameConn.remove(Values.sesameStatement(stmt), Values.sesameResources(contexts));
            } else {
                sesameConn.remove(Values.sesameStatement(stmt));
            }
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        try {
            SesameStatementIterable iterable = new SesameStatementIterable(statements);

            if (contexts.length > 0) {
                sesameConn.remove(iterable, Values.sesameResources(contexts));
            } else {
                sesameConn.remove(iterable);
            }
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        try {
            if (contexts.length <= 0) {
                sesameConn.remove(Values.sesameResource(subject), Values.sesameIRI(predicate), Values.sesameValue(object));
            } else {
                sesameConn.remove(Values.sesameResource(subject), Values.sesameIRI(predicate),
                        Values.sesameValue(object), Values.sesameResources(contexts));
            }
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
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
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void close() throws RepositoryException {
        try {
            sesameConn.close();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public long size(Resource... contexts) throws RepositoryException {
        try {
            return sesameConn.size(Values.sesameResources(contexts));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryResult<Statement>
            getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException {
        try {
            org.eclipse.rdf4j.repository.RepositoryResult<org.eclipse.rdf4j.model.Statement> sesameResults;

            if (contexts.length > 0) {
                sesameResults = sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                        Values.sesameValue(object), Values.sesameResources(contexts));
            } else {
                sesameResults = sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                         Values.sesameValue(object));
            }

            return new SesameRepositoryResult<>(sesameResults, new StatementValueFactory());
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean contains(Resource subject, IRI predicate, Value object, Resource... contexts) {
        try {
            return sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), Values.sesameResources(contexts)).hasNext();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean containsContext(Resource context) {
        try {
            return sesameConn.getStatements(null, null, null, Values.sesameResources(context)).hasNext();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public RepositoryResult<Resource> getContextIDs() throws RepositoryException {
        try {
            return new SesameRepositoryResult<>(sesameConn.getContextIDs(), new ResourceValueFactory());
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void begin() throws RepositoryException {
        try {
            sesameConn.begin();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void begin(IsolationLevels isolationLevel) throws RepositoryException {
        switch (isolationLevel){
            case NONE:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.NONE);
                return;
            case READ_UNCOMMITTED:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.READ_UNCOMMITTED);
                return;
            case READ_COMMITTED:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.READ_COMMITTED);
                return;
            case SNAPSHOT_READ:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.SNAPSHOT_READ);
                return;
            case SNAPSHOT:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.SNAPSHOT);
                return;
            case SERIALIZABLE:
                sesameConn.begin(org.eclipse.rdf4j.IsolationLevels.SERIALIZABLE);
                return;
            default:
                sesameConn.begin();
        }
    }

    @Override
    public void commit() throws RepositoryException {
        try {
            sesameConn.commit();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void rollback() throws RepositoryException {
        try {
            sesameConn.rollback();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean isActive() throws RepositoryException {
        try {
            return sesameConn.isActive();
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public Operation prepareQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameOperation(sesameConn.prepareQuery(query));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Operation prepareQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameOperation(sesameConn.prepareQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public TupleQuery prepareTupleQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameTupleQuery(sesameConn.prepareTupleQuery(query));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public TupleQuery prepareTupleQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameTupleQuery(sesameConn.prepareTupleQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public GraphQuery prepareGraphQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameGraphQuery(sesameConn.prepareGraphQuery(query));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public GraphQuery prepareGraphQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameGraphQuery(sesameConn.prepareGraphQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameBooleanQuery(sesameConn.prepareBooleanQuery(query));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameBooleanQuery(sesameConn.prepareBooleanQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Update prepareUpdate(String update) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameUpdate(sesameConn.prepareUpdate(update));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

    @Override
    public Update prepareUpdate(String update, String baseURI) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameUpdate(sesameConn.prepareUpdate(QueryLanguage.SPARQL, update, baseURI));
        } catch (org.eclipse.rdf4j.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.eclipse.rdf4j.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MobiException(e);
        }
    }

}
