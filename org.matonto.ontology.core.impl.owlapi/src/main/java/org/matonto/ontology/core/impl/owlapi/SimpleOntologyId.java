package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.OntologyId;
import org.openrdf.model.Resource;
import org.openrdf.model.impl.URIImpl;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLOntologyID;

import com.google.common.base.Optional;

public class SimpleOntologyId implements OntologyId {

	private Resource contextId;
	private OWLOntologyID ontologyId;
		
		
	public SimpleOntologyId(Resource contextId)
	{
		this.contextId = contextId;
		Optional<IRI> owlIri = Optional.of(SimpleIRI.owlapiIRI(new SimpleIRI(contextId.stringValue())));
		Optional<IRI> owlVersionIri = Optional.absent();
		ontologyId = new OWLOntologyID(owlIri, owlVersionIri);
	}
	
	
	public SimpleOntologyId(Resource contextId, Optional<OntologyIRI> iri, Optional<OntologyIRI> versionIri)
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
		
	
	@Override
	public Optional<OntologyIRI> getOntologyIRI()
	{	
		if(!ontologyId.getOntologyIRI().isPresent())
			return Optional.absent();
		
		IRI owlIri = ontologyId.getOntologyIRI().get();
		return Optional.of(SimpleIRI.matontoIRI(owlIri));
	}
	
	
	@Override
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
	
	
	protected OWLOntologyID getOwlapiOntologyId()
	{
		return ontologyId;
	}
	
	
	@Override
	public String toString()
	{
		Optional<IRI> iri = ontologyId.getOntologyIRI();
		return (iri.isPresent()) ? iri.get().toString() : "";
	}
	
	
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		
		if (obj instanceof SimpleOntologyId) {
			SimpleOntologyId other = (SimpleOntologyId)obj;
			if(ontologyId.equals(other.getOwlapiOntologyId()))
				return contextId.equals(other.getContextId());
		}
		
		return false;		        	
	}
	
	
	public int hashCode()
	{
		return ontologyId.hashCode();
	}
	
	
	public static OWLOntologyID owlapiOntologyId(SimpleOntologyId simpleId)
	{
		return simpleId.getOwlapiOntologyId();
	}
	
	
	public static SimpleOntologyId matontoOntologyId(OWLOntologyID owlId)
	{
		Resource cid = new URIImpl(owlId.getOntologyIRI().get().toString());
		Optional<OntologyIRI> iri = Optional.absent();
		Optional<OntologyIRI> versionIri = Optional.absent();
		
		if(owlId.getOntologyIRI().isPresent()) 
			iri = Optional.of(SimpleIRI.matontoIRI(owlId.getOntologyIRI().get()));
		
		if(owlId.getVersionIRI().isPresent())
			versionIri = Optional.of(SimpleIRI.matontoIRI(owlId.getVersionIRI().get()));
		
		return new SimpleOntologyId(cid, iri, versionIri);
	}
		
}



