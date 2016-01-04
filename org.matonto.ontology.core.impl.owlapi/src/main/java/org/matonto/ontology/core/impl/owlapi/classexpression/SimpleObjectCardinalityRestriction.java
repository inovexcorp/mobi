package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectCardinalityRestriction;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectCardinalityRestriction implements ObjectCardinalityRestriction {

	
	private int cardinality;
	private ObjectPropertyExpression property;
	private ClassExpression expression;
	
	
	public SimpleObjectCardinalityRestriction(@Nonnull ObjectPropertyExpression property, int cardinality, @Nonnull ClassExpression expression)
	{
		this.cardinality = cardinality;
		this.property = property;
		this.expression = expression;
	}
	
	
	@Override
	public ObjectPropertyExpression getProperty()
	{
		return property;
	}
	
	
	@Override
	public int getCardinality()
	{
		return cardinality;
	}
	
	
	@Override
	public ClassExpression getClassExpression()
	{
		return expression;
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return null;
	}

	
	@Override
	public Set<ClassExpression> asConjunctSet() 
	{
		Set<ClassExpression> conjuncts = new HashSet<ClassExpression>();
		conjuncts.add(this);	
		return conjuncts;
	}
	

	@Override
	public boolean containsConjunct(@Nonnull ClassExpression ce) 
	{
		return ce.equals(this);
	}
	

	@Override
	public Set<ClassExpression> asDisjunctSet() 
	{
		Set<ClassExpression> disjuncts = new HashSet<ClassExpression>();
		disjuncts.add(this);
		return disjuncts;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (obj instanceof ObjectCardinalityRestriction) {
			ObjectCardinalityRestriction other = (ObjectCardinalityRestriction) obj;
			return ((other.getProperty().equals(getProperty())) && (other.getCardinality()==cardinality) && (other.getClassExpression().equals(getClassExpression())));
		}
		return false;
	}

}
