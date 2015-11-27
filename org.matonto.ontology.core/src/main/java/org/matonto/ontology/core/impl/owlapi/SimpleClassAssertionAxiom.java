package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.ClassAssertionAxiom;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.Individual;

import com.google.common.base.Preconditions;


public class SimpleClassAssertionAxiom 
	extends SimpleAxiom 
	implements ClassAssertionAxiom {

	
	private Individual individual;
	private ClassExpression expression;
	
	
	public SimpleClassAssertionAxiom(Individual individual, ClassExpression expression, Set<Annotation> annotations) 
	{
		super(annotations);
		this.individual = Preconditions.checkNotNull(individual, "individual cannot be null");
		this.expression = Preconditions.checkNotNull(expression, "expression cannot be null");
	}

	
	@Override
	public ClassAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleClassAssertionAxiom(individual, expression, NO_ANNOTATIONS);	
	}

	
	@Override
	public ClassAssertionAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleClassAssertionAxiom(individual, expression, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.CLASS_ASSERTION;
	}

	
	@Override
	public Individual getIndividual() 
	{
		return individual;
	}

	
	@Override
	public ClassExpression getClassExpression() 
	{
		return expression;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof ClassAssertionAxiom) {
			ClassAssertionAxiom other = (ClassAssertionAxiom)obj;			 
			return ((individual.equals(other.getIndividual())) && (expression.equals(other.getClassExpression())));
		}
		
		return false;
	}

}
