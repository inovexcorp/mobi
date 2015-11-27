package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.DataPropertyExpression;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.NegativeDataPropertyAssertionAxiom;

import com.google.common.base.Preconditions;


public class SimpleNegativeDataPropertyAssertionAxiom 
	extends SimpleAxiom
	implements NegativeDataPropertyAssertionAxiom {


	
	private Individual subject;
	private DataPropertyExpression property;
	private Literal value;
	
	
	public SimpleNegativeDataPropertyAssertionAxiom(Individual subject, DataPropertyExpression property, Literal value, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subject = Preconditions.checkNotNull(subject, "subject cannot be null");
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.value = Preconditions.checkNotNull(value, "value cannot be null");
	}

	
	@Override
	public NegativeDataPropertyAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleNegativeDataPropertyAssertionAxiom(subject, property, value, NO_ANNOTATIONS);	
	}

	
	@Override
	public NegativeDataPropertyAssertionAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleNegativeDataPropertyAssertionAxiom(subject, property, value, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.NEGATIVE_DATA_PROPERTY_ASSERTION;
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
