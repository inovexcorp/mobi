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
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { createHttpParams, handleError } from '../utility';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REPOS } from '../../prefixes';
import { REPOSITORY_STORE_TYPE, REST_PREFIX } from '../../constants';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';

/**
 * @class shared.SparqlManagerService
 *
 * A service that provides access to the Mobi SPARQL query REST endpoint and various state variables for the SPARQL
 * Editor.
 */
@Injectable()
export class SparqlManagerService {
    prefix = `${REST_PREFIX}sparql`;

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /sparql REST endpoint to conduct a SPARQL query using the provided query
     * and optionally using the provided DatasetRecord IRI to limit the query to a dataset.
     *
     * @param {string} query The SPARQL query string to submit
     * @param {string} resourceId The IRI resource to query
     * @param {string} storeType The type of store to query
     * @param {string} branchId An optional IRI of a branch if the resourceId is a VersionedRDFRecord
     * @param {string} commitId An optional IRI of a commit if the resourceId is a VersionedRDFRecord
     * @param {boolean} [includeImports=true] Whether to include imports if the resourceId is a VersionedRDFRecord
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the InProgessCommit if the resourceId is a
     *      VersionedRDFRecord
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} A Observable that resolves to the data from the response or rejects with an
     * error message.
     */
    query(query: string, resourceId = `${REPOS}system`, storeType = REPOSITORY_STORE_TYPE, branchId = '',
          commitId = '', includeImports = false, applyInProgressCommit = false,
          isTracked = false): Observable<string | SPARQLSelectResults> {
        const params: {[key: string]: string | boolean} = {
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit,
            query
        };
        const request = this.http.get(`${this.prefix}/${encodeURIComponent(storeType)}/${encodeURIComponent(resourceId)}`, {params: createHttpParams(params), responseType: 'text', observe: 'response'})
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<string>) => {
                    const contentType = response.headers.get('Content-Type');
                    if (contentType === 'application/json') {
                        return (JSON.parse(response.body)) as SPARQLSelectResults;
                    } else {
                        return response.body;
                    }
                })
            );
        return this.spinnerSvc.trackedRequest(request, isTracked);
    }

    /**
     * Calls the POST /sparql REST endpoint to conduct a SPARQL query using the provided query
     * and optionally using the provided DatasetRecord IRI to limit the query to a dataset.
     *
     * @param {string} query The SPARQL query string to submit
     * @param {string} resourceId The IRI resource to query
     * @param {string} storeType The type of store to query
     * @param {string} branchId An optional IRI of a branch if the resourceId is a VersionedRDFRecord
     * @param {string} commitId An optional IRI of a commit if the resourceId is a VersionedRDFRecord
     * @param {boolean} [includeImports=false] Whether to include imports if the resourceId is a VersionedRDFRecord
     * @param {boolean} [applyInProgressCommit=false] Whether to apply the InProgessCommit if the resourceId is a
     *      VersionedRDFRecord
     * @param {string} [format='application/json'] The RDF format to return the results in
     * @param {boolean} [isTracked=false] Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} A Observable that resolves to the data from the response or rejects with an
     * error message.
     */
    postQuery(query: string, resourceId = `${REPOS}system`, storeType = REPOSITORY_STORE_TYPE, branchId = '',
              commitId = '', includeImports = false, applyInProgressCommit = false, format = 'application/json',
              isTracked = false): Observable<string | SPARQLSelectResults> {
        const params: {[key: string]: string | boolean} = {
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', this._getMimeType(format));
        headers = headers.append('Content-Type', 'application/sparql-query');
        const request = this.http.post(`${this.prefix}/${encodeURIComponent(storeType)}/${encodeURIComponent(resourceId)}`, query, {params: createHttpParams(params), responseType: 'text', observe: 'response', headers})
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<string>) => {
                    const contentType = response.headers.get('Content-Type');
                    if (contentType === 'application/json') {
                        return (JSON.parse(response.body)) as SPARQLSelectResults;
                    } else {
                        return response.body;
                    }
                })
            );
        return this.spinnerSvc.trackedRequest(request, isTracked);
    }

    /**
     * Calls the GET /mobirest/sparql endpoint using the `window.location` variable which will start a download of the
     * results of running the provided, optionally using a provided datasetRecordIRI, in the specified file type with
     * an optional file name.
     *
     * @param {string} query The query to run
     * @param {string} fileType The type of file to download based on file extension
     * @param {string} fileName The optional name of the downloaded file
     * @param {string} resourceId The IRI resource to query
     * @param {string} storeType The type of store to query
     * @param {string} branchId An optional IRI of a branch if the resourceId is a VersionedRDFRecord
     * @param {string} commitId An optional IRI of a commit if the resourceId is a VersionedRDFRecord
     * @param {boolean} [includeImports=true] Whether to include imports if the resourceId is a VersionedRDFRecord
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the InProgessCommit if the resourceId is a
     *      VersionedRDFRecord
     */
    downloadResults(query: string, fileType: string, fileName = '', resourceId = `${REPOS}system`,
                    storeType = REPOSITORY_STORE_TYPE, branchId = '', commitId = '', includeImports = false,
                    applyInProgressCommit = false): void {
        const paramsObj: {[key: string]: string | boolean} = {
            query,
            fileType,
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit
        };
        if (fileName) {
            paramsObj.fileName = fileName;
        }
        window.open(`${this.prefix}/${encodeURIComponent(storeType)}/${encodeURIComponent(resourceId)}?${createHttpParams(paramsObj).toString()}`);
    }

    /**
     * Calls the POST /mobirest/sparql endpoint with an Accept Header of application/octet-stream which will start a
     * download of the results of running the provided query, optionally using a provided datasetRecordIRI, in the
     * specified file type with an optional file name.
     *
     * @param {string} fileType The type of file to download based on file extension
     * @param {string=''} fileName The optional name of the downloaded file
     * @param {string} resourceId The IRI resource to query
     * @param {string} storeType The type of store to query
     * @param {string} branchId An optional IRI of a branch if the resourceId is a VersionedRDFRecord
     * @param {string} commitId An optional IRI of a commit if the resourceId is a VersionedRDFRecord
     * @param {boolean} [includeImports=true] Whether to include imports if the resourceId is a VersionedRDFRecord
     * @param {boolean} [applyInProgressCommit=true] Whether to apply the InProgessCommit if the resourceId is a
     *      VersionedRDFRecord
     */
    downloadResultsPost(query: string, fileType: string, fileName = '', resourceId = `${REPOS}system`,
                        storeType = REPOSITORY_STORE_TYPE, branchId = '', commitId = '', includeImports = false,
                        applyInProgressCommit = false): Observable<ArrayBuffer> {
        const params: {[key: string]: string | boolean} = {
            fileType,
            fileName,
            branchId,
            commitId,
            includeImports,
            applyInProgressCommit
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', 'application/octet-stream').append('Content-Type', 'application/sparql-query');
        
        return this.spinnerSvc.track(this.http.post(`${this.prefix}/${encodeURIComponent(storeType)}/${encodeURIComponent(resourceId)}`, query, {headers, params: createHttpParams(params), responseType: 'arraybuffer', observe: 'response'}))
            .pipe(
                catchError(handleError),
                map((response: HttpResponse<ArrayBuffer>) => {
                    const file = new Blob([response.body], {
                        type: response.headers.get('Content-Type')
                    });
                    const fileURL = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = fileURL;
                    a.target = '_blank';
                    const respFilename = this._getFileName(response);
                    a.download = respFilename || fileName || 'untitled';
                    a.click(); //click the link "a"
                    return response.body;
                }));
    }

    private _getFileName(response: HttpResponse<ArrayBuffer>): string {
        try {
            const contentDisposition: string = response.headers.get('content-disposition');
            const matches = /filename=([^;]+)/ig.exec(contentDisposition);
            return ((matches || [''])[1]).trim();
        } catch (e) {
            return '';
        }
    }
    private _getMimeType(format: string): string {
        if (format === 'turtle') {
            return 'text/turtle';
        } else if (format === 'jsonld') {
            return 'application/ld+json';
        } else if (format === 'rdf/xml') {
            return 'application/rdf+xml';
        } else if (format === 'application/json') {
            return 'application/json';
        } else {
            console.error(`${format} is not a valid rdf mime type. Changing to application/ld+json.`);
            return 'application/ld+json';
        }
    }
}
