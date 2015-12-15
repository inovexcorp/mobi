package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.AnnotationProperty;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.impl.owlapi.Values;
import org.semanticweb.owlapi.vocab.OWLRDFVocabulary;


public class SimpleAnnotationProperty implements AnnotationProperty {

	private OntologyIRI iri = null;
	
	
	public SimpleAnnotationProperty(@Nonnull OntologyIRI iri)	
	{
		this.iri = iri;
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
		return Values.owlapiIRI(iri).equals(OWLRDFVocabulary.RDFS_COMMENT.getIRI());
	}

	
	@Override
	public boolean isLabel() 
	{
		return Values.owlapiIRI(iri).equals(OWLRDFVocabulary.RDFS_LABEL.getIRI());
	}
	
	
	@Override
	public EntityType getEntityType()
	{
		return EntityType.ANNOTATION_PROPERTY;
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
