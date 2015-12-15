package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.OntologyId;
import org.matonto.rdf.api.IRI;
import org.openrdf.model.Resource;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.semanticweb.owlapi.model.OWLOntologyID;


public class SimpleOntologyId implements OntologyId {

	private Resource identifier;
	private OWLOntologyID ontologyId;
    private static final ValueFactory VF = ValueFactoryImpl.getInstance();

    
    public SimpleOntologyId() {
        this.identifier = VF.createBNode();       
        ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(), com.google.common.base.Optional.absent());
    }

	public SimpleOntologyId(@Nonnull IRI ontologyIRI) {	
	    org.semanticweb.owlapi.model.IRI oIRI = Values.owlapiIRI(ontologyIRI);
		ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.absent());
		this.identifier = VF.createURI(ontologyIRI.toString());	
	}

	public SimpleOntologyId(@Nonnull IRI ontologyIRI, @Nonnull IRI versionIRI) {
	    org.semanticweb.owlapi.model.IRI oIRI =Values.owlapiIRI(ontologyIRI);
	    org.semanticweb.owlapi.model.IRI vIRI = Values.owlapiIRI(versionIRI);
        ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.of(vIRI));
        this.identifier = VF.createURI(versionIRI.toString());
	}
		
	
	@Override
	public Optional<IRI> getOntologyIRI() {
        if (ontologyId.getOntologyIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI owlIri = ontologyId.getOntologyIRI().get();
            return Optional.of(Values.matontoIRI(owlIri));
        } else {
            return Optional.empty();
        }
	}
	
	
	@Override
	public Optional<IRI> getVersionIRI() {
        if (ontologyId.getVersionIRI().isPresent()) {
            org.semanticweb.owlapi.model.IRI versionIri = ontologyId.getVersionIRI().get();
            return Optional.of(Values.matontoIRI(versionIri));
        } else {
            return Optional.empty();
        }
	}

	public Resource getOntologyIdentifier() {
		return identifier;
	}

	protected OWLOntologyID getOwlapiOntologyId() {
		return ontologyId;
	}
	
	@Override
	public String toString() {
		com.google.common.base.Optional<org.semanticweb.owlapi.model.IRI> vIRI = ontologyId.getVersionIRI();
		com.google.common.base.Optional<org.semanticweb.owlapi.model.IRI> oIRI = ontologyId.getOntologyIRI();

        if (vIRI.isPresent()) {
            return vIRI.get().toString();
        } else if (oIRI.isPresent()) {
            return oIRI.get().toString();
        } else {
            return identifier.stringValue();
        }
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



