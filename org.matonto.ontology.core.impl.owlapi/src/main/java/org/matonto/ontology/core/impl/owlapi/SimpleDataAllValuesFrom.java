package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DataAllValuesFrom;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.DataRange;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleDataAllValuesFrom implements DataAllValuesFrom {

	private DataPropertyExpression property;
	private DataRange dataRange;
	
	
	public SimpleDataAllValuesFrom (DataPropertyExpression property, DataRange dataRange)
	{
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.dataRange = Preconditions.checkNotNull(dataRange, "dataRange cannot be null");
	}
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_ALL_VALUES_FROM;
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
	public DataRange getDataRange() 
	{
		return dataRange;
	}
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof DataAllValuesFrom ){
			DataAllValuesFrom  other = (DataAllValuesFrom) obj;
			return ((other.getDataRange().equals(getDataRange())) && (other.getProperty().equals(getProperty())));
		}
		
		return false;
	}

}
