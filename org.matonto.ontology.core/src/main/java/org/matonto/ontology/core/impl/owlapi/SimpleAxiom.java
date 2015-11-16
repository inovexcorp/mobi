package org.matonto.ontology.core.impl.owlapi;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.Annotation;

import org.matonto.ontology.core.api.Axiom;
import org.semanticweb.owlapi.model.OWLAxiom;

public abstract class SimpleAxiom implements Axiom {

	private Set<Annotation> annotations;
	private SimpleAxiomType axiomType;
	
	public SimpleAxiom(Set<Annotation> annotations)
	{
		if(annotations.isEmpty())
			this.annotations = Collections.emptySet();
		else
			this.annotations = annotations;
	}
	
	@Override
	public Set<Annotation> getAnnotations() 
	{
	    if (annotations.isEmpty()) 
	    	return Collections.emptySet();
	    
	    return annotations;
	}

	@Override
	public boolean isAnnotated() 
	{
		return !annotations.isEmpty();
	}
	
	
	public SimpleAxiomType getAxiomType()
	{
		return axiomType;
	}

	
	protected Set<Annotation> mergeAnnos(Set<Annotation> annos)
	{
		Set<Annotation> merged = new HashSet<Annotation>(annos);
		merged.addAll(annotations);
		return merged;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		
		if (obj instanceof SimpleAxiom) {
			SimpleAxiom other = (SimpleAxiom)obj;			 
			return annotations.equals(other.getAnnotations());
		}
		
		return false;
	}
	
	/*
	 * MUST Implement!!!!!!!
	 */
	public OWLAxiom owlapiAxiom(Axiom matontoAxiom)
	{
		return null;
	}
	
	public Axiom matontoAxiom(OWLAxiom owlapiAxiom)
	{
		return null;
	}

}
