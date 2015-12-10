package org.matonto.ontology.core.impl.owlapi.change;

import org.matonto.ontology.core.api.Ontology;
import org.matonto.ontology.core.api.change.OntologyChange;
import org.matonto.ontology.core.api.change.OntologyChangeset;

import java.util.HashSet;
import java.util.Set;

public class SimpleOntologyChangeset implements OntologyChangeset {

    private Ontology ontology;
    private Set<OntologyChange> changes = new HashSet<>();

    public SimpleOntologyChangeset(Ontology ontology) {
        this.ontology = ontology;
    }

    @Override
    public Ontology getOntology() {
        return ontology;
    }

    @Override
    public Ontology applyChanges() {
        return null;
    }

    @Override
    public Set<OntologyChange> getAdditions() {
        return null;
    }

    @Override
    public Set<OntologyChange> getRemovals() {
        return null;
    }

    @Override
    public Set<OntologyChange> getModifications() {
        return null;
    }

    @Override
    public Set<OntologyChange> getChanges() {
        return null;
    }

    @Override
    public boolean addChange(OntologyChange change) {
        return changes.add(change);
    }
}
