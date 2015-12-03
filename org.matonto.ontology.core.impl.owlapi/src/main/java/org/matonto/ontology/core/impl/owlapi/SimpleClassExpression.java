package org.matonto.ontology.core.impl.owlapi;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.classexpression.ClassExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleClassExpression implements ClassExpression {
	
	private Set<ClassExpression> operands;
	
	
	public SimpleClassExpression(Set<ClassExpression> operands)
	{
		this.operands = new TreeSet<ClassExpression>(Preconditions.checkNotNull(operands, "operands cannot be null"));
	}

	
	public List<ClassExpression> getOperandsAsList()
	{
		return new ArrayList<ClassExpression>(operands);
	}
	
	
	public Set<ClassExpression> getOperands()
	{
		return new TreeSet<ClassExpression>(operands);
	}
	
	
	@Override
	public Set<ClassExpression> asConjunctSet()
	{
		Set<ClassExpression> conjuncts = new HashSet<ClassExpression>();
		for(ClassExpression op : getOperands())
			conjuncts.add(op);
		
		return conjuncts;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
		    return true;
		}
		if ((obj instanceof SimpleClassExpression)) {
			SimpleClassExpression other = (SimpleClassExpression)obj;
			return getOperands().equals(other.getOperands());
		}
		
		return false;
	}


	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return null;
	}


	@Override
	public boolean containsConjunct(ClassExpression ce) 
	{
		if (ce.equals(this)) {
			return true;
		}
		for (ClassExpression op : getOperands()) {
			if (op.containsConjunct(ce)) {
				return true;
			}
		}
		return false;
	}


	@Override
	public Set<ClassExpression> asDisjunctSet() 
	{
		Set<ClassExpression> disjuncts = new HashSet<ClassExpression>();
		disjuncts.add(this);
		for(ClassExpression op : getOperands())
			disjuncts.addAll(op.asConjunctSet());
		
		return disjuncts;
	}
	
	
	
}
