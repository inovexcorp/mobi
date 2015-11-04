package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Map;
import java.util.Optional;

import org.openrdf.model.Resource;

public interface OntologyManager {
	
	Ontology createOntology(Resource ontologyId);
	
	Ontology createOntology(File file, Resource ontologyId);
	
	Ontology createOntology(URL url, Resource ontologyId);
	
	Ontology createOntology(InputStream inputStream, Resource ontologyId);
	
	Optional<Ontology> retrieveOntology(Resource ontologyId); 
	
	boolean storeOntology(Ontology ontology);
	
	boolean deleteOntology(Resource ontologyId);

	Optional<Map<Resource, String>> getOntologyRegistry();
	
}
