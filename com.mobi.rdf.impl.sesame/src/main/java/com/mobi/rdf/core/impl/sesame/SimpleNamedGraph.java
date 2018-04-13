package com.mobi.rdf.core.impl.sesame;

/*-
 * #%L
 * com.mobi.rdf.impl.sesame
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.NamedGraph;
import com.mobi.rdf.api.Namespace;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.rdf.base.AbstractStatementSet;
import org.eclipse.rdf4j.model.util.Models;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;

public class SimpleNamedGraph extends AbstractStatementSet implements NamedGraph {

    private static final long serialVersionUID = -2898304389277771420L;
    private Resource graphID;
    private Model model;
    private ModelFactory factory = LinkedHashModelFactory.getInstance();
    private static final ValueFactory MOBI_VF = SimpleValueFactory.getInstance();

    protected SimpleNamedGraph(Resource graphID, ModelFactory factory) {
        this.factory = factory;
        setDelegate(factory.createModel());
        this.graphID = graphID;
    }

    public SimpleNamedGraph() {
        this(MOBI_VF.createBNode());
    }

    public SimpleNamedGraph(Resource graphID) {
        setDelegate(new LinkedHashModel());
        this.graphID = graphID;
    }

    public SimpleNamedGraph(Resource graphID, @Nonnull Model model) {
        this(graphID, model.getNamespaces());
    }

    public SimpleNamedGraph(Resource graphID, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        this(graphID, Collections.emptySet(), c);
    }

    public SimpleNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces) {
        this(graphID, namespaces, Collections.emptyList());
    }

    public SimpleNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c) {
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

        if (context.isPresent()) {
            return context.get().equals(getGraphID());
        } else {
            return getGraphID() == null;
        }
    }

    @Override
    public Resource getGraphID() {
        return graphID;
    }

    @Override
    public boolean add(@Nonnull Resource subject, @Nonnull IRI predicate, @Nonnull Value object) {
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
    public boolean contains(@Nonnull Object o) {
        return model.contains(o);
    }

    @Override
    public @Nonnull Iterator<Statement> iterator() {
        return model.iterator();
    }

    @Override
    public boolean add(@Nonnull Statement statement) {
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
    public Optional<Namespace> removeNamespace(@Nonnull String prefix) {
        return model.removeNamespace(prefix);
    }

    @Override
    public void setNamespace(@Nonnull Namespace namespace) {
        model.setNamespace(namespace);
    }

    @Override
    public Namespace setNamespace(@Nonnull String prefix, @Nonnull String name) {
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
    public Model asModel() {
        return asModel(factory);
    }

    @Override
    public Model asModel(@Nonnull ModelFactory factory) {
        Model m = factory.createModel();
        m.addAll(model);
        return m;
    }

    @Override
    public boolean remove(@Nonnull Object o) {
        if (o instanceof Statement) {
            Statement st = (Statement) o;

            return validStatement(st) && model.remove(st);
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

            SesameModelWrapper model1 = new SesameModelWrapper(new org.eclipse.rdf4j.model.impl.LinkedHashModel());
            model1.addAll(this);

            SesameModelWrapper model2 = new SesameModelWrapper(new org.eclipse.rdf4j.model.impl.LinkedHashModel());
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
