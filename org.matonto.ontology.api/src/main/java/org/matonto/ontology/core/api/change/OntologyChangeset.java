package org.matonto.ontology.core.api.change;

import org.matonto.ontology.core.api.Ontology;

import java.util.Set;

public interface OntologyChangeset {

    Ontology getOntology();

    Ontology applyChanges();

    Set<OntologyChange> getAdditions();

    Set<OntologyChange> getRemovals();

    Set<OntologyChange> getModifications();

    Set<OntologyChange> getChanges();

    boolean addChange(OntologyChange change);
}
