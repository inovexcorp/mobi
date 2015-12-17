package org.matonto.rdf.core.impl.sesame;

import org.matonto.rdf.api.*;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Collections;
import java.util.Set;

public abstract class AbstractNamedGraphFactory implements NamedGraphFactory {

    private static final ValueFactory VF = SimpleValueFactory.getInstance();

    @Override
    public NamedGraph createNamedGraph() {
        return createNamedGraph(VF.createBNode());
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Model model) {
        return createNamedGraph(graphID, model.getNamespaces(), model);
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Collection<@Nonnull ? extends Statement> c) {
        return createNamedGraph(graphID, Collections.emptySet(), c);
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces) {
        return createNamedGraph(graphID, namespaces, Collections.emptySet());
    }

    @Override
    public NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces,
                                       @Nonnull Collection<@Nonnull ? extends Statement> c) {
        NamedGraph graph = createNamedGraph();
        graph.addAll(c);
        namespaces.forEach(graph::setNamespace);
        return graph;
    }
}
