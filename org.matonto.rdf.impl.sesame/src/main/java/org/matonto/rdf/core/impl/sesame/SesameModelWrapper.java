package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Namespace;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.Statement;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.openrdf.model.util.Models;

import java.util.*;
import java.util.stream.Collectors;

public class SesameModelWrapper implements Model {

    private static final long serialVersionUID = -4290503637573113943L;
    private static final ValueFactory MATONTO_VF = SimpleValueFactory.getInstance();

    private org.openrdf.model.Model sesameModel;

    protected SesameModelWrapper() {}

    protected SesameModelWrapper(org.openrdf.model.Model model) {
        setDelegate(model);
    }

    protected void setDelegate(org.openrdf.model.Model model) {
        this.sesameModel = model;
    }

    @Override
    public boolean add(Resource subject, IRI predicate, Value object, Resource... context) {
        return sesameModel.add(Values.sesameResource(subject), Values.sesameIRI(predicate), Values.sesameValue(object),
                Values.sesameResources(context));
    }

    @Override
    public boolean clear(Resource... context) {
        return sesameModel.clear(Values.sesameResources(context));
    }

    @Override
    public boolean contains(Resource subject, IRI predicate, Value object, Resource... context) {
            return sesameModel.contains(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), Values.sesameResources(context));
    }

    @Override
    public Model filter(Resource subject, IRI predicate, Value object, Resource... context) {
        if (context == null) {
            return new SesameModelWrapper(
                    sesameModel.filter(Values.sesameResource(subject), Values.sesameIRI(predicate),
                            Values.sesameValue(object), (org.openrdf.model.Resource) null)
            );
        } else {
            return new SesameModelWrapper(
                    sesameModel.filter(Values.sesameResource(subject), Values.sesameIRI(predicate),
                            Values.sesameValue(object), Values.sesameResources(context))
            );
        }
    }

    @Override
    public Set<Namespace> getNamespaces() {
        return sesameModel.getNamespaces().stream()
                .map(n -> new SimpleNamespace(n.getPrefix(), n.getName()))
                .collect(Collectors.toSet());
    }

    @Override
    public boolean remove(Resource subject, IRI predicate, Value object, Resource... context) {
        if (context == null) {
            return sesameModel.remove(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), (org.openrdf.model.Resource) null);
        } else {
            return sesameModel.remove(Values.sesameResource(subject), Values.sesameIRI(predicate),
                    Values.sesameValue(object), Values.sesameResources(context));
        }
    }

    @Override
    public Optional<Namespace> removeNamespace(String prefix) {
        Optional<org.openrdf.model.Namespace> sesameNS = sesameModel.removeNamespace(prefix);

        if (sesameNS.isPresent()) {
            return Optional.of(new SimpleNamespace(sesameNS.get().getPrefix(), sesameNS.get().getName()));
        } else {
            return Optional.empty();
        }
    }

    @Override
    public void setNamespace(Namespace namespace) {
        sesameModel.setNamespace(
                new org.openrdf.model.impl.SimpleNamespace(namespace.getPrefix(), namespace.getName())
        );
    }

    @Override
    public Namespace setNamespace(String prefix, String name) {
        Optional<? extends Namespace> result = getNamespace(prefix);
        if (!result.isPresent() || !result.get().getName().equals(name)) {
            result = Optional.of(new SimpleNamespace(prefix, name));
            setNamespace(result.get());
        }
        return result.get();
    }

    @Override
    public Model unmodifiable() {
        return new SesameModelWrapper(sesameModel.unmodifiable());
    }

    @Override
    public int size() {
        return sesameModel.size();
    }

    @Override
    public boolean isEmpty() {
        return sesameModel.isEmpty();
    }

    @Override
    public boolean contains(Object o) {
        if (o instanceof Statement) {
            Statement st = (Statement) o;
            if (st.getContext().isPresent()) {
                return contains(st.getSubject(), st.getPredicate(), st.getObject(), st.getContext().get());
            } else {
                return contains(st.getSubject(), st.getPredicate(), st.getObject());
            }
        }
        return false;
    }

    @Override
    public Iterator<Statement> iterator() {
        Iterator<org.openrdf.model.Statement> sesameItr = sesameModel.iterator();

        return new Iterator<Statement>() {
            @Override
            public boolean hasNext() {
                return sesameItr.hasNext();
            }

            @Override
            public Statement next() {
                org.openrdf.model.Statement stmt = sesameItr.next();
                return MATONTO_VF.createStatement(Values.matontoResource(stmt.getSubject()),
                        Values.matontoIRI(stmt.getPredicate()), Values.matontoValue(stmt.getObject()),
                        Values.matontoResource(stmt.getContext()));
            }

            @Override
            public void remove() {
                sesameItr.remove();
            }
        };
    }

    @Override
    public Object[] toArray() {
        Iterator<Statement> it = iterator();
        List<Object> r = new ArrayList<>(size());
        while (it.hasNext()) {
            r.add(it.next());
        }
        return r.toArray();
    }

    @Override
    public <T> T[] toArray(T[] a) {
        Iterator<Statement> it = iterator();
        List<Object> r = new ArrayList<>(size());
        while (it.hasNext()) {
            r.add(it.next());
        }
        return r.toArray(a);
    }

    @Override
    public boolean add(Statement statement) {
        if (statement.getContext().isPresent()) {
            return add(statement.getSubject(), statement.getPredicate(), statement.getObject(), statement.getContext().get());
        } else {
            return add(statement.getSubject(), statement.getPredicate(), statement.getObject());
        }
    }

    @Override
    public boolean remove(Object o) {
        if (o instanceof Statement) {
            Statement st = (Statement) o;
            return remove(st.getSubject(), st.getPredicate(), st.getObject(), st.getContext().orElse(null));
        }
        return false;
    }

    @Override
    public boolean containsAll(Collection<?> c) {
        Iterator<?> e = c.iterator();
        while (e.hasNext())
            if (!contains(e.next()))
                return false;
        return true;
    }

    @Override
    public boolean addAll(Collection<? extends Statement> c) {
        Iterator<? extends Statement> e = c.iterator();
        boolean modified = false;
        while (e.hasNext()) {
            if (add(e.next()))
                modified = true;
        }
        return modified;
    }

    @Override
    public boolean retainAll(Collection<?> c) {
        Iterator<Statement> e = iterator();
        boolean modified = false;
        while (e.hasNext()) {
            if (!c.contains(e.next())) {
                e.remove();
                modified = true;
            }
        }
        return modified;
    }

    @Override
    public boolean removeAll(Collection<?> c) {
        boolean modified = false;
        Iterator<?> i = c.iterator();
        while (i.hasNext())
            modified |= remove(i.next());
        return modified;
    }

    @Override
    public void clear() {
        sesameModel.clear();
    }

    /**
     * Compares two RDF models, and returns true if they consist of isomorphic graphs and the isomorphic graph
     * identifiers map 1:1 to each other. RDF graphs are isomorphic graphs if statements from one graphs can be mapped
     * 1:1 on to statements in the other graphs. In this mapping, blank nodes are not considered mapped when having an
     * identical internal id, but are mapped from one graph to the other by looking at the statements in which the blank
     * nodes occur.
     *
     * A Model can consist of more than one graph (denoted by context identifiers). Two models are considered isomorphic
     * if for each of the graphs in one model, an isomorphic graph exists in the other model, and the context
     * identifiers of these graphs are either identical or (in the case of blank nodes) map 1:1 on each other.
     *
     * Note: Depending on the size of the models, this can be an expensive operation.
     *
     * @return true if they consist of isomorphic graphs and the isomorphic graph identifiers map 1:1 to each other
     */
    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o instanceof SesameModelWrapper) {
            SesameModelWrapper model = (SesameModelWrapper) o;
            return Models.isomorphic(this.sesameModel, model.getSesameModel());
        }
        return false;
    }

    @Override
    public int hashCode() {
        return sesameModel.hashCode();
    }

    /**
     * @return the unmodifiable sesame model that represents this Model
     */
    protected org.openrdf.model.Model getSesameModel() {
        return sesameModel.unmodifiable();
    }
}
