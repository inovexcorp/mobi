package com.mobi.repository.api;

/*-
 * #%L
 * com.mobi.persistence.api
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

import com.mobi.query.api.BooleanQuery;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.Operation;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.api.Update;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.rdf.api.IRI;
import com.mobi.repository.exception.RepositoryException;

public interface RepositoryConnection extends AutoCloseable {

    /**
     * Adds the supplied statement to this repository, optionally to one or more named contexts.
     *
     * @param stmt -  The statement to add.
     * @param contexts - The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is added to any context specified
     *                 in each statement, or if the statement contains no context, it is added without context.
     *                 If one or more contexts are specified the statement is added to these contexts, ignoring
     *                 any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be added to the repository, for example because
     * the repository is not writable.
     */
    void add(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Adds the supplied statements to this repository, optionally to one or more named contexts.
     *
     * @param statements - The statements that should be added.
     * @param contexts - The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, each statement is added to any context specified
     *                 in the statement, or if the statement contains no context, it is added without context.
     *                 If one or more contexts are specified each statement is added to these contexts, ignoring
     *                 any context information in the statement itself.
     * @throws RepositoryException - If the statements could not be added to the repository, for example because
     * the repository is not writable.
     */
    void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

    /**
     * Adds a statement with the specified subject, predicate and object to this repository, optionally
     * to one or more named contexts.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's subject.
     * @param object - The statement's object.
     * @param contexts - The contexts to add the data to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the data is added to any context specified
     *                 in the actual data file, or if the data contains no context, it is added without context.
     *                 If one or more contexts are specified the data is added to these contexts, ignoring any
     *                 context information in the data itself.
     * @throws RepositoryException - If the data could not be added to the repository, for example because
     * the repository is not writable.
     */
    void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Removes the supplied statement from this repository, optionally from one or more named contexts.
     *
     * @param stmt -  The statement to remove.
     * @param contexts - The contexts to remove the statements from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is removed from any context specified
     *                 in each statement, or if the statement contains no context, it is removed without context.
     *                 If one or more contexts are specified the statement is removed from these contexts, ignoring
     *                 any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be removed from the repository, for example because
     * the repository is not writable.
     */
    void remove(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Removes the supplied statements from this repository, optionally from one or more named contexts.
     *
     * @param statements - The statements that should be removed.
     * @param contexts - The contexts to remove the statements from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, each statement is removed from any context specified
     *                 in the statement, or if the statement contains no context, it is removed without context.
     *                 If one or more contexts are specified each statement is removed from those contexts, ignoring
     *                 any context information in the statement itself.
     * @throws RepositoryException - If the data could not be removed from the repository, for example because
     * the repository is not writable.
     */
    void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

    /**
     * Removes a statement with the specified subject, predicate and object from this repository, optionally
     * from one or more named contexts.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's subject.
     * @param object - The statement's object.
     * @param contexts - The contexts to remove the data from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the data is removed from any context specified
     *                 in the actual data file, or if the data contains no context, it is removed without context.
     *                 If one or more contexts are specified the data is removed from these contexts, ignoring any
     *                 context information in the data itself.
     * @throws RepositoryException - If the data could not be removed from the repository, for example because
     * the repository is not writable.
     */
    void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Removes all statements from a specific contexts in the repository.
     *
     * @param contexts - The context(s) to remove the data from. Note that this parameter is a vararg and as
     *                 such is optional. If no contexts are supplied the method operates on the entire repository.
     * @throws RepositoryException - If the statements could not be removed from the repository, for example
     * because the repository is not writable.
     */
    void clear(Resource... contexts) throws RepositoryException;

    /**
     * Closes the connection, freeing resources.
     *
     * @throws RepositoryException - If the connection could not be closed.
     */
    void close() throws RepositoryException;

    /**
     * Returns the number of (explicit) statements that are in the specified contexts in this repository.
     *
     * @param contexts - The context(s) to get the data from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are supplied the method operates on the entire repository.
     * @return The number of explicit statements from the specified contexts in this repository.
     */
    long size(Resource... contexts) throws RepositoryException;

    /**
     * Gets all statements with a specific subject, predicate and/or object from the repository. The result is
     * optionally restricted to the specified set of named contexts. If the repository supports inferencing,
     * inferred statements will be included in the result.
     *
     * @param subject - A Resource specifying the subject, or null for a wildcard.
     * @param predicate - A URI specifying the predicate, or null for a wildcard.
     * @param object - A Value specifying the object, or null for a wildcard.
     * @param contexts - The context(s) to get the data from. Note that this parameter is a vararg and as such is
     *                 optional. If no contexts are supplied the method operates on the entire repository.
     * @return The statements matching the specified pattern. The result object is a RepositoryResult object, a lazy
     * Iterator-like object containing Statements and optionally throwing a RepositoryException when an error
     * when a problem occurs during retrieval.
     * @throws RepositoryException when a problem occurs during retrieval.
     */
    RepositoryResult<Statement> getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException;

    /**
     * Indicates whether a statement with a specific subject, predicate, and/or object exists in the repository. The
     * result is optionally restricted to the specified set of named contexts. If the repository supports inferencing,
     * inferred statements will be included in the result.
     *
     * @param subject - A Resource specifying the subject, or null for a wildcard.
     * @param predicate - A URI specifying the predicate, or null for a wildcard.
     * @param object - A Value specifying the object, or null for a wildcard.
     * @param contexts - The context(s) to limit the query to. Note that this parameter is a vararg and as such is
     *                 optional. If no contexts are supplied the method operates on the entire repository.
     * @return True if a statement matching the specified pattern exists in the repository.
     * @throws RepositoryException when a problem occurs during retrieval.
     */
    boolean contains(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Indicates whether a specific context exists in the repository.
     *
     * @param context - A Resource specifying the context.
     * @return True if the context exists in the repository.
     * @throws RepositoryException when a problem occurs during retrieval.
     */
    boolean containsContext(Resource context) throws RepositoryException;

    /**
     * Gets all resources that are used as context identifiers. Care should be taken that the returned
     * RepositoryResult is closed to free any resources that it keeps hold of.
     *
     * @return a RepositoryResult object containing Resources that are used as context identifiers.
     * @throws RepositoryException
     */
    RepositoryResult<Resource> getContextIDs() throws RepositoryException;

    /**
     * Begins a transaction requiring commit() or rollback() to be called to end the transaction.
     *
     * @throws RepositoryException when a problem occurs starting the transaction
     */
    void begin() throws RepositoryException;

    /**
     * Begins a transaction requiring commit() or rollback() to be called to end the transaction.
     *
     * @param isolationLevel The isolationLevel of the transaction
     * @throws RepositoryException when a problem occurs starting the transaction
     */
    void begin(IsolationLevels isolationLevel) throws RepositoryException;

    /**
     * Commits the active transaction.
     * @throws RepositoryException when there is a problem committing the transaction
     * @throws UnknownTransactionStateException (Runtime) if the transaction state cannot be determined
     */
    void commit() throws RepositoryException;

    /**
     * Rolls back all updates in the active transaction. This operation ends the active transaction.
     *
     * @throws RepositoryException when the transaction cannot be rolled back.
     */
    void rollback() throws RepositoryException;

    /**
     * Indicates if a transaction is currently active on the connection. Transactions become active upon a call to
     * begin() and inactive on a call to commit() or rollback()
     * @return true if a transaction is active, or false if the transaction is inactive
     * @throws RepositoryException if the connection to the repository could not be accessed to check for state.
     */
    boolean isActive() throws RepositoryException;


    /**
     * Prepares a query for evaluation on this repository (optional operation).
     *
     * @param query
     *        The query string.
     * @return A query ready to be evaluated on this repository.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     * @throws UnsupportedOperationException
     *         If the <tt>prepareQuery</tt> method is not supported by this
     *         repository.
     */
    Operation prepareQuery(String query)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares a query for evaluation on this repository (optional operation).
     *
     * @param query
     *        The query string.
     * @param baseURI
     *        The base URI to resolve any relative URIs that are in the query
     *        against, can be <tt>null</tt> if the query does not contain any
     *        relative URIs.
     * @return A query ready to be evaluated on this repository.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     * @throws UnsupportedOperationException
     *         If the <tt>prepareQuery</tt> method is not supported by this
     *         repository.
     */
    Operation prepareQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares a SPARQL query that produces sets of value tuples, that is a
     * SPARQL SELECT query.
     *
     * @param query
     *        The query string, in SPARQL syntax.
     * @return a {@link TupleQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a tuple query.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     */
    TupleQuery prepareTupleQuery(String query)
            throws RepositoryException, MalformedQueryException;


    /**
     * Prepares a query that produces sets of value tuples.
     *
     * @param query
     *        The query string.
     * @param baseURI
     *        The base URI to resolve any relative URIs that are in the query
     *        against, can be <tt>null</tt> if the query does not contain any
     *        relative URIs.
     * @return a {@link TupleQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a tuple query.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     */
    TupleQuery prepareTupleQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares SPARQL queries that produce RDF graphs, that is, SPARQL CONSTRUCT
     * or DESCRIBE queries.
     *
     * @param query
     *        The query string, in SPARQL syntax.
     * @return a {@link GraphQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a graph query.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     */
    GraphQuery prepareGraphQuery(String query)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares queries that produce RDF graphs.
     *
     * @param query
     *        The query string.
     * @param baseURI
     *        The base URI to resolve any relative URIs that are in the query
     *        against, can be <tt>null</tt> if the query does not contain any
     *        relative URIs.
     * @return a {@link GraphQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a graph query.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     */
    GraphQuery prepareGraphQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException;


    /**
     * Prepares SPARQL queries that return <tt>true</tt> or <tt>false</tt>, that
     * is, SPARQL ASK queries.
     *
     * @param query
     *        The query string, in SPARQL syntax.
     * @return a {@link BooleanQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a boolean query.
     * @throws MalformedQueryException
     *         If the supplied SPARQL query is malformed.
     */
    BooleanQuery prepareBooleanQuery(String query)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares queries that return <tt>true</tt> or <tt>false</tt>.
     *
     * @param query
     *        The query string.
     * @param baseURI
     *        The base URI to resolve any relative URIs that are in the query
     *        against, can be <tt>null</tt> if the query does not contain any
     *        relative URIs.
     * @return a {@link BooleanQuery} ready to be evaluated on this
     *         {@link RepositoryConnection}.
     * @throws IllegalArgumentException
     *         If the supplied query is not a boolean query.
     * @throws MalformedQueryException
     *         If the supplied query is malformed.
     */
    BooleanQuery prepareBooleanQuery(String query, String baseURI)
            throws RepositoryException, MalformedQueryException;

    /**
     * Prepares a SPARQL Update operation.
     *
     * @param update
     *        The update operation string, in SPARQL syntax.
     * @return a {@link Update} ready to be executed on this
     *         {@link RepositoryConnection}.
     * @throws MalformedQueryException
     *         If the supplied update operation string is malformed.
     */
    Update prepareUpdate(String update)
            throws RepositoryException, MalformedQueryException;


    /**
     * Prepares an Update operation.
     *
     * @param update
     *        The update operation string.
     * @param baseURI
     *        The base URI to resolve any relative URIs that are in the update
     *        against, can be <tt>null</tt> if the update does not contain any
     *        relative URIs.
     * @return a {@link Update} ready to be executed on this
     *         {@link RepositoryConnection}.
     * @throws MalformedQueryException
     *         If the supplied update operation string is malformed.
     */
    Update prepareUpdate(String update, String baseURI)
            throws RepositoryException, MalformedQueryException;
}
