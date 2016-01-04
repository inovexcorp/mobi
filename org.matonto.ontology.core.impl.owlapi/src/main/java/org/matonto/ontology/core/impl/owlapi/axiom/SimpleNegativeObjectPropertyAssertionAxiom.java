package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.Individual;
import org.matonto.ontology.core.api.axiom.NegativeObjectPropertyAssertionAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


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
