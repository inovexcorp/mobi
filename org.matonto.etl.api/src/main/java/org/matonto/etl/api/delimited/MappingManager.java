package org.matonto.etl.api.delimited;

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
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.Resource;
import org.openrdf.rio.RDFFormat;

import javax.annotation.Nonnull;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import java.util.Set;

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
     * Retrieves the mapping registry.
     *
     * @return the mapping registry as a map between mapping IRIs and the name
     *         of the repository they are in
     */
    Set<Resource> getMappingRegistry();

    /**
     * Creates an empty mapping with the passed in MappingId.
     *
     * @param id a MappingId used to generate the mapping IRI and versionIRI
     * @return an empty Mapping except for beginning statements
     */
    MappingWrapper createMapping(MappingId id);

    /**
     * Creates a MatOnto Model with the mapping in the given file.
     *
     * @param mapping a file containing RDF with a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws MatOntoException if the file does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(File mapping) throws IOException, MatOntoException;

    /**
     * Creates a MatOnto Model with the mapping in the given JSON-LD string.
     *
     * @param jsonld a string containing JSON-LD of a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws MatOntoException if the file does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(String jsonld) throws IOException, MatOntoException;

    /**
     * Creates a MatOnto Model with the mapping in the given InputStream in
     * the given RDF format.
     *
     * @param in an input stream containing mapping RDF
     * @param format the RDF format the mapping is in
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws MatOntoException if the file does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(InputStream in, RDFFormat format) throws IOException, MatOntoException;

    /**
     * Collects a mapping MatOnto Model specified by the passed mapping IRI Resource
     * from the repository if it exists.
     *
     * @param mappingId the IRI Resource for a mapping
     * @return an Optional with a Mapping with the mapping RDF if it was found
     * @throws MatOntoException thrown if a connection to the repository could not be made
     */
    Optional<MappingWrapper> retrieveMapping(@Nonnull Resource mappingId) throws MatOntoException;

    /**
     * Persist a mapping in the repository.
     *
     * @param mappingWrapper a MappingWrapper with an id and RDF data
     * @throws MatOntoException thrown if a connection to the repository could not be made
     */
    void storeMapping(@Nonnull MappingWrapper mappingWrapper) throws MatOntoException;

    /**
     * Updates a mapping in the repository with the new passed mapping.
     *
     * @param mappingId the id of a mapping
     * @param newMapping a new mapping to replace the existing one with
     * @throws MatOntoException thrown if the mapping does not exist or a connection to
     *      the repository could not be made or mapping does not exist
     */
    void updateMapping(@Nonnull Resource mappingId, MappingWrapper newMapping) throws MatOntoException;

    /**
     * Delete a mapping from the repository.
     *
     * @param mappingId the id for a mapping
     * @throws MatOntoException thrown if the mapping does not exist or a connection to
     *      the repository could not be made or mapping does not exist
     */
    void deleteMapping(@Nonnull Resource mappingId) throws MatOntoException;

    /**
     * Tests whether the passes mapping Resource IRI exists in the mapping registry.
     *
     * @param mappingId the mapping id to test for in the registry
     * @return true if the registry contains the passed mapping IRI, false otherwise.
     */
    boolean mappingExists(@Nonnull Resource mappingId) throws MatOntoException;
}
