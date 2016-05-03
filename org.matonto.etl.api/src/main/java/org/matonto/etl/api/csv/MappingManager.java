package org.matonto.etl.api.csv;

import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.Model;
import org.matonto.rdf.api.Resource;
import org.openrdf.rio.RDFFormat;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.Set;
import javax.annotation.Nonnull;

public interface MappingManager {

    /**
     * Retrieves the mapping registry.
     *
     * @return the mapping registry as a map between mapping IRIs and the name
     *         of the repository they are in
     */
    Set<Resource> getMappingRegistry();

    /**
     * Generates a mapping IRI Resource with a UUID for a local name.
     *
     * @return an IRI Resource for a mapping with a new UUID local name
     */
    Resource createMappingIRI();

    /**
     * Generates a mapping IRI Resource with the passed local name.
     *
     * @param localName the local name to use for the mapping IRI Resource
     * @return an IRI Resource for a mapping with the passed local name
     */
    Resource createMappingIRI(String localName);

    /**
     * Creates a MatOnto Model with the mapping in the given file.
     *
     * @param mapping a file containing RDF with a mapping
     * @return a MatOnto Model with the mapping RDF
     * @throws IOException thrown if an error occurs when parsing
     */
    Model createMapping(File mapping) throws IOException;

    /**
     * Creates a MatOnto Model with the mapping in the given JSON-LD string.
     *
     * @param jsonld a string containing JSON-LD of a mapping
     * @return a MatOnto Model with the mapping RDF
     * @throws IOException thrown if an error occurs when parsing
     */
    Model createMapping(String jsonld) throws IOException;

    /**
     * Creates a MatOnto Model with the mapping in the given InputStream in
     * the given RDF format.
     *
     * @param in an input stream containing mapping RDF
     * @param format the RDF format the mapping is in
     * @return a MatOnto Model with the mapping RDF
     * @throws IOException thrown if an error occurs when parsing
     */
    Model createMapping(InputStream in, RDFFormat format) throws IOException;

    /**
     * Collects a mapping MatOnto Model specified by the passed mapping IRI Resource
     * from the repository if it exists.
     *
     * @param mappingIRI the IRI Resource for a mapping
     * @return an Optional with the mapping MatOnto Model if it was found
     * @throws MatOntoException thrown if a connection to the repository
     *                          could not be made
     */
    Optional<Model> retrieveMapping(@Nonnull Resource mappingIRI) throws MatOntoException;

    /**
     * Persist a mapping in the repository.
     *
     * @param mappingModel a MatOnto Model with a mapping
     * @param mappingIRI the IRI for the mapping
     * @return true if the mapping was persisted, false otherwise
     * @throws MatOntoException thrown if a connection to the repository
     *                          could not be made
     */
    boolean storeMapping(Model mappingModel, @Nonnull Resource mappingIRI) throws MatOntoException;

    /**
     * Delete a mapping from the repository.
     *
     * @param mappingIRI the IRI for a mapping
     * @return true if deletion was successful, false otherwise
     * @throws MatOntoException thrown is a connection to the repository
     *                          could not be made or mapping does not exist
     */
    boolean deleteMapping(@Nonnull Resource mappingIRI) throws MatOntoException;
}
