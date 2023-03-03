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
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { UtilService } from './util.service';

/**
 * @class shared.SparqlManagerService
 *
 * A service that provides access to the Mobi SPARQL query REST endpoint and various state variables for the SPARQL
 * Editor.
 */
@Injectable()
export class SparqlManagerService {
    prefix = REST_PREFIX + 'sparql';

    constructor(private http: HttpClient, private util: UtilService, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /sparql REST endpoint to conduct a SPARQL query using the provided query
     * and optionally using the provided DatasetRecord IRI to limit the query to a dataset.
     *
     * @param {string} query The SPARQL query string to submit
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
     * @param {string} id The identifier for this call
     * @return {Observable} A Observable that resolves to the data from the response or rejects with an
     * error message.
     */
    query(query: string, datasetRecordIRI = '', isTracked = false): Observable<string|SPARQLSelectResults> {
        const params: any = { query };
        if (datasetRecordIRI) {
            params.dataset = datasetRecordIRI;
        }
        const request = this.http.get(this.prefix, {params: this.util.createHttpParams(params), responseType: 'text', observe: 'response'})
            .pipe(
                catchError(this.util.handleError),
                map((response: HttpResponse<string>) => {
                    const contentType = response.headers.get('Content-Type');
                    if (contentType === 'application/json') {
                        return (JSON.parse(response.body)) as SPARQLSelectResults;
                    } else {
                        return response.body;
                    }
                })
            );
        return this.util.trackedRequest(request, isTracked);
    }

    /**
     * Calls the POST /sparql REST endpoint to conduct a SPARQL query using the provided query
     * and optionally using the provided DatasetRecord IRI to limit the query to a dataset.
     *
     * @param {string} query The SPARQL query string to submit
     * @param {string} datasetRecordIRI The IRI of the DatasetRecord to restrict the query to
     * @param {string} id The identifier for this call
     * @return {Observable} A Observable that resolves to the data from the response or rejects with an
     * error message.
     */
    postQuery(query: string, datasetRecordIRI = '', isTracked = false): Observable<string|SPARQLSelectResults> {
        const params: any = {};
        if (datasetRecordIRI) {
            params.dataset = datasetRecordIRI;
        }
        const request = this.http.post(this.prefix, query, {params: this.util.createHttpParams(params), responseType: 'text', observe: 'response'})
            .pipe(
                catchError(this.util.handleError),
                map((response: HttpResponse<string>) => {
                    const contentType = response.headers.get('Content-Type');
                    if (contentType === 'application/json') {
                        return (JSON.parse(response.body)) as SPARQLSelectResults;
                    } else {
                        return response.body;
                    }
                })
            );
        return this.util.trackedRequest(request, isTracked);
    }

    /**
     * Calls the GET /mobirest/sparql endpoint using the `window.location` variable which will start a download of the
     * results of running the provided, optionally using a provided datasetRecordIRI, in the specified file type with
     * an optional file name.
     *
     * @param {string} query The query to run
     * @param {string} fileType The type of file to download based on file extension
     * @param {string} fileName The optional name of the downloaded file
     * @param {string} datasetRecordIRI The optional Dataset to run the query against
     */
    downloadResults(query: string, fileType: string, fileName = '', datasetRecordIRI = ''): void {
        const paramsObj: any = {
            query,
            fileType
        };
        if (fileName) {
            paramsObj.fileName = fileName;
        }
        if (datasetRecordIRI) {
            paramsObj.dataset = datasetRecordIRI;
        }
        window.open(this.prefix + '?' + this.util.createHttpParams(paramsObj).toString());
    }

    /**
     * Calls the POST /mobirest/sparql endpoint with an Accept Header of application/octet-stream which will start a
     * download of the results of running the provided query, optionally using a provided datasetRecordIRI, in the
     * specified file type with an optional file name.
     *
     * @param {string} fileType The type of file to download based on file extension
     * @param {string=''} fileName The optional name of the downloaded file
     */
    downloadResultsPost(query: string, fileType: string, fileName = '', datasetRecordIRI = ''): Observable<any> {
        const params: any = {
            fileType,
            fileName
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', 'application/octet-stream').append('Content-Type', 'application/sparql-query');
        
        if (datasetRecordIRI) {
            params.dataset = datasetRecordIRI;
        }
        
        return this.spinnerSvc.track(this.http.post(this.prefix, query, {headers, params: this.util.createHttpParams(params), responseType: 'arraybuffer', observe: 'response'}))
            .pipe(
                catchError(this.util.handleError),
                map((response: HttpResponse<any>) => {
                    const file = new Blob([response.body], {
                        type: response.headers.get('Content-Type')
                    });
                    const fileURL = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = fileURL;
                    a.target = '_blank';
                    const respFilename = this._getFileName(response);
                    a.download = respFilename || fileName || 'untitled';
                    // document.body.appendChild(a); //create the link "a"
                    a.click(); //click the link "a"
                    // document.body.removeChild(a); //remove the link "a"
                    return response.body;
                }));
    }

    private _getFileName(response: HttpResponse<any>): string {
        try {
            const contentDisposition: string = response.headers.get('content-disposition');
            const matches = /filename=([^;]+)/ig.exec(contentDisposition);
            return ((matches || [''])[1]).trim();
        } catch (e) {
            return '';
        }
    }
}
