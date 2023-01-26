package com.mobi.persistence.utils;

/*-
 * #%L
 * com.mobi.persistence.utils
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.common.iteration.Iteration;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.base.RepositoryConnectionWrapper;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFParseException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.net.URL;

public class ReadOnlyRepositoryConnection extends RepositoryConnectionWrapper {

    public ReadOnlyRepositoryConnection(RepositoryConnection conn) {
        super(conn.getRepository(), conn);
    }

    @Override
    public Update prepareUpdate(String s) throws RepositoryException, MalformedQueryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public Update prepareUpdate(QueryLanguage ql, String update) throws RepositoryException, MalformedQueryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public Update prepareUpdate(QueryLanguage ql, String update, String baseURI)
            throws RepositoryException, MalformedQueryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(InputStream in, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(InputStream in, String baseURI, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Reader reader, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Reader reader, String baseURI, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(URL url, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(URL url, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(URL url, String baseURI, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(File file, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(File file, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(File file, String baseURI, RDFFormat dataFormat, Resource... contexts)
            throws IOException, RDFParseException, RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Statement st, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public <E extends Exception> void add(Iteration<? extends Statement, E> statements, Resource... contexts)
            throws RepositoryException, E {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void add(RepositoryResult<Statement> statements, Resource... contexts)
            throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Statement st, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public <E extends Exception> void remove(Iteration<? extends Statement, E> statements, Resource... contexts)
            throws RepositoryException, E {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void remove(RepositoryResult<Statement> statements, Resource... contexts)
            throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }

    @Override
    public void clear(Resource... contexts) throws RepositoryException {
        throw new UnsupportedOperationException("Connection is read-only. Operation not supported.");
    }
}
