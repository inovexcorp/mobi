package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.ClassAssertionAxiom;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleClassAssertionAxiom 
	extends SimpleAxiom 
	implements ClassAssertionAxiom {

	
	private Individual individual;
	private ClassExpression expression;
	
	
	public SimpleClassAssertionAxiom(@Nonnull Individual individual, @Nonnull ClassExpression expression, Set<Annotation> annotations) 
	{
		super(annotations);
		this.individual = individual;
		this.expression = expression;
	}

	
	@Override
	public ClassAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleClassAssertionAxiom(individual, expression, NO_ANNOTATIONS);	
	}

	
	@Override
	public ClassAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleClassAssertionAxiom(individual, expression, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.CLASS_ASSERTION;
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
