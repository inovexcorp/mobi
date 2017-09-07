package org.matonto.ontology.core.impl.owlapi.classexpression;

/*-
 * #%L
 * org.matonto.ontology.core.impl.owlapi
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

import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectAllValuesFrom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleObjectAllValuesFrom implements ObjectAllValuesFrom {

	
	private ObjectPropertyExpression property;
	private ClassExpression classExpression;
	
	public SimpleObjectAllValuesFrom(@Nonnull ObjectPropertyExpression property, @Nonnull ClassExpression classExpression)
	{
		this.property = property;
		this.classExpression = classExpression;
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
	public boolean containsConjunct(@Nonnull ClassExpression ce) 
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
