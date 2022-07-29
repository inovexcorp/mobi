/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { get } from 'lodash';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

import { HelperService } from './helper.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { JSONLDObject } from '../models/JSONLDObject.interface';

/**
 * @class shared.DelimitedManagerService
 *
 * A service that provides access to the Mobi CSV REST endpoints and various variables to hold data pertaining to the
 * parameters passed to the endpoints and the results of the endpoints.
 */
@Injectable()
export class DelimitedManagerService {
    prefix = REST_PREFIX + 'delimited-files';
    
    constructor(private http: HttpClient, private helper: HelperService, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * An array of a preview of delimited data. Set by the POST /mobirest/delimited-files endpoint.
     * @type {string[][]}
     */
    dataRows: string[][] = undefined;
    /**
     * A string with the name of the uploaded delimited file given back from the POST /mobirest/delimited-files endpoint
     * calls.
     * @type {string}
     */
    fileName = '';
    /**
     * The File object of the original uploaded delimited file that was sent to the POST /mobirest/delimited-files
     * endpoint call.
     * @type {File}
     */
    fileObj: File = undefined;
    /**
     * A string with the character separating columns in the uploaded delimited file if it is an
     * SV file. It is used in the GET /mobirest/delimited-files/{fileName}, the POST
     * /mobirest/delimited-files/{fileName}/map, and the GET /mobirest/delimited-files/{fileName}/map endpoint 
     * calls.
     * @type {string}
     */
    separator = ',';
    /**
     * A boolean indicating whether the uploaded delimited file contains a header row or not. It is used in the GET
     * /mobirest/delimited-files/{fileName}, the POST /mobirest/delimited-files/{fileName}/map-preview, and the GET
     * /mobirest/delimited-files/{fileName}/map endpoints calls.
     * @type {boolean}
     */
    containsHeaders = true;
    /**
     * A string or JSONLDObject containing a preview of mapped data to be used in the
     * {@link mapper.RdfPreviewTabComponent}.
     * @type {string|JSONLDObject}
     */
    preview: string|JSONLDObject = '';
    /**
     * A string containing the format for the preview to be used in the {@link mapper.RdfPreviewTabComponent}
     * @type {string}
     */
    serializeFormat = 'turtle';

    /**
     * Makes a call to POST /mobirest/delimited-files to upload the passed File object to the repository.
     * Returns the resulting file name is a promise.
     *
     * @param {File} file a File object to upload (should be a SV or Excel file)
     * @return {Observable<string>} An Observable that resolves to the name of the uploaded delimited file; rejects with
     * an error message otherwise
     */
    upload(file: File): Observable<string> {
        const fd = new FormData();
        fd.append('delimitedFile', file);
        return this.spinnerSvc.track(this.http.post(this.prefix, fd, {responseType: 'text'}))
            .pipe(catchError(this.helper.handleError));
    }
    /**
     * Makes a call to GET /mobirest/delimited-files/{fileName} to retrieve the passed in number of rows of an uploaded
     * delimited file. Uses {@link shared.DelimitedManagerService#r#separator} and
     * {@link shared.DelimitedManagerService#fileName} to make the call. Depending on the value of
     * {@link shared.DelimitedManagerService#containsHeaders}, either uses the first returned row as headers or
     * generates headers of the form "Column " + index. Sets the value of
     * {@link shared.DelimitedManagerService#dataRows}. Returns an Observable indicating the success of the REST call.
     *
     * @param {number} rowEnd the number of rows to retrieve from the uploaded delimited file
     * @return {Observable<null>} An Observable that resolves if the call succeeded; rejects if the preview was empty
     * or the call did not succeed
     */
    previewFile(rowEnd: number): Observable<null> {
        const params = {
            rowCount: rowEnd ? rowEnd : 0,
            separator: this.separator
        };
        return this.spinnerSvc.track(this.http.get<string[][]>(this.prefix + '/' + encodeURIComponent(this.fileName),
            {params: this.helper.createHttpParams(params)}))
            .pipe(
                catchError(error => {
                    this.dataRows = undefined;
                    return this.helper.handleError(error);
                }),
                switchMap((response: string[][]) => {
                    if (response.length === 0) {
                        this.dataRows = undefined;
                        return throwError('No rows were found');
                    } else {
                        this.containsHeaders = !response[0].every( item => item ==="");
                        this.dataRows = response;
                        return of(null);
                    }
                })
            );
    }
    /**
     * Makes a call to POST /mobirest/delimited-files/{fileName}/map-preview to retrieve the first 10 rows of delimited
     * data mapped into RDF data using the passed in JSON-LD mapping and returns the RDF data in the passed in format.
     * Uses {@link shared.DelimitedManagerService#separator}, {@link shared.DelimitedManagerService#containsHeaders},
     * and {@link shared.DelimitedManagerService#fileName} to make the call. If the format is "jsonld," sends the
     * request with an Accept header of "application/json". Otherwise, sends the request with an Accept header of
     * "text/plain". Returns an Observable with the body of the response
     *
     * @param {JSONLDObject[]} jsonld the JSON-LD of a mapping
     * @param {string} format the RDF serialization format to return the mapped data in
     * @return {Observable<string|JSONLDObject[]>} An Observable that resolves with the mapped data in the specified RDF
     * format
     */
    previewMap(jsonld: JSONLDObject[], format: string): Observable<string|JSONLDObject[]> {
        const fd = new FormData();
        const params = {
            format,
            containsHeaders: this.containsHeaders,
            separator: this.separator
        };
        let headers = new HttpHeaders();
        headers = headers.append('Accept', (format === 'jsonld') ? 'application/json' : 'text/plain');
        fd.append('jsonld', JSON.stringify(jsonld));
        return this.spinnerSvc.track(this.http.post(this.prefix + '/' + encodeURIComponent(this.fileName) + '/map-preview',
            fd, {headers, params: this.helper.createHttpParams(params), responseType: 'text'}))
            .pipe(
                catchError(this.helper.handleError),
                map((data: string) => (format === 'jsonld') ? JSON.parse(data) : data)
            );
    }
    /**
     * Calls the GET /mobirest/delimited-files/{fileName}/map endpoint using the `window.location` variable
     * which will start a file download of the complete mapped delimited data in the specified format
     * of an uploaded delimited file using a saved Mapping identified by the passed IRI. Uses
     * {@link shared.DelimitedManagerService#separator},
     * {@link shared.DelimitedManagerService#containsHeaders}, and
     * {@link shared.DelimitedManagerService#fileName} to create the URL.
     *
     * @param {string} mappingRecordIRI the IRI of a saved MappingRecord
     * @param {string} format the RDF format for the mapped data
     * @param {string} fileName the file name for the downloaded mapped data
     */
    mapAndDownload(mappingRecordIRI: string, format: string, fileName: string): void {
        const params = this.helper.createHttpParams({
            containsHeaders: this.containsHeaders,
            separator: this.separator,
            format,
            mappingRecordIRI,
            fileName
        });
        window.open(this.prefix + '/' + encodeURIComponent(this.fileName) + '/map?' + params.toString());
    }
    /**
     * Calls the POST /mobirest/delimited-files/{fileName}/map to map the data of an uploaded delimited file
     * using a saved Mapping identified by the passed IRI into the Dataset associated with the DatasetRecord
     * identified by the passed IRI. Returns a Promise indicating the success of the request.
     *
     * @param {string} mappingIRI the IRI of a saved Mapping
     * @param {string} datasetRecordIRI the IRI of a DatasetRecord
     * @return {Observable<null>} An Observable that resolves if the upload was successful; rejects with an error
     *  message otherwise
     */
    mapAndUpload(mappingRecordIRI: string, datasetRecordIRI: string): Observable<null> {
        const params = {
            mappingRecordIRI,
            datasetRecordIRI,
            containsHeaders: this.containsHeaders,
            separator: this.separator
        };
        return this.spinnerSvc.track(this.http.post(this.prefix + '/' + encodeURIComponent(this.fileName) + '/map', null, {params: this.helper.createHttpParams(params)}))
           .pipe(catchError(this.helper.handleError));
    }
    /**
     * Calls the POST /mobirest/delimited-files/{fileName}/map-to-ontology to commit the data of an uploaded delimited
     * file using a saved Mapping identified by the passed IRI on the Ontology associated with the OntologyRecord
     * identified by the passed IRI. Returns a Promise with the whole HTTP response indicating the success of the request.
     *
     * @param {string} mappingIRI the IRI of a saved Mapping
     * @param {string} ontologyRecordIRI the IRI of a OntologyRecord
     * @param {string} branchIRI the IRI of record branch
     * @param {boolean} update True to update the ontology with new mapping results, false to add as new additions
     * @return {Promise} An Observable of the whole HTTP response that resolves if the upload was successful; rejects
     * with an error message otherwise
     */
    mapAndCommit(mappingRecordIRI: string, ontologyRecordIRI: string, branchIRI: string, update = false): Observable<HttpResponse<null>> {
        const params = {
            mappingRecordIRI,
            ontologyRecordIRI,
            branchIRI,
            update,
            containsHeaders: this.containsHeaders,
            separator: this.separator
        };
        return this.spinnerSvc.track(this.http.post(this.prefix + '/' + encodeURIComponent(this.fileName) 
            + '/map-to-ontology', null, {params: this.helper.createHttpParams(params), observe: 'response'}))
           .pipe(catchError(this.helper.handleError));
    }
    /**
     * Retrieves the header name of a column based on its index. If {@link shared.DelimitedManagerService#dataRows} have
     * been set and {@link shared.DelimitedManagerService#containsHeaders}, collects the header name from the first row.
     * Otherwise, generates a name using the index.
     *
     * @param {number|string} index The index number of the column to retrieve the header name from
     * @return {string} A header name for the column at the specified index
     */
    getHeader(index: string|number): string {
        return this.containsHeaders && this.dataRows ? get(this.dataRows[0], index, `Column ${index}`) : `Column ${index}`;
    }
    /**
     * Resets the values of {@link shared.DelimitedManagerService#dataRows},
     * {@link shared.DelimitedManagerServicer#preview}, {@link shared.DelimitedManagerService#fileName},
     * {@link shared.DelimitedManagerService#separator}, and {@link shared.DelimitedManagerService#containsHeaders} back
     * to their default values.
     */
    reset(): void {
        this.dataRows = undefined;
        this.fileName = '';
        this.fileObj = undefined;
        this.separator = ',';
        this.containsHeaders = true;
        this.preview = '';
    }
}