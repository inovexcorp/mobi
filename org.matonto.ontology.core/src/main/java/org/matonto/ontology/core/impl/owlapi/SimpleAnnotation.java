package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.AnnotationProperty;
import org.matonto.ontology.core.api.AnnotationValue;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLProperty;
import org.semanticweb.owlapi.util.CollectionFactory;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationImpl;

public class SimpleAnnotation implements Annotation {
	
	private AnnotationProperty property;
	private AnnotationValue value;
	private Set<Annotation> annotations;

	public SimpleAnnotation(AnnotationProperty property, AnnotationValue value, Set<? extends Annotation> annotations)
	{
		this.property = Preconditions.checkNotNull(property, "property cannot be null");
		this.value = Preconditions.checkNotNull(value, "value cannot be null");
		this.annotations = CollectionFactory.getCopyOnRequestSetFromMutableCollection(new TreeSet<Annotation>
				(Preconditions.checkNotNull(annotations, "annotations cannot be null")));
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
	public Set<Annotation> getAnnotations() 
	{
		return annotations;
	}

	public Annotation getAnnotatedAnnotation(Set<Annotation> annotations)
	{
		if (annotations.isEmpty()) {
			return this;
		}
			Set<Annotation> merged = new HashSet(this.annotations);
			merged.addAll(annotations);
			return new SimpleAnnotation(property, value, merged);
	}
	
	
//	public static OWLAnnotation OwlapiAnnotation(Annotation anno)
//	{
//		OWLProperty owlProp = SimpleAnnotationProperty.owlapiAnnotationProperty(anno.getProperty());
//		
//		
//	}
	
}
