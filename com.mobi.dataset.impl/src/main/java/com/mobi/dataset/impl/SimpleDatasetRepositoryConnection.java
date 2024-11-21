package com.mobi.dataset.impl;

/*-
 * #%L
 * com.mobi.dataset.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.ontology.dataset.Dataset;
import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.Statements;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.NotImplementedException;
import org.eclipse.rdf4j.common.iteration.EmptyIteration;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.query.Binding;
import org.eclipse.rdf4j.query.BooleanQuery;
import org.eclipse.rdf4j.query.GraphQuery;
import org.eclipse.rdf4j.query.MalformedQueryException;
import org.eclipse.rdf4j.query.Query;
import org.eclipse.rdf4j.query.QueryLanguage;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.query.impl.SimpleDataset;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;
import org.eclipse.rdf4j.repository.base.RepositoryConnectionWrapper;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public class SimpleDatasetRepositoryConnection extends RepositoryConnectionWrapper implements DatasetConnection {

    private Resource datasetResource;
    private String repositoryId;
    private ValueFactory valueFactory;
    private Resource systemDefaultNG;

    private long batchSize = 10000;

    /**
     * Boolean to track if an update (add/remove) has occurred. If the connection is "dirty" the operationDataset is
     * recalculated.
     */
    private boolean dirty = true;

    /**
     * The {@link SimpleDataset} to add to queries. Represents the namedGraphs/defaultGraphs to query
     * from in this DatasetConnection.
     */
    private SimpleDataset opDataset;

    private static final String GET_GRAPHS_QUERY;
    private static final String GET_NAMED_GRAPHS_QUERY;
    private static final String GET_DEFAULT_NAMED_GRAPHS_QUERY;
    private static final String GET_OPERATION_DATASET_GRAPHS;
    private static final String DATSET_BINDING = "dataset";
    private static final String GRAPH_BINDING = "graph";
    private static final String NOT_YET_IMPLEMENTED = "Not yet implemented.";

    private static final Logger log = LoggerFactory.getLogger(SimpleDatasetRepositoryConnection.class);

    static {
        try {
            GET_GRAPHS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/get-graphs.rq"),
                    StandardCharsets.UTF_8
            );
            GET_NAMED_GRAPHS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/get-named-graphs.rq"),
                    StandardCharsets.UTF_8
            );
            GET_DEFAULT_NAMED_GRAPHS_QUERY = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/get-default-named-graphs.rq"),
                    StandardCharsets.UTF_8
            );
            GET_OPERATION_DATASET_GRAPHS = IOUtils.toString(
                    SimpleDatasetManager.class.getResourceAsStream("/get-operation-dataset-graphs.rq"),
                    StandardCharsets.UTF_8
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    public SimpleDatasetRepositoryConnection(RepositoryConnection delegate, Resource dataset, String repositoryId,
                                             ValueFactory valueFactory) {
        super(delegate.getRepository());
        setDelegate(delegate);
        this.datasetResource = dataset;
        this.repositoryId = repositoryId;
        this.valueFactory = valueFactory;
        this.systemDefaultNG = getSystemDefaultNG();
    }

    public SimpleDatasetRepositoryConnection(RepositoryConnection delegate, Resource dataset, String repositoryId,
                                             ValueFactory valueFactory, long batchSize) {
        super(delegate.getRepository());
        setDelegate(delegate);
        this.datasetResource = dataset;
        this.repositoryId = repositoryId;
        this.valueFactory = valueFactory;
        this.systemDefaultNG = getSystemDefaultNG();
        this.batchSize = batchSize;
    }

    @Override
    public void add(Statement stmt, Resource... contexts) throws RepositoryException {
        addStatement(stmt, Dataset.namedGraph_IRI, contexts);
    }

    @Override
    public void add(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        addStatements(statements, Dataset.namedGraph_IRI, contexts);
    }

    @Override
    public void add(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        add(valueFactory.createStatement(subject, predicate, object), contexts);
    }

    @Override
    public void addDefault(Statement stmt, Resource... contexts) throws RepositoryException {
        addStatement(stmt, Dataset.defaultNamedGraph_IRI, contexts);
    }

    @Override
    public void addDefault(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        addStatements(statements, Dataset.defaultNamedGraph_IRI, contexts);
    }

    @Override
    public void addDefault(Resource subject, IRI predicate, Value object, Resource... contexts)
            throws RepositoryException {
        addDefault(valueFactory.createStatement(subject, predicate, object), contexts);
    }

    @Override
    public void remove(Statement stmt, Resource... contexts) throws RepositoryException {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        Set<Resource> graphs = getGraphsSet();

        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
            getDelegate().remove(stmt, graphs.toArray(new Resource[0]));
        } else {
            removeSingleStatement(stmt, graphs);
        }

        if (startedTransaction) {
            commit();
        }
        dirty = true;
    }

    @Override
    public void remove(Iterable<? extends Statement> statements, Resource... contexts) throws RepositoryException {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        Set<Resource> graphs = getGraphsSet();
        graphs.add(systemDefaultNG);

        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
            getDelegate().remove(statements, graphs.toArray(new Resource[0]));
        } else {
            statements.forEach(stmt -> removeSingleStatement(stmt, graphs));
        }

        if (startedTransaction) {
            commit();
        }
        dirty = true;
    }

    @Override
    public void remove(Resource subject, IRI predicate, Value object, Resource... contexts) throws RepositoryException {
        // Start a transaction if not currently in one
        boolean startedTransaction = startTransaction();

        Set<Resource> graphs = getGraphsSet();
        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
            getDelegate().remove(subject, predicate, object, graphs.toArray(new Resource[0]));
        } else {
            getDelegate().remove(subject, predicate, object, getSystemDefaultNamedGraph());
        }

        if (startedTransaction) {
            commit();
        }
        dirty = true;
    }

    @Override
    public void clear(Resource... contexts) throws RepositoryException {
        if (varargsPresent(contexts)) {
            for (Resource context : contexts) {
                if (context.equals(getSystemDefaultNamedGraph())) {
                    getDelegate().clear(getSystemDefaultNamedGraph());
                } else {
                    deleteDatasetGraph(context);
                }
            }
        } else {
            getDelegate().clear(getSystemDefaultNamedGraph());
            deleteDatasetGraph(null);
        }
        dirty = true;
    }

    @Override
    public long size(Resource... contexts) throws RepositoryException {
        Set<Resource> graphs = getGraphsSet();
        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
        }

        if (graphs.size() == 0) {
            return 0;
        }
        return getDelegate().size(graphs.toArray(new Resource[0]));
    }

    @Override
    public RepositoryResult<Resource> getNamedGraphs() {
        TupleQuery query = getDelegate().prepareTupleQuery(GET_NAMED_GRAPHS_QUERY);
        query.setBinding(DATSET_BINDING, getDataset());
        TupleQueryResult result = query.evaluate();

        return new DatasetGraphResultWrapper(result);
    }

    @Override
    public RepositoryResult<Resource> getDefaultNamedGraphs() {
        TupleQuery query = getDelegate().prepareTupleQuery(GET_DEFAULT_NAMED_GRAPHS_QUERY);
        query.setBinding(DATSET_BINDING, getDataset());
        TupleQueryResult result = query.evaluate();

        return new DatasetGraphResultWrapper(result);
    }

    @Override
    public Resource getSystemDefaultNamedGraph() {
        return systemDefaultNG;
    }

    @Override
    public void addNamedGraph(Resource graph) {
        getDelegate().add(getDataset(), valueFactory.createIRI(Dataset.namedGraph_IRI), graph, getDataset());
    }

    @Override
    public void addDefaultNamedGraph(Resource graph) {
        getDelegate().add(getDataset(), valueFactory.createIRI(Dataset.defaultNamedGraph_IRI), graph, getDataset());
    }

    @Override
    public void removeGraph(Resource graph) {
        getDelegate().remove(getDataset(), valueFactory.createIRI(Dataset.namedGraph_IRI), graph, getDataset());
        getDelegate().remove(getDataset(), valueFactory.createIRI(Dataset.defaultNamedGraph_IRI), graph, getDataset());
    }

    @Override
    public RepositoryResult<Statement> getStatements(Resource subject, IRI predicate, Value object,
                                                     Resource... contexts) throws RepositoryException {
        Set<Resource> graphs = getGraphsSet();
        if (varargsPresent(contexts)) {
            graphs.retainAll(Arrays.asList(contexts));
        }

        return getDelegate().getStatements(subject, predicate, object, graphs.toArray(new Resource[0]));
    }

    @Override
    public boolean contains(Resource subject, IRI predicate, Value object, Resource... contexts) {
        RepositoryResult<Statement> result = getStatements(subject, predicate, object, contexts);
        boolean contains = result.hasNext();
        result.close();
        return contains;
    }

    @Override
    public boolean containsContext(Resource context) throws RepositoryException {
        try (RepositoryResult<Resource> result = getContextIDs()) {
            for (Resource existingContext : result) {
                if (context.equals(existingContext)) {
                    return true;
                }
            }
            return false;
        }
    }

    @Override
    public RepositoryResult<Resource> getContextIDs() throws RepositoryException {
        TupleQuery query = getDelegate().prepareTupleQuery(GET_GRAPHS_QUERY);
        query.setBinding(DATSET_BINDING, getDataset());
        TupleQueryResult result = query.evaluate();

        return new DatasetGraphResultWrapper(result);
    }

    @Override
    public Query prepareQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public Query prepareQuery(QueryLanguage language, String query, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public TupleQuery prepareTupleQuery(String query) throws RepositoryException, MalformedQueryException {
        TupleQuery tupleQuery = getDelegate().prepareTupleQuery(query);
        tupleQuery.setDataset(getOperationDataset());
        return tupleQuery;
    }

    @Override
    public TupleQuery prepareTupleQuery(QueryLanguage language, String query, String baseURI) throws RepositoryException,
            MalformedQueryException {
        TupleQuery tupleQuery = getDelegate().prepareTupleQuery(language, query, baseURI);
        tupleQuery.setDataset(getOperationDataset());
        return tupleQuery;
    }

    @Override
    public TupleQuery prepareTupleQuery(String query, Resource... contexts) throws RepositoryException,
            MalformedQueryException {
        TupleQuery tupleQuery = getDelegate().prepareTupleQuery(query);
        tupleQuery.setDataset(getFilteredOperationDataset(contexts));
        return tupleQuery;
    }

    @Override
    public GraphQuery prepareGraphQuery(String query) throws RepositoryException, MalformedQueryException {
        GraphQuery graphQuery = getDelegate().prepareGraphQuery(query);
        graphQuery.setDataset(getOperationDataset());
        return graphQuery;
    }

    @Override
    public GraphQuery prepareGraphQuery(QueryLanguage language, String query, String baseURI) throws RepositoryException,
            MalformedQueryException {
        GraphQuery graphQuery = getDelegate().prepareGraphQuery(language, query, baseURI);
        graphQuery.setDataset(getOperationDataset());
        return graphQuery;
    }

    @Override
    public GraphQuery prepareGraphQuery(String query, Resource... contexts) throws RepositoryException,
            MalformedQueryException {
        GraphQuery graphQuery = getDelegate().prepareGraphQuery(query);
        graphQuery.setDataset(getFilteredOperationDataset(contexts));
        return graphQuery;
    }

    @Override
    public BooleanQuery prepareBooleanQuery(String query) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public BooleanQuery prepareBooleanQuery(QueryLanguage language, String query, String baseURI) throws RepositoryException,
            MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public Update prepareUpdate(String update) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public Update prepareUpdate(QueryLanguage language, String update, String baseURI) throws RepositoryException, MalformedQueryException {
        throw new NotImplementedException(NOT_YET_IMPLEMENTED);
    }

    @Override
    public Resource getDataset() {
        return datasetResource;
    }

    @Override
    public String getRepositoryId() {
        return repositoryId;
    }

    private SimpleDataset getOperationDataset() {
        if (dirty) {
            SimpleDataset operationDataset = new SimpleDataset();
            TupleQueryResult result = getGraphs();
            result.forEach(bindings -> {
                Optional<Binding> namedGraphBinding = Optional.ofNullable(bindings.getBinding("namedGraph"));
                namedGraphBinding.ifPresent(binding -> operationDataset.addNamedGraph((IRI) binding.getValue()));

                Optional<Binding> defaultGraphBinding = Optional.ofNullable(bindings.getBinding("defaultGraph"));
                defaultGraphBinding.ifPresent(binding -> operationDataset.addDefaultGraph((IRI) binding.getValue()));
            });
            opDataset = operationDataset;
            dirty = false;

            operationDataset.addDefaultGraph((IRI) systemDefaultNG);
        }
        return opDataset;
    }

    private SimpleDataset getFilteredOperationDataset(Resource... contexts) {
        if (varargsPresent(contexts)) {
            SimpleDataset opDataset = getOperationDataset();
            SimpleDataset filteredOpDataset = new SimpleDataset();

            List<Resource> contextList = Arrays.asList(contexts);
            opDataset.getNamedGraphs()
                    .stream()
                    .filter(contextList::contains)
                    .forEach(filteredOpDataset::addNamedGraph);
            opDataset.getDefaultGraphs()
                    .stream()
                    .filter(contextList::contains)
                    .forEach(filteredOpDataset::addDefaultGraph);
            return filteredOpDataset;
        } else {
            return getOperationDataset();
        }
    }


    private TupleQueryResult getGraphs() {
        TupleQuery query = getDelegate().prepareTupleQuery(GET_OPERATION_DATASET_GRAPHS);
        query.setBinding(DATSET_BINDING, getDataset());
        return query.evaluate();
    }

    private Set<Resource> getGraphsSet() {
        Set<Resource> graphSet = new HashSet<>();
        SimpleDataset operationDataset = getOperationDataset();
        graphSet.addAll(operationDataset.getDefaultGraphs());
        graphSet.addAll(operationDataset.getNamedGraphs());

        graphSet.add(systemDefaultNG);
        return graphSet;
    }

    private boolean varargsPresent(Object[] varargs) {
        return !(varargs == null || varargs.length == 0 || varargs[0] == null);
    }

    private Resource getSystemDefaultNG() {
        RepositoryResult<Statement> statements = getDelegate()
                .getStatements(datasetResource, valueFactory.createIRI(Dataset.systemDefaultNamedGraph_IRI), null);

        if (statements.hasNext()) {
            Resource resource = Statements.objectResource(statements.next())
                    .orElseThrow(() -> new MobiException("Could not retrieve systemDefaultNamedGraph for dataset"));
            statements.close();
            return resource;
        } else {
            statements.close();
            throw new MobiException("Could not retrieve systemDefaultNamedGraph for dataset");
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
            if (startedTransaction) {
                int count = 0;
                for (Statement statement : statements) {
                    getDelegate().add(statement, contexts);
                    count++;
                    if (count % batchSize == 0) {
                        try {
                            getDelegate().commit();
                            if (log != null) {
                                log.debug(batchSize + " statements imported");
                            }
                            getDelegate().begin();
                        } catch (RepositoryException e) {
                            throw new RDFHandlerException(e);
                        }
                    }
                }
            } else {
                getDelegate().add(statements, contexts);
            }
            addGraphStatements(predicate, contexts);
        } else {
            statements.forEach(stmt -> addSingleStatement(stmt, predicate));
        }

        if (startedTransaction) {
            commit();
        }
        dirty = true;
    }

    /**
     * Adds a statement to the dataset. If the statement has a context, then add it to that graph and add that graph to
     * the dataset using the provided predicate; otherwise, add the data to the system default named graph.
     *
     * @param statement The Statement to add to the dataset.
     * @param predicate The String representing the predicate to use to add the graph if it has a context.
     */
    private void addSingleStatement(Statement statement, String predicate) {
        if (statement.getContext() != null) {
            getDelegate().add(statement);
            addGraphStatements(predicate, statement.getContext());
        } else {
            getDelegate().add(statement, systemDefaultNG);
        }
        dirty = true;
    }

    /**
     * Removes a statement from the dataset if the statement is in an accessible graph. If the statement has a context,
     * then remove it from that graph; otherwise, remove it from the system default named graph.
     *
     * @param statement The Statement to remove from the dataset.
     * @param accessibleGraphs The set of Resources that represent graphs from which the data can be removed.
     */
    private void removeSingleStatement(Statement statement, Set<Resource> accessibleGraphs) {
        if (statement.getContext() != null && accessibleGraphs.contains(statement.getContext())) {
            getDelegate().remove(statement);
        } else {
            getDelegate().remove(statement, systemDefaultNG);
        }
        dirty = true;
    }

    /**
     * Adds a set of graph statements to the dataset.
     *
     * @param predicate The predicate to use for the graph statements.
     * @param contexts The graph identifiers.
     */
    private void addGraphStatements(String predicate, Resource... contexts) {
        for (Resource context : contexts) {
            if (!context.equals(datasetResource)) {
                getDelegate().add(datasetResource, valueFactory.createIRI(predicate), context, datasetResource);
            }
        }
        dirty = true;
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

    /**
     * Deletes a graph from the repository and removes the named graph and default named graph predicates from this
     * dataset.
     *
     * @param graph The graph to delete and remove from the dataset.
     */
    private void deleteDatasetGraph(Resource graph) {
        IRI ngPred = valueFactory.createIRI(Dataset.namedGraph_IRI);
        IRI dngPred = valueFactory.createIRI(Dataset.defaultNamedGraph_IRI);

        // TODO: This would be much more efficient with a sparql query

        getDelegate().getStatements(getDataset(), ngPred, graph, getDataset()).forEach(stmt ->
                Statements.objectResource(stmt).ifPresent(context -> {
                    getDelegate().remove(getDataset(), ngPred, context, getDataset());
                    getDelegate().clear(context);
                })
        );
        getDelegate().getStatements(getDataset(), dngPred, graph, getDataset()).forEach(stmt ->
                Statements.objectResource(stmt).ifPresent(context -> {
                    getDelegate().remove(getDataset(), dngPred, context, getDataset());
                    getDelegate().clear(context);
                })
        );
        dirty = true;
    }

    private static class DatasetGraphResultWrapper extends RepositoryResult<Resource> {

        private TupleQueryResult queryResult;

        DatasetGraphResultWrapper(TupleQueryResult queryResult) {
            super(new RepositoryResult<>(new EmptyIteration<>())); // TODO:
            this.queryResult = queryResult;
        }

        @Override
        public void handleClose() {
            queryResult.close();
        }

        @Override
        public boolean hasNext() {
            boolean hasNext = queryResult.hasNext();
            if (!hasNext) {
                close();
            }
            return hasNext;
        }

        @Override
        public Resource next() {
            return Bindings.requiredResource(queryResult.next(), GRAPH_BINDING);
        }
    }
}
