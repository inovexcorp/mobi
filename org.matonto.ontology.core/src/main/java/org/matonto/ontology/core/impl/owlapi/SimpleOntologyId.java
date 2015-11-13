package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.OntologyIRI;
import org.openrdf.model.Resource;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLOntologyID;

import com.google.common.base.Optional;

public class SimpleOntologyId {

	private Resource contextId;
	private OWLOntologyID ontologyId;
		
		
	public SimpleOntologyId(Resource contextId)
	{
		this.contextId = contextId;
		ontologyId = new OWLOntologyID();
	}
	
	
	public SimpleOntologyId(Resource contextId, Optional<SimpleIRI> iri, Optional<SimpleIRI> versionIri)
	{
		this.contextId = contextId;
		Optional<IRI> owlIri = Optional.absent();
		Optional<IRI> owlVersionIri = Optional.absent();
		
		if(iri.isPresent()) 
			owlIri = Optional.of(SimpleIRI.owlapiIRI(iri.get()));
		
		if(versionIri.isPresent())
			owlVersionIri = Optional.of(SimpleIRI.owlapiIRI(versionIri.get()));
		
		ontologyId = new OWLOntologyID(owlIri, owlVersionIri);
	}
		
		
	public Optional<OntologyIRI> getOntologyIRI()
	{	
		if(!ontologyId.getOntologyIRI().isPresent())
			return Optional.absent();
		
		IRI owlIri = ontologyId.getOntologyIRI().get();
		return Optional.of(SimpleIRI.matontoIRI(owlIri));
	}
	
	
	public Optional<OntologyIRI> getVersinIRI()
	{
		if(!ontologyId.getVersionIRI().isPresent())
			return Optional.absent();
		
		IRI versionIri = ontologyId.getVersionIRI().get();
		return Optional.of(SimpleIRI.matontoIRI(versionIri));
	}
	
	
	public Resource getContextId()
	{
		return contextId;
	}
	
	
	protected OWLOntologyID getOntologyId()
	{
		return ontologyId;
	}
	
	
	@Override
	public String toString()
	{
		return ontologyId.toString();
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if (obj instanceof SimpleOntologyId) {
			SimpleOntologyId other = (SimpleOntologyId)obj;
			if(ontologyId.equals(other.getOntologyId()))
				return contextId.equals(other.getContextId());
		}
		
		return false;		        	
	}
	
	
	public int hashCode()
	{
		return ontologyId.hashCode();
	}
		
}



