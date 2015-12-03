package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectComplementOf;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.ClassExpressionType;

public class SimpleObjectComplementOf 
	implements ObjectComplementOf {

	
	private ClassExpression operand;
	
	public SimpleObjectComplementOf(ClassExpression operand) 
	{
		this.operand = Preconditions.checkNotNull(operand, "operand cannot be null");
	}

	
	public ClassExpression getOperand()
	{
		return operand;
	}	
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_COMPLEMENT_OF;
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
		
		if(obj instanceof SimpleObjectComplementOf){
			SimpleObjectComplementOf other = (SimpleObjectComplementOf) obj;
			return other.getOperand().equals(operand);
		}
		
		return false;
	}

}
