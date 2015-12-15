package org.matonto.ontology.core.impl.owlapi;

import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;


public class SimpleNamedIndividual 
	implements NamedIndividual {

	private OntologyIRI iri;
	
	
	public SimpleNamedIndividual(@Nonnull OntologyIRI iri)
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
		return EntityType.NAMED_INDIVIDUAL;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if(obj == this)
			return true;
		
		if(obj instanceof NamedIndividual) {
			NamedIndividual other = (NamedIndividual) obj;
			return iri.equals(other.getIRI());
		}
		
		return false;
	}
	
	
	@Override
	public boolean isNamed() 
	{
		return true;
	}


	@Override
	public boolean isAnonymous() 
	{
		return false;
	}

}
