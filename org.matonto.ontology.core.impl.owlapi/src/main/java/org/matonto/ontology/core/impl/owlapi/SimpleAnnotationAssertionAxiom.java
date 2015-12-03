package org.matonto.ontology.core.impl.owlapi;

import java.util.Set;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.AnnotationAssertionAxiom;
import org.matonto.ontology.core.api.AnnotationProperty;
import org.matonto.ontology.core.api.AnnotationSubject;
import org.matonto.ontology.core.api.AnnotationValue;

import com.google.common.base.Preconditions;
import org.matonto.ontology.core.api.types.AxiomType;

public class SimpleAnnotationAssertionAxiom 
	extends SimpleAxiom 
	implements AnnotationAssertionAxiom {

	
	private AnnotationSubject subject;
	private AnnotationProperty property;
	private AnnotationValue value;
	
	
	public SimpleAnnotationAssertionAxiom(AnnotationSubject subject, AnnotationProperty property, AnnotationValue value, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subject = Preconditions.checkNotNull(subject, "subject cannot be null");
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.value = Preconditions.checkNotNull(value, "value cannot be null");
	}

	
	@Override
	public AnnotationAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationAssertionAxiom(subject, property, value, NO_ANNOTATIONS);	
	}

	
	@Override
	public AnnotationAssertionAxiom getAnnotatedAxiom(Set<Annotation> annotations) 
	{
		return new SimpleAnnotationAssertionAxiom(subject, property, value, mergeAnnos(annotations));
	}


	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.ANNOTATION_ASSERTION;
	}
	

	@Override
	public AnnotationSubject getSubject() 
	{
		return subject;
	}

	
	@Override
	public AnnotationProperty getProperty() 
	{		
		return property;
	}
	

	@Override
	public AnnotationValue getValue() 
	{		
		return value;
	}

	
	@Override
	public Annotation getAnnotation() 
	{	
		return new SimpleAnnotation(property, value, NO_ANNOTATIONS);
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof AnnotationAssertionAxiom) {
			AnnotationAssertionAxiom other = (AnnotationAssertionAxiom)obj;			 
			return ((subject.equals(other.getSubject())) && (property.equals(other.getProperty())) && (value.equals(other.getValue())));
		}
		
		return false;
	}

}
