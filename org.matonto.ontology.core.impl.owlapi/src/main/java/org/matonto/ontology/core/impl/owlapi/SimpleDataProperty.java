package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLDataProperty;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLDataPropertyImpl;

public class SimpleDataProperty implements DataProperty {

	private OntologyIRI iri;
	
	
	public SimpleDataProperty(OntologyIRI iri)
	{
		this.iri = Preconditions.checkNotNull(iri, "iri cannot be null");
	}
	
	@Override
	public OntologyIRI getIRI() 
	{
		return iri;
	}
	
	
	@Override
	public EntityType getEntityType()
	{
		return EntityType.DATA_PROPERTY;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (obj == this) {
			return true;
		}
		
		if(obj instanceof DataProperty) {
			OntologyIRI otherIri = ((DataProperty) obj).getIRI();
			return otherIri.equals(iri);
		}
		
		return false;
	}
	
	
	public static DataProperty matontoDataProperty(OWLDataProperty owlapiDataProperty)
	{
		IRI owlapiIri = owlapiDataProperty.getIRI();
		OntologyIRI matontoIri = SimpleIRI.matontoIRI(owlapiIri);
		return new SimpleDataProperty(matontoIri);
	}
	
	
	public static OWLDataProperty owlapiDataProperty(DataProperty matontoDataProperty)
	{
		OntologyIRI matontoIri = matontoDataProperty.getIRI();
		IRI owlapiIri = SimpleIRI.owlapiIRI(matontoIri);
		return new OWLDataPropertyImpl(owlapiIri);
	}

	@Override
	public DataProperty asDataProperty() 
	{
		return this;
	}

}
