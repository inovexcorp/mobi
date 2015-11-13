package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.AnnotationProperty;
import org.matonto.ontology.core.api.OntologyIRI;
import org.semanticweb.owlapi.model.EntityType;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.vocab.OWLRDFVocabulary;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationPropertyImpl;

public class SimpleAnnotationProperty implements AnnotationProperty {

	private static OntologyIRI ontologyIri = null;
	
	
	public SimpleAnnotationProperty(OntologyIRI iri)	
	{
		ontologyIri = Preconditions.checkNotNull(iri, "simpleIri cannot be null");
	}
		
	@Override
	public OntologyIRI getIRI()
	{
		return ontologyIri;
	}
	
	
	@Override
	public String toString()
	{
		return ontologyIri.toString();
	}
	
	
	@Override
	public boolean isComment() 
	{
		return SimpleIRI.owlapiIRI(ontologyIri).equals(OWLRDFVocabulary.RDFS_COMMENT.getIRI());
	}

	
	@Override
	public boolean isLabel() 
	{
		return SimpleIRI.owlapiIRI(ontologyIri).equals(OWLRDFVocabulary.RDFS_LABEL.getIRI());
	}
	
	
	public EntityType<?> getEntityType()
	{
		return EntityType.ANNOTATION_PROPERTY;
	}

	
	public static OWLAnnotationProperty owlapiAnnotationProperty(AnnotationProperty sap)
	{
		return new OWLAnnotationPropertyImpl(SimpleIRI.owlapiIRI(sap.getIRI()));
	}
	
	
	public static SimpleAnnotationProperty MatontoAnnotationProperty(OWLAnnotationProperty oap)
	{
		return new SimpleAnnotationProperty(SimpleIRI.matontoIRI(oap.getIRI()));
	}
	
}
