package com.mobi.catalog.api;

/*-
 * #%L
 * com.mobi.catalog.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.builder.KeywordCount;
import com.mobi.catalog.api.ontologies.mcat.Record;
import com.mobi.catalog.api.record.EntityMetadata;
import com.mobi.catalog.api.record.RecordService;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import com.mobi.rdf.orm.OrmFactory;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface RecordManager {
    /**
     * Creates and adds a Record to the repository using provided RecordOperationConfig.
     *
     * @param <T>         An Object which extends Record.
     * @param user        The User that is creating the Record.
     * @param config      The RecordOperationConfig containing the Record's metadata.
     * @param recordClass The Class of the Record to be created.
     * @param conn        A RepositoryConnection to use for lookup.
     * @return The Record Object that was added to the repository of type T.
     */
    <T extends Record> T createRecord(User user, RecordOperationConfig config, Class<T> recordClass,
                                      RepositoryConnection conn);

    /**
     * Exports the record data based on the record type and associated configurations. Export implementation is defined
     * by available RecordServices.
     *
     * @param recordIRI The record IRI
     * @param config    The configuration of the record
     * @param conn      A RepositoryConnection to use for lookup.
     */
    void export(Resource recordIRI, RecordOperationConfig config, RepositoryConnection conn);

    /**
     * Exports a list of record data based on the record type and associated configurations. Export implementation is
     * defined by available RecordServices.
     *
     * @param recordIRIs The list of record IRIs
     * @param config     The configuration of the record
     * @param conn       A RepositoryConnection to use for lookup.
     */
    void export(List<Resource> recordIRIs, RecordOperationConfig config, RepositoryConnection conn);

    /**
     * Retrieves a paginated list of entities from the repository based on the provided catalog ID and search parameters.
     * <p>
     * This method queries the repository for entities that match the specified search criteria and returns the results
     * in a paginated format. The results are encapsulated in a {@link PaginatedSearchResults} object, which provides
     * access to the current page of results, as well as metadata about the total number of results and pagination details.
     *
     * @param catalogId    The identifier of the catalog from which to retrieve entities. This should be a valid IRI
     *                     representing the catalog resource.
     * @param searchParams The search parameters to use for querying entities. This includes pagination details such
     *                     as page number and page size, as well as any other criteria used for filtering the results.
     * @param user         The user to check record read permissions for
     * @param conn         The repository connection used to perform the query. This connection should be established
     *                     and valid for the duration of the query.
     * @return A {@link PaginatedSearchResults} object containing the results of the query. The object will include
     * a list of {@link EntityMetadata} objects representing the entities on the current page, as well as metadata
     * about the total number of results and pagination.
     * @throws RepositoryException      If an error occurs while querying the repository. This may include issues with the
     *                                  connection, query execution, or data retrieval.
     * @throws IllegalArgumentException If any of the input parameters are invalid. For example, if {@code catalogId} is
     *                                  null, or if {@code searchParams} contain invalid values such as negative page
     *                                  numbers or sizes.
     */
    PaginatedSearchResults<EntityMetadata> findEntities(Resource catalogId,
                                                        PaginatedSearchParams searchParams,
                                                        User user, RepositoryConnection conn);

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams. Acceptable
     * sortBy parameters are `dct:title`, `dct:modified`, and `dct:issued`.
     *
     * @param catalogId    The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @param conn         A RepositoryConnection to use for lookup.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams,
                                              RepositoryConnection conn);

    /**
     * Searches the provided Catalog for Records that match the provided PaginatedSearchParams. Acceptable
     * sortBy parameters are `dct:title`, `dct:modified`, and `dct:issued`. Only records that the provided user has
     * Read  permission for are returned.
     *
     * @param catalogId    The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @param user         The user to check record read permissions for
     * @param conn         A RepositoryConnection to use for lookup.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<Record> findRecord(Resource catalogId, PaginatedSearchParams searchParams, User user,
                                              RepositoryConnection conn);

    /**
     * Return a list of keywords using the provided Catalog with provided PaginatedSearchParams.
     *
     * @param catalogId    The Resource identifying the Catalog to find the Records in.
     * @param searchParams Search parameters.
     * @param conn         A RepositoryConnection to use for lookup.
     * @return The PaginatedSearchResults for a page matching the search criteria.
     * @throws IllegalArgumentException Thrown if the passed offset is greater than the number of results.
     */
    PaginatedSearchResults<KeywordCount> getKeywords(Resource catalogId, PaginatedSearchParams searchParams,
                                                     RepositoryConnection conn);

    /**
     * Retrieves a Record identified by the provided Resources. The Record will be of type T which is determined by the
     * provided OrmFactory.
     *
     * @param catalogId The Resource identifying the Catalog which should have the Record.
     * @param recordId  The Resource of the Record to retrieve.
     * @param factory   The OrmFactory of the type of Record you want to get back.
     * @param conn      A RepositoryConnection to use for lookup.
     * @param <T>       A Class that extends Record.
     * @return The identified Record.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     */
    <T extends Record> T getRecord(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                   RepositoryConnection conn);

    /**
     * Gets a Set of all Resources identifying Records which exist within the Catalog identified by the provided
     * Resource.
     *
     * @param catalogId The Resource identifying the Catalog that you would like to get the Records from.
     * @param conn      A RepositoryConnection to use for lookup.
     * @return The Set of all Resources identifying Records contained within the Catalog identified by the provided
     * Resource.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found
     */
    Set<Resource> getRecordIds(Resource catalogId, RepositoryConnection conn);

    /**
     * Gets the Record from the provided Catalog. The Record will be of type T which is determined by the provided
     * OrmFactory. Returns an empty Optional if the Record could not be found, or the Record does not belong to the
     * Catalog.
     *
     * @param <T>       An Object which extends Record.
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param recordId  The Resource identifying the Record you want to get.
     * @param factory   The OrmFactory of the Type of Record you want to get back.
     * @param conn      A RepositoryConnection to use for lookup.
     * @return The Record if it exists.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found.
     */
    <T extends Record> Optional<T> getRecordOpt(Resource catalogId, Resource recordId, OrmFactory<T> factory,
                                                RepositoryConnection conn);

    /**
     * Retrieves the {@link RecordService} associated with the provided recordId.
     *
     * @param recordId The Resource of the Record to find an associated RecordService
     * @param conn     A RepositoryConnection to use for lookup.
     * @return The RecordService
     */
    RecordService<? extends Record> getRecordService(Resource recordId, RepositoryConnection conn);

    /**
     * Removes the Record identified by the provided Resources from the repository using the appropriate
     * {@link com.mobi.catalog.api.record.RecordService}. If the type passed is the top level {@link Record}, then the
     * method will use the most specific {@link com.mobi.catalog.api.record.RecordService} it can find.
     *
     * @param <T>         An Object which extends Record.
     * @param catalogId   The Resource identifying the Catalog which contains the Record.
     * @param recordId    The Resource identifying the Record which you want to remove.
     * @param user        The user performing the deletion activity
     * @param recordClass The Class of Record you want to delete.
     * @param conn        A RepositoryConnection to use for lookup.
     * @return The Record object which was removed.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or
     *                                  the Record does not belong to the Catalog.
     */
    <T extends Record> T removeRecord(Resource catalogId, Resource recordId, User user, Class<T> recordClass,
                                      RepositoryConnection conn);

    /**
     * Uses the provided Record to find the Resource of the existing Record and replaces it.
     *
     * @param <T>       An Object which extends Record.
     * @param catalogId The Resource identifying the Catalog which contains the Record.
     * @param newRecord The Record with the desired changes.
     * @param conn      A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or
     *                                  the Record does not belong to the Catalog.
     */
    <T extends Record> void updateRecord(Resource catalogId, T newRecord, RepositoryConnection conn);

    /**
     * Validates the type and existence of a Record in a Catalog.
     *
     * @param catalogId  The Resource identifying the Catalog which should have the Record.
     * @param recordId   The Resource of the Record.
     * @param recordType The IRI of the type of Record.
     * @param conn       A RepositoryConnection to use for lookup.
     * @throws IllegalArgumentException Thrown if the Catalog could not be found, the Record could not be found, or the
     *                                  Record does not belong to the Catalog.
     */
    void validateRecord(Resource catalogId, Resource recordId, IRI recordType, RepositoryConnection conn);
}
