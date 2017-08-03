package org.matonto.prov.api;

/*-
 * #%L
 * org.matonto.prov.api
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

import org.matonto.query.api.BooleanQuery;
import org.matonto.query.api.GraphQuery;
import org.matonto.query.api.Operation;
import org.matonto.query.api.TupleQuery;
import org.matonto.query.exception.MalformedQueryException;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.exception.RepositoryException;

/**
 * A wrapper around the RepositoryConnection for provenance data so that only queries that don't affect the triple store
 * are supported.
 */
public interface ProvenanceQueryConnection extends AutoCloseable {
    /**
     * Prepares a query for evaluation on the provenance repository (optional operation).
     *
     * @param query The query string.
     * @return A query ready to be evaluated on the provenance repository.
     * @throws MalformedQueryException If the supplied query is malformed.
     * @throws UnsupportedOperationException If the <tt>prepareQuery</tt> method is not supported by the provenance
     *      repository.
     */
    Operation prepareQuery(String query) throws RepositoryException, MalformedQueryException;

    /**
     * Prepares a query for evaluation on the provenance repository (optional operation).
     *
     * @param query The query string.
     * @param baseURI The base URI to resolve any relative URIs that are in the query against, can be <tt>null</tt>
     *        if the query does not contain any relative URIs.
     * @return A query ready to be evaluated on the provenance repository.
     * @throws MalformedQueryException If the supplied query is malformed.
     * @throws UnsupportedOperationException If the <tt>prepareQuery</tt> method is not supported by the provenance
     *      repository.
     */
    Operation prepareQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException;

    /**
     * Prepares a SPARQL query that produces sets of value tuples, that is a SPARQL SELECT query.
     *
     * @param query This query string, in SPARQL syntax.
     * @return a {@link TupleQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a tuple query.
     * @throws MalformedQueryException If the supplied query is malformed.
     */
    TupleQuery prepareTupleQuery(String query) throws RepositoryException, MalformedQueryException;


    /**
     * Prepares a query that produces sets of value tuples.
     *
     * @param query The query string.
     * @param baseURI The base URI to resolve any relative URIs that are in the query against, can be <tt>null</tt>
     *        if the query does not contain any relative URIs.
     * @return a {@link TupleQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a tuple query.
     * @throws MalformedQueryException If the supplied query is malformed.
     */
    TupleQuery prepareTupleQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException;

    /**
     * Prepares SPARQL queries that produce RDF graphs, that is, SPARQL CONSTRUCT or DESCRIBE queries.
     *
     * @param query This query string, in SPARQL syntax.
     * @return a {@link GraphQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a graph query.
     * @throws MalformedQueryException If the supplied query is malformed.
     */
    GraphQuery prepareGraphQuery(String query) throws RepositoryException, MalformedQueryException;

    /**
     * Prepares queries that produce RDF graphs.
     *
     * @param query The query string.
     * @param baseURI The base URI to resolve any relative URIs that are in the query against, can be <tt>null</tt>
     *        if the query does not contain any relative URIs.
     * @return a {@link GraphQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a graph query.
     * @throws MalformedQueryException If the supplied query is malformed.
     */
    GraphQuery prepareGraphQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException;


    /**
     * Prepares SPARQL queries that return <tt>true</tt> or <tt>false</tt>, that is, SPARQL ASK queries.
     *
     * @param query This query string, in SPARQL syntax.
     * @return a {@link BooleanQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a boolean query.
     * @throws MalformedQueryException If the supplied SPARQL query is malformed.
     */
    BooleanQuery prepareBooleanQuery(String query) throws RepositoryException, MalformedQueryException;

    /**
     * Prepares queries that return <tt>true</tt> or <tt>false</tt>.
     *
     * @param query The query string.
     * @param baseURI The base URI to resolve any relative URIs that are in the query against, can be <tt>null</tt>
     *        if the query does not contain any relative URIs.
     * @return a {@link BooleanQuery} ready to be evaluated on this {@link RepositoryConnection}.
     * @throws IllegalArgumentException If the supplied query is not a boolean query.
     * @throws MalformedQueryException If the supplied query is malformed.
     */
    BooleanQuery prepareBooleanQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException;
}
