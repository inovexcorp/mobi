package org.matonto.ontology.core.api.change;

import org.matonto.ontology.core.api.OWLObject;

public interface OntologyAddition<T extends OWLObject> extends OntologyChange<T> {

    default boolean isAddition() {
        return true;
    }

    default boolean isRemoval() {
        return false;
    }

    default boolean isModification() {
        return false;
    }
}
