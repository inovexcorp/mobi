package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.*;
import org.openrdf.model.impl.LinkedHashModel;

import java.util.*;

public class SimpleNamedGraph extends SesameModelWrapper implements NamedGraph {

    private Resource graphID;

    public SimpleNamedGraph(Resource graphID) {
        setDelegate(new LinkedHashModel());
        this.graphID = graphID;
    }

    public SimpleNamedGraph(Resource graphID, Model model) {
        this(graphID, model.getNamespaces());

        Set contexts = model.contexts();
        if (contexts.size() != 1 &&
                !contexts.iterator().next().equals(graphID) &&
                model.contains(null, null, null, (Resource) null)) {
            throw new IllegalArgumentException("Every Statement in Model must contain a context " +
                    "that matches NamedGraph ID.\"");
        }

        addAll(model);
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
        return super.add(subject, predicate, object, getGraphID());
    }

    @Override
    public boolean add(Resource subject, IRI predicate, Value object, Resource... context) {
        if (context.length == 1 && context[0].equals(getGraphID())) {
            return add(subject, predicate, object);
        } else {
            throw new IllegalArgumentException("Must provide a single context that matches NamedGraph ID.");
        }
    }

    @Override
    public boolean add(Statement statement) {
        if (validStatement(statement)) {
            return super.add(statement);
        } else {
            throw new IllegalArgumentException("Statement must contain a context that matches NamedGraph ID.");
        }
    }

    @Override
    public boolean clear(Resource... context) {
        if (context.length == 1 && context[0].equals(getGraphID())) {
            clear();
            return true;
        } else {
            return false;
        }
    }

    @Override
    public boolean contains(Resource subject, IRI predicate, Value object) {
        return super.contains(subject, predicate, object, getGraphID());
    }

    @Override
    public Set<Resource> contexts() {
        Set<Resource> contexts = new HashSet<>();
        contexts.add(getGraphID());
        return contexts;
    }

    @Override
    public Model filter(Resource subject, IRI predicate, Value object) {
        return super.filter(subject, predicate, object, getGraphID());
    }

    @Override
    public boolean remove(Resource subject, IRI predicate, Value object) {
        return false;
    }

    @Override
    public boolean remove(Object o) {
        if (o instanceof Statement) {
            Statement st = (Statement) o;
            return remove(st.getSubject(), st.getPredicate(), st.getObject(), st.getContext().orElse(null));
        }
        return false;
    }
}
