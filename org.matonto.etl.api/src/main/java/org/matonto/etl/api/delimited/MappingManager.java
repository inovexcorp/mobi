package org.matonto.etl.api.delimited;

import org.matonto.exception.MatOntoException;
import org.matonto.rdf.api.IRI;
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
     * Creates a MappingId using the passed Resource as the identifier.
     *
     * @param id a Resource to use as a identifier
     * @return a MappingId with the passed identifier
     */
    MappingId createMappingId(Resource id);

    /**
     * Creates a MappingId using the passed IRI as the mapping IRI.
     *
     * @param mappingIRI an IRI to use as a mapping IRI
     * @return a MappingId with the passed mapping IRI
     */
    MappingId createMappingId(IRI mappingIRI);

    /**
     * Creates a MappingId using the passed IRIs as the mapping and version IRIs.
     *
     * @param mappingIRI an IRI to use as a mapping IRI
     * @param versionIRI an IRI to use as a version IRI
     * @return a MappingId with the passed mapping and version IRIs
     */
    MappingId createMappingId(IRI mappingIRI, IRI versionIRI);

    /**
     * Retrieves the local name of a mapping IRI.
     *
     * @param iri a mapping IRI
     * @return the local name of the mapping IRI
     */
    String getMappingLocalName(IRI iri);

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
    IRI createMappingIRI();

    /**
     * Generates a mapping IRI Resource with the passed local name.
     *
     * @param localName the local name to use for the mapping IRI Resource
     * @return an IRI Resource for a mapping with the passed local name
     */
    IRI createMappingIRI(String localName);

    /**
     * Creates an empty mapping with the passed in MappingId.
     *
     * @param id a MappingId used to generate the mapping IRI and versionIRI
     * @return an empty Mapping except for beginning statements
     */
    Mapping createMapping(MappingId id);

    /**
     * Creates a MatOnto Model with the mapping in the given file.
     *
     * @param mapping a file containing RDF with a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     */
    Mapping createMapping(File mapping) throws IOException, MatOntoException;

    /**
     * Creates a MatOnto Model with the mapping in the given JSON-LD string.
     *
     * @param jsonld a string containing JSON-LD of a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     */
    Mapping createMapping(String jsonld) throws IOException, MatOntoException;

    /**
     * Creates a MatOnto Model with the mapping in the given InputStream in
     * the given RDF format.
     *
     * @param in an input stream containing mapping RDF
     * @param format the RDF format the mapping is in
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     */
    Mapping createMapping(InputStream in, RDFFormat format) throws IOException, MatOntoException;

    /**
     * Collects a mapping MatOnto Model specified by the passed mapping IRI Resource
     * from the repository if it exists.
     *
     * @param mappingId the IRI Resource for a mapping
     * @return an Optional with a Mapping with the mapping RDF if it was found
     * @throws MatOntoException thrown if a connection to the repository
     *                          could not be made
     */
    Optional<Mapping> retrieveMapping(@Nonnull Resource mappingId) throws MatOntoException;

    /**
     * Persist a mapping in the repository.
     *
     * @param mapping a Mapping with an id and RDF data
     * @return true if the mapping was persisted, false otherwise
     * @throws MatOntoException thrown if a connection to the repository
     *                          could not be made
     */
    boolean storeMapping(@Nonnull Mapping mapping) throws MatOntoException;

    /**
     * Delete a mapping from the repository.
     *
     * @param mappingId the id for a mapping
     * @return true if deletion was successful, false otherwise
     * @throws MatOntoException thrown is a connection to the repository
     *                          could not be made or mapping does not exist
     */
    boolean deleteMapping(@Nonnull Resource mappingId) throws MatOntoException;

    /**
     * Tests whether the passes mapping Resource IRI exists in the mapping registry.
     *
     * @param mappingId the mapping id to test for in the registry
     * @return true if the registry contains the passed mapping IRI, false otherwise.
     */
    boolean mappingExists(@Nonnull Resource mappingId) throws MatOntoException;
}
