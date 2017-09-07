package org.matonto.ontology.core.impl.owlapi.axiom;

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

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.SubObjectPropertyOfAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleSubObjectPropertyOfAxiom 
	extends SimpleAxiom
	implements SubObjectPropertyOfAxiom {
	
	
	private ObjectPropertyExpression subProperty;
	private ObjectPropertyExpression superProperty;
	
	public SimpleSubObjectPropertyOfAxiom(@Nonnull ObjectPropertyExpression subProperty, @Nonnull ObjectPropertyExpression superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = subProperty;
		this.superProperty = superProperty;
	}

	
	@Override
	public SubObjectPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubObjectPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubObjectPropertyOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleSubObjectPropertyOfAxiom(subProperty, superProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.SUB_OBJECT_PROPERTY;
	}

	
	@Override
	public ObjectPropertyExpression getSubObjectProperty() 
	{
		return subProperty;
	}

	
	@Override
	public ObjectPropertyExpression getSuperObjectProperty() 
	{
		return superProperty;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof SubObjectPropertyOfAxiom) {
			SubObjectPropertyOfAxiom other = (SubObjectPropertyOfAxiom)obj;			 
			return ((subProperty.equals(other.getSubObjectProperty())) && (superProperty.equals(other.getSuperObjectProperty())));
		}
		
		return false;
	}



}
