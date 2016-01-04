package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.DataAllValuesFrom;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.datarange.DataRange;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleDataAllValuesFrom implements DataAllValuesFrom {

	private DataPropertyExpression property;
	private DataRange dataRange;
	
	
	public SimpleDataAllValuesFrom (@Nonnull DataPropertyExpression property, @Nonnull DataRange dataRange)
	{
		this.property = property;
		this.dataRange = dataRange;
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
