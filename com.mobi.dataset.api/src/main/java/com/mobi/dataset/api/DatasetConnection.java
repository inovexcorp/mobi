package com.mobi.dataset.api;

/*-
 * #%L
 * com.mobi.dataset.api
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

import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.OperationDataset;
import com.mobi.query.api.TupleQuery;
import com.mobi.query.api.Update;
import com.mobi.query.exception.MalformedQueryException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.repository.api.DelegatingRepositoryConnection;
import com.mobi.repository.base.RepositoryResult;
import com.mobi.repository.exception.RepositoryException;

/**
 * A special type of RepositoryConnection that limits operations to a single Dataset in a Repository.
 */
public interface DatasetConnection extends DelegatingRepositoryConnection {

    /**
     * Adds the supplied statement to this repository as a named graph, optionally to one or more named contexts.
     * Ensures that any necessary dataset named graph statements are created. Any statement added without a context (or
     * supplied context) will be added to the system default named graph for that dataset.
     *
     * @param stmt -  The statement to add.
     * @param contexts - The contexts to add the statement to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statement is added to
     *                 these contexts, ignoring any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be added to the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void add(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Adds the supplied statements to this repository as a named graph, optionally to one or more named contexts.
     * Ensures that any necessary dataset named graph statements are created. Any statement added without a context (or
     * supplied context) will be added to the system default named graph for that dataset.
     *
     * @param statements - The statements that should be added.
     * @param contexts - The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statements are added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statements are added to
     *                 these contexts, ignoring any context information in the statements themselves.
     * @throws RepositoryException - If the statements could not be added to the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

    /**
     * Adds a statement with the specified subject, predicate and object to this repository, optionally
     * to one or more named contexts. Ensures that any necessary dataset named graph statements are created. Any
     * statement added without a context (or supplied context) will be added to the system default named graph for that
     * dataset.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's subject.
     * @param object - The statement's object.
     * @param contexts - The contexts to add the data to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the data are added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the data are added to
     *                 these contexts.
     * @throws RepositoryException - If the data could not be added to the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Adds the supplied statement to this repository as a default named graph, optionally to one or more named
     * contexts. Ensures that any necessary dataset default named graph statements are created. Any statement added
     * without a context (or supplied context) will be added to the system default named graph for that dataset.
     *
     * @param stmt -  The statement to add.
     * @param contexts - The contexts to add the statement to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statement is added to
     *                 these contexts, ignoring any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be added to the repository, for example because
     *      the repository is not writable.
     */
    void addDefault(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Adds the supplied statements to this repository as a default named graph, optionally to one or more named
     * contexts. Ensures that any necessary dataset default named graph statements are created. Any statement added
     * without a context (or supplied context) will be added to the system default named graph for that dataset.
     *
     * @param statements - The statements that should be added.
     * @param contexts - The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statements are added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statements are added to
     *                 these contexts, ignoring any context information in the statements themselves.
     * @throws RepositoryException - If the statements could not be added to the repository, for example because
     *      the repository is not writable.
     */
    void addDefault(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

    /**
     * Adds a statement with the specified subject, predicate and object to this repository, optionally
     * to one or more named contexts. Ensures that any necessary dataset default named graph statements are created. Any
     * statement added without a context (or supplied context) will be added to the system default named graph for that
     * dataset.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's subject.
     * @param object - The statement's object.
     * @param contexts - The contexts to add the data to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the data are added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the data are added to
     *                 these contexts.
     * @throws RepositoryException - If the data could not be added to the repository, for example because
     *      the repository is not writable.
     */
    void addDefault(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Removes the supplied statement from this dataset, optionally from one or more named contexts. Ensures the removal
     * operations only affect graphs in this dataset. This operation will not remove empty graphs from the dataset.
     *
     * @param stmt -  The statement to remove.
     * @param contexts - The contexts to remove the statements from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is removed from any context specified
     *                 in each statement, or if the statement contains no context, it is removed from the system default
     *                 named graph. If one or more contexts are specified, the statement is removed from these contexts,
     *                 ignoring any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be removed from the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void remove(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Removes the supplied statements from this dataset, optionally from one or more named contexts. Ensures the
     * removal operations only affect graphs in this dataset. This operation will not remove empty graphs from the
     * dataset.
     *
     * @param statements - The statements that should be removed.
     * @param contexts - The contexts to remove the statements from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, each statement is removed from any context specified
     *                 in the statement, or if the statement contains no context, it is removed from the system default
     *                 named graph. If one or more contexts are specified, each statement is removed from those
     *                 contexts, ignoring any context information in the statement itself.
     * @throws RepositoryException - If the data could not be removed from the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

    /**
     * Removes a statement with the specified subject, predicate and object from this dataset, optionally
     * from one or more named contexts. Ensures the removal operations only affect graphs in this dataset. This
     * operation will not remove empty graphs from the dataset.
     *
     * @param subject - The statement's subject.
     * @param predicate - The statement's predicate.
     * @param object - The statement's object.
     * @param contexts - The contexts to remove the data from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the data is removed from the system default
     *                 named graph.
     * @throws RepositoryException - If the data could not be removed from the repository, for example because
     *      the repository is not writable.
     */
    @Override
    void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

    /**
     * Removes all statements from this dataset, optionally from one or more named contexts. Ensures the removal
     * operations only affect graphs in this dataset. This operation will remove all graph data and graph statements
     * from the dataset.
     *
     * @param contexts - The context(s) to remove the data from. Note that this parameter is a vararg and as
     *                 such is optional. If no contexts are supplied the method operates on the entire dataset.
     * @throws RepositoryException - If the statements could not be removed from the repository, for example
     *      because the repository is not writable.
     */
    @Override
    void clear(Resource... contexts) throws RepositoryException;

    /**
     * Returns the number of (explicit) statements that are in the specified contexts that exist in this Dataset.
     * Contexts that are not graphs in this Dataset will evaluate to a size of 0.
     *
     * @param contexts - The context(s) from which to count statements. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are supplied the method operates on the entire dataset. Contexts that
     *                 are not graphs in this dataset will evaluate to a size of 0.
     * @return The number of explicit statements from the specified contexts that exist in this dataset.
     * @throws RepositoryException - If the size could not be determined from the repository, for example because
     *      the repository is not readable.
     */
    @Override
    long size(Resource... contexts) throws RepositoryException;

    /**
     * Gets all statements with a specific subject, predicate and/or object from the dataset. The result is
     * optionally restricted to the specified set of named contexts. Ensures only graphs within the dataset are
     * affected. If the repository supports inferencing, inferred statements will be included in the result. Care should
     * be taken that the returned RepositoryResult is closed to free any resources that it keeps hold of.
     *
     * @param subject - A Resource specifying the subject, or null for a wildcard.
     * @param predicate - A URI specifying the predicate, or null for a wildcard.
     * @param object - A Value specifying the object, or null for a wildcard.
     * @param contexts - The context(s) to get the data from. Note that this parameter is a vararg and as such is
     *                 optional. If no contexts are supplied the method operates on the entire repository.
     * @return The statements matching the specified pattern. The result object is a RepositoryResult object, a lazy
     *      Iterator-like object containing Statements and optionally throwing a RepositoryException when an error
     *      when a problem occurs during retrieval.
     * @throws RepositoryException If a problem occurs during retrieval.
     */
    @Override
    RepositoryResult<Statement> getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException;

    /**
     * Gets all resources that are used as context identifiers. Care should be taken that the returned RepositoryResult
     * is closed to free any resources that it keeps hold of.
     *
     * @return a RepositoryResult object containing Resources that are used as context identifiers.
     * @throws RepositoryException - If the contexts could not be determined from the repository, for example because
     *      the repository is not readable.
     */
    @Override
    RepositoryResult<Resource> getContextIDs() throws RepositoryException;

    /**
     * Prepares a SPARQL query against the specified contexts that produces sets of value tuples, that is a SPARQL
     * SELECT query.
     *
     * @param query The query string, in SPARQL syntax.
     * @param contexts The context(s) to query. Note that this parameter is a vararg and as such is optional. If no
     *                 contexts are supplied the method operates on the entire dataset.
     * @return a {@link TupleQuery} ready to be evaluated on this {@link DatasetConnection}.
     * @throws IllegalArgumentException If the supplied query is not a tuple query.
     * @throws MalformedQueryException If the supplied query is malformed.
     * @throws RepositoryException - If the query could not be run against the repository, for example because
     *      the repository is not readable.
     */
    TupleQuery prepareTupleQuery(String query, Resource... contexts) throws RepositoryException,
            MalformedQueryException;

    /**
     * Prepares SPARQL queries against the specified contexts that produce RDF graphs, that is, SPARQL CONSTRUCT or
     * DESCRIBE queries.
     *
     * @param query The query string, in SPARQL syntax.
     * @param contexts The context(s) to query. Note that this parameter is a vararg and as such is optional. If no
     *                 contexts are supplied the method operates on the entire dataset.
     * @return a {@link GraphQuery} ready to be evaluated on this {@link DatasetConnection}.
     * @throws IllegalArgumentException If the supplied query is not a graph query.
     * @throws MalformedQueryException If the supplied query is malformed.
     * @throws RepositoryException - If the query could not be run against the repository, for example because
     *      the repository is not readable.
     */
    GraphQuery prepareGraphQuery(String query, Resource... contexts) throws RepositoryException,
            MalformedQueryException;

    /**
     * Prepares SPARQL queries against the specified contexts that modify RDF graphs, that is, SPARQL INSERT/DELETE
     * queries. If the query string contains an INSERT and/or DELETE, the operation will occur on the dataset graph.
     *
     * @param query The query string, in SPARQL syntax.
     * @param contexts The context(s) to query. Note that this parameter is a vararg and as such is optional. If no
     *                 contexts are supplied the method operates on the entire dataset.
     * @return a {@link GraphQuery} ready to be evaluated on this {@link DatasetConnection}.
     * @throws IllegalArgumentException If the supplied query is not a graph query.
     * @throws MalformedQueryException If the supplied query is malformed.
     * @throws RepositoryException - If the query could not be run against the repository, for example because
     *      the repository is not readable.
     */
    Update prepareUpdate(String query, Resource... contexts)
            throws RepositoryException, MalformedQueryException;

    /**
     * Gets the resources that are used as named graphs in the dataset. Care should be taken that the returned
     * RepositoryResult is closed to free any resources that it keeps hold of.
     *
     * @return the Set of all named graph Resources in the dataset.
     */
    RepositoryResult<Resource> getNamedGraphs();

    /**
     * Gets the resources that are used as default named graphs in the dataset. Care should be taken that the returned
     * RepositoryResult is closed to free any resources that it keeps hold of.
     *
     * @return the Set of all default named graph Resources in the dataset.
     */
    RepositoryResult<Resource> getDefaultNamedGraphs();

    /**
     * Gets the system default named graph Resource in the dataset.
     *
     * @return the system default named graph Resource in the dataset.
     */
    Resource getSystemDefaultNamedGraph();

    /**
     * Retrieves the system default named graph from the repository, sets it on the connection, and returns the newly
     * set Resource value.
     *
     * @return the Resource representing the system default named graph.
     */
    Resource getAndSetSystemDefaultNamedGraph();

    /**
     * Sets the system default named graph for the DatasetConnection. Used in cases where the DatasetConnection defers
     * initializing the system default named graph.
     *
     * @param systemDefaultNamedGraph the Resource representing the system default named graph.
     */
    void setSystemDefaultNamedGraph(Resource systemDefaultNamedGraph);

    /**
     * Retrieves the {@link OperationDataset} that maintains the named graphs and default graphs used in the dataset.
     *
     * @param force a boolean indicating whether or not to re-retrieve the graphs sets from the repository. If true,
     *              re-queries the repository. If false, returns the cached OperationDataset stored on the connection.
     * @return
     */
    OperationDataset getOperationDataset(boolean force);

    /**
     * Sets the {@link OperationDataset} that represents the named graphs and default graphs of the Dataset on the
     * DatasetConnection.
     *
     * @param operationDataset the OperationDataset to set on the connection.
     */
    void setOperationDataset(OperationDataset operationDataset);

    /**
     * Adds a named graph to the dataset.
     *
     * @param graph the Resource representing the named graph to add to the dataset.
     */
    void addNamedGraph(Resource graph);

    /**
     * Adds a default named graph to the dataset.
     *
     * @param graph the Resource representing the default named graph to add to the dataset.
     */
    void addDefaultNamedGraph(Resource graph);

    /**
     * Removes a graph from the dataset. Note that this does not delete the specified graph from the repository.
     *
     * @param graph the Resource representing the graph to remove from the dataset.
     */
    void removeGraph(Resource graph);

    /**
     * Returns the Resource representing the Dataset for this DatasetConnection.
     *
     * @return the Resource representing the Dataset for this DatasetConnection.
     */
    Resource getDataset();

    /**
     * Returns String representing the ID for the Repository for this DatasetConnection.
     *
     * @return String representing the ID for the Repository for this DatasetConnection.
     */
    String getRepositoryId();
}
