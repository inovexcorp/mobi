package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.AsymmetricObjectPropertyAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleAsymmetricObjectPropertyAxiom
	extends SimpleAxiom 
	implements AsymmetricObjectPropertyAxiom {


	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleAsymmetricObjectPropertyAxiom(@Nonnull ObjectPropertyExpression objectProperty, Set<Annotation> annotations)
	{
		super(annotations);
		this.objectProperty = objectProperty;
	}
	

	@Override
	public AsymmetricObjectPropertyAxiom getAxiomWithoutAnnotations()
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAsymmetricObjectPropertyAxiom(objectProperty, NO_ANNOTATIONS);
	}

	
	@Override
	public AsymmetricObjectPropertyAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations)
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
