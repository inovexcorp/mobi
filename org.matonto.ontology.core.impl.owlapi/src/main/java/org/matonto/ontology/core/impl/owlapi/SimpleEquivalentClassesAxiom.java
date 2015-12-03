package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.axiom.EquivalentClassesAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleEquivalentClassesAxiom 
	extends SimpleClassAxiom 
	implements EquivalentClassesAxiom {

	
	private Set<ClassExpression> expressions;
	
	
	public SimpleEquivalentClassesAxiom(Set<ClassExpression> expressions, Set<Annotation> annotations) 
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
	public EquivalentClassesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleEquivalentClassesAxiom(expressions, NO_ANNOTATIONS);	
	}
	
	
	@Override
	public EquivalentClassesAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleEquivalentClassesAxiom(expressions, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.EQUIVALENT_CLASSES;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof EquivalentClassesAxiom) {
			EquivalentClassesAxiom other = (EquivalentClassesAxiom)obj;			 
			return expressions.equals(other.getClassExpressions());
		}
		
		return false;
	}

}
