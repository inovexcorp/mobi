package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.ObjectProperty;
import org.matonto.ontology.core.api.OntologyIRI;

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
	
	public SimpleEntityType getEntityType()
	{
		return SimpleEntityType.OBJECT_PROPERTY;
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
	
	
	public static ObjectProperty matontoObjectProperty(OWLObjectProperty owlapiObjectProperty)
	{
		IRI owlapiIri = owlapiObjectProperty.getIRI();
		OntologyIRI matontoIri = SimpleIRI.matontoIRI(owlapiIri);
		return new SimpleObjectProperty(matontoIri);
	}
	
	
	public static OWLObjectProperty owlapiObjectProperty(ObjectProperty matontoObjectProperty)
	{
		OntologyIRI matontoIri = matontoObjectProperty.getIRI();
		IRI owlapiIri = SimpleIRI.owlapiIRI(matontoIri);
		return new OWLObjectPropertyImpl(owlapiIri);
	}


}
