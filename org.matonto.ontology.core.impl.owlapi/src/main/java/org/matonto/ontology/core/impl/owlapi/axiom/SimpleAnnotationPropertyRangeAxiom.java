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
import org.matonto.ontology.core.api.axiom.AnnotationPropertyRangeAxiom;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.rdf.api.IRI;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleAnnotationPropertyRangeAxiom 
	extends SimpleAxiom 
	implements AnnotationPropertyRangeAxiom {


	private IRI range;
	private AnnotationProperty property;
	
	
	public SimpleAnnotationPropertyRangeAxiom(@Nonnull IRI range, @Nonnull AnnotationProperty property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.range = range;
		this.property = property;
	}

	
	@Override
	public AnnotationPropertyRangeAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationPropertyRangeAxiom(range, property, NO_ANNOTATIONS);	
	}
	

	@Override
	public AnnotationPropertyRangeAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleAnnotationPropertyRangeAxiom(range, property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{		
		return AxiomType.ANNOTATION_PROPERTY_RANGE;
	}

	
	@Override
	public IRI getRange() 
	{
		return range;
	}

	
	@Override
	public AnnotationProperty getProperty() 
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
		
		if (obj instanceof AnnotationPropertyRangeAxiom) {
			AnnotationPropertyRangeAxiom other = (AnnotationPropertyRangeAxiom)obj;			 
			return ((range.equals(other.getRange())) && (property.equals(other.getProperty())));
		}
		
		return false;
	}
}
