package org.matonto.ontology.core.api.axiom;

import org.matonto.ontology.core.api.Entity;

public interface DeclarationAxiom extends Axiom {

    Entity getEntity();

    DeclarationAxiom getAxiomWithoutAnnotations();
}
