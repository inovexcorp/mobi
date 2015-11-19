package org.matonto.repository.api;

import org.matonto.rdf.api.*;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

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
    RepositoryResult getStatements(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException;

    /**
     * Gets a ValueFactory for this RepositoryConnection.
     *
     * @return A repository-specific ValueFactory.
     */
    ValueFactory getValueFactory();
}
