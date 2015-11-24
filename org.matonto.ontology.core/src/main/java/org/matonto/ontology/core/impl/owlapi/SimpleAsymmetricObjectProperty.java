package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.AsymmetricObjectProperty;
import org.matonto.ontology.core.api.ObjectPropertyExpression;

import com.google.common.base.Preconditions;


public class SimpleAsymmetricObjectProperty 
	extends SimpleAxiom 
	implements AsymmetricObjectProperty {


	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleAsymmetricObjectProperty(ObjectPropertyExpression objectProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
	}
	

	@Override
	public AsymmetricObjectProperty getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAsymmetricObjectProperty(objectProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public AsymmetricObjectProperty getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleAsymmetricObjectProperty(objectProperty, mergeAnnos(annotations));
	}


	@Override
	public SimpleAxiomType getAxiomType() 
	{
		return SimpleAxiomType.ASYMMETRIC_OBJECT_PROPERTY;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
	}

	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof AsymmetricObjectProperty) {
			AsymmetricObjectProperty other = (AsymmetricObjectProperty)obj;			 
			return objectProperty.equals(other.getObjectProperty());
		}
		
		return false;
	}
}
