package org.matonto.ontology.core.api;

import java.util.Set;

public interface Axiom {

	public Set<Annotation> getAnnotations();
	
	public boolean isAnnotated();
	
	public Axiom getAxiomWithoutAnnotations();
	
	public boolean equals(Object obj);
	
	public int hashCode();
}
