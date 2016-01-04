package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.DataProperty;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.rdf.api.IRI;


public class SimpleDataProperty implements DataProperty {

	private IRI iri;
	
	public SimpleDataProperty(@Nonnull IRI iri)
	{
		this.iri = iri;
	}
	
	@Override
	public IRI getIRI() 
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
			IRI otherIri = ((DataProperty) obj).getIRI();
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
