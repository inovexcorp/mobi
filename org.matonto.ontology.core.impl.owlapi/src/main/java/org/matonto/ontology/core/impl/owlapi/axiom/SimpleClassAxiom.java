package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.ClassAxiom;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleClassAxiom extends SimpleAxiom implements ClassAxiom {

	
	public SimpleClassAxiom(Set<Annotation> annotations) 
	{
		super(annotations);
	}

	
	@Override
	public ClassAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleClassAxiom(NO_ANNOTATIONS);	
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return null;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (obj instanceof ClassAxiom) {
			ClassAxiom other = (ClassAxiom)obj;			 
			return getAnnotations().equals(other.getAnnotations());
		}
		
		return false;
	}


	@Override
	public ClassAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleClassAxiom(mergeAnnos(annotations));
	}

}
