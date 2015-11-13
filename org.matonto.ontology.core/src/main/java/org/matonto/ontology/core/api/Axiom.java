package org.matonto.ontology.core.api;

import java.util.List;


public interface Axiom {

	public List<Annotation> getAnnotations();
	
	public boolean isAnnotated();
	
	public Axiom getAxiomWithoutAnnotations();
	
	public boolean equals(Object o);
	
	public int hashCode();
}
