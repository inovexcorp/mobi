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
import com.mobi.ontology.core.api.classexpression.ObjectOneOf;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.types.ClassExpressionType;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleObjectOneOf implements ObjectOneOf {

	
	private Set<Individual> individuals;
	
	public SimpleObjectOneOf(@Nonnull Set<Individual> individuals) 
	{
		this.individuals = new HashSet<Individual>(individuals);
	}
	
	
	public Set<Individual> getIndividuals()
	{
		return new HashSet<Individual>(individuals);
	}
	
	
	public ClassExpression asObjectUnionOf()
	{
		if(individuals.size() == 1) {
			return this;
		}
		Set<ClassExpression> ops = new HashSet<ClassExpression>();
		for(Individual ind : individuals) {
			if(ind != null) {
				Set<Individual> inds = new HashSet<Individual>();
				inds.add(ind);
				ops.add(new SimpleObjectOneOf(inds));
			}
		}
		return new SimpleObjectUnionOf(ops);
		
	}

	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_ONE_OF;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof SimpleObjectOneOf){
			SimpleObjectOneOf other = (SimpleObjectOneOf) obj;
			return other.getIndividuals().equals(individuals);
		}
		
		return false;
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

}
