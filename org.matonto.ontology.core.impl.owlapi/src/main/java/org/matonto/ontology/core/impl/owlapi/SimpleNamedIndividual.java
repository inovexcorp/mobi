package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.NamedIndividual;
import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.types.EntityType;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLNamedIndividual;

import com.google.common.base.Preconditions;

import uk.ac.manchester.cs.owl.owlapi.OWLNamedIndividualImpl;

public class SimpleNamedIndividual 
	implements NamedIndividual {

	private OntologyIRI iri;
	
	
	public SimpleNamedIndividual(OntologyIRI iri)
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
