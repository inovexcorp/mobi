package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.SubClassOfAxiom;

import com.google.common.base.Preconditions;

public class SimpleSubClassOfAxiom extends SimpleClassAxiom implements SubClassOfAxiom {

	private ClassExpression subClass;
	private ClassExpression superClass;
	
	
	public SimpleSubClassOfAxiom(ClassExpression subClass, ClassExpression superClass, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subClass = Preconditions.checkNotNull(subClass, "subClass cannot be null");
		this.superClass = Preconditions.checkNotNull(subClass, "subClass cannot be null");
	}

	
	@Override
	public ClassExpression getSubClass() 
	{
		return subClass;
	}

	
	@Override
	public ClassExpression getSuperClass() 
	{
		return superClass;
	}
	
	
	@Override
	public SubClassOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubClassOfAxiom(subClass, superClass, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public SubClassOfAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleSubClassOfAxiom(subClass, superClass, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.SUBCLASS_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof SubClassOfAxiom) {
			SubClassOfAxiom other = (SubClassOfAxiom)obj;			 
			return ((subClass.equals(other.getSubClass())) && (superClass.equals(other.getSuperClass())));
		}
		
		return false;
	}

}
