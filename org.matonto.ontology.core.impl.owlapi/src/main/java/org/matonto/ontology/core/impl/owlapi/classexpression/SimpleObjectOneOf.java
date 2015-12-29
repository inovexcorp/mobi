package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.classexpression.ObjectOneOf;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectOneOf implements ObjectOneOf {

	
	private Set<Individual> individuals;
	
	public SimpleObjectOneOf(@Nonnull Set<Individual> individuals) 
	{
		this.individuals = new HashSet<Individual>(individuals);
	}
	
	
	public Set<Individual> getIndividuals()
	{
		return new HashSet<Individual>(individuals);
	}
	
	
	public ClassExpression asObjectUnionOf()
	{
		if(individuals.size() == 1) {
			return this;
		}
		Set<ClassExpression> ops = new HashSet<ClassExpression>();
		for(Individual ind : individuals) {
			if(ind != null) {
				Set<Individual> inds = new HashSet<Individual>();
				inds.add(ind);
				ops.add(new SimpleObjectOneOf(inds));
			}
		}
		return new SimpleObjectUnionOf(ops);
		
	}

	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_ONE_OF;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof SimpleObjectOneOf){
			SimpleObjectOneOf other = (SimpleObjectOneOf) obj;
			return other.getIndividuals().equals(individuals);
		}
		
		return false;
	}
	
	
	@Override
	public Set<ClassExpression> asConjunctSet() 
	{
		Set<ClassExpression> result = new HashSet<ClassExpression>();
		result.add(this);
		return result;
	}	
	
	
	@Override
	public boolean containsConjunct(@Nonnull ClassExpression ce)
	{
		return ce.equals(this);
	}
	
	
	@Override
	public Set<ClassExpression> asDisjunctSet()
	{
		Set<ClassExpression> result = new HashSet<ClassExpression>();
		result.add(this);
		return result;
	}

}
