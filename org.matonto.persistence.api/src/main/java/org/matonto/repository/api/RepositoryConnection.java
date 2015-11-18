package org.matonto.repository.api;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Value;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

public interface RepositoryConnection extends AutoCloseable {

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

    void close() throws RepositoryException;

    /**
     * Returns the number of (explicit) statements that are in the specified contexts in this repository.
     *
     * @param contexts - The context(s) to get the data from. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are supplied the method operates on the entire repository.
     * @return The number of explicit statements from the specified contexts in this repository.
     */
    long size(Resource... contexts) throws RepositoryException;

    RepositoryResult getStatements(Resource subj, IRI pred, Value obj, Resource... contexts)
            throws RepositoryException;
}
