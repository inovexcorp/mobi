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
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.api.axiom.InverseObjectPropertiesAxiom;
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleInverseObjectPropertiesAxiom 
	extends SimpleAxiom 
	implements InverseObjectPropertiesAxiom {

	
	private ObjectPropertyExpression firstProperty;
	private ObjectPropertyExpression secondProperty;
	
	public SimpleInverseObjectPropertiesAxiom(@Nonnull ObjectPropertyExpression firstProperty, @Nonnull ObjectPropertyExpression secondProperty, Set<Annotation> annotations)
	{
		super(annotations);
		this.firstProperty = firstProperty;
		this.secondProperty = secondProperty;
	}

	
	@Override
	public InverseObjectPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleInverseObjectPropertiesAxiom(firstProperty, secondProperty, NO_ANNOTATIONS);
	}

	
	@Override
	public InverseObjectPropertiesAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleInverseObjectPropertiesAxiom(firstProperty, secondProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.INVERSE_OBJECT_PROPERTIES;
	}

	
	@Override
	public ObjectPropertyExpression getFirstProperty() 
	{
		return firstProperty;
	}

	
	@Override
	public ObjectPropertyExpression getSecondProperty() 
	{
		return secondProperty;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof InverseObjectPropertiesAxiom) {
			InverseObjectPropertiesAxiom other = (InverseObjectPropertiesAxiom)obj;			 
			return  ((firstProperty.equals(other.getFirstProperty())) && (secondProperty.equals(other.getSecondProperty())));
		}
		
		return false;
	}

}
