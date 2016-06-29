package org.matonto.etl.api.csv;

/*-
 * #%L
 * org.matonto.etl.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

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

    /**
     * Tests whether the passes mapping Resource IRI exists in the mapping registry.
     *
     * @param mappingIRI the mapping IRI to test for in the registry
     * @return true if the registry contains the passed mapping IRI, false otherwise.
     */
    boolean mappingExists(@Nonnull Resource mappingIRI) throws MatOntoException;
}
