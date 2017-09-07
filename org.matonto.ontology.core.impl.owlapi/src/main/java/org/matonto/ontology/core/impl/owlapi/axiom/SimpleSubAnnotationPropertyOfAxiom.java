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
import org.matonto.ontology.core.api.axiom.SubAnnotationPropertyOfAxiom;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.types.AxiomType;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleSubAnnotationPropertyOfAxiom 
	extends SimpleAxiom 
	implements SubAnnotationPropertyOfAxiom {

	
	private AnnotationProperty subProperty;
	private AnnotationProperty superProperty;
	
	
	public SimpleSubAnnotationPropertyOfAxiom(@Nonnull AnnotationProperty subProperty, @Nonnull AnnotationProperty superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = subProperty;
		this.superProperty = superProperty;
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubAnnotationPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleSubAnnotationPropertyOfAxiom(subProperty, superProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{	
		return AxiomType.SUB_ANNOTATION_PROPERTY_OF;
	}

	
	@Override
	public AnnotationProperty getSubProperty() 
	{
		return subProperty;
	}

	
	@Override
	public AnnotationProperty getSuperProperty() 
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
		
		if (obj instanceof SubAnnotationPropertyOfAxiom) {
			SubAnnotationPropertyOfAxiom other = (SubAnnotationPropertyOfAxiom)obj;			 
			return ((superProperty.equals(other.getSuperProperty())) && (superProperty.equals(other.getSuperProperty())));
		}
		
		return false;
	}

}
