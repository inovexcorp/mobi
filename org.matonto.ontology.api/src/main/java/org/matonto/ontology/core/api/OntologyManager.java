package org.matonto.ontology.core.api;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.matonto.repository.api.Repository;


public interface OntologyManager {
	
	Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException;
	
	Ontology createOntology(File file) throws MatontoOntologyException, FileNotFoundException;
	
	Ontology createOntology(IRI iri) throws MatontoOntologyException;
	
	Ontology createOntology(InputStream inputStream) throws MatontoOntologyException;
	
	Optional<Ontology> retrieveOntology(@Nonnull Resource resource) throws MatontoOntologyException;

	/**
	 * Persists Ontology object in the repository, and returns true if successfully persisted
	 *
	 * @return True if successfully persisted
	 * @throws IllegalStateException - if the repository is null
     * @throws MatontoOntologyException - if an exception occurs while persisting
	 */
	boolean storeOntology(@Nonnull Ontology ontology) throws MatontoOntologyException;

    /**
     * Deletes the ontology with the given OntologyId, and returns true if successfully removed. The identifier
     * used matches the rules for OntologyId.getOntologyIdentifier():
     *
     * <ol>
     *     <li>If a Version IRI is present, the ontology identifier will match the Version IRI</li>
     *     <li>Else if an Ontology IRI is present, the ontology identifier will match the Ontology IRI</li>
     *     <li>Else if neither are present, the ontology identifier will be a system generated blank node</li>
     * </ol>
     *
     * @return True if the name graph with given context id is successfully deleted, or false if ontology Id
     * does not exist in the repository or if an owlapi exception or sesame exception is caught.
     * @throws IllegalStateException - if the repository is null
     */
	boolean deleteOntology(@Nonnull Resource resource) throws MatontoOntologyException;

	Map<Resource, String> getOntologyRegistry() throws MatontoOntologyException;
	
	OntologyId createOntologyId();
	
	OntologyId createOntologyId(IRI ontologyIRI);
	
	OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI);
	
	IRI createOntologyIRI(String ns, String ln);
	
	IRI createOntologyIRI(String iriString);

	SesameTransformer getTransformer();
	
	Repository getRepository();
}
