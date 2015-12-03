package org.matonto.ontology.core.impl.owlapi;

import java.util.HashSet;
import java.util.Set;
import java.util.TreeSet;

import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.AnnotationValue;
import org.matonto.ontology.core.api.AnonymousIndividual;
import org.matonto.ontology.core.api.Literal;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLAnnotation;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.model.OWLAnnotationValue;
import org.semanticweb.owlapi.model.OWLAnonymousIndividual;
import org.semanticweb.owlapi.model.OWLLiteral;
import org.semanticweb.owlapi.model.OWLRuntimeException;
import org.semanticweb.owlapi.util.CollectionFactory;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationImpl;

public class SimpleAnnotation implements Annotation {
	
	private AnnotationProperty property;
	private AnnotationValue value;
	private Set<Annotation> annotations;
	

	public SimpleAnnotation(AnnotationProperty property, AnnotationValue value, Set<? extends Annotation> annotations)
	{
		this.property = (AnnotationProperty)Preconditions.checkNotNull(property, "property cannot be null");
		this.value = (AnnotationValue)Preconditions.checkNotNull(value, "value cannot be null");
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
			Set<Annotation> merged = new HashSet<Annotation>(this.annotations);
			merged.addAll(annotations);
			return new SimpleAnnotation(property, value, merged);
	}
	
	@Override
	public boolean isAnnotated()
	{
		return(!annotations.isEmpty());
	}
	
	
	public static OWLAnnotation owlapiAnnotation(Annotation anno)
	{		
		if(!anno.isAnnotated()) {
			OWLAnnotationProperty owlAnnoProperty = SimpleAnnotationProperty.owlapiAnnotationProperty(anno.getProperty());
			AnnotationValue value = anno.getValue();
			if(value instanceof SimpleIRI) {
				IRI iri = SimpleIRI.owlapiIRI((SimpleIRI)value);
				return new OWLAnnotationImpl(owlAnnoProperty, iri, new HashSet<OWLAnnotation>());
			}
			
			else if(value instanceof SimpleLiteral) {
				OWLLiteral literal = SimpleLiteral.owlapiLiteral((SimpleLiteral) value);
				return new OWLAnnotationImpl(owlAnnoProperty, literal, new HashSet<OWLAnnotation>());
			}
			
			else if(value instanceof SimpleAnonymousIndividual) {
				OWLAnonymousIndividual individual = SimpleAnonymousIndividual.owlapiAnonymousIndividual((SimpleAnonymousIndividual)value);
				return new OWLAnnotationImpl(owlAnnoProperty, individual, new HashSet<OWLAnnotation>());
			}
			
			else
				throw new MatontoOntologyException("Invalid annotation value");
		}
		
		else {
			Set<Annotation> annos = anno.getAnnotations();
			Set<OWLAnnotation> owlAnnos = new HashSet<OWLAnnotation>();
			
			//Get annotations recursively
			for(Annotation a : annos) {
				owlAnnos.add(SimpleAnnotation.owlapiAnnotation(a));
			}
			
			OWLAnnotationProperty owlAnnoProperty = SimpleAnnotationProperty.owlapiAnnotationProperty(anno.getProperty());
			AnnotationValue value = anno.getValue();
			if(value instanceof SimpleIRI) {
				IRI iri = SimpleIRI.owlapiIRI((SimpleIRI)value);
				return new OWLAnnotationImpl(owlAnnoProperty, iri, owlAnnos);
			}
			
			else if(value instanceof SimpleLiteral) {
				OWLLiteral literal = SimpleLiteral.owlapiLiteral((SimpleLiteral)value);
				return new OWLAnnotationImpl(owlAnnoProperty, literal, owlAnnos);
			}
			
			else if(value instanceof SimpleAnonymousIndividual) {
				OWLAnonymousIndividual individual = SimpleAnonymousIndividual.owlapiAnonymousIndividual((SimpleAnonymousIndividual)value);
				return new OWLAnnotationImpl(owlAnnoProperty, individual, owlAnnos);
			}
			
			else
				throw new MatontoOntologyException("Invalid annotation value");
			
		}
		
	}
	
	
		public static Annotation matontoAnnotation(OWLAnnotation owlAnno)
		{
			Set<OWLAnnotation> owlAnnos = owlAnno.getAnnotations();
			if(owlAnnos.isEmpty()) {
				SimpleAnnotationProperty property = SimpleAnnotationProperty.matontoAnnotationProperty(owlAnno.getProperty());
				OWLAnnotationValue value = owlAnno.getValue();
				if(value instanceof OWLLiteral){
					OWLLiteral literal = (OWLLiteral) value;
					Literal simpleLiteral = SimpleLiteral.matontoLiteral(literal);
					return new SimpleAnnotation(property, simpleLiteral, new HashSet<Annotation>());
				}
				
				else if(value instanceof IRI){
					IRI iri = (IRI) value;
					OntologyIRI simpleIri = SimpleIRI.matontoIRI(iri);
					return new SimpleAnnotation(property, simpleIri, new HashSet<Annotation>());
				}
				
				else if(value instanceof OWLAnonymousIndividual){
					OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
					AnonymousIndividual simpleIndividual = SimpleAnonymousIndividual.matontoAnonymousIndividual(individual);
					return new SimpleAnnotation(property, simpleIndividual, new HashSet<Annotation>());
				}
				
				else
					throw new OWLRuntimeException("Invalid annotation value");
			}
			
			else {
				Set<Annotation> annos = new HashSet<Annotation>();
				//Get annotations recursively
				for(OWLAnnotation a : owlAnnos) {
					annos.add(SimpleAnnotation.matontoAnnotation(a));
				}
				
				SimpleAnnotationProperty property = SimpleAnnotationProperty.matontoAnnotationProperty(owlAnno.getProperty());
				OWLAnnotationValue value = owlAnno.getValue();
				if(value instanceof OWLLiteral){
					OWLLiteral literal = (OWLLiteral) value;
					Literal simpleLiteral = SimpleLiteral.matontoLiteral(literal);
					return new SimpleAnnotation(property, simpleLiteral, annos);
				}
				
				else if(value instanceof IRI){
					IRI iri = (IRI) value;
					OntologyIRI simpleIri = SimpleIRI.matontoIRI(iri);
					return new SimpleAnnotation(property, simpleIri, annos);
				}
				
				else if(value instanceof OWLAnonymousIndividual){
					OWLAnonymousIndividual individual = (OWLAnonymousIndividual) value;
					AnonymousIndividual simpleIndividual = SimpleAnonymousIndividual.matontoAnonymousIndividual(individual);
					return new SimpleAnnotation(property, simpleIndividual, annos);
				}
				
				else
					throw new OWLRuntimeException("Invalid annotation value");
			}
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
