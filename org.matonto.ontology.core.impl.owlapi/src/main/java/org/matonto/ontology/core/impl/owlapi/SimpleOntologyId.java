package org.matonto.ontology.core.impl.owlapi;

import org.matonto.ontology.core.api.OntologyIRI;
import org.matonto.ontology.core.api.OntologyId;
import org.openrdf.model.Resource;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.impl.URIImpl;
import org.openrdf.model.impl.ValueFactoryImpl;
import org.semanticweb.owlapi.model.IRI;
import org.semanticweb.owlapi.model.OWLOntologyID;

import com.google.common.base.Optional;

public class SimpleOntologyId implements OntologyId {

	private Resource identifier;
	private OWLOntologyID ontologyId;

    private static final ValueFactory VF = ValueFactoryImpl.getInstance();

    public SimpleOntologyId() {
        Optional<IRI> oIRI = Optional.absent();
        Optional<IRI> vIRI = Optional.absent();

        this.identifier = VF.createBNode();
        ontologyId = new OWLOntologyID(oIRI, vIRI);
    }

	public SimpleOntologyId(OntologyIRI ontologyIRI) {
        IRI oIRI = SimpleIRI.owlapiIRI(ontologyIRI);

		this.identifier = VF.createURI(ontologyIRI.toString());
		ontologyId = new OWLOntologyID(Optional.of(oIRI), Optional.absent());
	}

	public SimpleOntologyId(OntologyIRI ontologyIRI, OntologyIRI versionIRI) {
        IRI oIRI = SimpleIRI.owlapiIRI(ontologyIRI);
        IRI vIRI = SimpleIRI.owlapiIRI(versionIRI);

        this.identifier = VF.createURI(versionIRI.toString());
        ontologyId = new OWLOntologyID(Optional.of(oIRI), Optional.of(vIRI));
	}
		
	
	@Override
	public Optional<OntologyIRI> getOntologyIRI() {
        if (ontologyId.getOntologyIRI().isPresent()) {
            IRI owlIri = ontologyId.getOntologyIRI().get();
            return Optional.of(SimpleIRI.matontoIRI(owlIri));
        } else {
            return Optional.absent();
        }
	}
	
	
	@Override
	public Optional<OntologyIRI> getVersionIRI() {
        if (ontologyId.getVersionIRI().isPresent()) {
            IRI versionIri = ontologyId.getVersionIRI().get();
            return Optional.of(SimpleIRI.matontoIRI(versionIri));
        } else {
            return Optional.absent();
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
        Optional<IRI> vIRI = ontologyId.getVersionIRI();
		Optional<IRI> oIRI = ontologyId.getOntologyIRI();

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
            return identifier.equals(other.getOntologyIdentifier());
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
		Optional<IRI> oIRI = owlId.getOntologyIRI();
		Optional<IRI> vIRI = owlId.getVersionIRI();

        if (vIRI.isPresent()) {
            return new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()), SimpleIRI.matontoIRI(vIRI.get()));
        } else if (oIRI.isPresent()) {
            return new SimpleOntologyId(SimpleIRI.matontoIRI(oIRI.get()));
        } else {
            return new SimpleOntologyId();
        }
	}
}



