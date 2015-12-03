package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.InverseFunctionalObjectPropertyAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleInverseFunctionalObjectPropertyAxiom 
	extends SimpleAxiom
	implements InverseFunctionalObjectPropertyAxiom {

	
	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleInverseFunctionalObjectPropertyAxiom(ObjectPropertyExpression objectProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
	}

	
	@Override
	public InverseFunctionalObjectPropertyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleInverseFunctionalObjectPropertyAxiom(objectProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public InverseFunctionalObjectPropertyAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleInverseFunctionalObjectPropertyAxiom(objectProperty, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.INVERSE_FUNCTIONAL_OBJECT_PROPERTY;
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
		
		if (obj instanceof InverseFunctionalObjectPropertyAxiom) {
			InverseFunctionalObjectPropertyAxiom other = (InverseFunctionalObjectPropertyAxiom)obj;			 
			return objectProperty.equals(other.getObjectProperty());
		}
		
		return false;
	}

}
