package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.DataCardinalityRestriction;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleDataCardinalityRestriction implements DataCardinalityRestriction {

	private int cardinality;
	private DataPropertyExpression property;
	private DataRange dataRange;
	
	
	public SimpleDataCardinalityRestriction(@Nonnull DataPropertyExpression property, int cardinality, @Nonnull DataRange dataRange)
	{
		this.cardinality = cardinality;
		this.property = property;
		this.dataRange = dataRange;
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
	public DataPropertyExpression getProperty() 
	{
		return property;
	}

	
	@Override
	public int getCardinality() 
	{
		return cardinality;
	}

	
	@Override
	public DataRange getDataRange() 
	{
		return dataRange;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (obj instanceof DataCardinalityRestriction) {
			DataCardinalityRestriction other = (DataCardinalityRestriction) obj;
			return ((other.getProperty().equals(getProperty())) && (other.getCardinality()==cardinality) && (other.getDataRange().equals(getDataRange())));
		}
		return false;
	}

}
