package org.matonto.ontology.core.api;

import org.matonto.ontology.core.utils.MatontoOntologyException;
import org.matonto.ontology.utils.api.SesameTransformer;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.util.Map;
import java.util.Optional;
import java.util.Set;


public interface OntologyManager {

    Ontology createOntology(OntologyId ontologyId) throws MatontoOntologyException;

    Ontology createOntology(File file) throws MatontoOntologyException, FileNotFoundException;

    Ontology createOntology(IRI iri) throws MatontoOntologyException;

    Ontology createOntology(InputStream inputStream) throws MatontoOntologyException;

    Ontology createOntology(String json) throws MatontoOntologyException;

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

    /**
     * Updates Ontology object with the changed resource
     *
     * @param ontologyResource Ontology Resource
     * @param changedResource The IRI of the changed resource
     * @param resourceJson The json-ld of the changed resource
     * @param updateRefs True if we need to update statements where the object is the resourceJson subject, false
     *                   otherwise
     * @return True if successfully updated, false otherwise
     */
    boolean saveChangesToOntology(Resource ontologyResource, Resource changedResource, String resourceJson);

    /**
     * Add the resource json to the Ontology object
     *
     * @param ontologyResource Ontology Resource
     * @param resourceJson The json-ld of the new resource
     * @return True if successfully updated, false otherwise
     */
    boolean addEntityToOntology(Resource ontologyResource, String resourceJson);

    Map<String, Set> deleteEntityFromOntology(@Nonnull Resource ontologyResource, @Nonnull Resource entityResource)
            throws MatontoOntologyException;

    /**
     * Gets the ontology registry which is persisted in the repository
     *
     * @return Set of ontology resources
     * @throws MatontoOntologyException - if the repository is null
     */
    Set<Resource> getOntologyRegistry() throws MatontoOntologyException;

    OntologyId createOntologyId();

    OntologyId createOntologyId(Resource resource);

    OntologyId createOntologyId(IRI ontologyIRI);

    OntologyId createOntologyId(IRI ontologyIRI, IRI versionIRI);

    SesameTransformer getTransformer();
}
