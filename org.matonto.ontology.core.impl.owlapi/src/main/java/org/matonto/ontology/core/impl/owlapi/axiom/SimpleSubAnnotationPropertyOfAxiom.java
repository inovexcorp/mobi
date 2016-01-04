package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.axiom.SubAnnotationPropertyOfAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleSubAnnotationPropertyOfAxiom 
	extends SimpleAxiom 
	implements SubAnnotationPropertyOfAxiom {

	
	private AnnotationProperty subProperty;
	private AnnotationProperty superProperty;
	
	
	public SimpleSubAnnotationPropertyOfAxiom(@Nonnull AnnotationProperty subProperty, @Nonnull AnnotationProperty superProperty, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subProperty = subProperty;
		this.superProperty = superProperty;
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleSubAnnotationPropertyOfAxiom(subProperty, superProperty, NO_ANNOTATIONS);	
	}

	
	@Override
	public SubAnnotationPropertyOfAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
