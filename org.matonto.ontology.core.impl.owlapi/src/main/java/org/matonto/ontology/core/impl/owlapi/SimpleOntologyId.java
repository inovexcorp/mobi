package org.matonto.ontology.core.impl.owlapi;

import java.util.Optional;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.OntologyId;
import org.openrdf.model.Resource;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLOntologyID;


public class SimpleOntologyId implements OntologyId {

	private Resource identifier;
	private OWLOntologyID ontologyId;

    private static final ValueFactory VF = ValueFactoryImpl.getInstance();

    
    public SimpleOntologyId() {
        this.identifier = VF.createBNode();       
        ontologyId = new OWLOntologyID(com.google.common.base.Optional.absent(), com.google.common.base.Optional.absent());
    }

	public SimpleOntologyId(OntologyIRI ontologyIRI) {
		this.identifier = VF.createURI(ontologyIRI.toString());		
		IRI oIRI = SimpleIRI.owlapiIRI(ontologyIRI);
		ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.absent());
	}

	public SimpleOntologyId(OntologyIRI ontologyIRI, OntologyIRI versionIRI) {
        this.identifier = VF.createURI(versionIRI.toString());
        IRI oIRI = SimpleIRI.owlapiIRI(ontologyIRI);
        IRI vIRI = SimpleIRI.owlapiIRI(versionIRI);
        ontologyId = new OWLOntologyID(com.google.common.base.Optional.of(oIRI), com.google.common.base.Optional.of(vIRI));
	}
		
	
	@Override
	public Optional<OntologyIRI> getOntologyIRI() {
        if (ontologyId.getOntologyIRI().isPresent()) {
            IRI owlIri = ontologyId.getOntologyIRI().get();
            return Optional.of(SimpleIRI.matontoIRI(owlIri));
        } else {
            return Optional.empty();
        }
	}
	
	
	@Override
	public Optional<OntologyIRI> getVersionIRI() {
        if (ontologyId.getVersionIRI().isPresent()) {
            IRI versionIri = ontologyId.getVersionIRI().get();
            return Optional.of(SimpleIRI.matontoIRI(versionIri));
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
		com.google.common.base.Optional<IRI> vIRI = ontologyId.getVersionIRI();
		com.google.common.base.Optional<IRI> oIRI = ontologyId.getOntologyIRI();

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

	public static OWLOntologyID owlapiOntologyId(SimpleOntologyId simpleId) {
		return simpleId.getOwlapiOntologyId();
	}

	public static SimpleOntologyId matontoOntologyId(OWLOntologyID owlId) {
		com.google.common.base.Optional<IRI> oIRI = owlId.getOntologyIRI();
		com.google.common.base.Optional<IRI> vIRI = owlId.getVersionIRI();

        if (vIRI.isPresent()) {
            return new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()), SimpleIRI.matontoIRI(vIRI.get()));
        } else if (oIRI.isPresent()) {
            return new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()));
        } else {
            return new SimpleOntologyId();
        }
	}
}



