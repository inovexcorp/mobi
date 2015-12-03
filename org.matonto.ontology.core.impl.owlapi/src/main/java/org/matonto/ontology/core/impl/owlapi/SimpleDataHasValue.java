package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DataHasValue;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.Literal;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleDataHasValue implements DataHasValue {

	private DataPropertyExpression property;
	private Literal value;
	
	
	public SimpleDataHasValue(DataPropertyExpression property, Literal value)
	{
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.value = Preconditions.checkNotNull(value, "dataRange cannot be null");
	}
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_HAS_VALUE;
	}

	@Override
	public Set<ClassExpression> asConjunctSet() 
	{
		Set<ClassExpression> result = new HashSet<ClassExpression>();
		result.add(this);
		return result;
	}	
	
	
	@Override
	public boolean containsConjunct(ClassExpression ce)
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

	@Override
	public DataPropertyExpression getProperty() 
	{
		return property;
	}

	@Override
	public Literal getValue() 
	{
		return value;
	}
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof DataHasValue){
			DataHasValue other = (DataHasValue) obj;
			return ((other.getValue().equals(getValue())) && (other.getProperty().equals(getProperty())));
		}
		
		return false;
	}
}
