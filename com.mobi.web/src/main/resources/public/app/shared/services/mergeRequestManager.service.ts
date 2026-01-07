/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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

import { Observable, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { cloneDeep, get, has, includes } from 'lodash';

import { DCTERMS, MERGEREQ  } from '../../prefixes';
import { EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequestConfig } from '../models/mergeRequestConfig.interface';
import { MergeRequestPaginatedConfig } from '../models/mergeRequestPaginatedConfig.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { SortOption } from '../models/sortOption.interface';
import { createHttpParams, handleError, paginatedConfigToHttpParams } from '../utility';
import { MergeRequest } from '../models/mergeRequest.interface';

import { UserCount } from '../models/user-count.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { RecordCount } from '../models/record-count.interface';
import { MergeRequestStatus, MergeRequestStatusAction } from '../models/merge-request-status';

/**
 * @class shared.MergeRequestManagerService
 *
 * A service that provides access to the Mobi merge-requests REST endpoints along with utility methods for working with
 * Merge Requests and their components.
 */
@Injectable()
export class MergeRequestManagerService {
    prefix = `${REST_PREFIX}merge-requests`;

    /**
     * `sortOptions` contains a list of objects representing all sort options for Merge Request.
     */
    sortOptions: SortOption[] = [
        {
            field: `${DCTERMS}issued`,
            asc: false,
            label: 'Issued (desc)'
        },
        {
            field: `${DCTERMS}issued`,
            asc: true,
            label: 'Issued (asc)'
        },
        {
            field: `${DCTERMS}title`,
            asc: false,
            label: 'Title (desc)'
        },
        {
            field: `${DCTERMS}title`,
            asc: true,
            label: 'Title (asc)'
        }
    ];

    // Only the service has access to the subject
    private _mergeRequestActionSubject = new Subject<EventWithPayload>();
    public mergeRequestAction$ = this._mergeRequestActionSubject.asObservable();

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /mobirest/merge-requests endpoint with the provided object of query parameters
     * which retrieves a list of MergeRequests.
     *
     * @param {MergeRequestPaginatedConfig} config An object with all the query parameter settings for the REST call
     * @returns {Observable<HttpResponse<JSONLDObject[]>>} An Observable that resolves with an HttpResponse with the
     * list of MergeRequests or rejects with an error message
     */
    getRequests(config: MergeRequestPaginatedConfig): Observable<HttpResponse<JSONLDObject[]>> {
        let params = paginatedConfigToHttpParams(config);
        if (config.searchText) {
            params = params.set('searchText', config.searchText);
        }
        params = params.set('requestStatus', config.requestStatus);
        if (config.creators && config.creators.length) {
            config.creators.forEach(creator => {
                params = params.append('creators', creator);
            });
        }
        if (config.assignees && config.assignees.length) {
          config.assignees.forEach(assignee => {
              params = params.append('assignees', assignee);
          });
      }
        if (config.records?.length) {
            config.records.forEach(record => {
                params = params.append('records', record);
            });
        }
        return this.spinnerSvc.track(this.http.get<JSONLDObject[]>(this.prefix, {params, observe: 'response'}))
            .pipe(catchError(handleError));
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
        get(requestConfig, 'assignees', []).forEach(user => fd.append('assignees', user.username));
        if (has(requestConfig, 'removeSource')) {
            fd.append('removeSource', `${requestConfig.removeSource}`);
        }
        return this.spinnerSvc.track(this.http.post(this.prefix, fd, {responseType: 'text'}))
            .pipe(catchError(handleError));
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
        return this.spinnerSvc.track(this.http.get<JSONLDObject>(`${this.prefix}/${encodeURIComponent(requestId)}`))
           .pipe(catchError(handleError));
    }
    /**
     * Calls the DELETE /mobirest/merge-requests/{requestId} endpoint to remove a single Merge Request
     * with a matching IRI from the application.
     *
     * @param {string} requestId An IRI ID of a Merge Request
     * @returns {Observable<null>} An Observable that resolves if the request was deleted or rejects with an
     * error message
     */
    deleteRequest(requestId: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.prefix}/${encodeURIComponent(requestId)}`))
           .pipe(catchError(handleError), map(() => {}));
    }
    /**
     * Calls the POST /mobirest/merge-requests/{requestId} endpoint to accept a Merge Request
     * with a matching IRI and perform the represented merge.
     *
     * @param {string} mergeRequest The jsonLD of the merge request to take an action against
     * @param {string} action A string representation of the action to take against the mergeRequest
     * @returns {Observable<null>} An Observable that resolves if the request was accepted or rejects with an
     * error message
     */
    updateRequestStatus(mergeRequest: MergeRequest, action: MergeRequestStatusAction): Observable<void> {
        const requestClone = cloneDeep(mergeRequest);
        const mergeRequestId = requestClone.jsonld['@id'];
        const params = {
            action: action
        };
        return this.spinnerSvc.track(this.http.post(`${this.prefix}/${encodeURIComponent(mergeRequestId)}/status`,
            null, {params: createHttpParams(params)})).pipe(
                catchError(handleError),
                map(() => {}),
                tap(() => {
                    this._requestAccepted(requestClone, action);
                })
            );
    }
    /**
     * Emits an event on merge request acceptance (IRI of the record being accepted and the target branch IRI)
     * @param requestToAccept Merge Request IRI ID
     * @param {string} action A string representation of the action to take against the mergeRequest
     */
    _requestAccepted(requestToAccept: MergeRequest, action: MergeRequestStatusAction): void {
        if (action === 'accept') {
            const recordId = requestToAccept.recordIri;
            const targetBranchId = requestToAccept.targetBranch['@id'];
            this._mergeRequestActionSubject.next({
                eventType: EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED,
                payload: {
                    recordId,
                    targetBranchId,
                    requestToAccept
                }
            });
        }
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
        return this.spinnerSvc.track(this.http.get<JSONLDObject[][]>(`${this.prefix}/${encodeURIComponent(requestId)}/comments`))
           .pipe(catchError(handleError));
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
    deleteComment(requestId: string, commentId: string): Observable<void> {
        return this.spinnerSvc.track(this.http.delete(`${this.prefix}/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}`))
           .pipe(catchError(handleError), map(() => {}));
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
        return this.spinnerSvc.track(this.http.post(`${this.prefix}/${encodeURIComponent(requestId)}/comments`, 
          commentStr, {params: createHttpParams(params), responseType: 'text'}))
           .pipe(catchError(handleError));
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
    updateComment(requestId: string, commentId: string, commentStr: string): Observable<void> {
        return this.spinnerSvc.track(this.http.put(`${this.prefix}/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}`, 
          commentStr)).pipe(catchError(handleError), map(() => {}));
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
        return this.spinnerSvc.track(this.http.put(`${this.prefix}/${encodeURIComponent(requestId)}`, jsonld, 
          { responseType: 'text' }))
           .pipe(catchError(handleError));
    }
    /**
     * Retrieves the list of creators of merge requests throughout the application using the provided pagination
     * parameters. Results include the user's IRI, display name, and MR count and are ordered by display name.
     * 
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests. Handles `searchText` on
     * top of the default supported params
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable<HttpResponse<UserCount[]>>} An Observable that either resolves with the full HttpResponse
     * of an array of {@link UserCount} objects or is rejected with a error message
     */
    getCreators(paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<UserCount[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        if (get(paginatedConfig, 'searchText')) {
            params = params.set('searchText', paginatedConfig.searchText);
        }
        const url = `${this.prefix}/creators`;
        const request =  this.http.get<UserCount[]>(url, { params, observe: 'response' });  
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Retrieves the list of assignees of merge requests throughout the application using the provided pagination
     * parameters. Results include the user's IRI, display name, and MR count and are ordered by display name.
     *
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests. Handles `searchText` on
     * top of the default supported params
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable<HttpResponse<UserCount[]>>} An Observable that either resolves with the full HttpResponse
     * of an array of {@link UserCount} objects or is rejected with a error message
     */
    getAssignees(paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<UserCount[]>> {
      let params = paginatedConfigToHttpParams(paginatedConfig);
      if (get(paginatedConfig, 'searchText')) {
          params = params.set('searchText', paginatedConfig.searchText);
      }
      const url = `${this.prefix}/assignees`;
      const request =  this.http.get<UserCount[]>(url, { params, observe: 'response' });
      return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Retrieves the list of records of merge requests throughout the application using the provided pagination
     * parameters. Results include the record's IRI, title, and MR count and are ordered by title.
     *
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests. Handles `searchText` on
     * top of the default supported params
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @returns {Observable<HttpResponse<RecordCount[]>>} An Observable that either resolves with the full HttpResponse
     * of an array of {@link RecordCount} objects or is rejected with a error message
     */
    getRecords(paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<RecordCount[]>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        if (get(paginatedConfig, 'searchText')) {
            params = params.set('searchText', paginatedConfig.searchText);
        }
        const url = `${this.prefix}/records`;
        const request =  this.http.get<RecordCount[]>(url, { params, observe: 'response' });
        return this.spinnerSvc.trackedRequest(request, isTracked).pipe(catchError(handleError));
    }
    /**
     * Returns the current status of the passed Merge Request.
     *
     * @param {JSONLDObject} request A MergeRequest JSON-LD object
     * @return {string} a status string corresponding to the current status
     */
    requestStatus(request: JSONLDObject): MergeRequestStatus {
        if (includes(request['@type'], `${MERGEREQ}AcceptedMergeRequest`)) {
            return 'accepted';
        } else if (includes(request['@type'], `${MERGEREQ}ClosedMergeRequest`)) {
            return 'closed';
        } else {
            return 'open';
        }
    }
}
