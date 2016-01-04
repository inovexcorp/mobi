package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import javax.annotation.Nonnull;

import org.matonto.ontology.core.api.Annotation;

import org.matonto.ontology.core.api.axiom.Axiom;
import org.semanticweb.owlapi.model.OWLAxiom;

public abstract class SimpleAxiom implements Axiom {

	private Set<Annotation> annotations = new HashSet<Annotation>();
	protected Set<Annotation> NO_ANNOTATIONS;
	
	public SimpleAxiom(Set<Annotation> annotations)
	{
	    if(annotations != null) {
    		if(annotations.isEmpty())
    			this.annotations = Collections.emptySet();
    		
    		else
    			this.annotations = new HashSet<Annotation>(annotations);
	    }
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

	
	protected Set<Annotation> mergeAnnos(@Nonnull Set<Annotation> annos)
	{
		Set<Annotation> merged = new HashSet<Annotation>(annos);
		merged.addAll(annotations);
		return merged;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (obj instanceof Axiom) {
			Axiom other = (Axiom)obj;			 
			return annotations.equals(other.getAnnotations());
		}
		
		return false;
	}

}
