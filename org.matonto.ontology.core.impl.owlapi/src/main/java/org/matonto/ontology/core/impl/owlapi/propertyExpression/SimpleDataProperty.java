package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;


public class SimpleDataProperty implements DataProperty {

	private OntologyIRI iri;
	
	public SimpleDataProperty(@Nonnull OntologyIRI iri)
	{
		this.iri = iri;
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
	
	
	@Override
	public DataProperty asDataProperty() 
	{
		return this;
	}

}
