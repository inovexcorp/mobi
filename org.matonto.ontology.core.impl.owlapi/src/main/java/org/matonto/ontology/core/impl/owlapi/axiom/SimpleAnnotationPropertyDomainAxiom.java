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
import org.matonto.ontology.core.api.axiom.AnnotationPropertyDomainAxiom;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.rdf.api.IRI;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleAnnotationPropertyDomainAxiom 
	extends SimpleAxiom 
	implements AnnotationPropertyDomainAxiom {

	
	private IRI domain;
	private AnnotationProperty property;
	
	
	public SimpleAnnotationPropertyDomainAxiom(IRI domain, @Nonnull AnnotationProperty property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.domain = domain;
		this.property = property;
	}

	
	@Override
	public AnnotationPropertyDomainAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationPropertyDomainAxiom(domain, property, NO_ANNOTATIONS);	
	}
	

	@Override
	public AnnotationPropertyDomainAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleAnnotationPropertyDomainAxiom(domain, property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{		
		return AxiomType.ANNOTATION_PROPERTY_DOMAIN;
	}

	
	@Override
	public IRI getDomain() 
	{
		return domain;
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
		
		if (obj instanceof AnnotationPropertyDomainAxiom) {
			AnnotationPropertyDomainAxiom other = (AnnotationPropertyDomainAxiom)obj;			 
			return ((domain.equals(other.getDomain())) && (property.equals(other.getProperty())));
		}
		
		return false;
	}

}
