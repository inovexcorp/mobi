package org.matonto.query.api;

import org.jetbrains.annotations.NotNull;
import org.matonto.rdf.api.Value;

import javax.annotation.Nonnull;

public interface Binding {

    /**
     * Gets the name of the binding (e.g. the variable name).
     *
     * @return The name of the binding.
     */
    String getName();

    /**
     * Gets the value of the binding. The returned value is never equal to
     * <tt>null</tt>, such a "binding" is considered to be unbound.
     *
     * @return The value of the binding, never <tt>null</tt>.
     */
    @NotNull @Nonnull
    Value getValue();

    /**
     * Compares a binding object to another object.
     *
     * @param object
     *        The object to compare this binding to.
     * @return <tt>true</tt> if the other object is an instance of
     *         {@link Binding} and both their names and values are equal,
     *         <tt>false</tt> otherwise.
     */
    boolean equals(Object object);


}
