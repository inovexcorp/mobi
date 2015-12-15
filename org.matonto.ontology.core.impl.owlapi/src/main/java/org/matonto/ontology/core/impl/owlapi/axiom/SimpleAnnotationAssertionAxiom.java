package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;

import javax.annotation.Nonnull;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.axiom.AnnotationAssertionAxiom;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.AnnotationSubject;
import org.matonto.ontology.core.api.types.AxiomType;
import org.matonto.ontology.core.impl.owlapi.SimpleAnnotation;
import org.matonto.rdf.api.Value;


public class SimpleAnnotationAssertionAxiom 
	extends SimpleAxiom 
	implements AnnotationAssertionAxiom {

	
	private AnnotationSubject subject;
	private AnnotationProperty property;
	private Value value;
	
	
	public SimpleAnnotationAssertionAxiom(@Nonnull AnnotationSubject subject, @Nonnull AnnotationProperty property, Value value, Set<Annotation> annotations) 
	{
		super(annotations);
		this.subject = subject;
		this.property = property;
		this.value = value;
	}

	
	@Override
	public AnnotationAssertionAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleAnnotationAssertionAxiom(subject, property, value, NO_ANNOTATIONS);	
	}

	
	@Override
	public AnnotationAssertionAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
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
	public Value getValue() 
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
