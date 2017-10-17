package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.Statement;
import com.mobi.query.api.BooleanQuery;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.Operation;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.api.Update;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Value;
import com.mobi.repository.api.RepositoryConnection;
import com.mobi.repository.base.RepositoryConnectionWrapper;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;

public class ReadOnlyRepositoryConnection extends RepositoryConnectionWrapper {

    public ReadOnlyRepositoryConnection(RepositoryConnection conn) {
        super(conn);
    }

    @Override
    public long size(Resource... resources) throws RepositoryException {
        return getDelegate().size(resources);
    }

    @Override
    public boolean contains(Resource resource, IRI iri, Value value, Resource... resources) throws RepositoryException {
        return getDelegate().contains(resource, iri, value, resources);
    }

    @Override
    public boolean containsContext(Resource resource) throws RepositoryException {
        return getDelegate().containsContext(resource);
    }

    @Override
    public RepositoryResult<Resource> getContextIDs() throws RepositoryException {
        return getDelegate().getContextIDs();
    }

    @Override
    public RepositoryResult<Statement> getStatements(Resource resource, IRI iri, Value value, Resource... resources) throws RepositoryException {
        return getDelegate().getStatements(resource, iri, value, resources);
    }

    @Override
    public Operation prepareQuery(String s) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareQuery(s);
    }

    @Override
    public Operation prepareQuery(String s, String s1) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareQuery(s, s1);
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String s) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareBooleanQuery(s);
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String s, String s1) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareBooleanQuery(s, s1);
    }

    @Override
    public GraphQuery prepareGraphQuery(String s) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareGraphQuery(s);
    }

    @Override
    public GraphQuery prepareGraphQuery(String s, String s1) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareGraphQuery(s, s1);
    }

    @Override
    public TupleQuery prepareTupleQuery(String s) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareTupleQuery(s);
    }

    @Override
    public TupleQuery prepareTupleQuery(String s, String s1) throws RepositoryException, MalformedQueryException {
        return getDelegate().prepareTupleQuery(s, s1);
    }

    @Override
    public Update prepareUpdate(String s) throws RepositoryException, MalformedQueryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public Update prepareUpdate(String s, String s1) throws RepositoryException, MalformedQueryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Iterable<? extends Statement> iterable, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Statement statement, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Resource resource, IRI iri, Value value, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void clear(Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Iterable<? extends Statement> iterable, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Statement statement, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Resource resource, IRI iri, Value value, Resource... resources) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }
}
