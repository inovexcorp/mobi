package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.ClassExpression;
import org.matonto.ontology.core.api.ObjectPropertyExpression;
import org.matonto.ontology.core.api.ObjectPropertyRangeAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleObjectPropertyRangeAxiom 
	extends SimpleAxiom 
	implements ObjectPropertyRangeAxiom {

	
	private ObjectPropertyExpression objectProperty;
	private ClassExpression range;
	
	
	public SimpleObjectPropertyRangeAxiom(ObjectPropertyExpression objectProperty, ClassExpression range, Set<Annotation> annotations) 
	{
		super(annotations);
		this.objectProperty = Preconditions.checkNotNull(objectProperty, "objectProperty cannot be null");
		this.range = Preconditions.checkNotNull(range, "range cannot be null");
	}

	
	@Override
	public ObjectPropertyRangeAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleObjectPropertyRangeAxiom(objectProperty, range, NO_ANNOTATIONS);	
	}

	
	@Override
	public ObjectPropertyRangeAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleObjectPropertyRangeAxiom(objectProperty, range, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.OBJECT_PROPERTY_RANGE;
	}

	
	@Override
	public ObjectPropertyExpression getObjectProperty() 
	{
		return objectProperty;
	}

	
	@Override
	public ClassExpression getRange() 
	{
		return range;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof ObjectPropertyRangeAxiom) {
			ObjectPropertyRangeAxiom other = (ObjectPropertyRangeAxiom)obj;			 
			return ((objectProperty.equals(other.getObjectProperty())) && (range.equals(other.getRange())));
		}
		
		return false;
	}


}
