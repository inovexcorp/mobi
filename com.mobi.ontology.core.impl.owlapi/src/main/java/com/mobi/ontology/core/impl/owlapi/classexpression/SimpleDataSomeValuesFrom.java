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

import com.mobi.ontology.core.api.propertyexpression.DataPropertyExpression;
import com.mobi.ontology.core.api.classexpression.ClassExpression;
import com.mobi.ontology.core.api.classexpression.DataSomeValuesFrom;
import com.mobi.ontology.core.api.datarange.DataRange;
import com.mobi.ontology.core.api.types.ClassExpressionType;

import java.util.HashSet;
import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleDataSomeValuesFrom implements DataSomeValuesFrom {

	private DataPropertyExpression property;
	private DataRange dataRange;
	
	
	public SimpleDataSomeValuesFrom(@Nonnull DataPropertyExpression property, @Nonnull DataRange dataRange)
	{
		this.property = property;
		this.dataRange = dataRange;
	}
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.DATA_SOME_VALUES_FROM;
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
		
		if(obj instanceof DataSomeValuesFrom){
			DataSomeValuesFrom other = (DataSomeValuesFrom) obj;
			return ((other.getDataRange().equals(getDataRange())) && (other.getProperty().equals(getProperty())));
		}
		
		return false;
	}

}
