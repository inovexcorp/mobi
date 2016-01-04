package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectComplementOf;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectComplementOf 
	implements ObjectComplementOf {

	private ClassExpression operand;
	
	public SimpleObjectComplementOf(@Nonnull ClassExpression operand) 
	{
		this.operand = operand;
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
