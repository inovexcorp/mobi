package org.matonto.repository.impl.sesame;

/*-
 * #%L
 * org.matonto.repository.impl.sesame
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

import org.matonto.exception.MatOntoException;
import org.matonto.query.api.*;
import org.matonto.query.exception.MalformedQueryException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.core.impl.sesame.factory.ResourceValueFactory;
import org.matonto.rdf.core.impl.sesame.factory.StatementValueFactory;
import org.matonto.rdf.core.utils.Values;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;
import org.matonto.repository.impl.sesame.query.*;
import org.openrdf.OpenRDFException;
import org.openrdf.query.QueryLanguage;

import java.util.HashSet;
import java.util.Set;

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
        try {
            Set<org.openrdf.model.Statement> sesameStatements = new HashSet<>();
            statements.forEach(stmt -> sesameStatements.add(Values.sesameStatement(stmt)));

            if (contexts.length > 0) {
                sesameConn.add(sesameStatements, Values.sesameResources(contexts));
            } else {
                sesameConn.add(sesameStatements);
            }
        } catch (org.openrdf.repository.RepositoryException e) {
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
        } catch (org.openrdf.repository.RepositoryException e) {
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
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        try {
            Set<org.openrdf.model.Statement> sesameStatements = new HashSet<>();
            statements.forEach(stmt -> sesameStatements.add(Values.sesameStatement(stmt)));

            if (contexts.length > 0) {
                sesameConn.remove(sesameStatements, Values.sesameResources(contexts));
            } else {
                sesameConn.remove(sesameStatements);
            }
        } catch (org.openrdf.repository.RepositoryException e) {
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
    public RepositoryResult<Statement>
            getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
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
    public boolean contains(Resource subject, IRI predicate, Value object, Resource... contexts) {
        try {
            return sesameConn.getStatements(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), Values.sesameResources(contexts)).hasNext();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean containsContext(Resource context) {
        try {
            return sesameConn.getStatements(null, null, null, Values.sesameResources(context)).hasNext();
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
        try {
            sesameConn.begin();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void commit() throws RepositoryException {
        try {
            sesameConn.commit();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public void rollback() throws RepositoryException {
        try {
            sesameConn.rollback();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public boolean isActive() throws RepositoryException {
        try {
            return sesameConn.isActive();
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        }
    }

    @Override
    public Operation prepareQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameOperation(sesameConn.prepareQuery(query));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public Operation prepareQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameOperation(sesameConn.prepareQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public TupleQuery prepareTupleQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameTupleQuery(sesameConn.prepareTupleQuery(query));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public TupleQuery prepareTupleQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameTupleQuery(sesameConn.prepareTupleQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public GraphQuery prepareGraphQuery(String query)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameGraphQuery(sesameConn.prepareGraphQuery(query));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public GraphQuery prepareGraphQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException {
        try {
            return new SesameGraphQuery(sesameConn.prepareGraphQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameBooleanQuery(sesameConn.prepareBooleanQuery(query));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameBooleanQuery(sesameConn.prepareBooleanQuery(QueryLanguage.SPARQL, query, baseURI));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public Update prepareUpdate(String update) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameUpdate(sesameConn.prepareUpdate(update));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

    @Override
    public Update prepareUpdate(String update, String baseURI) throws RepositoryException, MalformedQueryException {
        try {
            return new SesameUpdate(sesameConn.prepareUpdate(QueryLanguage.SPARQL, update, baseURI));
        } catch (org.openrdf.repository.RepositoryException e) {
            throw new RepositoryException(e);
        } catch (org.openrdf.query.MalformedQueryException e) {
            throw new MalformedQueryException(e);
        } catch (OpenRDFException e) {
            throw new MatOntoException(e);
        }
    }

}
