package com.mobi.dataset.api;

/*-
 * #%L
 * com.mobi.dataset.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import com.mobi.dataset.ontology.dataset.DatasetRecord;
import com.mobi.dataset.pagination.DatasetPaginatedSearchParams;
import com.mobi.jaas.api.ontologies.usermanagement.User;
import org.eclipse.rdf4j.model.Resource;

import java.util.Optional;
import java.util.Set;

/**
 * As service for managing DatasetRecords within the Mobi platform.
 */
public interface DatasetManager {

    /**
     * Retrieve the Resource for every Dataset in the specified Repository as defined in the local catalog. Note: This
     * method returns the Dataset Resource, not return the DatasetRecord Resource.
     *
     * @param repositoryId The Repository containing the desired datasets.
     * @return The Set of Resources for all the Datasets in the specified Repository as defined in the local catalog.
     */
    Set<Resource> getDatasets(String repositoryId);

    /**
     * Retrieves DatasetRecords in the local catalog based on the passed search and pagination parameters. Acceptable
     * sort properties are `dct:title`, `dct:modified`, and`dct:issued`.
     *
     * @return The PaginatedSearchResults of DatasetRecords in the local catalog. DatasetRecord includes empty Dataset
     *      object.
     */
    PaginatedSearchResults<DatasetRecord> getDatasetRecords(DatasetPaginatedSearchParams searchParams);

    /**
     * Retrieves the DatasetRecord for a dataset in the specified repository.
     *
     * @param dataset The Resource described by the DatasetRecord in the local catalog.
     * @param repositoryId  The Repository containing the specified dataset.
     * @return The DatasetRecord from the local catalog. DatasetRecord includes empty Dataset object.
     */
    Optional<DatasetRecord> getDatasetRecord(Resource dataset, String repositoryId);

    /**
     * Retrieves the DatasetRecord for a dataset described by the specified DatasetRecord Resource.
     *
     * @param record The Resource of the DatasetRecord.
     * @return The DatasetRecord from the local catalog. DatasetRecord includes empty Dataset object.
     */
    Optional<DatasetRecord> getDatasetRecord(Resource record);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource as the provided User.
     * Note: This method removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @param user The User to perform the delete as.
     * @return The DatasetRecord that was removed.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    DatasetRecord deleteDataset(Resource dataset, String repositoryId, User user);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the DatasetRecord Resource. Note: This method
     * removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param record The Resource of the DatasetRecord to be removed along with associated Dataset and data.
     * @return The DatasetRecord that was removed.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     * @throws IllegalStateException if the DatasetRecord does not point to a Dataset or a repository
     */
    DatasetRecord deleteDataset(Resource record, User user);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource as the provided User.
     * Note: This method removes all graphs from the specified dataset if and only if they are not associated with
     * other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @param user The user to perform the delete as.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    DatasetRecord safeDeleteDataset(Resource dataset, String repositoryId, User user);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the DatasetRecord Resource. Note: This method
     * removes all graphs from the specified dataset if and only if they are not associated with other datasets.
     *
     * @param record The Resource of DatasetRecord to be removed along with associated Dataset and data.
     * @return The DatasetRecord that was removed.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     * @throws IllegalStateException if the DatasetRecord does not point to a Dataset or a repository
     */
    DatasetRecord safeDeleteDataset(Resource record, User user);

    /**
     * Removes all data associated with the Dataset of the DatasetRecord Resource. DatasetRecord and Dataset are not
     * removed. Note: This method removes all graphs from the specified dataset even if they are associated with other
     * datasets.
     *
     * @param record The Resource of the DatasetRecord to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     * @throws IllegalStateException if the DatasetRecord does not point to a Dataset or a repository
     */
    void clearDataset(Resource record);

    /**
     * Removes all data associated with the Dataset of the DatasetRecord Resource. DatasetRecord and Dataset are not
     * removed. Note: This method removes all graphs from the specified dataset if and only if they are not associated
     * with other
     * datasets.
     *
     * @param record The Resource of the DatasetRecord to be cleared.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     * @throws IllegalStateException if the DatasetRecord does not point to a Dataset or a repository
     */
    void safeClearDataset(Resource record);

    /**
     * Returns a DatasetConnection for the specified DatasetRecord. The DatasetConnection is associated with the
     * Repository defined for the DatasetRecord in the catalog.
     *
     * @param record The Resource of the DatasetRecord for which to return a DatasetConnection.
     * @return A DatasetConnection for the specified DatasetRecord.
     * @throws IllegalArgumentException if the DatasetRecord could not be found in the catalog.
     */
    DatasetConnection getConnection(Resource record);
    
}
