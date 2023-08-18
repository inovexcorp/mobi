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
import { forEach, get, has, includes } from 'lodash';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { MERGEREQ, DCTERMS } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequestConfig } from '../models/mergeRequestConfig.interface';
import { MergeRequestPaginatedConfig } from '../models/mergeRequestPaginatedConfig.interface';
import { UtilService } from './util.service';
import { SortOption } from '../models/sortOption.interface';

/**
 * @class shared.MergeRequestManagerService
 *
 * A service that provides access to the Mobi merge-requests REST endpoints along with utility methods for working with
 * Merge Requests and their components.
 */
@Injectable()
export class MergeRequestManagerService {
    prefix = REST_PREFIX + 'merge-requests';
    /**
     * `sortOptions` contains a list of objects representing all sort options for Merge Request.
     */
    sortOptions: SortOption[] = [
        {
            field: DCTERMS + 'issued',
            asc: false,
            label: 'Issued (desc)'
        },
        {
            field: DCTERMS + 'issued',
            asc: true,
            label: 'Issued (asc)'
        },
        {
            field: DCTERMS + 'title',
            asc: false,
            label: 'Title (desc)'
        },
        {
            field: DCTERMS + 'title',
            asc: true,
            label: 'Title (asc)'
        },

    ];
    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService, private util: UtilService) {}
    /**
     * Calls the GET /mobirest/merge-requests endpoint with the provided object of query parameters
     * which retrieves a list of MergeRequests.
     *
     * @param {MergeRequestPaginatedConfig} config An object with all the query parameter settings for the REST call
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with an HttpResponse with the
     * list of MergeRequests or rejects with an error message
     */
    getRequests(config: MergeRequestPaginatedConfig): Observable<HttpResponse<JSONLDObject[]>> {
        const params = this.util.paginatedConfigToParams(config);
        params.accepted = config.accepted;
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(this.prefix, {params: this.util.createHttpParams(params), observe: 'response'}))
            .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the POST /mobirest/merge-requests endpoint with the passed metadata and creates a new
     * MergeRequest. Returns a Promise with the IRI of the new MergeRequest if successful or
     * rejects with an error message.
     *
     * @param {MergeRequestConfig} requestConfig A configuration object containing metadata for the new MergeRequest
     * @return {Observable<string>} An Observable that resolves to the IRI of the new MergeRequest or is rejected with
     * an error message
     */
    createRequest(requestConfig: MergeRequestConfig): Observable<string> {
        const fd = new FormData();
        fd.append('title', requestConfig.title);
        fd.append('recordId', requestConfig.recordId);
        fd.append('sourceBranchId', requestConfig.sourceBranchId);
        fd.append('targetBranchId', requestConfig.targetBranchId);
        if (has(requestConfig, 'description')) {
            fd.append('description', requestConfig.description);
        }
        forEach(get(requestConfig, 'assignees', []), username => fd.append('assignees', username));
        if (has(requestConfig, 'removeSource')) {
            fd.append('removeSource', '' + requestConfig.removeSource);
        }
        return this.spinnerSvc.track(this.http.post(this.prefix, fd, {responseType: 'text'}))
            .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the GET /mobirest/merge-requests/{requestId} endpoint to retrieve a single Merge Request
     * with a matching IRI.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @returns {Observable<JSONLDObject>} An Observable that resolves with Merge Request if found or rejects with an
     * error message
     */
    getRequest(requestId: string): Observable<JSONLDObject> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject>(this.prefix + '/' + encodeURIComponent(requestId)))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the DELETE /mobirest/merge-requests/{requestId} endpoint to remove a single Merge Request
     * with a matching IRI from the application.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @returns {Observable<null>} An Observable that resolves if the request was deleted or rejects with an
     * error message
     */
    deleteRequest(requestId: string): Observable<null> {
        return this.spinnerSvc.track(this.http.delete(this.prefix + '/' + encodeURIComponent(requestId)))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the POST /mobirest/merge-requests/{requestId} endpoint to accept a Merge Request
     * with a matching IRI and perform the represented merge.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @returns {Observable<null>} An Observable that resolves if the request was accepted or rejects with an
     * error message
     */
    acceptRequest(requestId: string): Observable<null> {
        return this.spinnerSvc.track(this.http.post(this.prefix + '/' + encodeURIComponent(requestId), null))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the GET /mobirest/merge-requests/{requestId}/comments endpoint to retrieve the array of comment
     * chains for the Merge Request with a matching IRI.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @returns {Observable<JSONLDObject[][]>} An Observable that resolves with an array of arrays of
     * {@link JSONLDObject} representing comment chains or rejects with an error message
     */
    getComments(requestId: string): Observable<JSONLDObject[][]> {
        return this.spinnerSvc.track(this.http.get<JSONLDObject[][]>(this.prefix + '/' + encodeURIComponent(requestId) + '/comments'))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the DELETE /mobirest/merge-requests/{requestId}/comments/{commentId} endpoint to delete a comment
     * with a matching IRI from the Merge Request with a matching IRI.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @param {string} commentId An IRI ID of a Comment on the Merge Request
     * @returns {Observable<null>} An Observable that resolves if the comment was deleted or rejects with an error
     * message
     */
    deleteComment(requestId: string, commentId: string): Observable<null> {
        return this.spinnerSvc.track(this.http.delete(this.prefix + '/' + encodeURIComponent(requestId) + '/comments/' + encodeURIComponent(commentId)))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the POST /mobirest/merge-requests/{requestId}/comments endpoint to create a comment on the Merge
     * Request with a matching IRI with the provided comment string. Can optionally specify the comment the new
     * comment is reply to.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @param {string} commentStr A string to be the body of the new Comment
     * @param {string} [replyComment=''] An IRI ID of a Comment on the Merge Request
     * @returns {Observable<string>} An Observable that resolves to the IRI of the new comment if created or rejects
     * with an error message
     */
    createComment(requestId: string, commentStr: string, replyComment = ''): Observable<string> {
        const params = {
            commentId: ''
        };
        if (replyComment) {
            params.commentId = replyComment;
        }
        return this.spinnerSvc.track(this.http.post(this.prefix + '/' + encodeURIComponent(requestId) + '/comments', commentStr, {params: this.util.createHttpParams(params), responseType: 'text'}))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the PUT /mobirest/merge-requests/{requestId}/comments/{commentId} endpoint to edit a comment on the Merge
     * Request with a matching IRI with the provided comment string.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @param {string} commentId An IRI ID of a Comment on the Merge Request
     * @param {string} commentStr A string to be the new body of the Comment
     * @returns {Observable<null>} An Observable that resolves if the comment was edited or rejects with an error message
     */
    updateComment(requestId: string, commentId: string, commentStr: string): Observable<null> {
        return this.spinnerSvc.track(this.http.put(this.prefix + '/' + encodeURIComponent(requestId) + '/comments/' + encodeURIComponent(commentId), commentStr))
           .pipe(catchError(this.util.handleError));
    }
    /**
     * Calls the PUT /mobirest/merge-requests/{requestId} endpoint to update a Merge Request
     * with a matching IRI.
     * 
     * @param {string} requestId An IRI of a MergeRequest
     * @param {JSONLDObject} jsonld A MergeRequest JSON-LD object
     * @return {Observable<string>} An Observable that resolves to the IRI of the updated MergeRequest or is rejected
     * with an error message
     */
    updateRequest(requestId: string, jsonld: JSONLDObject): Observable<string> {
        return this.spinnerSvc.track(this.http.put(this.prefix + '/' + encodeURIComponent(requestId), jsonld, { responseType: 'text' }))
           .pipe(catchError(this.util.handleError));
    }
    
    /**
     * Determines whether the passed request is accepted or not.
     *
     * @param {JSONLDObject} request A MergeRequest JSON-LD object
     * @return {boolean} True if the MergeRequest is accepted; false otherwise
     */
    isAccepted(request: JSONLDObject): boolean {
        return includes(request['@type'], MERGEREQ + 'AcceptedMergeRequest');
    }

}
