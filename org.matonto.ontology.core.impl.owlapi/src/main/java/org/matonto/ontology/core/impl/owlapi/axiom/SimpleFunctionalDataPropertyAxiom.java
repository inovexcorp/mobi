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
import org.matonto.ontology.core.api.axiom.FunctionalDataPropertyAxiom;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleFunctionalDataPropertyAxiom 
	extends SimpleAxiom 
	implements FunctionalDataPropertyAxiom {

	
	public DataPropertyExpression property;
	
	
	public SimpleFunctionalDataPropertyAxiom(@Nonnull DataPropertyExpression property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.property = property;
	}

	
	@Override
	public FunctionalDataPropertyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleFunctionalDataPropertyAxiom(property, NO_ANNOTATIONS);	
	}
	

	@Override
	public FunctionalDataPropertyAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleFunctionalDataPropertyAxiom(property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.FUNCTIONAL_DATA_PROPERTY;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof FunctionalDataPropertyAxiom) {
			FunctionalDataPropertyAxiom other = (FunctionalDataPropertyAxiom)obj;			 
			return property.equals(other.getDataProperty());
		}
		
		return false;
	}

}
