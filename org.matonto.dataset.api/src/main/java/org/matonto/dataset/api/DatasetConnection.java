package org.matonto.dataset.api;

/*-
 * #%L
 * org.matonto.dataset.api
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
     * @param contexts - The contexts to add the statement to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statement is added to
     *                 these contexts, ignoring any context information in the statement itself.
     * @throws RepositoryException - If the statement could not be added to the repository, for example because
     * the repository is not writable.
     */
    @Override
    void add(Statement stmt, Resource... contexts) throws RepositoryException;

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
     * the repository is not writable.
     */
    void addDefault(Statement stmt, Resource... contexts) throws RepositoryException;

    /**
     * Adds the supplied statements to this repository, optionally to one or more named contexts. Ensures that any
     * necessary dataset named graph statements are created. Any statement added without a context (or supplied context)
     * will be added to the system default named graph for that dataset.
     *
     * @param statements - The statements that should be added.
     * @param contexts - The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statements are added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statements are added to
     *                 these contexts, ignoring any context information in the statements themselves.
     * @throws RepositoryException - If the statements could not be added to the repository, for example because
     * the repository is not writable.
     */
    @Override
    void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

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
     * the repository is not writable.
     */
    void addDefault(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException;

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
     * the repository is not writable.
     */
    @Override
    void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

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
     * the repository is not writable.
     */
    void addDefault(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException;

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
