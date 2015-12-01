package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Map;

import org.openrdf.model.Resource;

import com.google.common.base.Optional;

public interface OntologyManager {
	
	public Ontology createOntology(OntologyId ontologyId);
	
	public Ontology createOntology(File file, OntologyId ontologyId);
	
	public Ontology createOntology(URL url, OntologyId ontologyId);
	
	public Ontology createOntology(InputStream inputStream, OntologyId ontologyId);
	
	public Optional<Ontology> retrieveOntology(OntologyId ontologyId); 
	
	public boolean storeOntology(Ontology ontology);
	
	public boolean deleteOntology(OntologyId ontologyId);

	public Optional<Map<OntologyId, String>> getOntologyRegistry();
	
	public OntologyId createOntologyId(Resource contextId);
	
}
