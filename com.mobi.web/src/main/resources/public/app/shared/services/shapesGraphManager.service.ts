/*-
 * #%L
 * com.mobi.web
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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forEach, get } from 'lodash';
import { catchError, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { REST_PREFIX } from '../../constants';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { RdfUpdate } from '../models/rdfUpdate.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { createHttpParams, handleError, handleErrorObject } from '../utility';
import { JSONLDObject } from '../models/JSONLDObject.interface';

/**
 * @class shared.ShapesGraphManagerService
 *
 * A service that provides access to the Mobi SHACL shapes graphs REST endpoints for adding, removing, and editing Mobi
 * SHACL shapes graphs.
 */
@Injectable()
export class ShapesGraphManagerService {
    prefix = `${REST_PREFIX}shapes-graphs`;

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the POST /mobirest/shapes-graphs endpoint to upload a SHACL shapes graph to Mobi. Returns a Observable that
     * resolves with the result of the call if it was successful and rejects with an error message if it was not.
     *
     * @param {RdfUpload} newRecord the new SHACL record to add
     * @returns {Observable} A Observable that resolves with metadata about the newly created Record if the request was 
     *    successful; rejects with a {@link RESTError} otherwise
     */
    createShapesGraphRecord(newRecord: RdfUpload): Observable<VersionedRdfUploadResponse> {
        const fd = new FormData();
        fd.append('title', newRecord.title);
        if (newRecord.jsonld) {
            fd.append('json', JSON.stringify(newRecord.jsonld));
        }
        if (newRecord.file) {
            fd.append('file', newRecord.file);
        }
        if (newRecord.description) {
            fd.append('description', newRecord.description);
        }
        forEach(get(newRecord, 'keywords', []), keyword => fd.append('keywords', keyword));

        return this.spinnerSvc.track(this.http.post<VersionedRdfUploadResponse>(this.prefix, fd))
            .pipe(catchError(handleErrorObject));
    }
    /**
     * Calls the GET /mobirest/shapes-graphs/{recordId} endpoint using the `window.location` variable which will
     * start a download of the SHACL shapes graph starting at the identified Commit.
     *
     * @param {RdfDownload} rdfDownload the VersionedRdfRecord download parameters
     */
    downloadShapesGraph(rdfDownload: RdfDownload): void {
        const params = createHttpParams({
            branchId: rdfDownload.branchId,
            commitId: rdfDownload.commitId,
            rdfFormat: rdfDownload.rdfFormat || 'jsonld',
            fileName: rdfDownload.fileName || 'shapesGraph',
            applyInProgressCommit: rdfDownload.applyInProgressCommit || false
        });
        window.open(`${this.prefix}/${encodeURIComponent(rdfDownload.recordId)}?${params.toString()}`);
    }
    /**
     * Calls the DELETE /mobirest/shapes-graphs/{recordId} endpoint to delete a SHACL shapes graph record. Returns
     * a Observable that resolves if it was successful and rejects with an error message if it was not.
     *
     * @param {string} recordId the iri of the SHACL shapes graph record to delete
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with a {@link RESTError}
     *    otherwise
     */
    deleteShapesGraphRecord(recordId: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.prefix}/${encodeURIComponent(recordId)}`))
            .pipe(catchError(handleErrorObject), map(() => {}));
    }
    /**
     * Calls the PUT /mobirest/shapes-graphs/{recordId} endpoint which will update the in-progress commit
     * object to be applied to the shapes graph.
     *
     * @param {RdfUpdate} rdfUpdate the uploaded SHACL shapes graph
     * @returns {Observable} An Observable that resolves if the request was successful; rejects with a {@link RESTError}
     *    otherwise
     */
    uploadChanges(rdfUpdate: RdfUpdate): Observable<HttpResponse<null>> {
        const fd = new FormData();
        if (rdfUpdate.file) {
            fd.append('file', rdfUpdate.file);
        }
        if (rdfUpdate.jsonld) {
            fd.append('json', JSON.stringify(rdfUpdate.jsonld));
        }
        const params = {
            branchId: rdfUpdate.branchId,
            commitId: rdfUpdate.commitId,
            replaceInProgressCommit: rdfUpdate.replaceInProgressCommit
        };
        return this.spinnerSvc.track(this.http.put<null>(`${this.prefix}/${encodeURIComponent(rdfUpdate.recordId)}`, fd, 
          { observe: 'response', params: createHttpParams(params) }))
            .pipe(catchError(handleErrorObject));
    }

    /**
     * Calls the GET /mobirest/shapes-graphs/{recordId}/entities/{entityId} endpoint which will
     * retrieve all the directly attached predicates and objects of the passed in entityId.
     *
     * @param {string} recordId the IRI of the record to retrieve.
     * @param {string} branchId the IRI of the branch to retrieve.
     * @param {string} commitId the IRI of the commit to retrieve.
     * @param {string} commitId the IRI of the entity to retrieve.
     * @param {string} format the format of the rdf that will be retrieved.
     * @param {boolean} applyInProgressCommit whether to apply the current in progress commit.
     * @returns {Observable} An Observable that resolves with the metadata triples as either a JSON-LD array or a RDF 
     *    formatted string; rejects with an error message otherwise
     */
    getShapesGraphMetadata(recordId: string, branchId: string, commitId: string, entityId: string, format = 'jsonld', 
      applyInProgressCommit = true): Observable<JSONLDObject[] | string>  {
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/entities/${encodeURIComponent(entityId)}`;
        const ob = this.spinnerSvc.track(this.http.get(url, { 
            params: createHttpParams({ branchId, commitId, format, applyInProgressCommit }),
            responseType: 'text'
        }));
        return ob.pipe(
            catchError(handleError),
            map((response: string) => {
                if (format === 'jsonld') {
                    return (JSON.parse(response)) as JSONLDObject[];
                } else {
                    return response;
                }
            })
        );
    }

    /**
     * Calls the GET /mobirest/shapes-graphs/{recordId}/content endpoint which will retrieve all triples in a Shapes 
     * Graph not directly attached to the Shapes Graph IRI subjectId.
     *
     * @param {string} recordId the IRI of the record to retrieve.
     * @param {string} branchId the IRI of the branch to retrieve.
     * @param {string} commitId the IRI of the commit to retrieve.
     * @param {string} format the format of the rdf that will be retrieved.
     * @param {boolean} applyInProgressCommit whether to apply the current in progress commit.
     * @returns {Observable} An Observable that resolves with the triples of the shapes graph content as either a
     *    JSON-LD array or a RDF formatted string if the request was successful; rejects with an error message otherwise
     */
    getShapesGraphContent(recordId: string, branchId: string, commitId: string, format = 'turtle', 
      applyInProgressCommit = true): Observable<JSONLDObject[] | string>  {
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/content`;
        const ob = this.spinnerSvc.track(this.http.get(url, { 
            params: createHttpParams({ branchId, commitId, format, applyInProgressCommit }), 
            responseType: 'text'
        }));
        return ob.pipe(
            catchError(handleError),
            map((response: string) => {
              if (format === 'jsonld') {
                  return (JSON.parse(response)) as JSONLDObject[];
              } else {
                  return response;
              }
            })
        );
    }

    /**
     * Calls the GET /mobirest/shapes-graphs/{recordId}/id endpoint which will
     * retrieve the IRI of the shapes graph with the passed in recordId, branchId, and commitId.
     *
     * @param {string} recordId the IRI of the record to retrieve.
     * @param {string} branchId the IRI of the branch to retrieve.
     * @param {string} commitId the IRI of the commit to retrieve.
     * @param {boolean} applyInProgressCommit whether to apply the current in progress commit.
     *
     * @returns {Observable} An Observable that resolves with the IRI string if the request was successful; rejects with 
     *    an error message otherwise
     */
    getShapesGraphIRI(recordId: string, branchId: string, commitId: string, 
      applyInProgressCommit = true): Observable<string> {
        const url = `${this.prefix}/${encodeURIComponent(recordId)}/id`;
        const ob = this.spinnerSvc.track(this.http.get(url, {
            params: createHttpParams({ branchId, commitId, applyInProgressCommit }), 
            responseType: 'text'
        }));
        return ob.pipe(catchError(handleError));
    }
}
