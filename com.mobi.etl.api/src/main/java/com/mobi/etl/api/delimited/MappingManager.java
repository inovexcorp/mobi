package com.mobi.etl.api.delimited;

/*-
 * #%L
 * com.mobi.etl.api
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

import com.mobi.catalog.api.PaginatedSearchResults;
import com.mobi.etl.api.ontologies.delimited.MappingRecord;
import com.mobi.etl.api.pagination.MappingPaginatedSearchParams;
import com.mobi.exception.MobiException;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.Resource;
import org.eclipse.rdf4j.rio.RDFFormat;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import javax.annotation.Nonnull;

public interface MappingManager {

    /**
     * Creates a {@link MappingId} using the passed {@link Resource} as the identifier.
     *
     * @param id a {@link Resource} to use as a identifier
     * @return a {@link MappingId} with the passed identifier
     */
    MappingId createMappingId(Resource id);

    /**
     * Creates a {@link MappingId} using the passed {@link IRI} as the mapping IRI.
     *
     * @param mappingIRI an {@link IRI} to use as a mapping IRI
     * @return a {@link MappingId} with the passed mapping {@link IRI}
     */
    MappingId createMappingId(IRI mappingIRI);

    /**
     * Creates a {@link MappingId} using the passed {@link IRI IRIs} as the mapping and version IRIs.
     *
     * @param mappingIRI an {@link IRI} to use as a mapping IRI
     * @param versionIRI an {@link IRI} to use as a version IRI
     * @return a {@link MappingId} with the passed mapping and version {@link IRI IRIs}
     */
    MappingId createMappingId(IRI mappingIRI, IRI versionIRI);

    /**
     * Creates a {@link MappingWrapper} with the mapping in the given {@link File}.
     *
     * @param mapping a {@link File} containing RDF with a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws MobiException if the file does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(File mapping) throws IOException, MobiException;

    /**
     * Creates a {@link MappingWrapper} with the mapping in the given JSON-LD string.
     *
     * @param jsonld a string containing JSON-LD of a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws MobiException if the data does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(String jsonld) throws IOException, MobiException;

    /**
     * Creates a {@link MappingWrapper} with the mapping in the given Mobi {@link Model}.
     *
     * @param model a {@link Model} containing the data of a mapping
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws MobiException if the data does not contain exactly one mapping resource
     */
    MappingWrapper createMapping(Model model) throws MobiException;

    /**
     * Creates a {@link MappingWrapper} with the mapping in the given {@link InputStream} in the given
     * {@link RDFFormat}.
     *
     * @param in an {@link InputStream} containing mapping RDF
     * @param format the {@link RDFFormat} the mapping is in
     * @return a Mapping with the mapping RDF and id pulled from the data
     * @throws IOException thrown if an error occurs when parsing
     * @throws IllegalArgumentException if the file is not a valid RDF format
     */
    MappingWrapper createMapping(InputStream in, RDFFormat format) throws IOException, MobiException;

    /**
     * Retrieves a paginated list of {@link MappingRecord MappingRecords} in the local catalog based on the passed
     * search and pagination parameters. Acceptable sort properties are http://purl.org/dc/terms/title,
     * http://purl.org/dc/terms/modified, and http://purl.org/dc/terms/issued.
     *
     * @param searchParams Pagination configuration for {@link MappingRecord MappingRecords}
     * @return The {@link PaginatedSearchResults} of {@link MappingRecord MappingRecords} in the local catalog
     */
    PaginatedSearchResults<MappingRecord> getMappingRecords(MappingPaginatedSearchParams searchParams);

    /**
     * Collects a {@link MappingWrapper} specified by the passed mapping IRI {@link Resource} from the repository if it
     * exists.
     *
     * @param recordId the IRI {@link Resource} for a mapping
     * @return an {@link Optional} with a Mapping with the mapping RDF if it was found
     */
    Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId);

    /**
     * Collects a {@link MappingWrapper} specified by the passed IRI {@link Resource Resources} for a
     * {@link MappingRecord} and a {@link com.mobi.catalog.api.ontologies.mcat.Branch} from the repository if it exists.
     *
     * @param recordId the IRI {@link Resource} for a Mapping Record
     * @param branchId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Branch}
     * @return an {@link Optional} with a Mapping with the mapping RDF if it was found
     */
    Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId);

    /**
     * Collects a {@link MappingWrapper} specified by the passed mapping IRI {@link Resource Resources} for a
     * {@link MappingRecord}, {@link com.mobi.catalog.api.ontologies.mcat.Branch}, and a
     * {@link com.mobi.catalog.api.ontologies.mcat.Commit} from the repository if it exists.
     *
     * @param recordId the IRI {@link Resource} for a Mapping Record
     * @param branchId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Branch}
     * @param commitId the IRI {@link Resource} for a {@link com.mobi.catalog.api.ontologies.mcat.Commit}
     * @return an {@link Optional} with a Mapping with the mapping RDF if it was found
     */
    Optional<MappingWrapper> retrieveMapping(@Nonnull Resource recordId, @Nonnull Resource branchId,
                                             @Nonnull Resource commitId);
}
