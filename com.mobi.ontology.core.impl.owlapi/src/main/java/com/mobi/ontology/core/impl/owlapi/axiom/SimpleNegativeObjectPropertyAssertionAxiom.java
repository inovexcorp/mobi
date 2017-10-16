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
import com.mobi.ontology.core.api.axiom.NegativeObjectPropertyAssertionAxiom;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleNegativeObjectPropertyAssertionAxiom 
	extends SimpleAxiom
	implements NegativeObjectPropertyAssertionAxiom {

	
	private Individual subject;
	private ObjectPropertyExpression property;
	private Individual object;
	
	
	public SimpleNegativeObjectPropertyAssertionAxiom(@Nonnull Individual subject, @Nonnull ObjectPropertyExpression property, @Nonnull Individual object, Set<Annotation> annotations)
	{
		super(annotations);
		this.subject = subject;
		this.property = property;
		this.object = object;
	}

	
	@Override
	public NegativeObjectPropertyAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleNegativeObjectPropertyAssertionAxiom(subject, property, object, NO_ANNOTATIONS);	
	}

	
	@Override
	public NegativeObjectPropertyAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleNegativeObjectPropertyAssertionAxiom(subject, property, object, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.NEGATIVE_OBJECT_PROPERTY_ASSERTION;
	}
	

	@Override
	public Individual getSubject() 
	{
		return subject;
	}

	
	@Override
	public ObjectPropertyExpression getProperty() 
	{
		return property;
	}

	
	@Override
	public Individual getObject() 
	{
		return object;
	}
	
	
	@Override
	public boolean containsAnonymousIndividuals()
	{
		return (subject.isAnonymous() || object.isAnonymous());
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof NegativeObjectPropertyAssertionAxiom) {
			NegativeObjectPropertyAssertionAxiom other = (NegativeObjectPropertyAssertionAxiom)obj;			 
			return ((subject.equals(other.getSubject())) && (property.equals(other.getProperty())) && (object.equals(other.getObject())));
		}
		
		return false;
	}
}
