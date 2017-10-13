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
import com.mobi.ontology.core.api.axiom.InverseFunctionalObjectPropertyAxiom;
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import com.mobi.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleInverseFunctionalObjectPropertyAxiom 
	extends SimpleAxiom
	implements InverseFunctionalObjectPropertyAxiom {

	
	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleInverseFunctionalObjectPropertyAxiom(@Nonnull ObjectPropertyExpression objectProperty, Set<Annotation> annotations)
	{
		super(annotations);
		this.objectProperty = objectProperty;
	}

	
	@Override
	public InverseFunctionalObjectPropertyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleInverseFunctionalObjectPropertyAxiom(objectProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public InverseFunctionalObjectPropertyAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleInverseFunctionalObjectPropertyAxiom(objectProperty, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.INVERSE_FUNCTIONAL_OBJECT_PROPERTY;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof InverseFunctionalObjectPropertyAxiom) {
			InverseFunctionalObjectPropertyAxiom other = (InverseFunctionalObjectPropertyAxiom)obj;			 
			return objectProperty.equals(other.getObjectProperty());
		}
		
		return false;
	}

}
