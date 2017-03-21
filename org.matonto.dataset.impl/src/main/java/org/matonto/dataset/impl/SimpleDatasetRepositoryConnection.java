package org.matonto.dataset.impl;

/*-
 * #%L
 * org.matonto.dataset.impl
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

import org.apache.commons.lang.NotImplementedException;
import org.matonto.dataset.api.DatasetConnection;
import org.matonto.dataset.ontology.dataset.Dataset;
import org.matonto.exception.MatOntoException;
import org.matonto.persistence.utils.Statements;
import org.matonto.query.api.BooleanQuery;
import org.matonto.query.api.GraphQuery;
import org.matonto.query.api.Operation;
import org.matonto.query.api.TupleQuery;
import org.matonto.query.api.Update;
import org.matonto.query.exception.MalformedQueryException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.repository.api.RepositoryConnection;
import org.matonto.repository.base.RepositoryConnectionWrapper;
import org.matonto.repository.base.RepositoryResult;
import org.matonto.repository.exception.RepositoryException;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class SimpleDatasetRepositoryConnection extends RepositoryConnectionWrapper implements DatasetConnection {

    private Resource dataset;
    private String repositoryId;
    private ValueFactory valueFactory;

    public SimpleDatasetRepositoryConnection(RepositoryConnection delegate, Resource dataset, String repositoryId, ValueFactory valueFactory) {
        setDelegate(delegate);
        this.dataset = dataset;
        this.repositoryId = repositoryId;
        this.valueFactory = valueFactory;
    }

    @Override
    public void add(Statement stmt, Resource... contexts) throws RepositoryException {
        addStatement(stmt, Dataset.namedGraph_IRI, contexts);
    }

    @Override
    public void addDefault(Statement stmt, Resource... contexts) throws RepositoryException {
        addStatement(stmt, Dataset.defaultNamedGraph_IRI, contexts);
    }

    @Override
    public void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        addStatements(statements, Dataset.namedGraph_IRI, contexts);
    }

    @Override
    public void addDefault(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        addStatements(statements, Dataset.defaultNamedGraph_IRI, contexts);
    }

    @Override
    public void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        add(valueFactory.createStatement(subject, predicate, object), contexts);
    }

    @Override
    public void addDefault(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        addDefault(valueFactory.createStatement(subject, predicate, object), contexts);
    }

    @Override
    public void remove(Statement stmt, Resource... contexts) throws RepositoryException {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        Set<Resource> graphs = new HashSet<>();
        getGraphs(graphs, Dataset.systemDefaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.defaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.namedGraph_IRI);

        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
            getDelegate().remove(stmt, graphs.toArray(new Resource[graphs.size()]));
        } else {
            removeSingleStatement(stmt, graphs);
        }

        if (startedTransaction) {
            commit();
        }
    }

    @Override
    public void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        Set<Resource> graphs = new HashSet<>();
        getGraphs(graphs, Dataset.systemDefaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.defaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.namedGraph_IRI);

        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
            getDelegate().remove(statements, graphs.toArray(new Resource[graphs.size()]));
        } else {
            statements.forEach(stmt -> removeSingleStatement(stmt, graphs));
        }

        if (startedTransaction) {
            commit();
        }
    }

    @Override
    public void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        remove(valueFactory.createStatement(subject, predicate, object), contexts);
    }

    @Override
    public void clear(Resource... contexts) throws RepositoryException {
        IRI ngPred = valueFactory.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = valueFactory.createIRI(Dataset.defaultNamedGraph_IRI);
        IRI sdngPred = valueFactory.createIRI(Dataset.systemDefaultNamedGraph_IRI);

        getDelegate().getStatements(getDataset(), ngPred, null)
                .forEach(stmt -> Statements.objectResource(stmt).ifPresent(this::deleteGraph));
        getDelegate().getStatements(getDataset(), dngPred, null)
                .forEach(stmt -> Statements.objectResource(stmt).ifPresent(this::deleteGraph));
        getDelegate().getStatements(getDataset(), sdngPred, null)
                .forEach(stmt -> Statements.objectResource(stmt).ifPresent(graph -> getDelegate().clear(graph)));
    }

    @Override
    public long size(Resource... contexts) throws RepositoryException {
        // TODO: Would this be more efficient with a sparql query? I probably wouldn't need a value factory.
        Set<Resource> graphs = new HashSet<>();
        getGraphs(graphs, Dataset.systemDefaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.defaultNamedGraph_IRI);
        getGraphs(graphs, Dataset.namedGraph_IRI);

        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
        }

        if (graphs.size() == 0) {
            return 0;
        }
        return getDelegate().size(graphs.toArray(new Resource[graphs.size()]));
    }

    @Override
    public Set<Resource> getNamedGraphs() {
        Set<Resource> graphs = new HashSet<>();
        getGraphs(graphs, Dataset.namedGraph_IRI);
        return graphs;
    }

    @Override
    public Set<Resource> getDefaultNamedGraphs() {
        Set<Resource> graphs = new HashSet<>();
        getGraphs(graphs, Dataset.defaultNamedGraph_IRI);
        return graphs;
    }

    @Override
    public Resource getSystemDefaultNamedGraph() {
        return getSystemDefaultNG();
    }

    @Override
    public void addNamedGraph(Resource graph) {
        // TODO: Implement
    }

    @Override
    public void addDefaultNamedGraph(Resource graph) {
        // TODO: Implement
    }

    @Override
    public void removeGraph(Resource graph) {
        // TODO: Implement
    }

    @Override
    public RepositoryResult<Statement> getStatements(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        // TODO: Implement
        return null;
    }

    @Override
    public RepositoryResult<Resource> getContextIDs() throws RepositoryException {
        // TODO: Implement
        return null;
    }

    @Override
    public Operation prepareQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public Operation prepareQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public TupleQuery prepareTupleQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public TupleQuery prepareTupleQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public GraphQuery prepareGraphQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public GraphQuery prepareGraphQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public Update prepareUpdate(String update) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public Update prepareUpdate(String update, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException("Not yet implemented.");
    }

    @Override
    public Resource getDataset() {
        return dataset;
    }

    @Override
    public String getRepositoryId() {
        return repositoryId;
    }

    private boolean varargsPresent(Object[] varargs) {
        return !(varargs == null || varargs.length == 0 || varargs[0] == null);
    }

    private void getGraphs(Set<Resource> graphs, String predString) {
        getDelegate().getStatements(getDataset(), valueFactory.createIRI(predString), null)
                .forEach(stmt -> Statements.objectResource(stmt).ifPresent(graphs::add));
    }

    private Resource getSystemDefaultNG() {
        RepositoryResult<Statement> statements = getDelegate()
                .getStatements(dataset, valueFactory.createIRI(Dataset.systemDefaultNamedGraph_IRI), null);

        if (statements.hasNext()) {
            return Statements.objectResource(statements.next())
                    .orElseThrow(() -> new MatOntoException("Could not retrieve systemDefaultNamedGraph for dataset"));
        } else {
            throw new MatOntoException("Could not retrieve systemDefaultNamedGraph for dataset");
        }
    }

    /**
     * Adds a statement to the dataset, optionally to one or more named contexts. Ensures that the provided dataset
     * graph statement is created. Any statement added without a context (or supplied context) will be added to the
     * system default named graph for that dataset.
     *
     * @param statement The statement to add.
     * @param predicate The String representing the predicate to use for the graph registration in the dataset.
     * @param contexts The contexts to add the statement to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statement is added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statement is added to
     *                 these contexts, ignoring any context information in the statement itself.
     */
    private void addStatement(Statement statement, String predicate, Resource... contexts) {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        if (varargsPresent(contexts)) {
            getDelegate().add(statement, contexts);
            addGraphStatements(predicate, contexts);
        } else {
            addSingleStatement(statement, predicate);
        }

        if (startedTransaction) {
            commit();
        }
    }

    /**
     * Adds the statements to the dataset, optionally to one or more named contexts. Ensures that the provided dataset
     * graph statements are created. Any statement added without a context (or supplied context) will be added to the
     * system default named graph for that dataset.
     *
     * @param statements The statements to add.
     * @param predicate The String representing the predicate to use for the graph registration in the dataset.
     * @param contexts The contexts to add the statements to. Note that this parameter is a vararg and as such
     *                 is optional. If no contexts are specified, the statements are added to any context specified
     *                 in each statement, or if the statement contains no context, it is added to the system default
     *                 named graph for that dataset. If one or more contexts are specified, the statements are added to
     *                 these contexts, ignoring any context information in the statements themselves.
     */
    private void addStatements(Iterable<? extends Statement> statements, String predicate, Resource... contexts) {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        if (varargsPresent(contexts)) {
            getDelegate().add(statements, contexts);
            addGraphStatements(predicate, contexts);
        } else {
            statements.forEach(stmt -> addSingleStatement(stmt, predicate));
        }

        if (startedTransaction) {
            commit();
        }
    }

    /**
     * Adds a statement to the dataset. If the statement has a context, then add it to that graph and add that graph to
     * the dataset as a Named Graph.
     *
     * @param statement The Statement to add to the dataset.
     */
    private void addSingleStatement(Statement statement, String predicate) {
        if (statement.getContext().isPresent()) {
            getDelegate().add(statement);
            addGraphStatements(predicate, statement.getContext().get());
        } else {
            getDelegate().add(statement, getSystemDefaultNG());
        }
    }

    /**
     * Removes a statement from the dataset if the statement is in an accessible graph. If the statement has a context,
     * then remove it from that graph; otherwise, remove it from the system default named graph.
     *
     * @param statement The Statement to remove from the dataset.
     */
    private void removeSingleStatement(Statement statement, Set<Resource> accessibleGraphs) {
        if (statement.getContext().isPresent() && accessibleGraphs.contains(statement.getContext().get())) {
            getDelegate().remove(statement);
        } else {
            getDelegate().remove(statement, getSystemDefaultNG());
        }
    }

    /**
     * Adds a set of graph statements to the dataset.
     *
     * @param predicate The predicate to use for the graph statements.
     * @param contexts The graph identifiers.
     */
    private void addGraphStatements(String predicate, Resource... contexts) {
        for (Resource context : contexts) {
            getDelegate().add(dataset, valueFactory.createIRI(predicate), context, dataset);
        }
    }

    /**
     * Starts a transaction for this DatasetConnection if one is not already active.
     *
     * @return True is a transaction was started. False otherwise.
     */
    private boolean startTransaction() {
        if (!isActive()) {
            begin();
            return true;
        }
        return false;
    }

    private void deleteGraph(Resource graph) {
        getDelegate().clear(graph);
        getDelegate().remove(getDataset(), null, graph, getDataset());
    }
}
