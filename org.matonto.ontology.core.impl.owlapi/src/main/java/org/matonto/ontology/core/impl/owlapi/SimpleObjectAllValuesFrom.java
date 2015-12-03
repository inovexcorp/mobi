package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectAllValuesFrom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleObjectAllValuesFrom implements ObjectAllValuesFrom {

	
	private ObjectPropertyExpression property;
	private ClassExpression classExpression;
	
	public SimpleObjectAllValuesFrom(ObjectPropertyExpression property, ClassExpression classExpression)
	{
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.classExpression = Preconditions.checkNotNull(classExpression, "classExpression cannot be null");
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_ALL_VALUES_FROM;
	}
	
	
	@Override
	public ObjectPropertyExpression getProperty()
	{
		return property;
	}
	
	
	@Override
	public ClassExpression getClassExpression()
	{
		return classExpression;
	}
	

	@Override
	public Set<ClassExpression> asConjunctSet() 
	{
		Set<ClassExpression> conjuncts = new HashSet<ClassExpression>();
		conjuncts.add(this);	
		return conjuncts;
	}

	
	@Override
	public boolean containsConjunct(ClassExpression ce) 
	{
		return (this.equals(ce) || classExpression.equals(ce));
	}

	
	@Override
	public Set<ClassExpression> asDisjunctSet() 
	{
		Set<ClassExpression> disjuncts = new HashSet<ClassExpression>();
		disjuncts.add(this);
		disjuncts.add(this.getClassExpression());
		return disjuncts;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		if (obj instanceof ObjectAllValuesFrom) {
			ObjectAllValuesFrom other = (ObjectAllValuesFrom) obj;
			if(other.getClassExpression().equals(getClassExpression()))
				return other.getProperty().equals(getProperty());
		}
		return false;
	}


}
