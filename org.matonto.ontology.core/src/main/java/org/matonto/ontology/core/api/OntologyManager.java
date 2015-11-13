package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Map;

import org.matonto.ontology.core.impl.owlapi.SimpleOntologyId;

import com.google.common.base.Optional;

public interface OntologyManager {
	
	Ontology createOntology(SimpleOntologyId ontologyId);
	
	Ontology createOntology(File file, SimpleOntologyId ontologyId);
	
	Ontology createOntology(URL url, SimpleOntologyId ontologyId);
	
	Ontology createOntology(InputStream inputStream, SimpleOntologyId ontologyId);
	
	Optional<Ontology> retrieveOntology(SimpleOntologyId ontologyId); 
	
	boolean storeOntology(Ontology ontology);
	
	boolean deleteOntology(SimpleOntologyId ontologyId);

	Optional<Map<SimpleOntologyId, String>> getOntologyRegistry();
	
}
