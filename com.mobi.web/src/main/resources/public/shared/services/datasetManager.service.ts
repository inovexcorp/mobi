/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { has, get, forEach, find, map, remove, includes } from 'lodash';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { DATASET, DCTERMS } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { Dataset } from '../models/dataset.interface';
import { DatasetRecordConfig } from '../models/datasetRecordConfig.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { CatalogManagerService } from './catalogManager.service';
import { DiscoverStateService } from './discoverState.service';
import { UtilService } from './util.service';

/**
 * @class shared.DatasetManagerService
 *
 * A service that provides access to the Mobi Dataset REST endpoints.
 */
@Injectable()
export class DatasetManagerService {
    prefix = REST_PREFIX + 'datasets';

    constructor(private http: HttpClient, private cm: CatalogManagerService, private spinnerSvc: ProgressSpinnerService,
        private util: UtilService, private ds: DiscoverStateService) {}

    /**
     * 'datasetRecords' holds an array of dataset record arrays which contain properties for the metadata
     * associated with that record.
     * @type {JSONLDObject[][]}
     */
    datasetRecords: JSONLDObject[][] = [];

    /**
     * Calls the GET /mobirest/datasets endpoint to collect a list of the DatasetRecords in Mobi.
     * Can optionally be paged and sorted through the properties in the passed `paginatedConfig` object.
     * Returns a response with the list of DatasetRecords in the data and any extra pagination information
     * in the headers.
     *
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<HttpResponse<JSONLDObject[][]>>} An Observable that either resolves with the response of the
     * endpoint or is rejected with an error message
     */
    getDatasetRecords(paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<JSONLDObject[][]>> {
        const params = this.util.paginatedConfigToParams(paginatedConfig);
        if (get(paginatedConfig, 'searchText')) {
            params.searchText = paginatedConfig.searchText;
        }
        const request = this.http.get<JSONLDObject[][]>(this.prefix, {params: this.util.createHttpParams(params), observe: 'response'});
        return this._trackedRequest(request, isTracked)
            .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the GET /mobirest/datasets/{datasetRecordIRI} endpoint to get the DatasetRecord associated
     * with the provided ID.
     *
     * @return {Observable<JSONLDObject[]>} An Observable that either resolves with the response of the endpoint or is
     * rejected with an error message
     */
    getDatasetRecord(datasetRecordIRI: string): Observable<JSONLDObject[]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(this.prefix + '/' + encodeURIComponent(datasetRecordIRI)))
            .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls POST /mobirest/datasets endpoint with the passed metadata and creates a new DatasetRecord and
     * associated Dataset. Returns a Promise with the IRI of the new DatasetRecord if successful or rejects
     * with an error message.
     *
     * @param {DatasetRecordConfig} recordConfig A configuration object containing metadata for the new Record
     * @return {Observable<string>} An Observable that resolves to the IRI of the new DatasetRecord or is rejected with
     * an error message
     */
    createDatasetRecord(recordConfig: DatasetRecordConfig): Observable<string> {
        const fd = new FormData();
        fd.append('title', recordConfig.title);
        fd.append('repositoryId', recordConfig.repositoryId);
        if (has(recordConfig, 'datasetIRI')) {
            fd.append('datasetIRI', recordConfig.datasetIRI);
        }
        if (has(recordConfig, 'description')) {
            fd.append('description', recordConfig.description);
        }
        forEach(get(recordConfig, 'keywords', []), word => fd.append('keywords', word));
        forEach(get(recordConfig, 'ontologies', []), id => fd.append('ontologies', id));
        return this.spinnerSvc.track(this.http.post(this.prefix, fd, {responseType: 'text'}))
            .pipe(
                catchError(this.util.handleError),
                switchMap((datasetRecordId: string) => {
                    this.initialize().subscribe();
                    return of(datasetRecordId);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/datasets/{datasetRecordId} endpoint and removes the identified DatasetRecord
     * and its associated Dataset and named graphs from Mobi. By default, only removes named graphs that are not
     * used by other Datasets, but can be forced to delete them by passed in a boolean. Returns a Promise indicating
     * the success of the request.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord to delete
     * @param {boolean} [force=false] Whether or not the delete should be forced
     * @return {Observable<null>} An Observable that resolves if the delete was successful; rejects with an error
     * message otherwise
     */
    deleteDatasetRecord(datasetRecordIRI: string, force = false): Observable<null> {
        const params = { force };
        return this.spinnerSvc.track(this.http.delete(this.prefix + '/' + encodeURIComponent(datasetRecordIRI), {params: this.util.createHttpParams(params)}))
            .pipe(
                catchError(this.util.handleError),
                switchMap(() => {
                    this.ds.cleanUpOnDatasetDelete(datasetRecordIRI);
                    this._removeDataset(datasetRecordIRI);
                    return of(null);
                })
            );
    }
    /**
     * Calls the DELETE /mobirest/datasets/{datasetRecordId}/data endpoint and removes the named graphs of the
     * Dataset associated with the identified DatasetRecord from Mobi. By default, only removes named graphs that
     * are not used by other Datasets, but can be forced to delete them by passed in a boolean. Returns a Promise
     * indicating the success of the request.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset named graphs should be deleted
     * @param {boolean} [force=false] Whether or not the delete should be forced
     * @return {Observable<null>} An Observable that resolves if the delete was successful; rejects with an error message 
     * otherwise
     */
    clearDatasetRecord(datasetRecordIRI: string, force = false): Observable<null> {
        const params = { force };
        return this.spinnerSvc.track(this.http.delete(this.prefix + '/' + encodeURIComponent(datasetRecordIRI) + '/data', {params: this.util.createHttpParams(params)}))
            .pipe(
                catchError(this.util.handleError),
                switchMap(() => {
                    this.ds.cleanUpOnDatasetClear(datasetRecordIRI);
                    return of(null);
                })
            );
    }
    /**
     * Calls the updateRecord method of the CatalogManager to update the dataset record provided in the JSON-LD.
     * If successful: it then updates the appropriate dataset record in datasetRecords. Returns a Promise
     * indicating the success of the request.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset named graphs should be updated.
     * @param {string} catalogIRI The IRI of the catalog to which the DatasetRecord belongs.
     * @param {JSONLDObject[]} jsonld An array containing the JSON-LD DatasetRecord with it's associated Ontology 
     * information.
     * @return {Observable<null>} An Observable that resolves if the update was successful; rejects with an error message 
     * otherwise
     */
    updateDatasetRecord(datasetRecordIRI: string, catalogIRI: string, jsonld: JSONLDObject[]): Observable<null> {
        return this.spinnerSvc.track(this.cm.updateRecord(datasetRecordIRI, catalogIRI, jsonld))
            .pipe(
                switchMap(() => {
                    this._removeDataset(datasetRecordIRI);
                    this.datasetRecords.push(jsonld);
                    return of(null);
                })
            );
    }
    /**
     * Calls the POST /mobirest/datasets/{datasetRecordId}/data endpoint and uploads the data contained in the
     * provided file to the Dataset associated with the identified DatasetRecord from Mobi. Returns a Promise
     * indicating the success of the request.
     *
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord whose Dataset will receive the data
     * @param {File} file The RDF File object to upload
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable<null>} An Observable that resolves if the upload was successful; rejects with an error message 
     * otherwise
     */
    uploadData(datasetRecordIRI: string, file: File, isTracked = false): Observable<null> {
        const fd = new FormData();
        fd.append('file', file);
        const url = this.prefix + '/' + encodeURIComponent(datasetRecordIRI) + '/data';
        return this._trackedRequest(this.http.post(url, fd, {responseType: 'text'}), isTracked)
            .pipe(catchError(this.util.handleError));
    }
    /**
     * Populates the 'datasetRecords' with results from the 'getDatasetRecords' method. If that method results
     * in an error, an error toast will be displayed. Returns a promise.
     *
     * @return {Observable<null>} An Observable that indicates the function has completed.
     */
    initialize(): Observable<null> {
        const paginatedConfig: PaginatedConfig = {
            sortOption: {
                field: DCTERMS + 'title',
                label: 'Title (asc)',
                asc: true
            }
        };
        return this.getDatasetRecords(paginatedConfig)
            .pipe(switchMap((response: HttpResponse<JSONLDObject[][]>) => {
                this.datasetRecords = response.body;
                return of(null);
            })
        );
    }
    /**
     * Gets the list of ontology identifiers for the provided record in the provided JSON-LD array
     *
     * @param {JSONLDObject[]} arr A JSON-LD array (typically contains a DatasetRecord and OntologyIdentifiers)
     * @param {JSONLDObject} record A DatasetRecord JSON-LD object
     * @return {JSONLDObject[]} A JSON-LD array of OntologyIdentifier blank nodes
     */
    getOntologyIdentifiers(arr: JSONLDObject[], record?: JSONLDObject): JSONLDObject[] {
        const rec = record || this.getRecordFromArray(arr);
        return map(get(rec, `['${DATASET}ontology']`), obj => find(arr, {'@id': obj['@id']}));
    }
    /**
     * Retrieves the DatasetRecord from the provided JSON-LD array based on whether or not the object has
     * the correct type.
     *
     * @param {JSONLDObject[]} arr A JSON-LD array (typically a result from the REST endpoint)
     * @return {JSONLDObject} The JSON-LD object for a DatasetRecord; undefined otherwise
     */
    getRecordFromArray(arr: JSONLDObject[]): JSONLDObject {
        return find(arr, obj => includes(obj['@type'], DATASET + 'DatasetRecord'));
    }
    /**
     * Splits the JSON-LD array into an object with a key for the DatasetRecord and a key for the
     * OntologyIdentifiers. 
     *
     * @param {JSONLDObject[]} arr A JSON-LD array (typically a result from the REST endpoint)
     * @return {Dataset} An object with key `record` for the DatasetRecord and key `identifiers` for the
     * OntologyIdentifiers
     */
    splitDatasetArray(arr: JSONLDObject[]): Dataset {
        const record = this.getRecordFromArray(arr);
        return {
            record,
            identifiers: this.getOntologyIdentifiers(arr, record)
        };
    }

    private _removeDataset(datasetRecordIRI: string) {
        remove(this.datasetRecords, (array: JSONLDObject[]) => !!find(array, {'@id': datasetRecordIRI}));
    }
    private _trackedRequest(request, tracked: boolean) {
        if (tracked) {
            return request;
        } else {
            return this.spinnerSvc.track(request);
        }
    }
}
