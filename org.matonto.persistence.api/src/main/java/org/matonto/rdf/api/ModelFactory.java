package org.matonto.rdf.api;

import java.util.Collection;
import java.util.Set;

public interface ModelFactory {

    /**
     * Creates an empty Model.
     *
     * @return The created Model.
     */
    Model createModel();

    /**
     * Creates a Model populated with the supplied Model as its contents and the supplied
     * Model's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(Model model);

    /**
     * Creates a Model populated with the supplied Collection as its contents.
     *
     * @return The created Model.
     */
    Model createModel(Collection<? extends Statement> c);

    /**
     * Creates an empty Model with the supplied Model's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(Set<Namespace> namespaces);

    /**
     * Creates a Model populated with the supplied Collection as its contents and the supplied
     * Collection's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(Set<Namespace> namespaces, Collection<? extends Statement> c);
}
