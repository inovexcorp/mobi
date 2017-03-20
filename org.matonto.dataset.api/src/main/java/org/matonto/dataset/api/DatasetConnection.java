package org.matonto.dataset.api;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.repository.api.DelegatingRepositoryConnection;
import org.matonto.repository.exception.RepositoryException;

/**
 * A special type of RepositoryConnection that limits operations to a single Dataset in a Repository.
 */
public interface DatasetConnection extends DelegatingRepositoryConnection {

    /**
     * Adds the supplied statement to this repository, optionally to one or more named contexts. Ensures that any
     * necessary dataset named graph statements are created. Any statement added without a context (or supplied context)
     * will be added to the system default named graph for that dataset.
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
     * Adds the supplied statements to this repository, optionally to one or more named contexts. Ensures that any
     * necessary dataset named graph statements are created. Any statement added without a context (or supplied context)
     * will be added to the system default named graph for that dataset.
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
     * to one or more named contexts. Ensures that any necessary dataset named graph statements are created. Any
     * statement added without a context (or supplied context) will be added to the system default named graph for that
     * dataset.
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
     * Returns the number of (explicit) statements that are in the specified contexts that exist in this Dataset.
     * Contexts that are not graphs in this Dataset will evaluate to a size of 0.
     *
     * @param contexts - The context(s) from which to count statements. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are supplied the method operates on the entire dataset. Contexts that
     *                 are not graphs in this dataset will evaluate to a size of 0.
     * @return The number of explicit statements from the specified contexts that exist in this dataset.
     */
    @Override
    long size(Resource... contexts) throws RepositoryException;

    /**
     * Returns the Resource representing the Dataset for this DatasetConnection.
     *
     * @return the Resource representing the Dataset for this DatasetConnection.
     */
    Resource getDataset();

    /**
     * Returns the String representing the ID for the Repository for this DatasetConnection.
     *
     * @return the String representing the ID for the Repository for this DatasetConnection.
     */
    String getRepositoryId();
}
