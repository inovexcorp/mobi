package org.matonto.ontology.core.api.change;

import org.matonto.ontology.core.api.OWLObject;

public interface OntologyChange<T extends OWLObject> {

    T getChangedObject();

    boolean isAddition();

    boolean isRemoval();

    boolean isModification();
}
