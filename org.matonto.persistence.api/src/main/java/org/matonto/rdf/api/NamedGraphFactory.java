package org.matonto.rdf.api;

import javax.annotation.Nonnull;
import java.util.Collection;
import java.util.Set;

public interface NamedGraphFactory {

    /**
     * Creates an empty NamedGraph with a BlankNode Resource as its graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph();

    /**
     * Creates an empty NamedGraph with the supplied Resource as its graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID, the Model's Namespaces as its
     * namespaces, and populated with the contents of the supplied Model. Note that all Statements in the
     * supplied Model must have a context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Model model);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID and populated with the
     * contents of the supplied Collection. Note that all Statements in the supplied Collection must have a
     * context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Collection<@Nonnull ? extends Statement> c);

    /**
     * Creates a empty NamedGraph with the supplied Resource as its graph ID and supplied Namespaces as its
     * namespaces.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces);

    /**
     * Creates a NamedGraph with the supplied Resource as its graph ID, the supplied Namespaces as its
     * namespaces, and populated with the contents of the supplied Collection. Note that all Statements
     * in the supplied Collection must have a context that matches the graph ID.
     *
     * @return The created NamedGraph.
     */
    NamedGraph createNamedGraph(Resource graphID, @Nonnull Set<@Nonnull Namespace> namespaces,
                                @Nonnull Collection<@Nonnull ? extends Statement> c);
}
