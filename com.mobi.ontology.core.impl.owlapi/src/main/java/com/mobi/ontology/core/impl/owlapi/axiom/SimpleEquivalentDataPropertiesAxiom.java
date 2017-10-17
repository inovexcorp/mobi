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
import com.mobi.ontology.core.api.propertyexpression.DataPropertyExpression;
import com.mobi.ontology.core.api.axiom.EquivalentDataPropertiesAxiom;
import com.mobi.ontology.core.api.types.AxiomType;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleEquivalentDataPropertiesAxiom 
	extends SimpleAxiom 
	implements EquivalentDataPropertiesAxiom {

	
	private Set<DataPropertyExpression> properties;
	
	
	public SimpleEquivalentDataPropertiesAxiom(@Nonnull Set<DataPropertyExpression> properties, Set<Annotation> annotations)
	{
		super(annotations);
		this.properties = new TreeSet<DataPropertyExpression>(properties);
	}

	
	@Override
	public EquivalentDataPropertiesAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleEquivalentDataPropertiesAxiom(properties, NO_ANNOTATIONS);	
	}
	

	@Override
	public EquivalentDataPropertiesAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleEquivalentDataPropertiesAxiom(properties, mergeAnnos(annotations));
	}
	

	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.EQUIVALENT_DATA_PROPERTIES;
	}
	

	@Override
	public Set<DataPropertyExpression> getDataProperties() 
	{
		return new HashSet<DataPropertyExpression>(properties);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof EquivalentDataPropertiesAxiom) {
			EquivalentDataPropertiesAxiom other = (EquivalentDataPropertiesAxiom)obj;			 
			return properties.equals(other.getDataProperties());
		}
		
		return false;
	}

}
