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
import org.matonto.ontology.core.api.classexpression.DataHasValue;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.types.ClassExpressionType;
import org.matonto.rdf.api.Literal;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleDataHasValue implements DataHasValue {

	private DataPropertyExpression property;
	private Literal value;
	
	
	public SimpleDataHasValue(@Nonnull DataPropertyExpression property, @Nonnull Literal value)
	{
		this.property = property;
		this.value = value;
	}
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_HAS_VALUE;
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
	public Literal getValue() 
	{
		return value;
	}
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if(obj instanceof DataHasValue){
			DataHasValue other = (DataHasValue) obj;
			return ((other.getValue().equals(getValue())) && (other.getProperty().equals(getProperty())));
		}
		
		return false;
	}
}
