package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;
import org.semanticweb.owlapi.model.OWLAnnotationProperty;
import org.semanticweb.owlapi.vocab.OWLRDFVocabulary;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLAnnotationPropertyImpl;

public class SimpleAnnotationProperty implements AnnotationProperty {

	private static OntologyIRI iri = null;
	
	
	public SimpleAnnotationProperty(OntologyIRI iri)	
	{
		this.iri = Preconditions.checkNotNull(iri, "iri cannot be null");
	}
		
	@Override
	public OntologyIRI getIRI()
	{
		return iri;
	}
	
	
	@Override
	public String toString()
	{
		return iri.toString();
	}
	
	
	@Override
	public boolean isComment() 
	{
		return SimpleIRI.owlapiIRI(iri).equals(OWLRDFVocabulary.RDFS_COMMENT.getIRI());
	}

	
	@Override
	public boolean isLabel() 
	{
		return SimpleIRI.owlapiIRI(iri).equals(OWLRDFVocabulary.RDFS_LABEL.getIRI());
	}
	
	
	@Override
	public EntityType getEntityType()
	{
		return EntityType.ANNOTATION_PROPERTY;
	}

	
	public static OWLAnnotationProperty owlapiAnnotationProperty(AnnotationProperty sap)
	{
		return new OWLAnnotationPropertyImpl(SimpleIRI.owlapiIRI(sap.getIRI()));
	}
	
	
	public static SimpleAnnotationProperty matontoAnnotationProperty(OWLAnnotationProperty oap)
	{
		return new SimpleAnnotationProperty(SimpleIRI.matontoIRI(oap.getIRI()));
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if(obj == this)
			return true;
		
		if(obj instanceof SimpleAnnotationProperty) {
			SimpleAnnotationProperty other = (SimpleAnnotationProperty) obj;
			return iri.equals(other.getIRI());
		}
		
		return false;
	}
	
}
