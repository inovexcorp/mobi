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

import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.rdf.api.IRI;

import java.util.List;

/**
 * As service for managing local datasets within the MatOnto platform.
 */
public interface DatasetManager {

    // TODO: Do all of these methods require a repository to operate against?
    // It would make sense for datasets exist in any number of Repositories
    // Without a record of where the dataset is stored, it will be inefficient, if not impossible to retrieve the data
    // The repository ID of the dataset should probably be part of its identifying information (along with IRI). In the DatasetRecord?
    // Probably best not to put it in the catalog because this will never be shared with other catalogs.

    // TODO: Do all of these methods require the user making the request?
    // This would probably require changes to the underlying repository API
    // Can we even do anything with user information yet?
    // We are not implementing security with this development effort (yet)

    // TODO: Should we operate with IRIs or DatasetRecords?
    // If you have a DatasetRecord, it is trivial to retrieve the record and dataset IRIs
    // If you have a record or dataset IRI, it is not necessarily trivial or efficient to create a DatasetRecord

    // TODO: return DatasetRecords?
    List<DatasetRecord> listDatasets();

    // TODO: return DatasetRecord?
    DatasetRecord getDataset(IRI datasetIRI);

    // TODO: return DatasetRecord?
    DatasetRecord createDataset(IRI datasetIRI);

    // TODO: take recordIRI or datasetIRI?
    void deleteDataset(IRI recordIRI);

    // TODO: take recordIRI or datasetIRI?
    void clearDataset(IRI datasetIRI);
}
