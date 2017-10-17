package com.mobi.ontology.core.impl.owlapi.axiom;

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

import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.axiom.DataPropertyRangeAxiom;
import com.mobi.ontology.core.api.datarange.DataRange;
import com.mobi.ontology.core.api.propertyexpression.DataPropertyExpression;
import com.mobi.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleDataPropertyRangeAxiom 
	extends SimpleAxiom 
	implements DataPropertyRangeAxiom {

	
	public DataPropertyExpression property;
	public DataRange range;
	
	
	public SimpleDataPropertyRangeAxiom(@Nonnull DataPropertyExpression property, @Nonnull DataRange range, Set<Annotation> annotations)
	{
		super(annotations);
		this.property = property;
		this.range = range;
	}

	
	@Override
	public DataPropertyRangeAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleDataPropertyRangeAxiom(property, range, NO_ANNOTATIONS);	
	}
	

	@Override
	public DataPropertyRangeAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleDataPropertyRangeAxiom(property, range, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.DATA_PROPERTY_RANGE;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}

	
	@Override
	public DataRange getRange() 
	{
		return range;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof DataPropertyRangeAxiom) {
			DataPropertyRangeAxiom other = (DataPropertyRangeAxiom)obj;			 
			return ((property.equals(other.getDataProperty())) && (range.equals(other.getRange())));
		}
		
		return false;
	}

}
