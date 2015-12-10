package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.*;
import org.matonto.rdf.base.AbstractStatementSet;
import org.openrdf.model.util.Models;

import java.util.*;

public class SimpleNamedGraph extends AbstractStatementSet implements NamedGraph {

    private static final long serialVersionUID = -2898304389277771420L;
    private Resource graphID;
    private Model model;
    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();

    public SimpleNamedGraph() {
        this(MATONTO_VF.createBNode());
    }

    public SimpleNamedGraph(Resource graphID) {
        setDelegate(new LinkedHashModel());
        this.graphID = graphID;
    }

    public SimpleNamedGraph(Resource graphID, Model model) {
        this(graphID, model.getNamespaces());
    }

    public SimpleNamedGraph(Resource graphID, Collection<? extends Statement> c) {
        this(graphID, Collections.emptySet(), c);
    }

    public SimpleNamedGraph(Resource graphID, Set<Namespace> namespaces) {
        this(graphID, namespaces, Collections.emptyList());
    }

    public SimpleNamedGraph(Resource graphID, Set<Namespace> namespaces, Collection<? extends Statement> c) {
        this(graphID);

        c.forEach(stmt -> {
            if (!validStatement(stmt)) {
                throw new IllegalArgumentException("Every Statement in Model must contain a context " +
                        "that matches NamedGraph ID.\"");
            }
        });

        addAll(c);
        namespaces.forEach(this::setNamespace);
    }

    protected void setDelegate(Model model) {
        this.model = model;
    }

    private boolean validStatement(Statement statement) {
        Optional<Resource> context = statement.getContext();
        return context.isPresent() && context.get().equals(getGraphID());
    }

    @Override
    public Resource getGraphID() {
        return graphID;
    }

    @Override
    public boolean add(Resource subject, IRI predicate, Value object) {
        return model.add(subject, predicate, object, getGraphID());
    }

    @Override
    public int size() {
        return model.size();
    }

    @Override
    public boolean isEmpty() {
        return model.isEmpty();
    }

    @Override
    public boolean contains(Object o) {
        return model.contains(o);
    }

    @Override
    public Iterator<Statement> iterator() {
        return model.iterator();
    }

    @Override
    public boolean add(Statement statement) {
        if (validStatement(statement)) {
            return model.add(statement);
        } else {
            throw new IllegalArgumentException("Statement must contain a context that matches NamedGraph ID.");
        }
    }

    @Override
    public boolean contains(Resource subject, IRI predicate, Value object) {
        return model.contains(subject, predicate, object, getGraphID());
    }

    @Override
    public Set<Resource> contexts() {
        Set<Resource> contexts = new HashSet<>();
        contexts.add(getGraphID());
        return contexts;
    }

    @Override
    public Set<Namespace> getNamespaces() {
        return model.getNamespaces();
    }

    @Override
    public Optional<Namespace> removeNamespace(String prefix) {
        return model.removeNamespace(prefix);
    }

    @Override
    public void setNamespace(Namespace namespace) {
        model.setNamespace(namespace);
    }

    @Override
    public Namespace setNamespace(String prefix, String name) {
        return model.setNamespace(prefix, name);
    }

    @Override
    public Model filter(Resource subject, IRI predicate, Value object) {
        return model.filter(subject, predicate, object, getGraphID());
    }

    @Override
    public boolean remove(Resource subject, IRI predicate, Value object) {
        return model.remove(subject, predicate, object, getGraphID());
    }

    @Override
    public NamedGraph unmodifiable() {
        SimpleNamedGraph graph = new SimpleNamedGraph(getGraphID());
        graph.setDelegate(model.unmodifiable());
        return graph;
    }

    @Override
    public Model asModel(ModelFactory factory) {
        Model m = factory.createEmptyModel();
        m.addAll(model);
        return m;
    }

    @Override
    public boolean remove(Object o) {
        if (o instanceof Statement) {
            Statement st = (Statement) o;

            if (validStatement(st)) {
                return model.remove(st);
            } else {
                return false;
            }
        }
        return false;
    }

    @Override
    public void clear() {
        model.clear();
    }

    /**
     * Compares two NamedGraphs, and returns true if they consist of isomorphic graphs and the isomorphic graph
     * identifiers map 1:1 to each other. RDF graphs are isomorphic graphs if statements from one graphs can be mapped
     * 1:1 on to statements in the other graphs. In this mapping, blank nodes are not considered mapped when having an
     * identical internal id, but are mapped from one graph to the other by looking at the statements in which the blank
     * nodes occur.
     *
     * Note: Depending on the size of the models, this can be an expensive operation.
     *
     * @return true if they are isomorphic graphs and the isomorphic graph identifiers map 1:1 to each other
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o instanceof SimpleNamedGraph) {
            SimpleNamedGraph graph = (SimpleNamedGraph) o;

            if (!getGraphID().equals(graph.getGraphID()))
                return false;

            SesameModelWrapper model1 = new SesameModelWrapper(new org.openrdf.model.impl.LinkedHashModel());
            model1.addAll(this);

            SesameModelWrapper model2 = new SesameModelWrapper(new org.openrdf.model.impl.LinkedHashModel());
            model2.addAll(graph);

            return Models.isomorphic(model1.getSesameModel(), model2.getSesameModel());
        }
        return false;
    }

    @Override
    public int hashCode() {
        return model.hashCode() + getGraphID().hashCode();
    }
}
