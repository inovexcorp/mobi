package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.NegativeObjectPropertyAssertionAxiom;
import org.matonto.ontology.core.api.ObjectPropertyExpression;

import com.google.common.base.Preconditions;

public class SimpleNegativeObjectPropertyAssertionAxiom 
	extends SimpleAxiom
	implements NegativeObjectPropertyAssertionAxiom {

	
	private Individual subject;
	private ObjectPropertyExpression property;
	private Individual object;
	
	
	public SimpleNegativeObjectPropertyAssertionAxiom(Individual subject, ObjectPropertyExpression property, Individual object, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subject = Preconditions.checkNotNull(subject, "subject cannot be null");
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.object = Preconditions.checkNotNull(object, "object cannot be null");
	}

	
	@Override
	public NegativeObjectPropertyAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleNegativeObjectPropertyAssertionAxiom(subject, property, object, NO_ANNOTATIONS);	
	}

	
	@Override
	public NegativeObjectPropertyAssertionAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleNegativeObjectPropertyAssertionAxiom(subject, property, object, mergeAnnos(annotations));
	}

	
	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.NEGATIVE_OBJECT_PROPERTY_ASSERTION;
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
