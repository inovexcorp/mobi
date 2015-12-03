package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.AsymmetricObjectPropertyAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleAsymmetricObjectPropertyAxiom
	extends SimpleAxiom 
	implements AsymmetricObjectPropertyAxiom {


	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleAsymmetricObjectPropertyAxiom(ObjectPropertyExpression objectProperty, Set<Annotation> annotations)
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
	}
	

	@Override
	public AsymmetricObjectPropertyAxiom getAxiomWithoutAnnotations()
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAsymmetricObjectPropertyAxiom(objectProperty, NO_ANNOTATIONS);
	}

	
	@Override
	public AsymmetricObjectPropertyAxiom getAnnotatedAxiom(Set<Annotation> annotations)
	{
		return new SimpleAsymmetricObjectPropertyAxiom(objectProperty, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.ASYMMETRIC_OBJECT_PROPERTY;
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
		
		if (obj instanceof AsymmetricObjectPropertyAxiom) {
			AsymmetricObjectPropertyAxiom other = (AsymmetricObjectPropertyAxiom)obj;
			return objectProperty.equals(other.getObjectProperty());
		}
		
		return false;
	}
}
