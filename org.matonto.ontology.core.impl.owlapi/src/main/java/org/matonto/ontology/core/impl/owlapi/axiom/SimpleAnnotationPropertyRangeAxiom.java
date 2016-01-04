package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.axiom.AnnotationPropertyRangeAxiom;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.rdf.api.IRI;


public class SimpleAnnotationPropertyRangeAxiom 
	extends SimpleAxiom 
	implements AnnotationPropertyRangeAxiom {


	private IRI range;
	private AnnotationProperty property;
	
	
	public SimpleAnnotationPropertyRangeAxiom(@Nonnull IRI range, @Nonnull AnnotationProperty property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.range = range;
		this.property = property;
	}

	
	@Override
	public AnnotationPropertyRangeAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationPropertyRangeAxiom(range, property, NO_ANNOTATIONS);	
	}
	

	@Override
	public AnnotationPropertyRangeAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleAnnotationPropertyRangeAxiom(range, property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{		
		return AxiomType.ANNOTATION_PROPERTY_RANGE;
	}

	
	@Override
	public IRI getRange() 
	{
		return range;
	}

	
	@Override
	public AnnotationProperty getProperty() 
	{		
		return property;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof AnnotationPropertyRangeAxiom) {
			AnnotationPropertyRangeAxiom other = (AnnotationPropertyRangeAxiom)obj;			 
			return ((range.equals(other.getRange())) && (property.equals(other.getProperty())));
		}
		
		return false;
	}
}
