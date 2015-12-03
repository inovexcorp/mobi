package org.matonto.ontology.core.api;

import java.util.Set;

import org.matonto.ontology.core.api.types.AxiomType;

public interface Axiom {

	Set<Annotation> getAnnotations();
	
	boolean isAnnotated();
	
	Axiom getAxiomWithoutAnnotations();
	
	Axiom getAnnotatedAxiom(Set<Annotation> annotations);
	
	AxiomType getAxiomType();
}
