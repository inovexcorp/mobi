package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Map;

import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.openrdf.model.Resource;

import com.google.common.base.Optional;

public interface OntologyManager {
	
	Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(File file, OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(URL url, OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(InputStream inputStream, OntologyId ontologyId) throws MatontoOntologyException;
	
	Optional<Ontology> retrieveOntology(OntologyId ontologyId) throws MatontoOntologyException;
	
	boolean storeOntology(Ontology ontology) throws MatontoOntologyException;
	
	boolean deleteOntology(OntologyId ontologyId) throws MatontoOntologyException;

	Optional<Map<OntologyId, String>> getOntologyRegistry() throws MatontoOntologyException;
	
	OntologyId createOntologyId(Resource contextId);
	
}
