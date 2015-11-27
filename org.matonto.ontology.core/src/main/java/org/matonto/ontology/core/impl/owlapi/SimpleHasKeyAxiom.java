package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Axiom;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.HasKeyAxiom;
import org.matonto.ontology.core.api.ObjectPropertyExpression;
import org.matonto.ontology.core.api.PropertyExpression;
import org.matonto.ontology.core.api.SubDataPropertyOfAxiom;

import com.google.common.base.Preconditions;

public class SimpleHasKeyAxiom 
	extends SimpleAxiom 
	implements HasKeyAxiom {

	
	private ClassExpression expression;
	private Set<PropertyExpression> propertyExpressions;

	
	public SimpleHasKeyAxiom(ClassExpression expression, Set<PropertyExpression> propertyExpressions, Set<Annotation> annotations) 
	{
		super(annotations);
		this.expression = Preconditions.checkNotNull(expression, "expression cannot be null");
		this.propertyExpressions = new TreeSet<PropertyExpression>(Preconditions.checkNotNull(propertyExpressions, "propertyExpressions cannot be null"));
	}

	
	@Override
	public HasKeyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleHasKeyAxiom(expression, propertyExpressions, NO_ANNOTATIONS);	
	}

	
	@Override
	public HasKeyAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleHasKeyAxiom(expression, propertyExpressions, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.HAS_KEY;
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
