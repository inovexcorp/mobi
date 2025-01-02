/*-
 * #%L
 * com.mobi.web
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
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { difference, find, forEach, get, has, without } from 'lodash';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { forkJoin, Observable, of, Subject, throwError } from 'rxjs';

import { CATALOG, DCTERMS, POLICY } from '../../prefixes';
import { Commit } from '../models/commit.interface';
import { CommitDifference } from '../models/commitDifference.interface';
import {
    condenseCommitId,
    createHttpParams,
    getBeautifulIRI,
    getDctermsValue,
    getSubstringMatch,
    handleError,
    handleErrorObject,
    paginatedConfigToHttpParams
} from '../utility';
import { Conflict } from '../models/conflict.interface';
import { Difference } from '../models/difference.class';
import { DistributionConfig } from '../models/distributionConfig.interface';
import { EntityRecord, MatchingAnnotations } from '../../entity-search/models/entity-record';
import { EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { FilterItem } from '../models/filterItem.interface';
import { FilterType, ListFilter } from '../models/list-filter.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { KeywordCount } from '../models/keywordCount.interface';
import { NewConfig } from '../models/newConfig.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { PaginatedResponse } from '../models/paginated-response.interface';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { RecordConfig } from '../models/recordConfig.interface';
import { SortOption } from '../models/sortOption.interface';
import { Statistic } from '../models/statistic.interface';
import { TagConfig } from '../models/tagConfig.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';

/**
 * @class shared.CatalogManagerService
 *
 * A service that provides access to the Mobi catalog and commits REST endpoints and utility functions for the record,
 * distribution, version, branch, and difference objects that are returned.
 */
@Injectable()
export class CatalogManagerService {
    prefix = `${REST_PREFIX}catalogs`;
    commitsPrefix = `${REST_PREFIX}commits`;

    constructor(
        private http: HttpClient, 
        private spinnerSrv: ProgressSpinnerService,
        private pep: PolicyEnforcementService
    ) {}

    // Only the service has access to the subject
    private _catalogManagerActionSubject = new Subject<EventWithPayload>();
    public catalogManagerAction$ = this._catalogManagerActionSubject.asObservable();
    // emits an “event” on branch removal with the IRI of the record and the branch IRI at minimum

    /**
     * `coreRecordTypes` contains a list of IRI strings of all the core types of Records defined by Mobi.
     * @type {string[]}
     */
    coreRecordTypes = [
        `${CATALOG}Record`,
        `${CATALOG}UnversionedRecord`,
        `${CATALOG}VersionedRecord`,
        `${CATALOG}VersionedRDFRecord`
    ];
    /**
     * `sortOptions` contains a list of objects representing all sort options for both Catalogs. This list is populated
     * by the `initialize` method.
     * @type {SortOption[]}
     */
    sortOptions: SortOption[] = [];
    /**
     * `recordTypes` contains an object of IRI strings of all types of records contained in both Catalogs to arrays of
     * the IRIs of their superclasses. This object is populated by the `initialize` method.
     * @type {{[key: string]: string[]}}
     */
    recordTypes: {[key: string]: string[]} = {};
    /**
     * `localCatalog` contains the JSON-LD object for the local Catalog in Mobi. It is populated by
     * the `initialize` method.
     * @type {JSONLDObject}
     */
    localCatalog: JSONLDObject = undefined;
    /**
     * `distributedCatalog` contains the JSON-LD object for the distributed Catalog in Mobi. It is
     * populated by the `initialize` method.
     * @type {JSONLDObject}
     */
    distributedCatalog: JSONLDObject = undefined;

    /**
     * `differencePageSize` tracks the number of differences to show per page
     * @type {number}
     */
    differencePageSize = 100;

    /**
     * Initializes the `sortOptions`, `recordTypes`, `localCatalog`, and `distributedCatalog` of the
     * catalogManagerService using the `getSortOptions` and `getRecordTypes` methods along with the
     * GET /mobirest/catalogs endpoint. If the local or distributed Catalog cannot be found, rejects
     * with an error message.
     *
     * @returns {Observable<null>} An Observable that resolves if initialization was successful or is rejected with an
     * error message
     */
    initialize(): Observable<null> {
        return forkJoin([this.getRecordTypes(), this.getSortOptions(), this.http.get<JSONLDObject[]>(this.prefix)])
            .pipe(
                catchError(() => throwError('Error in catalogManager initialization')),
                mergeMap(responses => {
                    this.localCatalog = find(responses[2], {[`${DCTERMS}title`]: [{'@value': 'Mobi Catalog (Local)'}]});
                    this.distributedCatalog = find(responses[2], {[`${DCTERMS}title`]: [{'@value': 'Mobi Catalog (Distributed)'}]});
                    if (!this.localCatalog) {
                        return throwError('Could not find local catalog');
                    }
                    if (!this.distributedCatalog) {
                        return throwError('Could not find distributed catalog');
                    }
                    this.recordTypes = responses[0];
                    forEach(responses[1], option => {
                        const label = getBeautifulIRI(option);
                        if (!find(this.sortOptions, {field: option})) {
                            this.sortOptions.push({
                                field: option,
                                asc: true,
                                label: `${label} (asc)`
                            }, {
                                field: option,
                                asc: false,
                                label: `${label} (desc)`
                            });
                        }
                    });
                    return of(null);
                })
            );
    }

    /**
     * Calls the GET /mobirest/catalogs/record-types endpoint and returns the array of record type IRIs.
     *
     * @returns {Observable<string[]>} An Observable that resolves to an array of the IRIs for all record types in the
     * catalog
     */
    getRecordTypes(): Observable<{[key: string]: string[]}> {
    // getRecordTypes(): Observable<string[]> {
        return this.spinnerSrv.track(this.http.get<{[key: string]: string[]}>(`${this.prefix}/record-types`))
        // return this.spinnerSrv.track(this.http.get<string[]>(`${this.prefix}/record-types`))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/sort-options endpoint and returns the array of record property IRIs.
     *
     * @returns {Observable<string[]>} An Observable that resolves to an array of the IRIs for all supported record
     * properties to sort by
     */
    getSortOptions(): Observable<string[]> {
        return this.spinnerSrv.track(this.http.get<string[]>(`${this.prefix}/sort-options`))
            .pipe(catchError(handleError));
    }

    /**
     * Calls whichever endpoint is in the passed URL and returns the paginated response for that
     * endpoint.
     *
     * @param {string} url A URL for a paginated call. Typically, this URL will be one of the URLs
     * in the "link" header of a paginated response.
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that either resolves with a paginated response
     * or is rejected with a error message
     */
    getResultsPage(url: string): Observable<HttpResponse<JSONLDObject[]>> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(url, {observe: 'response'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/keywords endpoint and returns the paginated response for the query
     * using the passed page index and limit. The data of the response will be the array of Keywords with counts, the
     * "x-total-count" headers will contain the total number of Records matching the query, and the "link" header will
     * contain the URLs for the next and previous page if present.
     *
     * @param {string} catalogId The id of the Catalog to retrieve Records from
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests. Handles `searchText` on
     * top of the default supported params
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable<HttpResponse<KeywordCount[]>>} An Observable that either resolves with the full HttpResponse
     * of an array of {@link KeywordCount} objects or is rejected with a error message
     */
    getKeywords(catalogId: string, paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<KeywordCount[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);

        if (get(paginatedConfig, 'searchText')) {
            params = params.set('searchText', paginatedConfig.searchText);
        }

        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/keywords`;
        const request =  this.http.get<KeywordCount[]>(url, {params, observe: 'response'});  
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records endpoint and returns the paginated response for the query
     * using the passed page index, limit, sort option from the `sortOptions` array, and Record type filter IRI from the
     * `recordTypes` array. The data of the response will be the array of Records, the "x-total-count" headers will
     * contain the total number of Records matching the query, and the "link" header will contain the URLs for the next
     * and previous page if present.
     *
     * @param {string} catalogId The id of the Catalog to retrieve Records from
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests. Handles `searchText`,
     * `type`, and `keywords` on top of the default supported params
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that either resolves with the full HttpResponse
     * of an array of the Record {@link JSONLDObject}s or is rejected with a error message
     */
    getRecords(catalogId: string, paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        params = this._setDefaultSort(params);
        if (get(paginatedConfig, 'searchText')) {
            params = params.set('searchText', paginatedConfig.searchText);
        }
        if (get(paginatedConfig, 'type', undefined)) {
            paginatedConfig.type.forEach(type => {
                params = params.append('type', type);
            });
        }
        if (get(paginatedConfig, 'keywords')) {
            paginatedConfig.keywords.forEach(keyword => {
                params = params.append('keywords', keyword);
            });
        }
        if (get(paginatedConfig, 'creators')) {
            paginatedConfig.creators.forEach(creator => {
                params = params.append('creators', creator);
            });
        }
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records`;
        const request =  this.http.get<JSONLDObject[]>(url, {params, observe: 'response'})
            .pipe(catchError(handleError));
        return this.spinnerSrv.trackedRequest(request, isTracked);
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed
     * Catalog and Record ids and returns the matching Record object if it exists.
     *
     * @param {string} recordId The id of the Record to retrieve
     * @param {string} catalogId The id of the Catalog with the specified Record
     * @returns {Observable<JSONLDObject[]>} An Observable that resolves to the array of {@link JSONLDObject}s for the
     * Record if it exists or is rejected with an error message
     */
    getRecord(recordId: string, catalogId: string): Observable<JSONLDObject[]> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}`))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed
     * Catalog and Record ids and returns the matching Record Statistics if it exists.
     *
     * @param {string} recordId The id of the Record to retrieve
     * @param {string} catalogId The id of the Catalog with the specified Record
     * @returns {Observable<Statistic[]>} An Observable that resolves to the array of {@link Statistic}s for the
     * Record if it exists or is rejected with an error message
     */
    getRecordStatistics(recordId: string, catalogId: string): Observable<Statistic[]> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/statistics`;
        return this.spinnerSrv.track(this.http.get<Statistic[]>(url))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records endpoint with the passed Catalog id and metadata and
     * creates a new Record for the identified Catalog. Returns an Observable with the IRI of the new Record if
     * successful or rejects with an error message.
     *
     * @param {string} catalogId The id of the Catalog to create the Record in
     * @param {RecordConfig} recordConfig A configuration object containing metadata for the new Record
     * @returns {Observable<string>} An Observable that resolves to the IRI of the new Record or is rejected with an
     * error message
     */
    createRecord(catalogId: string, recordConfig: RecordConfig): Observable<string> {
        const fd = new FormData();
        fd.append('type', recordConfig.type);
        fd.append('title', recordConfig.title);
        if (has(recordConfig, 'description')) {
            fd.append('description', recordConfig.description);
        }
        forEach(get(recordConfig, 'keywords', []), word => fd.append('keywords', word));
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records`, fd, {responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed Catalog and Record ids
     * and updates the identified Record with the passed Record JSON-LD object.
     *
     * @param {string} recordId The id of the Record to update
     * @param {string} catalogId The id of the Catalog with the specified Record
     * @param {JSONLDObject} newRecord The array of JSON-LD objects for the new Record
     * @returns {Observable<JSONLDObject[]>} An Observable that resolves with the Record IRI if the update was successful 
     * or rejects with an error message
     */
    updateRecord(recordId: string, catalogId: string, newRecord: JSONLDObject[]): Observable<JSONLDObject[]> {
        return this.spinnerSrv.track(this.http.put<JSONLDObject[]>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}`, newRecord))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId} endpoint with the passed Catalog and Record
     * ids and removes the identified Record and all associated entities from Mobi.
     *
     * @param {string} recordId The id of the Record to delete
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<null>} An Observable that resolves if the deletion was successful or rejects with an error
     * message
     */
    deleteRecord(recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}`))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/distributions endpoint and returns the paginated
     * response using the passed page index, limit, and sort option from the `sortOption` array. The data of the
     * response will be the array of Distributions, the "x-total-count" headers will contain the total number of
     * Distributions matching the query, and the "link" header will contain the URLs for the next and previous page if
     * present.
     *
     * @param {string} recordId The id of the Record to retrieve the Distributions of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with the full HttpResponse of
     * Distribution {@link JSONLDObject}s or is rejected with a error message
     */
    getRecordDistributions(recordId: string, catalogId: string, paginatedConfig: PaginatedConfig): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        params = this._setDefaultSort(params);
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/distributions`;
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(url, {params, observe: 'response'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId} endpoint and
     * returns the matching Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to retrieve
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<JSONLDObject>} An Observable that resolves to the Distribution if it is found or is rejected
     * with an error message
     */
    getRecordDistribution(distributionId: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/distributions/${encodeURIComponent(distributionId)}`))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/distributions endpoint with the passed Catalog
     * and Record id and metadata and creates a new Distribution for the identified Record. Returns an Observable with
     * the IRI of the new Distribution if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Distribution for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {DistributionConfig} distributionConfig A configuration object containing metadata for the new Distribution
     * @returns {Observable<string>} An Observable the resolves to the IRI of the new Distribution or is rejected with
     * an error message
     */
    createRecordDistribution(recordId: string, catalogId: string, distributionConfig: DistributionConfig): Observable<string> {
        const fd = new FormData();
        fd.append('title', distributionConfig.title);
        if (distributionConfig.description) {
            fd.append('description', distributionConfig.description);
        }
        if (distributionConfig.format) {
            fd.append('format', distributionConfig.format);
        }
        if (distributionConfig.accessURL) {
            fd.append('accessURL', distributionConfig.accessURL);
        }
        if (distributionConfig.downloadURL) {
            fd.append('downloadURL', distributionConfig.downloadURL);
        }
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/distributions`, fd, {responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId} endpoint with
     * the passed Catalog, Record, and Distribution ids and updates the identified Distribution with the passed
     * Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to update
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {JSONLDObject} newDistribution The JSON-LD object of the new Distribution
     * @returns {Observable<string>} An Observable that resolves if the update was successful or rejects with an error
     * message
     */
    updateRecordDistribution(distributionId: string, recordId: string, catalogId: string, newDistribution: JSONLDObject): Observable<string> {
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/distributions/${encodeURIComponent(distributionId)}`, newDistribution))
            .pipe(
                catchError(handleError),
                map(() => distributionId)
            );
    }

    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/distributions/{distributionId} endpoint
     * with the passed Catalog, Record, and Distribution ids and removes the identified Distribution and all associated
     * entities from Mobi.
     *
     * @param {string} distributionId The id of the Distribution to delete
     * @param {string} recordId The id of the Record with the specified Distribution
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<null>} An Observable that resolves if the deletion was successful or rejects with an error message
     */
    deleteRecordDistribution(distributionId: string, recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/distributions/${encodeURIComponent(distributionId)}`))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint and
     * returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Versions, the
     * "x-total-count" headers will contain the total number of Versions matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} recordId The id of the Record to retrieve the Versions of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with the full HttpResponse of or
     * is rejected with a error message
     */
    getRecordVersions(recordId: string, catalogId: string, paginatedConfig?: PaginatedConfig, isTracked = false): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        params = this._setDefaultSort(params);
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions`;
        const request = this.http.get<JSONLDObject[]>(url, {params, observe: 'response'})
            .pipe(catchError(handleError));
        return this.spinnerSrv.trackedRequest(request, isTracked);
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/latest
     * endpoint and returns the matching Version JSON-LD object for the Record's latest Version.
     *
     * @param {string} recordId The id of the Record to retrieve the latest Version of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<JSONLDObject>} An Observable that resolves to the Version if it is found or is rejected with
     * an error message
     */
    getRecordLatestVersion(recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this._getRecordVersion('latest', recordId, catalogId);
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}
     * endpoint and returns the matching Version JSON-LD object.
     *
     * @param {string} versionId The id of the Version to retrieve
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<JSONLDObject>} An Observable that resolves to the Version if it is found or is rejected with
     * an error message
     */
    getRecordVersion(versionId: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this._getRecordVersion(encodeURIComponent(versionId), recordId, catalogId);
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint with the passed
     * Catalog and Record ids and metadata and creates a new Version for the identified Record. Returns a
     * Promise with the IRI of the new Version if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Version for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {NewConfig} versionConfig A configuration object containing metadata for the new Version
     * @returns {Observable<string>} An Observable the resolves to the IRI of the new Version or is rejected with an
     * error message
     */
    createRecordVersion(recordId: string, catalogId: string, versionConfig: NewConfig): Observable<string> {
        versionConfig.type = `${CATALOG}Version`;
        return this._createVersion(recordId, catalogId, versionConfig);
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions endpoint with the passed
     * Catalog and Record ids, and metadata and creates a new Tag for the identified Record. Returns an Observable
     * with the IRI of the new Tag if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Tag for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {TagConfig} tagConfig A configuration object containing metadata for the new Tag
     * @returns {Observable<string>} An Observable the resolves to the IRI of the new Tag or is rejected with an error
     * message
     */
    createRecordTag(recordId: string, catalogId: string, tagConfig: TagConfig): Observable<string> {
        const fd = new FormData();
        fd.append('iri', tagConfig.iri);
        fd.append('title', tagConfig.title);
        fd.append('commit', tagConfig.commitId);
        if (has(tagConfig, 'description')) {
            fd.append('description', tagConfig.description);
        }
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/tags`, fd, {responseType: 'text'}))
            .pipe(catchError(handleErrorObject));
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId} endpoint with
     * the passed Catalog, Record, and Version ids and updates the identified Version with the passed
     * Version JSON-LD object.
     *
     * @param {string} versionId The id of the Version to update
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {JSONLDObject} newVersion The JSON-LD object of the new Version
     * @returns {Observable<string>} An Observable that resolves if the update was successful or rejects with an error message
     */
    updateRecordVersion(versionId: string, recordId: string, catalogId: string, newVersion: JSONLDObject): Observable<string> {
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}`, newVersion))
            .pipe(
                catchError(handleError),
                map(() => versionId)
            );
    }

    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId} endpoint
     * with the passed Catalog, Record, and Version ids and removes the identified Version and all associated
     * entities from Mobi.
     *
     * @param {string} versionId The id of the Version to delete
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<null>} An Observable that resolves if the deletion was successful or rejects with an error message
     */
    deleteRecordVersion(versionId: string, recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}`))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/commit endpoint
     * with the passed Catalog, Record, and Version ids and retrieves the associated Commit for the identified
     * Version in the passed RDF format.
     *
     * @param {string} versionId The id of the Version to retrieve the Commit of
     * @param {string} recordId The id of the Record with the specified Version
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} [format='jsonld'] The RDF format to return the Commit additions and deletions in
     * @returns {Observable<CommitDifference>} An Observable that resolves to the Version's Commit if found or rejects with an error message
     */
    getVersionCommit(versionId: string, recordId: string, catalogId: string, format = 'jsonld'): Observable<CommitDifference> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/commit`;
        return this.spinnerSrv.track(this.http.get<CommitDifference>(url, {params: createHttpParams({ format })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions
     * endpoint and returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Distributions, the
     * "x-total-count" headers will contain the total number of Distributions matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} versionId The id of the Version to retrieve the Distributions of
     * @param {string} recordId The id of the Record to the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with the full HttpResponse of or
     * is rejected with a error message
     */
    getVersionDistributions(versionId: string, recordId: string, catalogId: string, paginatedConfig: PaginatedConfig): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        params = this._setDefaultSort(params);
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/distributions`;
        return this.spinnerSrv.track(this.http.get<JSONLDObject[]>(url, {params, observe: 'response'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint and returns the matching Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to retrieve
     * @param {string} recordId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<JSONLDObject>} An Observable that resolves to the Distribution if it is found or is rejected
     * with an error message
     */
    getVersionDistribution(distributionId: string, versionId: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/distributions/${encodeURIComponent(distributionId)}`))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions
     * endpoint with the passed Catalog, Record, and Version ids and metadata and creates a new Distribution
     * for the identified Version. Returns an Observable with the IRI of the new Distribution if successful or
     * rejects with an error message.
     *
     * @param {string} version The id of the Version to create the Distribution for
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {DistributionConfig} distributionConfig A configuration object containing metadata for the new Distribution
     * @returns {Observable<string>} An Observable the resolves to the IRI of the new Distribution or is rejected with
     * an error message
     */
    createVersionDistribution(versionId: string, recordId: string, catalogId: string, distributionConfig: DistributionConfig): Observable<string> {
        const fd = new FormData();
        fd.append('title', distributionConfig.title);
        if (has(distributionConfig, 'description')) {
            fd.append('description', distributionConfig.description);
        }
        if (has(distributionConfig, 'format')) {
            fd.append('format', distributionConfig.format);
        }
        if (has(distributionConfig, 'accessURL')) {
            fd.append('accessURL', distributionConfig.accessURL);
        }
        if (has(distributionConfig, 'downloadURL')) {
            fd.append('downloadURL', distributionConfig.downloadURL);
        }
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/distributions`, fd, {responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint with the passed Catalog, Record, Version, and Distribution ids and updates the identified Distribution with
     * the passed Distribution JSON-LD object.
     *
     * @param {string} distributionId The id of the Distribution to update
     * @param {string} versionId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {JSONLDObject} newDistribution The JSON-LD object of the new Distribution
     * @returns {Observable<string>} An Observable that resolves if the update was successful or rejects with an error message
     */
    updateVersionDistribution(distributionId: string, versionId: string, recordId: string, catalogId: string, newDistribution: JSONLDObject): Observable<string> {
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/distributions/${encodeURIComponent(distributionId)}`, newDistribution))
            .pipe(
                catchError(handleError),
                map(() => distributionId)
            );
    }

    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/versions/{versionId}/distributions/{distributionId}
     * endpoint with the passed Catalog, Record, Version, and Distribution ids and removes the identified Distribution and all
     * associated entities from Mobi.
     *
     * @param {string} distributionId The id of the Distribution to delete
     * @param {string} versionId The id of the Version with the specified Distribution
     * @param {string} recordId The id of the Record the Version should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable<null>} An Observable that resolves if the deletion was successful or rejects with an error
     * message
     */
    deleteVersionDistribution(distributionId: string, versionId: string, recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${encodeURIComponent(versionId)}/distributions/${encodeURIComponent(distributionId)}`))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint and
     * returns the paginated response using the passed page index, limit, and sort option from the
     * `sortOption` array. The data of the response will be the array of Branches, the
     * "x-total-count" headers will contain the total number of Branches matching the query, and
     * the "link" header will contain the URLs for the next and previous page if present.
     *
     * @param {string} recordId The id of the Record to retrieve the Branches of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests
     * @param {boolean} applyUserFilter Whether or not the list should be filtered based on the currently logged in User
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with the full HttpResponse of or
     * is rejected with a error message
     */
    getRecordBranches(recordId: string, catalogId: string, paginatedConfig?: PaginatedConfig, applyUserFilter = false, isTracked = false): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        params = this._setDefaultSort(params);
        params = params.set('applyUserFilter', applyUserFilter);
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches`;
        const request = this.http.get<JSONLDObject[]>(url, {params, observe: 'response'})
            .pipe(catchError(handleError));
        return this.spinnerSrv.trackedRequest(request, isTracked);
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/master endpoint and
     * returns the matching Branch JSON-LD object for the Record's master Branch.
     *
     * @param {string} recordId The id of the Record to retrieve the master Branch of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves to the Branch if it is found or is rejected
     * with an error message
     */
    getRecordMasterBranch(recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this._getRecordBranch('master', recordId, catalogId);
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}
     * endpoint and returns the matching Branch JSON-LD object.
     *
     * @param {string} branchId The id of the Branch to retrieve
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves to the Branch if it is found or is rejected
     * with an error message
     */
    getRecordBranch(branchId: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this._getRecordBranch(encodeURIComponent(branchId), recordId, catalogId);
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint with the passed
     * Catalog and Record ids, metadata, and associated Commit id and creates a new Branch for the identified
     * Record. Returns an Observable with the IRI of the new Branch if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the Branch for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {NewConfig} branchConfig A configuration object containing metadata for the new Branch
     * @param {string} commitId The id of the Commit to associate with the new Branch
     * @returns {Observable} An Observable the resolves to the IRI of the new Branch or is rejected with an error
     * message
     */
    createRecordBranch(recordId: string, catalogId: string, branchConfig: NewConfig, commitId: string): Observable<string> {
        branchConfig.type = `${CATALOG}Branch`;
        return this._createBranch(recordId, catalogId, branchConfig, commitId);
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches endpoint with the passed
     * Catalog and Record ids, metadata, and associated Commit id and creates a new UserBranch for the identified
     * Record. Returns an Observable with the IRI of the new UserBranch if successful or rejects with an error message.
     *
     * @param {string} recordId The id of the Record to create the UserBranch for
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {NewConfig} branchConfig A configuration object containing metadata for the new Branch
     * @param {string} commitId The id of the Commit to associate with the new Branch
     * @param {string} parentBranchId The id of the parent Branch the UserBranch was created from
     * @returns {Observable} An Observable the resolves to the IRI of the new UserBranch or is rejected with an error
     * message
     */
    createRecordUserBranch(recordId: string, catalogId: string, branchConfig: NewConfig, commitId: string, parentBranchId: string): Observable<string> {
        branchConfig.type = `${CATALOG}UserBranch`;
        return this._createBranch(recordId, catalogId, branchConfig, commitId)
            .pipe(
                switchMap((iri: string) => {
                    return this._getRecordBranch(encodeURIComponent(iri), recordId, catalogId);
                }),
                switchMap((branch: JSONLDObject) => {
                    branch[`${CATALOG}head`] = [{'@id': commitId}];
                    branch[`${CATALOG}createdFrom`] = [{'@id': parentBranchId}];
                    return this.updateRecordBranch(branch['@id'], recordId, catalogId, branch);
                })
            );
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId} endpoint with
     * the passed Catalog, Record, and Branch ids and updates the identified Branch with the passed
     * Branch JSON-LD object.
     *
     * @param {string} branchId The id of the Branch to update
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {JSONLDObject} newBranch The JSON-LD object of the new Branch
     * @returns {Observable} An Observable that resolves with the IRI of the Branch if the update was successful or
     * rejects with an error message
     */
    updateRecordBranch(branchId: string, recordId: string, catalogId: string, newBranch: JSONLDObject): Observable<string> {
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}`, newBranch))
            .pipe(
                catchError(handleError),
                map(() => branchId)
            );
    }
    
    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId} endpoint
     * with the passed Catalog, Record, and Branch ids and removes the identified Branch and all associated
     * entities from Mobi.
     *
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} branchId The id of the Branch to delete
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves if the deletion was successful or rejects with an error message
     */
    deleteRecordBranch(recordId: string, branchId: string, catalogId: string): Observable<void> {
        const request = this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}`);
        return this.spinnerSrv.track(request)
            .pipe(
                catchError(handleError), 
                map(() => {}),
                tap(() => {
                    this._recordBranchDeleted(recordId, branchId, catalogId);
                })
            );
    }
    /**
     * Emits an event on branch removal (IRI of the record and the branch IRI)
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} branchId The id of the Branch to delete
     * @param {string} catalogId The id of the Catalog the Record should be part of
     */
     _recordBranchDeleted(recordId: string, branchId: string, catalogId: string): void {
        this._catalogManagerActionSubject.next({
            eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL, 
            payload: {
                recordId, 
                branchId,
                catalogId
            }
        });
    }
    /**
     * Calls the GET /mobirest/commits/{commitId} endpoint with the passed Commit id.
     *
     * @param {string} commitId The id of the Commit to retrieve
     * @param {string} [format='jsonld'] format The RDF format to return the Commit additions and deletions in
     * @returns {Observable} An Observable that resolves with the Commit or rejects with an error message
     */
    getCommit(commitId: string, format = 'jsonld'): Observable<JSONLDObject> {
        const url = `${this.commitsPrefix}/${encodeURIComponent(commitId)}`;
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(url, {params: createHttpParams({ format })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/commits/{commitId}/history endpoint with the passed Commit id.
     * 
     * @param {string} commitId - The commit id of the commit which should be the most recent commit in the 
     *      history.
     * @param {string} targetId - The commit id of the commit which should be the oldest commit in 
     *      the history.
     * @param {string} entityId - The commit id of the commit which should be contained in the history's
     *      commit list.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable} An Observable that resolves with the list of Commits or rejects with an error message
     */
    getCommitHistory(commitId: string, targetId?: string, entityId?: string, isTracked = false): Observable<Commit[]> {
        const params = { targetId, entityId };
        const url = `${this.commitsPrefix}/${encodeURIComponent(commitId)}/history`;
        const request = this.http.get<Commit[]>(url, {params: createHttpParams(params)});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(
          catchError(handleError),
          map((commits: Commit[]) => commits.map(commit => {
            commit.dateObj = new Date(commit.date);
            commit.condensedId = condenseCommitId(commit.id);
            return commit;
          }))
        );
    }

    /**
     * Calls the GET /mobirest/commits/{commitId}/resource endpoint with the passed Commit id.
     *
     * @param {string} commitId - The commit id of the commit which should be the most recent commit in
     *      the history.
     * @param {string} entityId - The id of the entity which is used to filter the resource list.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable} An Observable that resolves with the Compiled Resource of a commit or rejects with an error
     *      message.
     */
    getCompiledResource(commitId: string, entityId: string, isTracked = false): Observable<JSONLDObject[]> {
        const url = `${this.commitsPrefix}/${encodeURIComponent(commitId)}/resource`;
        const request =  this.http.get<JSONLDObject[]>(url, {params: createHttpParams({ entityId })});
        return this.spinnerSrv.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/commits/{commitId}/difference endpoint with the passed Commit id and Optional Target id
     * and returns the Difference between the source and target Commit chains.
     * 
     * @param {string} commitId The commit id of the commit whose chain will be merged in to the target.
     * @param {string} [targetId=''] Optional commit id of the commit to receive the source commits.
     * @param {string} [format='jsonld'] format The RDF format to return the Difference in
     * @returns {Observable} An Observable that resolves with the Difference of the two resulting Commit chains or 
     *      rejects with an error message
     */
    getDifference(commitId: string, targetId?: string, limit?: number, offset?: number, format='jsonld'): Observable<CommitDifference | HttpResponse<CommitDifference>> {
        const params = { targetId, limit, offset, format };
        const url = `${this.commitsPrefix}/${encodeURIComponent(commitId)}/difference`;
        return this.spinnerSrv.track(this.http.get<CommitDifference>(url, {params: createHttpParams(params), observe: 'response'}))
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<CommitDifference>) => limit !== null && limit !== undefined ? response : response.body)
            );
    }

    /**
     * Calls the GET /mobirest/commits/{commitId}/difference/{subjectId} endpoint with the passed Commit id and Subject Id
     * and returns the Difference between the source and target Commit chains for the specified entity.
     * 
     * @param {string} subjectId Id of the entity to receive the source commits.
     * @param {string} commitId The commit id of the commit whose chain will be merged in to the target.
     * @param {string} [format='jsonld'] format The RDF format to return the Difference in
     * @returns {Observable} An Observable that resolves with the Difference of the two resulting Commit chains or 
     *      rejects with an error message
     */
    getDifferenceForSubject(subjectId: string, commitId: string, format='jsonld'): Observable<CommitDifference> {
        const url = `${this.commitsPrefix}/${encodeURIComponent(commitId)}/difference/${encodeURIComponent(subjectId)}`;
        return this.spinnerSrv.track(this.http.get<CommitDifference>(url, {params: createHttpParams({ format })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits endpoint
     * with the passed Catalog, Record, and Branch ids and retrieves the list of Commits in that Branch.
     *
     * @param {string} branchId The id of the Branch to retrieve the Commits of
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} targetId The optional id of the target Branch to retrieve commits that are between that and the
     *      branchId
     * @returns {Observable} An Observable that resolves with the list of Branch Commits or rejects with an error message
     */
    getBranchCommits(branchId: string, recordId: string, catalogId: string, targetId?: string): Observable<Commit[]> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits`;
        return this.spinnerSrv.track(this.http.get<Commit[]>(url, {params: createHttpParams({ targetId })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits endpoint
     * with the passed Catalog, Record, and Branch ids and string message and creates a Commit on the identified
     * Branch using the logged in User's InProgressCommit with the passed message.
     *
     * @param {string} branchId The id of the Branch to create the Commit for
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} message The message for the new Commit
     * @returns {Observable} An Observable that resolves to the IRI of the new Commit or rejects with an error message
     */
    createBranchCommit(branchId: string, recordId: string, catalogId: string, message: string): Observable<string> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits`;
        return this.spinnerSrv.track(this.http.post(url, null, {params: createHttpParams({ message }), responseType: 'text'}))
            .pipe(catchError(handleErrorObject));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/head endpoint
     * and returns the matching Commit JSON object of the Branch's head Commit in the passed RDF format.
     *
     * @param {string} branchId The id of the Branch to retrieve the head Commit of
     * @param {string} recordId The id of the Record with the specified Branch
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string='jsonld'} format The RDF format to return the Commit additions and deletions in
     * @returns {Observable} An Observable that resolves to the Commit if found or rejects with an error message
     */
    getBranchHeadCommit(branchId: string, recordId: string, catalogId: string, format = 'jsonld'): Observable<CommitDifference> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits/head`;
        return this.spinnerSrv.track(this.http.get<CommitDifference>(url, {params: createHttpParams({ format })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId} endpoint
     * and returns the matching Commit JSON object in the passed RDF format.
     *
     * @param {string} commitId The id of the Commit to retrieve
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string='jsonld'} format The RDF format to return the Commit additions and deletions in
     * @returns {Observable} An Observable that resolves to the Commit if found or rejects with an error message
     */
    getBranchCommit(commitId: string, branchId: string, recordId: string, catalogId: string, format = 'jsonld'): Observable<CommitDifference> {
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits/${encodeURIComponent(commitId)}`;
        return this.spinnerSrv.track(this.http.get<CommitDifference>(url, {params: createHttpParams({ format })}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/difference endpoint
     * and returns an object with the culmination of additions and deletions between the identified source
     * Branch and the target Branch identified by the passed id.
     *
     * @param {string} sourceId The id of the source Branch to retrieve differences from
     * @param {string} targetId The id of the target Branch to compare against the source Branch
     * @param {string} recordId The id of the Record with both specified Branches
     * @param {string} catalogId The id of the Catalog the Record should be a part of
     * @param {string} [format='jsonld'] The RDF format to return the difference additions and deletions in
     * @returns {Observable} An Observable the resolves to the object with key `additions` and key `deletions` or rejects
     * with an error message.
     */
    getBranchDifference(sourceId: string, targetId: string, recordId: string, catalogId: string, format = 'jsonld'): Observable<Difference> {
        const params = { format, targetId };
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(sourceId)}/difference`;
        return this.spinnerSrv.track(this.http.get<Difference>(url, {params: createHttpParams(params)}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts endpoint
     * and returns an array of conflicts between the identified source Branch and the target Branch identified by
     * the passed id.
     *
     * @param {string} sourceId The id of the source Branch to retrieve conflicts for
     * @param {string} targetId The id of the target Branch to retrieve conflicts for
     * @param {string} recordId The id of the Record with both specified Branches
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {string} [format='jsonld'] The RDF format to return the Conflict additions and deletions in
     * @returns {Observable} An Observable that resolves to the array of Conflict objects or rejects with an error message
     */
    getBranchConflicts(sourceId: string, targetId: string, recordId: string, catalogId: string, format = 'jsonld'): Observable<Conflict[]> {
        const params = { format, targetId };
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(sourceId)}/conflicts`;
        return this.spinnerSrv.track(this.http.get<Conflict[]>(url, {params: createHttpParams(params)})).pipe(
            catchError(handleError),
            tap(conflicts => {
                conflicts.forEach(conflict => {
                    conflict.display = getBeautifulIRI(conflict.iri);
                });
            })
        );
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/conflicts/resolution endpoint
     * and performs a merge between the two identified Branches, creating a Commit using the additions and deletions JSON-LD
     * provided in the passed difference object.
     *
     * @param {string} sourceId The id of the source Branch to merge
     * @param {string} targetId The id of the target Branch to merge
     * @param {string} recordId The id of the Record with both specified Records
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Difference} differenceObj An object representing a collection of added and deleted statements
     * @returns {Observable} An Observable that resolves with the id of the Commit resulting from the merge or rejects with an error
     * message
     */
    mergeBranches(sourceId: string, targetId: string, recordId: string, catalogId: string, differenceObj: Difference, conflicts: Conflict[]): Observable<string> {
        const fd = new FormData();
        fd.append('additions', JSON.stringify(differenceObj.additions));
        fd.append('deletions', JSON.stringify(differenceObj.deletions));
        fd.append('conflicts', JSON.stringify(conflicts));
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(sourceId)}/conflicts/resolution`;
        return this.spinnerSrv.track(this.http.post(url, fd, {params: createHttpParams({ targetId }), responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource
     * endpoint and returns the resource compiled starting at the identified Commit.
     *
     * @param {string} commitId The id of the Commit to retrieve the compiled resource from
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {boolean} applyInProgressCommit Whether or not the saved changes in the logged-in User's InProgressCommit
     * should be applied to the resource
     * @param {String} format The RDF format to return the compiled resource in
     * @returns {Observable} An Observable that resolves to the compiled resource or rejects with an error message.
     */
    getResource(commitId: string, branchId: string, recordId: string, catalogId: string, applyInProgressCommit?: boolean, format = 'jsonld'): Observable<string | JSONLDObject[]> {
      const params = {
        format,
        applyInProgressCommit: !!applyInProgressCommit
      };
      let headers = new HttpHeaders();
      headers = headers.append('Accept', format === 'jsonld' ? 'application/json' : 'text/plain');
      const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits/${encodeURIComponent(commitId)}/resource`;
      return this.spinnerSrv.track(this.http.get(url, {
        responseType: 'text',
        observe: 'response',
        headers,
        params: createHttpParams(params)
      })).pipe(
        catchError(handleError),
        map((response: HttpResponse<string>) => {
          const contentType = response.headers.get('Content-Type');
          if (contentType === 'application/json') {
              return (JSON.parse(response.body)) as JSONLDObject[];
          } else {
              return response.body;
          }
        })
      );
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/branches/{branchId}/commits/{commitId}/resource
     * endpoint using the `window.location` variable which will start a download of the compiled resource starting at the
     * identified Commit.
     *
     * @param {string} commitId The id of the Commit to retrieve the compiled resource from
     * @param {string} branchId The id of the Branch with the specified Commit
     * @param {string} recordId The id of the Record the Branch should be part of
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {boolean} applyInProgressCommit Whether or not the saved changes in the logged-in User's InProgressCommit
     * should be applied to the resource
     * @param {String} format The RDF format to return the compiled resource in
     */
    downloadResource(commitId: string, branchId: string, recordId: string, catalogId: string, applyInProgressCommit?: boolean, format = 'jsonld', fileName = 'resource'): void {
        const params = createHttpParams({
            applyInProgressCommit: !!applyInProgressCommit,
            format: format,
            fileName: fileName
        });
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${encodeURIComponent(branchId)}/commits/${encodeURIComponent(commitId)}/resource?${params.toString()}`;
        const readRequest: XACMLRequest = {
            resourceId: recordId,
            actionId: `${POLICY}Read`
        };
        this.pep.evaluateRequest(readRequest).pipe(
            map(currentPermissions => currentPermissions === this.pep.permit)
        ).subscribe((isPermit) => {
            if (isPermit) {
                window.open(url);
            }
        });
    }

    /**
     * Calls the POST /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and creates
     * a new InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to create an InProgressCommit for
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves if the creation was successful or rejects with an error message
     */
    createInProgressCommit(recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/in-progress-commit`, null))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the GET /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and
     * retrieves the InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to retrieve the InProgressCommit from
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves with the InProgessCommit or rejects with the HTTP response
     */
    getInProgressCommit(recordId: string, catalogId: string): Observable<Difference> {
        return this.spinnerSrv.track(this.http.get<{additions: JSONLDObject[], deletions: JSONLDObject[]}>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/in-progress-commit`))
          .pipe(map(response => {
              const diff = new Difference();
              diff.additions = response.additions;
              diff.deletions = response.deletions;
              return diff;
          }));
    }

    /**
     * Calls the PUT /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and
     * updates the InProgressCommit for the logged-in User for the identified Record using the additions and
     * deletions JSON-LD provided in the passed difference object.
     *
     * @param {string} recordId The id of the Record to update the InProgressCommit for
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @param {Difference} differenceObj An object representing a collection of added and deleted statements
     * @returns {Observable} An Observable that resolves if the update was successful or rejects with an error message
     */
    updateInProgressCommit(recordId: string, catalogId: string, differenceObj: Difference): Observable<void> {
        const fd = new FormData();
        fd.append('additions', JSON.stringify(differenceObj.additions));
        fd.append('deletions', JSON.stringify(differenceObj.deletions));
        return this.spinnerSrv.track(this.http.put(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/in-progress-commit`, fd, {responseType: 'text'}))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Calls the DELETE /mobirest/catalogs/{catalogId}/records/{recordId}/in-progress-commit endpoint and deletes
     * the InProgressCommit for the logged-in User for the identified Record.
     *
     * @param {string} recordId The id of the Record to delete the InProgressCommit from
     * @param {string} catalogId The id of the Catalog the Record should be part of
     * @returns {Observable} An Observable that resolves if the deletion was successful or rejects with an error message
     */
    deleteInProgressCommit(recordId: string, catalogId: string): Observable<void> {
        return this.spinnerSrv.track(this.http.delete(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/in-progress-commit`))
            .pipe(catchError(handleError), map(() => {}));
    }

    /**
     * Collects the name of the passed entity or returns an anonymous name if it could not be generated.
     *
     * @param {JSONLDObject} entity A JSON-LD object to create the name for
     * @returns {string} A name to represent the passed entity
     */
    getEntityName(entity: JSONLDObject): string {
        return getDctermsValue(entity, 'title') || '(Anonymous)';
    }

    /**
     * Tests whether the passed entity is a Record or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Record type; false otherwise
     */
    isRecord(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Record`);
    }

    /**
     * Tests whether the passed entity is a VersionedRDFRecord or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the VersionedRDFRecord type; false otherwise
     */
    isVersionedRDFRecord(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}VersionedRDFRecord`);
    }

    /**
     * Tests whether the passed entity is a Distribution or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Distribution type; false otherwise
     */
    isDistribution(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Distribution`);
    }

    /**
     * Tests whether the passed entity is a Branch or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Branch type; false otherwise
     */
    isBranch(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Branch`);
    }

    /**
     * Tests whether the passed entity is a user branch or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the UserBranch type; false otherwise
     */
    isUserBranch(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}UserBranch`);
    }

    /**
     * Tests whether the passed entity is a Version or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Version type; false otherwise
     */
    isVersion(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Version`);
    }

    /**
     * Tests whether the passed entity is a Tag or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Tag type; false otherwise
     */
    isTag(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Tag`);
    }

    /**
     * Tests whether the passed entity is a Commit or not.
     *
     * @param {JSONLDObject} entity A JSON-LD object
     * @returns {boolean} True if the entity contains the Commit type; false otherwise
     */
    isCommit(entity: JSONLDObject): boolean {
        return get(entity, '@type', []).includes(`${CATALOG}Commit`);
    }

    /**
     * Returns the specific type of the provided Record.
     * 
     * @param {JSONLDObject} record The JSON-LD of the Record to retrieve the type of
     * @returns {string} The IRI string of the specific Record type
     */
    getType(record: JSONLDObject): string {
        const type = difference(Object.keys(this.recordTypes), this.coreRecordTypes)
            .find(type => get(record, '@type', []).includes(type));
        return type || `${CATALOG}Record`;
    }

    /**
     * Returns a list of Record type IRIs that are subclasses of the provided type identified by its IRI.
     * 
     * @param {string} parentType The IRI of a Record type
     * @returns {string[]} An array of subclass Record types
     */
    getSubRecordTypes(parentType: string): string[] {
        return Object.keys(this.recordTypes)
            .filter(type => this.recordTypes[type].includes(parentType));
    }

    /**
     * Returns a ListFilter object for filtering record types.
     *
     * @param {Function} isSelectedCall - The callback function to determine whether a filter item is currently selected.
     * @param {Function} emitterCall - A callback function to be called when a filter item is selected.
     * @param {string} [parentType] - An optional Record type IRI such that only its subclasses are options
     * @returns {ListFilter} - The generated ListFilter object.
     */
    getRecordTypeFilter(isSelectedCall: (value: string) => boolean, emitterCall: (items: FilterItem[]) => void, parentType?: string): ListFilter {
        const types = parentType ? this.getSubRecordTypes(parentType) : without(Object.keys(this.recordTypes), `${CATALOG}Record`);
        const filterItems = types.map(type => ({
            value: type,
            display: getBeautifulIRI(type),
            checked: isSelectedCall(type),
        } as FilterItem));

        const getNumChecked = (items => items.filter(item => item.checked).length);

        return {
            title: 'Record Type',
            type: FilterType.CHECKBOX,
            numChecked: 0,
            hide: false,
            pageable: false,
            searchable: false,
            filterItems,
            onInit: function() {
                this.numChecked = getNumChecked(this.filterItems);
            },
            setFilterItems: () => {},
            filter: function() {
                this.numChecked = getNumChecked(this.filterItems);
                emitterCall(this.filterItems.filter(item => item.checked));
            }
        };
    }

    /**
     * Retrieves entities based on the provided configuration.
     *
     * @param {string} catalogId The id of the Catalog to retrieve entities from
     * @param {PaginatedConfig} config - The configuration for retrieving entities.
     * @returns {Observable<HttpResponse<EntityRecord[]>>} - The observable containing the HTTP response with the retrieved JSONLDObject entities.
     */
    getEntities(catalogId: string, config: PaginatedConfig): Observable<PaginatedResponse<EntityRecord[]>> {
        let params = paginatedConfigToHttpParams(config);
        if (get(config, 'type', undefined)) {
            config.type.forEach(type => {
                params = params.append('type', type);
            });
        }
        if (get(config, 'keywords')) {
            config.keywords.forEach(keyword => {
                params = params.append('keywords', keyword);
            });
        }
        if (config.searchText) {
            params = params.set('searchText', config.searchText.trim());
        }
        if (config.sortOption) {
            params = params.set('sort', config.sortOption.field);
            params = params.set('asc', config.sortOption.asc);
        }
        const url = `${this.prefix}/${encodeURIComponent(catalogId)}/entities`;
        const request = this.http.get<EntityRecord[]>(url, {params, observe: 'response'});
        return this.spinnerSrv.track(request)
            .pipe(
                catchError(handleErrorObject),
                map((response: HttpResponse<EntityRecord[]>): PaginatedResponse<EntityRecord[]> => {
                    let entityRecords = [];
                    if (response.body) {
                        entityRecords = response.body.map((entityRecord: EntityRecord) => {
                            if (entityRecord.matchingAnnotations) {
                                entityRecord.matchingAnnotations = entityRecord.matchingAnnotations.map((matchingAnnotations: MatchingAnnotations) => {
                                    if (matchingAnnotations.value && config.searchText) {
                                        matchingAnnotations.matchValue = getSubstringMatch(matchingAnnotations.value, config.searchText);
                                    }
                                    return matchingAnnotations;
                                });
                            }
                            return entityRecord;
                        });
                    }
                    return {
                        totalCount: Number(response.headers.get('x-total-count')) || 0,
                        page: entityRecords
                    };
                })
            );
    }

    private _createVersion(recordId: string, catalogId: string, versionConfig: NewConfig): Observable<string> {
        const fd = new FormData();
        fd.append('title', versionConfig.title);
        fd.append('type', versionConfig.type);
        if (has(versionConfig, 'description')) {
            fd.append('description', versionConfig.description);
        }
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions`, fd, {responseType: 'text'}))
            .pipe(catchError(handleError));
    }

    private _createBranch(recordId: string, catalogId: string, branchConfig: NewConfig, commitId: string) {
        const fd = new FormData();
        fd.append('title', branchConfig.title);
        fd.append('type', branchConfig.type);
        fd.append('commitId', commitId);
        if (has(branchConfig, 'description')) {
            fd.append('description', branchConfig.description);
        }
        return this.spinnerSrv.track(this.http.post(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches`, fd, {responseType: 'text'}))
           .pipe(catchError(handleError));
    }

    private _getRecordVersion(versionIdentifier: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/versions/${versionIdentifier}`))
            .pipe(catchError(handleError));
    }

    private _getRecordBranch(branchIdentifier: string, recordId: string, catalogId: string): Observable<JSONLDObject> {
        return this.spinnerSrv.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(catalogId)}/records/${encodeURIComponent(recordId)}/branches/${branchIdentifier}`))
            .pipe(catchError(handleError));
    }

    private _setDefaultSort(configParams: HttpParams): HttpParams {
        if (!configParams.has('sort')) {
            configParams = configParams.set('sort', this.sortOptions[0].field);
            configParams = configParams.set('ascending', this.sortOptions[0].asc);
        }
        return configParams;
    }
}
