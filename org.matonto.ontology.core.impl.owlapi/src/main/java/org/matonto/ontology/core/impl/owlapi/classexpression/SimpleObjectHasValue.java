package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectHasValue;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectHasValue implements ObjectHasValue {
	
	private ObjectPropertyExpression property;
	
	public SimpleObjectHasValue(@Nonnull ObjectPropertyExpression property)
	{
		this.property = property;
	}
		
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_HAS_VALUE;
	}
	
	
	@Override
	public ObjectPropertyExpression getProperty()
	{
		return property;
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
		
		if (obj instanceof ObjectHasValue) {
			ObjectHasValue other = (ObjectHasValue) obj;
			return other.getProperty().equals(getProperty());
		}
		return false;
	}

}
