package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DisjointClassesAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleDisjointClassesAxiom 
	extends SimpleClassAxiom 
	implements DisjointClassesAxiom {

	private Set<ClassExpression> expressions;
	
	
	public SimpleDisjointClassesAxiom(Set<ClassExpression> expressions, Set<Annotation> annotations) 
	{
		super(annotations);
		this.expressions = new TreeSet<ClassExpression>(Preconditions.checkNotNull(expressions, "expressions cannot be null"));
	}

	
	@Override
	public Set<ClassExpression> getClassExpressions() 
	{
		return new HashSet<ClassExpression>(expressions);
	}
	
	
	@Override
	public DisjointClassesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDisjointClassesAxiom(expressions, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public DisjointClassesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleDisjointClassesAxiom(expressions, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DISJOINT_CLASSES;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DisjointClassesAxiom) {
			DisjointClassesAxiom other = (DisjointClassesAxiom)obj;			 
			return expressions.equals(other.getClassExpressions());
		}
		
		return false;
	}


}
