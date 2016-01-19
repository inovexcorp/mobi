package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.rdf.api.ValueFactory;
import org.semanticweb.owlapi.model.OWLOntologyID;


public class SimpleOntologyId implements OntologyId {

	private Resource identifier;
	private OWLOntologyID ontologyId;
	private ValueFactory factory;
	
	public static class Builder {
	    private Resource identifier;
	    private IRI ontologyIRI;
	    private IRI versionIRI;
        private ValueFactory factory;
	    
	    public Builder(ValueFactory factory) {
	        this.factory = factory;
	    }
	    
	    public Builder id(Resource identifier) {
	        this.identifier = identifier;
	        return this;
	    }
	    
	    public Builder ontologyIRI(IRI ontologyIRI) {
	        this.ontologyIRI = ontologyIRI;
	        return this;
	    }
	    
	    public Builder versionIRI(IRI versionIRI) {
            this.versionIRI = versionIRI;
            return this;
        }
	    
	    public SimpleOntologyId build() {
	        return new SimpleOntologyId(this);
	    }
	}

	private SimpleOntologyId(Builder b) {
        if(b.versionIRI != null && b.ontologyIRI==null)
            throw new MatontoOntologyException("ontology IRI must not be null if version IRI is not null");
        
	    this.factory = b.factory;
	    org.semanticweb.owlapi.model.IRI oIRI = null;
	    org.semanticweb.owlapi.model.IRI vIRI = null;
	    
	    if(b.versionIRI != null)
	        vIRI = SimpleOntologyValues.owlapiIRI(b.versionIRI);
	    if(b.ontologyIRI != null)
	        oIRI = SimpleOntologyValues.owlapiIRI(b.ontologyIRI);
	    
	    if(vIRI != null) {
	        ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.of(vIRI));
	        this.identifier = factory.createIRI(b.versionIRI.toString());
	    }
	    
	    else if(oIRI != null) {
	        ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.absent());
	        this.identifier = factory.createIRI(b.ontologyIRI.toString());
	    }
	    
	    else if(b.identifier != null) {
	        this.identifier = b.identifier;
	        ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(), com.google.common.base.Optional.absent());
	    }
	    
	    else {
	        this.identifier = factory.createBNode();
	        ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(), com.google.common.base.Optional.absent());
	    }
	        
	}

	
	@Override
	public Optional<IRI> getOntologyIRI() {
        if (ontologyId.getOntologyIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI owlIri = ontologyId.getOntologyIRI().get();
            return Optional.of(SimpleOntologyValues.matontoIRI(owlIri));
        } else {
            return Optional.empty();
        }
	}
	
	
	@Override
	public Optional<IRI> getVersionIRI() {
        if (ontologyId.getVersionIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI versionIri = ontologyId.getVersionIRI().get();
            return Optional.of(SimpleOntologyValues.matontoIRI(versionIri));
        } else {
            return Optional.empty();
        }
	}
	

    @Override
	public Resource getOntologyIdentifier() {
		return identifier;
	}

	protected OWLOntologyID getOwlapiOntologyId() {
		return ontologyId;
	}
	
	@Override
	public String toString() {
        return ontologyId.toString();
	}
	
	@Override
	public boolean equals(Object obj) {
		if (this == obj) {
			return true;
		}
		
		if (obj instanceof SimpleOntologyId) {
			SimpleOntologyId other = (SimpleOntologyId) obj;
            if(identifier.equals(other.getOntologyIdentifier()))
            	return this.getVersionIRI().equals(other.getVersionIRI());
		}
		
		return false;		        	
	}
	
	@Override
	public int hashCode() {
		return identifier.hashCode();
	}

}



