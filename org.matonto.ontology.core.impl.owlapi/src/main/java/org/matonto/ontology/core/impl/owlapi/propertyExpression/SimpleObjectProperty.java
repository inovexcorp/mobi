package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import org.matonto.ontology.core.api.OntologyIRI;

import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.ontology.core.impl.owlapi.SimpleIRI;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLObjectProperty;
import uk.ac.manchester.cs.owl.owlapi.OWLObjectPropertyImpl;

import com.google.common.base.Preconditions;


public class SimpleObjectProperty 
	extends SimpleObjectPropertyExpression
	implements ObjectProperty {

	
	private OntologyIRI iri;
	
	
	public SimpleObjectProperty(OntologyIRI iri)
	{
		this.iri = Preconditions.checkNotNull(iri, "iri cannot be null");
	}
	
	@Override
	public OntologyIRI getIRI() 
	{
		return iri;
	}
	
	public EntityType getEntityType()
	{
		return EntityType.OBJECT_PROPERTY;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (obj == this) {
			return true;
		}
		
		if(obj instanceof ObjectProperty) {
			OntologyIRI otherIri = ((ObjectProperty) obj).getIRI();
			return otherIri.equals(iri);
		}
		
		return false;
	}
	
	
	public ObjectProperty asObjectProperty() 
	{
		return this;
	}
	

}
