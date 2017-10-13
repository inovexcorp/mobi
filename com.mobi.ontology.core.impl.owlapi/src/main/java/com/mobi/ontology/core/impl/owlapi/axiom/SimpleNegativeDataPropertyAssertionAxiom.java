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
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.axiom.NegativeDataPropertyAssertionAxiom;
import com.mobi.ontology.core.api.propertyexpression.DataPropertyExpression;
import com.mobi.ontology.core.api.types.AxiomType;
import com.mobi.rdf.api.Literal;

import java.util.Set;
import javax.annotation.Nonnull;


public class SimpleNegativeDataPropertyAssertionAxiom 
	extends SimpleAxiom
	implements NegativeDataPropertyAssertionAxiom {


	private Individual subject;
	private DataPropertyExpression property;
	private Literal value;
	
	
	public SimpleNegativeDataPropertyAssertionAxiom(@Nonnull Individual subject, @Nonnull DataPropertyExpression property, @Nonnull Literal value, Set<Annotation> annotations)
	{
		super(annotations);
		this.subject = subject;
		this.property = property;
		this.value = value;
	}

	
	@Override
	public NegativeDataPropertyAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleNegativeDataPropertyAssertionAxiom(subject, property, value, NO_ANNOTATIONS);	
	}

	
	@Override
	public NegativeDataPropertyAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleNegativeDataPropertyAssertionAxiom(subject, property, value, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.NEGATIVE_DATA_PROPERTY_ASSERTION;
	}
	

	@Override
	public Individual getSubject() 
	{
		return subject;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}

	
	@Override
	public Literal getValue() 
	{
		return value;
	}
	
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof NegativeDataPropertyAssertionAxiom) {
			NegativeDataPropertyAssertionAxiom other = (NegativeDataPropertyAssertionAxiom)obj;			 
			return ((subject.equals(other.getSubject())) && (property.equals(other.getDataProperty())) && (value.equals(other.getValue())));
		}
		
		return false;
	}

}
