package org.matonto.ontology.core.impl.owlapi.change;

import org.matonto.ontology.core.api.OWLObject;
import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.change.OntologyAddition;

public class SimpleOntologyAddition<T extends OWLObject> implements OntologyAddition<T> {

    private Ontology ontology;
    private T object;

    public SimpleOntologyAddition(Ontology ontology, T object) {
        this.ontology = ontology;
        this.object = object;
    }

    @Override
    public T getChangedObject() {
        return null;
    }
}
