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
import com.mobi.ontology.core.api.AnnotationSubject;
import com.mobi.ontology.core.api.axiom.AnnotationAssertionAxiom;
import com.mobi.ontology.core.api.propertyexpression.AnnotationProperty;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.impl.owlapi.SimpleAnnotation;
import com.mobi.rdf.api.Value;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleAnnotationAssertionAxiom 
	extends SimpleAxiom 
	implements AnnotationAssertionAxiom {

	
	private AnnotationSubject subject;
	private AnnotationProperty property;
	private Value value;
	
	
	public SimpleAnnotationAssertionAxiom(@Nonnull AnnotationSubject subject, @Nonnull AnnotationProperty property, Value value, Set<Annotation> annotations)
	{
		super(annotations);
		this.subject = subject;
		this.property = property;
		this.value = value;
	}

	
	@Override
	public AnnotationAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationAssertionAxiom(subject, property, value, NO_ANNOTATIONS);	
	}

	
	@Override
	public AnnotationAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleAnnotationAssertionAxiom(subject, property, value, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.ANNOTATION_ASSERTION;
	}
	

	@Override
	public AnnotationSubject getSubject() 
	{
		return subject;
	}

	
	@Override
	public AnnotationProperty getProperty() 
	{		
		return property;
	}
	

	@Override
	public Value getValue() 
	{		
		return value;
	}

	
	@Override
	public Annotation getAnnotation() 
	{	
		return new SimpleAnnotation(property, value, NO_ANNOTATIONS);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof AnnotationAssertionAxiom) {
			AnnotationAssertionAxiom other = (AnnotationAssertionAxiom)obj;			 
			return ((subject.equals(other.getSubject())) && (property.equals(other.getProperty())) && (value.equals(other.getValue())));
		}
		
		return false;
	}

}
