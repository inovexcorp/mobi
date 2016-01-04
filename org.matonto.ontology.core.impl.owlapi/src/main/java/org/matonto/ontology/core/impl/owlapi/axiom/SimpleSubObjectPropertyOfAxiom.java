package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.ObjectPropertyExpression;
import org.matonto.ontology.core.api.axiom.SubObjectPropertyOfAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleSubObjectPropertyOfAxiom 
	extends SimpleAxiom
	implements SubObjectPropertyOfAxiom {
	
	
	private ObjectPropertyExpression subProperty;
	private ObjectPropertyExpression superProperty;
	
	public SimpleSubObjectPropertyOfAxiom(@Nonnull ObjectPropertyExpression subProperty, @Nonnull ObjectPropertyExpression superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = subProperty;
		this.superProperty = superProperty;
	}

	
	@Override
	public SubObjectPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubObjectPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubObjectPropertyOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleSubObjectPropertyOfAxiom(subProperty, superProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.SUB_OBJECT_PROPERTY;
	}

	
	@Override
	public ObjectPropertyExpression getSubObjectProperty() 
	{
		return subProperty;
	}

	
	@Override
	public ObjectPropertyExpression getSuperObjectProperty() 
	{
		return superProperty;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof SubObjectPropertyOfAxiom) {
			SubObjectPropertyOfAxiom other = (SubObjectPropertyOfAxiom)obj;			 
			return ((subProperty.equals(other.getSubObjectProperty())) && (superProperty.equals(other.getSuperObjectProperty())));
		}
		
		return false;
	}



}
