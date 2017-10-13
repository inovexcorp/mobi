package com.mobi.ontology.core.impl.owlapi.classexpression;

/*-
 * #%L
 * com.mobi.ontology.core.impl.owlapi
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import com.mobi.ontology.core.api.classexpression.ClassExpression;
import com.mobi.ontology.core.api.types.ClassExpressionType;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleClassExpression implements ClassExpression {
	
	private Set<ClassExpression> operands;
	
	
	public SimpleClassExpression(@Nonnull Set<ClassExpression> operands)
	{
		this.operands = new TreeSet<ClassExpression>(operands);
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
	public boolean containsConjunct(@Nonnull ClassExpression ce) 
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
