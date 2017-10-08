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
import com.mobi.ontology.core.api.classexpression.ObjectMinCardinality;
import com.mobi.ontology.core.api.types.ClassExpressionType;
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import javax.annotation.Nonnull;


public class SimpleObjectMinCardinality 
	extends SimpleObjectCardinalityRestriction 
	implements ObjectMinCardinality {
	
	public SimpleObjectMinCardinality(@Nonnull ObjectPropertyExpression property, int cardinality, @Nonnull ClassExpression expression)
	{
		super(property, cardinality, expression);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_MIN_CARDINALITY;
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj) 
			return true;
		
		if (!super.equals(obj)) 
			return false;
		
		return obj instanceof ObjectMinCardinality;
	}
	

}
