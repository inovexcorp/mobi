package org.matonto.ontology.core.api;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

import org.matonto.ontology.core.utils.MatontoOntologyException;


public interface OntologyManager {
	
	Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(File file, OntologyId ontologyId) throws MatontoOntologyException, FileNotFoundException;
	
	Ontology createOntology(OntologyIRI iri, OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException;
	
	Optional<Ontology> retrieveOntology(OntologyId ontologyId) throws MatontoOntologyException;
	
	boolean storeOntology(Ontology ontology) throws MatontoOntologyException;
	
	boolean deleteOntology(OntologyId ontologyId) throws MatontoOntologyException;

	Optional<Map<OntologyId, String>> getOntologyRegistry() throws MatontoOntologyException;
	
	OntologyId createOntologyId();
	
	OntologyId createOntologyId(OntologyIRI ontologyIRI);
	
	OntologyId createOntologyId(OntologyIRI ontologyIRI, OntologyIRI versionIRI);
	
	OntologyIRI createOntologyIRI(String ns, String ln);
	
	OntologyIRI createOntologyIRI(String iriString);
	
}
