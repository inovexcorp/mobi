package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectHasSelf;
import org.matonto.ontology.core.api.ObjectHasValue;
import org.matonto.ontology.core.api.ObjectPropertyExpression;

import com.google.common.base.Preconditions;

public class SimpleObjectHasSelf implements ObjectHasSelf {
	
	
	private ObjectPropertyExpression property;
	
	
	public SimpleObjectHasSelf(ObjectPropertyExpression property)
	{
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
	}
		
	
	@Override
	public ObjectPropertyExpression getProperty()
	{
		return property;
	}
	
	
	@Override
	public SimpleClassExpressionType getClassExpressionType() 
	{
		return SimpleClassExpressionType.OBJECT_HAS_SELF;
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
		if (this == obj) {
		    return true;
		}
		if (obj instanceof ObjectHasSelf) {
			ObjectHasSelf other = (ObjectHasSelf) obj;
			return other.getProperty().equals(getProperty());
		}
		return false;
	}

}
