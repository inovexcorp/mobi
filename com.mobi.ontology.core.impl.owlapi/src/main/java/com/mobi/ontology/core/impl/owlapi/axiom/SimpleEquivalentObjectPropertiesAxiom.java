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
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.api.axiom.EquivalentObjectPropertiesAxiom;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleEquivalentObjectPropertiesAxiom 
	extends SimpleAxiom 
	implements EquivalentObjectPropertiesAxiom {

	
	private Set<ObjectPropertyExpression> properties;
	
	
	public SimpleEquivalentObjectPropertiesAxiom(@Nonnull Set<ObjectPropertyExpression> properties, Set<Annotation> annotations)
	{
		super(annotations);
		this.properties = new TreeSet<ObjectPropertyExpression>(properties);;
	}

	
	@Override
	public EquivalentObjectPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleEquivalentObjectPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}

	
	@Override
	public EquivalentObjectPropertiesAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleEquivalentObjectPropertiesAxiom(properties, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.EQUIVALENT_OBJECT_PROPERTIES;
	}

	
	@Override
	public Set<ObjectPropertyExpression> getObjectPropertys() 
	{
		return new HashSet<ObjectPropertyExpression> (properties);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof EquivalentObjectPropertiesAxiom) {
			EquivalentObjectPropertiesAxiom other = (EquivalentObjectPropertiesAxiom)obj;			 
			return properties.equals(other.getObjectPropertys());
		}
		
		return false;
	}

}
