package org.matonto.ontology.core.api;

public interface DeclarationAxiom extends Axiom {

	public Entity getEntity();
	
	public DeclarationAxiom getAxiomWithoutAnnotations();
}
