package org.matonto.query.api;


import org.matonto.rdf.api.Value;

import java.util.Iterator;
import java.util.Optional;
import java.util.Set;

public interface BindingSet extends Iterable<Binding> {

    /**
     * Creates an iterator over the non-null bindings in the binding set.
     * @return The iterator with non-null bindings
     */
    Iterator<Binding> iterator();

    /**
     * Gets the names of the bindings in a binding set.
     * @return A set with binding names as strings
     */
    Set<String> getBindingNames();

    /**
     * Gets the binding with the given binding name.
     * @param bindingName The name of the binding needed
     * @return A binding with bindingName as the name of the binding
     */
    Optional<Binding> getBinding(String bindingName);

    /**
     * Checks whether a binding with the given name exists.
     * @param bindingName The binding name of the binding to look for
     * @return A boolean with true if the binding exists or false if it does not
     */
    boolean hasBinding(String bindingName);

    /**
     * Returns the value of the binding with a given name.
     * @param bindingName The name of the binding of which a value is requested
     * @return The value with of the binding with the given name, or null if the binding with the given name
     *         does not exist
     */
    Optional<Value> getValue(String bindingName);

    /**
     * Returns the number of bindings in the binding set.
     * @return An integer value of the number of bindings in the binding set
     */
    int size();

    /**
     * Compares a BindingSet to another object.
     * @param object The object to compare the bindingset to
     * @return true if the object is an instance of BindingSet and contains the same Bindings in any order, false if not
     */
    boolean equals(Object object);

}
