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
import com.mobi.ontology.core.api.axiom.HasKeyAxiom;
import com.mobi.ontology.core.api.classexpression.ClassExpression;
import com.mobi.ontology.core.api.propertyexpression.DataPropertyExpression;
import com.mobi.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import com.mobi.ontology.core.api.propertyexpression.PropertyExpression;
import com.mobi.ontology.core.api.types.AxiomType;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;


public class SimpleHasKeyAxiom 
	extends SimpleAxiom 
	implements HasKeyAxiom {

	
	private ClassExpression expression;
	private Set<PropertyExpression> propertyExpressions;

	
	public SimpleHasKeyAxiom(@Nonnull ClassExpression expression, @Nonnull Set<PropertyExpression> propertyExpressions, Set<Annotation> annotations)
	{
		super(annotations);
		this.expression = expression;
		this.propertyExpressions = new TreeSet<PropertyExpression>(propertyExpressions);
	}

	
	@Override
	public HasKeyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleHasKeyAxiom(expression, propertyExpressions, NO_ANNOTATIONS);	
	}

	
	@Override
	public HasKeyAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleHasKeyAxiom(expression, propertyExpressions, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.HAS_KEY;
	}

	
	@Override
	public ClassExpression getClassExpression() 
	{
		return expression;
	}

	@Override
	public Set<PropertyExpression> getPropertyExpressions() 
	{
		return new HashSet<PropertyExpression>(propertyExpressions);
	}
	

	@Override
	public Set<ObjectPropertyExpression> getObjectPropertyExpressions()
	{
		Set<ObjectPropertyExpression> objectProperties = new HashSet<ObjectPropertyExpression>();
		for(PropertyExpression prop : propertyExpressions) {
			if(prop instanceof ObjectPropertyExpression)
				objectProperties.add((ObjectPropertyExpression)prop);
		}
		return objectProperties;
	}
	

	@Override
	public Set<DataPropertyExpression> getDataPropertyExpressions()
	{
		Set<DataPropertyExpression> dataProperties = new HashSet<DataPropertyExpression>();
		for(PropertyExpression prop : propertyExpressions) {
			if(prop instanceof DataPropertyExpression)
				dataProperties.add((DataPropertyExpression)prop);
		}
		return dataProperties;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof HasKeyAxiom) {
			HasKeyAxiom other = (HasKeyAxiom)obj;			 
			return ((expression.equals(other.getClassExpression())) && (propertyExpressions.equals(other.getPropertyExpressions())));
		}
		
		return false;
	}

}
