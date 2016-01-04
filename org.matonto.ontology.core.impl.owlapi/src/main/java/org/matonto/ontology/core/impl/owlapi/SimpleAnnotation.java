package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.rdf.api.Value;


public class SimpleAnnotation implements Annotation {
	
	private AnnotationProperty property;
	private Value value;
	private Set<Annotation> annotations;
	

	public SimpleAnnotation(@Nonnull AnnotationProperty property, Value value, Set<? extends Annotation> annotations)
	{
		this.property = property;
		this.value = value;
		if(annotations!=null)
		    this.annotations = new TreeSet<Annotation>(annotations);
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
	public Set<Annotation> getAnnotations() 
	{
		return annotations;
	}

	public Annotation getAnnotatedAnnotation(@Nonnull Set<Annotation> annotations)
	{
		if (annotations.isEmpty()) {
			return this;
		}
		
		Set<Annotation> merged = new HashSet<Annotation>(this.annotations);
		merged.addAll(annotations);
		return new SimpleAnnotation(property, value, merged);
	}
	
	@Override
	public boolean isAnnotated()
	{
		return(!annotations.isEmpty());
	}	
		
	@Override
	public boolean equals(Object obj)
	{
		if (obj == this) 
			return true;
		
		if ((obj instanceof SimpleAnnotation)) {
			SimpleAnnotation other = (SimpleAnnotation)obj;
			return (other.getProperty().equals(property)) && (other.getValue().equals(value)) && (other.getAnnotations().equals(annotations));
		}
		
		return false;
	}
		
}
