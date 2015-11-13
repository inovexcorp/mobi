package org.matonto.ontology.core.impl.owlapi;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.matonto.ontology.core.api.Annotation;

import org.matonto.ontology.core.api.Axiom;

public abstract class SimpleAxiom implements Axiom {

	private List<Annotation> annotations = new ArrayList<>();
	
	public SimpleAxiom(List<Annotation> annotations)
	{
		this.annotations = annotations;
	}
	
	@Override
	public List<Annotation> getAnnotations() 
	{
	    if (annotations.isEmpty()) 
	    	return Collections.emptyList();
	    
	    return annotations;
	}

	@Override
	public boolean isAnnotated() 
	{
		return !annotations.isEmpty();
	}

	
	protected List<Annotation> mergeAnnos(List<Annotation> annos)
	{
		List<Annotation> merged = annos;
		merged.addAll(annotations);
		return merged;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		if ((obj == null) || (hashCode() != obj.hashCode())) {
			return false;
		}
		if (!(obj instanceof Axiom)) {
			return false;
		}
		
		Axiom other = (Axiom)obj;
		 
		if ((other instanceof SimpleAxiom))
		{
			return annotations.equals(annotations);
		}
		
		return getAnnotations().equals(other.getAnnotations());
	}

}
