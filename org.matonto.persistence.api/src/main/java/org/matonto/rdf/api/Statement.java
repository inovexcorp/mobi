package org.matonto.rdf.api;

import java.io.Serializable;
import java.util.Optional;

public interface Statement extends Serializable {

    /**
     * Compares a statement object to another object.
     *
     * @param object - The object to compare this statement to.
     * @return true if the other object is an instance of Statement and if their subjects, predicates, objects and
     * contexts are equal.
     */
    boolean equals(Object object);

    /**
     * Gets the context of this statement.
     *
     * @return The statement's context, or Optional.empty() if it doesn't have one.
     */
    Optional<Resource> getContext();

    /**
     * Gets the object of this statement.
     *
     * @return The statement's object.
     */
    Value getObject();

    /**
     * Gets the predicate of this statement.
     *
     * @return The statement's predicate.
     */
    IRI getPredicate();

    /**
     * Gets the subject of this statement.
     *
     * @return The statement's subject.
     */
    Resource getSubject();

    /**
     * The hash code of a statement.
     *
     * @return A hash code for the statement.
     */
    int hashCode();
}
