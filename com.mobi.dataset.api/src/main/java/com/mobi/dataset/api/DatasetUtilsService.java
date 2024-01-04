package com.mobi.dataset.api;

/*-
 * #%L
 * com.mobi.dataset.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import org.eclipse.rdf4j.model.Resource;

import java.util.function.Predicate;

/**
 * A Service to work with Datasets and their associated graphs within Repositories.
 */
public interface DatasetUtilsService {

    /**
     * Creates a dataset according to the specified configuration. Initial dataset structure is created in the specified
     * repository. No DatasetRecord is created.
     *
     * @param dataset The String representation of the Dataset IRI.
     * @param repositoryId The ID of the repository to store the dataset.
     * @return A boolean indicating the success of the dataset creation.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     * @throws IllegalStateException if the target dataset already exists in the target repository.
     */
    boolean createDataset(Resource dataset, String repositoryId);

    /**
     * Creates a dataset according to the specified configuration and executes the provided steps before actually
     * adding the dataset to the repository. Initial dataset structure is created in the specified repository. No
     * DatasetRecord is created.
     *
     * @param dataset The String representation of the Dataset IRI.
     * @param repositoryId The ID of the repository to store the dataset.
     * @param steps A Predicate to execute with the generated Dataset IRI prior to adding the Dataset to the repository
     * @return A boolean indicating the success of the dataset creation.
     * @throws IllegalArgumentException if the target dataset repository does not exist or the target dataset already
     *      exists in the target repository.
     */
    boolean createDataset(Resource dataset, String repositoryId, Predicate<Resource> steps);

    /**
     * Deletes the Dataset and data graphs associated with the Dataset Resource. Does not delete any associated
     * DatasetRecord. Note: This method removes all graphs from the specified dataset even if they are associated with
     * other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     */
    void deleteDataset(Resource dataset, String repositoryId);

    /**
     * Deletes the Dataset and data graphs associated with the Dataset Resource. Does not delete any associated
     * DatasetRecord. Note: This method removes all graphs from the specified dataset if and only if they are not
     * associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     */
    void safeDeleteDataset(Resource dataset, String repositoryId);

    /**
     * Removes all data associated with the Dataset Resource. Dataset is not removed. Note: This method removes all
     * graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     */
    void clearDataset(Resource dataset, String repositoryId);

    /**
     * Removes all data associated with the Dataset Resource. Dataset is not removed. Note: This method removes all
     * graphs from the specified dataset if and only if they are not associated with other datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     */
    void safeClearDataset(Resource dataset, String repositoryId);

    /**
     * Returns a DatasetConnection for the specified Dataset in the specified repository.
     *
     * @param dataset The Resource of the Dataset for which to return a DatasetConnection.
     * @param repositoryId The ID of the Repository where the Dataset is stored.
     * @return A DatasetConnection for the specified Dataset.
     * @throws IllegalArgumentException if the target dataset repository does not exist.
     */
    DatasetConnection getConnection(Resource dataset, String repositoryId);
}
