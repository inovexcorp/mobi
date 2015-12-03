package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.IrreflexiveObjectPropertyAxiom;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleIrreflexiveObjectPropertyAxiom 
	extends SimpleAxiom 
	implements IrreflexiveObjectPropertyAxiom {
	
	
	private ObjectPropertyExpression objectProperty;
	
	
	public SimpleIrreflexiveObjectPropertyAxiom(ObjectPropertyExpression objectProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
	}
	

	@Override
	public IrreflexiveObjectPropertyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleIrreflexiveObjectPropertyAxiom(objectProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public IrreflexiveObjectPropertyAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleIrreflexiveObjectPropertyAxiom(objectProperty, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.IRREFLEXIVE_OBJECT_PROPERTY;
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
		
		if (obj instanceof IrreflexiveObjectPropertyAxiom) {
			IrreflexiveObjectPropertyAxiom other = (IrreflexiveObjectPropertyAxiom)obj;			 
			return objectProperty.equals(other.getObjectProperty());
		}
		
		return false;
	}
}
