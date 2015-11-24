package org.matonto.ontology.core.api;

import java.util.Set;

import org.matonto.ontology.core.impl.owlapi.SimpleAxiomType;

public interface Axiom {

	public Set<Annotation> getAnnotations();
	
	public boolean isAnnotated();
	
	public Axiom getAxiomWithoutAnnotations();
	
	public Axiom getAnnotatedAxiom(Set<Annotation> annotations);
	
	public SimpleAxiomType getAxiomType();
}
