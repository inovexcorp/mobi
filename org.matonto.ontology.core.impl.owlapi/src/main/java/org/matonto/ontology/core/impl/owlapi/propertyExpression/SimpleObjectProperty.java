package org.matonto.ontology.core.impl.owlapi.propertyExpression;

import org.matonto.ontology.core.api.propertyexpression.ObjectProperty;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.types.EntityType;
import org.matonto.rdf.api.IRI;


public class SimpleObjectProperty 
	extends SimpleObjectPropertyExpression
	implements ObjectProperty {

	
	private IRI iri;
	
	public SimpleObjectProperty(@Nonnull IRI iri)
	{
		this.iri = iri;
	}
	
	@Override
	public IRI getIRI() 
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
			IRI otherIri = ((ObjectProperty) obj).getIRI();
			return otherIri.equals(iri);
		}
		
		return false;
	}
	
	
	public ObjectProperty asObjectProperty() 
	{
		return this;
	}
	

}
