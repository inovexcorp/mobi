package org.matonto.rdf.api;

import javax.annotation.Nonnull;
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
    Model createModel(@Nonnull Model model);

    /**
     * Creates a Model populated with the supplied Collection as its contents.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Collection<@Nonnull ? extends Statement> c);

    /**
     * Creates an empty Model with the supplied Model's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Set<Namespace> namespaces);

    /**
     * Creates a Model populated with the supplied Collection as its contents and the supplied
     * Collection's Namespaces as its namespaces.
     *
     * @return The created Model.
     */
    Model createModel(@Nonnull Set<Namespace> namespaces, @Nonnull Collection<@Nonnull ? extends Statement> c);
}