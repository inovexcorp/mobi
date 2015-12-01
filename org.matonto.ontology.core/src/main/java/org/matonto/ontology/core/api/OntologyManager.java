package org.matonto.ontology.core.api;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.Map;

import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.openrdf.model.Resource;

import com.google.common.base.Optional;

public interface OntologyManager {
	
	public Ontology createOntology(OntologyId ontologyId);
	
	public Ontology createOntology(File file, OntologyId ontologyId);
	
	public Ontology createOntology(URL url, OntologyId ontologyId);
	
	public Ontology createOntology(InputStream inputStream, OntologyId ontologyId);
	
	public Optional<Ontology> retrieveOntology(OntologyId ontologyId) throws MatontoOntologyException; 
	
	public boolean storeOntology(Ontology ontology) throws MatontoOntologyException;
	
	public boolean deleteOntology(OntologyId ontologyId) throws MatontoOntologyException;

	public Optional<Map<OntologyId, String>> getOntologyRegistry() throws MatontoOntologyException;
	
	public OntologyId createOntologyId(Resource contextId);
	
}
