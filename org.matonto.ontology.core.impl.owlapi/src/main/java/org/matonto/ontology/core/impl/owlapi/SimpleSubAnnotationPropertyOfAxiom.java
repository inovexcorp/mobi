package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.axiom.SubAnnotationPropertyOfAxiom;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleSubAnnotationPropertyOfAxiom 
	extends SimpleAxiom 
	implements SubAnnotationPropertyOfAxiom {

	
	private AnnotationProperty subProperty;
	private AnnotationProperty superProperty;
	
	
	public SimpleSubAnnotationPropertyOfAxiom(AnnotationProperty subProperty, AnnotationProperty superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = Preconditions.checkNotNull(subProperty, "subProperty cannot be null");
		this.superProperty = Preconditions.checkNotNull(superProperty, "superProperty cannot be null");
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubAnnotationPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleSubAnnotationPropertyOfAxiom(subProperty, superProperty, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{	
		return AxiomType.SUB_ANNOTATION_PROPERTY_OF;
	}

	
	@Override
	public AnnotationProperty getSubProperty() 
	{
		return subProperty;
	}

	
	@Override
	public AnnotationProperty getSuperProperty() 
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
		
		if (obj instanceof SubAnnotationPropertyOfAxiom) {
			SubAnnotationPropertyOfAxiom other = (SubAnnotationPropertyOfAxiom)obj;			 
			return ((superProperty.equals(other.getSuperProperty())) && (superProperty.equals(other.getSuperProperty())));
		}
		
		return false;
	}

}
