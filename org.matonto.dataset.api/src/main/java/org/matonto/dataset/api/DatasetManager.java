package org.matonto.dataset.api;

/*-
 * #%L
 * org.matonto.dataset.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import org.matonto.dataset.api.builder.DatasetRecordConfig;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.rdf.api.Resource;

import java.util.Set;

/**
 * As service for managing local datasets within the MatOnto platform.
 */
public interface DatasetManager {

    /**
     * Retrieve the record IDs for available dataset records in the local catalog.
     *
     * @return The Set of Resources for all the dataset records in the local catalog.
     */
    Set<Resource> listDatasets();

    /**
     * Retrieves the DatasetRecord for a dataset in the local catalog.
     *
     * @param dataset The Resource described by the DatasetRecord in the local catalog.
     * @return The DatasetRecord from the local catalog. DatasetRecord includes empty Dataset object.
     */
    DatasetRecord getDatasetRecord(Resource dataset);

    /**
     * Creates a dataset according to the specified configuration. Initial dataset structure is created in the specified
     * repository and the DatasetRecord is added to the local catalog.
     *
     * @param config The DatasetRecordConfig describing the details of the dataset to create.
     * @return The DatasetRecord that has been created in the local catalog. DatasetRecord includes empty Dataset
     * object.
     */
    DatasetRecord createDataset(DatasetRecordConfig config);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource. Note: This method
     * removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     */
    void deleteDataset(Resource dataset);

    /**
     * Deletes the DatasetRecord, Dataset, and data graphs associated with the Dataset Resource. Note: This method
     * removes all graphs from the specified dataset if and only if they are not associated with other datasets.
     *
     * @param dataset The Dataset Resource to be removed along with associated DatasetRecord and data.
     */
    void safeDeleteDataset(Resource dataset);

    /**
     * Removes all data associated with the Dataset Resource. DatasetRecord and Dataset are not removed. Note:
     * This method removes all graphs from the specified dataset even if they are associated with other datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     */
    void clearDataset(Resource dataset);

    /**
     * Removes all data associated with the Dataset Resource. DatasetRecord and Dataset are not removed. Note:
     * This method removes all graphs from the specified dataset if and only if they are not associated with other
     * datasets.
     *
     * @param dataset The Dataset Resource to be cleared.
     */
    void safeClearDataset(Resource dataset);
}
