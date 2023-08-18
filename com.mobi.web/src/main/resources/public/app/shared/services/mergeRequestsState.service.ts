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
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { get, map, uniq, noop, forEach, filter, find, union, concat, merge } from 'lodash';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CATALOG, MERGEREQ, OWL, ONTOLOGYEDITOR } from '../../prefixes';

import { CommitDifference } from '../models/commitDifference.interface';
import { Conflict } from '../models/conflict.interface';
import { Difference } from '../models/difference.class';
import { EntityNames } from '../models/entityNames.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequest } from '../models/mergeRequest.interface';
import { MergeRequestConfig } from '../models/mergeRequestConfig.interface';
import { CatalogManagerService } from './catalogManager.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { UserManagerService } from './userManager.service';
import { UtilService } from './util.service';
import { SortOption } from '../models/sortOption.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { MergeRequestPaginatedConfig } from '../models/mergeRequestPaginatedConfig.interface';

/**
 * @class shared.MergeRequestsStateService
 *
 * A service which contains various variables to hold the state of the Merge Requests page and utility functions to
 * update those variables.
 */
@Injectable()
export class MergeRequestsStateService {
    catalogId = '';
    /**
     * `totalRecordSize` holds an integer for the total number of merge  request in the latest query on the
     * @type {number}
     */
    totalRecordSize = 0;
    /**
     * `currentRecordPage` holds an 0 based index indicating which page of merge request should be displayed
     * @type {number}
     */
    currentRecordPage = 0;
    /**
     * `recordLimit` holds an integer representing the maximum number of merge request to be shown in a page
     * @type {number}
     */
    recordLimit = 10;
    /**
     * `recordSortOption` holds one of the options from the `sortOptions` in the
     * @type {SortOption}
     */
    recordSortOption: SortOption = undefined;
    /**
     * Indicates if the merge Request is accepted or open.
     * @type {boolean}
     */
    requestStatus: boolean;
    recordType: string;

    constructor(private mm: MergeRequestManagerService, private cm: CatalogManagerService,
        private um: UserManagerService, private om: OntologyManagerService, private util: UtilService) {}

    /**
     * Contains an object representing the currently selected request.
     * @type {MergeRequest}
     */
    selected: MergeRequest = undefined;
    /**
     * Determines whether accepted or open Merge Requests should be shown in the
     * {@link merge-requests.MergeRequestListComponent}.
     * @type {boolean}
     */
    acceptedFilter = false
    /**
     * Determines whether a Merge Request is being created and thus whether the
     * {@link merge-request.CreateMergeRequestComponent} should be shown.
     * @type {boolean}
     */
    createRequest = false;
    /**
     * Contains the index of the current step of the Create Merge Request process.
     * Currently, there are only 3 steps.
     * @type {number}
     */
    createRequestStep = 0;
    /**
     * Contains an object with the configurations for a new Merge Request.
     * @type {MergeRequestConfig}
     */
    requestConfig: MergeRequestConfig = {
        recordId: '',
        sourceBranchId: '',
        targetBranchId: '',
        title: '',
        description: '',
        assignees: [],
        removeSource: false,
    };
    /**
     * The Record JSON-LD object for the currently selected/in progress merge request
     * @type {JSONLDObject}
     */
    selectedRecord: JSONLDObject;
    /**
     * Contains an array of objects representing the currently displayed list of Merge Requests.
     * @type {MergeRequest[]}
     */
    requests: MergeRequest[] = [];
    /**
     * The map of entity IRIs to labels and names for the difference of the currently selected Merge Request, `selected`,
     * or the Merge Request being generated, `requestConfig`
     */
    entityNames: EntityNames = {};
    /**
     * The index of the Difference of the currently selected Merge Request, `selected`, or the Merge Request being
     * generated, `requestConfig`
     * @type {number}
     */
    startIndex = 0;
    /**
     * The Difference between the source and target Branch of the currently selected Merge Request, `selected`, or the
     * Merge Request being generated, `requestConfig`
     * @type {Difference}
     */
    difference: Difference;
    /**
     * Whether the same branch has been selected as both the source and target when creating a Merge Request. It's
     * stored on the state to carry the validation from the {@link merge-requests.RequestBranchSelectComponent} to the
     * {@link merge-requests.CreateRequestComponent}.
     * @type boolean
     */
    sameBranch = false;

    /**
     * Starts the Create Merge Request process by setting the appropriate state variables.
     */
    startCreate(): void {
        this.createRequest = true;
        this.createRequestStep = 0;
        this.requestConfig = {
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            title: '',
            description: '',
            assignees: [],
            removeSource: false,
        };
        this.selectedRecord = undefined;
        this.clearDifference();
    }
    /**
     * Initializes the service by retrieving the {@link shared.CatalogManagerService local catalog} id.
     */
    initialize(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    /**
     * Resets important state variables.
     */
    reset(): void {
        this.createRequest = false;
        this.createRequestStep = 0;
        this.selected = undefined;
        this.requestConfig = {
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            title: '',
            description: '',
            assignees: [],
            removeSource: false,
        };
        this.selectedRecord = undefined;
        this.clearDifference();
        this.sameBranch = false;
        this.acceptedFilter = false;
        this.totalRecordSize = 0;
        this.currentRecordPage = 1;
        this.recordSortOption = undefined;
    }
    /**
     * Clears all variables associated with calculating the Difference of a MergeRequest
     */
    clearDifference(): void {
        this.difference = undefined;
        this.entityNames = {};
        this.startIndex = 0;
    }
    /**
     * Sets `requests` using the {@link shared.MergeRequestManagerService} and retrieving any needed metadata about the
     * related VersionedRDFRecord and Branches.
     *
     * @param {boolean} [accepted=false] Whether the list should be accepted Merge Requests or just open ones.
     */
    setRequests( paginatedConfig: MergeRequestPaginatedConfig): void {
        let recordsToRetrieve;
        this.mm.getRequests(paginatedConfig)
            .pipe(
                switchMap((data: HttpResponse<JSONLDObject[]>) => {
                    this.requests = data.body.map(obj => this.getRequestObj(obj));
                    this.totalRecordSize = this.requests.length;
                    recordsToRetrieve = uniq(map(this.requests, 'recordIri'));
                    return forkJoin(recordsToRetrieve.map(iri => this.cm.getRecord(iri, this.catalogId)));
                })
            ).subscribe((responses: JSONLDObject[][]) => {
                const matchingRecords: JSONLDObject[] = responses.map(recordArr => recordArr.find(jsonldObj => recordsToRetrieve.includes(jsonldObj['@id'])));
                forEach(matchingRecords, record => {
                    const title = this.util.getDctermsValue(record, 'title');
                    const type = record['@type'].find(type => ![
                        OWL + 'Thing',
                        CATALOG + 'Record',
                        CATALOG + 'VersionedRecord',
                        CATALOG + 'VersionedRDFRecord',
                    ].includes(type));
                    filter(this.requests, {recordIri: record['@id']}).forEach(request => {
                        request.recordTitle = title;
                        request.recordType = type;
                    });
                });
            }, error => {
                this.requests = [];
                this.util.createErrorToast(error);
            });
    }
    /**
     * Adds more metadata on the provided object that represents a merge request using the
     * {@link shared.CatalogManagerService}. This metadata includes the source and target branch with their titles,
     * source and target commits, and the difference between the two commits.
     *
     * @param {MergeRequest} request An item from the `requests` array that represents the request to select
     */
    setRequestDetails(request: MergeRequest): Observable<null> {
        const emptyObject: JSONLDObject = {'@id': ''};
        request.sourceTitle = '';
        request.targetTitle = '';
        request.sourceBranch = emptyObject;
        request.targetBranch = emptyObject;
        request.sourceCommit = '';
        request.targetCommit = '';
        request.removeSource = undefined;
        request.comments = [];
        if (this.mm.isAccepted(request.jsonld)) {
            request.sourceTitle = this.util.getPropertyValue(request.jsonld, MERGEREQ + 'sourceBranchTitle');
            request.targetTitle = this.util.getPropertyValue(request.jsonld, MERGEREQ + 'targetBranchTitle');
            request.sourceCommit = this.util.getPropertyId(request.jsonld, MERGEREQ + 'sourceCommit');
            request.targetCommit = this.util.getPropertyId(request.jsonld, MERGEREQ + 'targetCommit');
            return this.mm.getComments(request.jsonld['@id'])
                .pipe(switchMap(comments => {
                    request.comments = comments;
                    return this.cm.getDifference(request.sourceCommit, request.targetCommit, this.cm.differencePageSize, 0);
                }),
                switchMap((response: HttpResponse<CommitDifference>) => {
                    return this.processDifferenceResponse(request.recordIri, '', request.sourceCommit, response, request.recordType);
                }));
        } else {
            return this.mm.getComments(request.jsonld['@id'])
                .pipe(
                    switchMap(comments => {
                        request.comments = comments;
                        const sourceIri = this.util.getPropertyId(request.jsonld, MERGEREQ + 'sourceBranch');
                        return this.cm.getRecordBranch(sourceIri, request.recordIri, this.catalogId);
                    }),
                    switchMap((branch: JSONLDObject) => {
                        request.sourceBranch = branch;
                        request.sourceCommit = this.util.getPropertyId(branch, CATALOG + 'head');
                        request.sourceTitle = this.util.getDctermsValue(branch, 'title');
                        request.removeSource = this.shouldRemoveSource(request.jsonld);
                        
                        const targetIri = this.util.getPropertyId(request.jsonld, MERGEREQ + 'targetBranch');
                        if (targetIri) {
                            return this.cm.getRecordBranch(targetIri, request.recordIri, this.catalogId)
                                .pipe(
                                    switchMap((branch: JSONLDObject) => {
                                        request.targetBranch = branch;
                                        request.targetCommit = this.util.getPropertyId(branch, CATALOG + 'head');
                                        request.targetTitle = this.util.getDctermsValue(branch, 'title');
                                        return this.cm.getDifference(request.sourceCommit, request.targetCommit, this.cm.differencePageSize, 0);
                                    }),
                                    switchMap((response: HttpResponse<CommitDifference>) => {
                                        return this.processDifferenceResponse(request.recordIri, request.sourceBranch['@id'], request.sourceCommit, response, request.recordType);
                                    }),
                                    switchMap(() => {
                                        return this.cm.getBranchConflicts(request.sourceBranch['@id'], targetIri, request.recordIri, this.catalogId);
                                    }),
                                    switchMap((conflicts: Conflict[]) => {
                                        request.conflicts = conflicts;
                                        return of(null);
                                    })
                                );
                        } else {
                            return of(null);
                        }
                    })
                );
        }
    }
    /**
     * Resolves the conflicts for the provided Merge Request by making a merge from the request's target into the source
     * with the provided resolution statements in a Difference. Will also reset the details on the provided request
     * after a successful merge.
     *
     * @param {MergeRequest} request An item from the `requests` array that represents the request to resolve
     * conflicts for
     * @param {Difference} resolutions An object with keys for the `additions` and `deletions` JSON-LD objects for
     * the merge commit
     * @return {Observable} An Observable indicating the success of the resolution
     */
    resolveRequestConflicts(request: MergeRequest, resolutions: Difference): Observable<null> {
        return this.cm.mergeBranches(request.targetBranch['@id'], request.sourceBranch['@id'], request.recordIri, this.catalogId, resolutions)
            .pipe(switchMap(() => {
                return this.setRequestDetails(request);
            }));
    }
    /**
     * Checks if the JSON-LD for a Merge Request has the removeSource property set to true. Returns boolean result.
     *
     * @param {JSONLDObject} jsonld The JSON-LD of a Merge Request
     * @returns {boolean} True if the removeSource property is true, otherwise false
     */
    shouldRemoveSource(jsonld: JSONLDObject): boolean {
        return this.util.getPropertyValue(jsonld, MERGEREQ + 'removeSource') === 'true';
    }
    /**
     * Deletes the provided Merge Request from the application. If successful, unselects the current `selected` request
     * and updates the list of requests. Displays an error toast if unsuccessful.
     *
     * @param {MergeRequest} request An Merge Request that should be deleted
     */
    deleteRequest(request: MergeRequest): void {
        this.mm.deleteRequest(request.jsonld['@id'])
            .subscribe(() => {
                const hasSelected = !!this.selected;
                this.selected = undefined;
                this.util.createSuccessToast('Request successfully deleted');
                if (!hasSelected) {
                    this.setRequests({accepted: this.acceptedFilter});
                }
            }, this.util.createErrorToast);
    }
    /**
     * Transforms the provided JSON-LD into a MergeRequest object.
     *
     * @param {JSONLDObject} jsonld The JSON-LD representation of a Merge Request
     * @returns {MergeRequest} A MergeRequest object representing the provided JSON-LD
     */
    getRequestObj(jsonld: JSONLDObject): MergeRequest {
        return {
            jsonld,
            title: this.util.getDctermsValue(jsonld, 'title'),
            description: this.util.getDctermsValue(jsonld, 'description') || 'No description',
            date: this._getDate(jsonld),
            creator: this._getCreator(jsonld),
            recordIri: this.util.getPropertyId(jsonld, MERGEREQ + 'onRecord'),
            assignees: map(get(jsonld, '[\'' + MERGEREQ + 'assignee\']'), obj => get(find(this.um.users, {iri: obj['@id']}), 'username'))
        };
    }
    /**
     * Processes the response from a `CatalogManagerService.getDifference` call and populates the `entityNames` variable
     * given the provided OntologyRecord identifiers (recordId, branchId, and commitId). Difference setting is delayed
     * until after the entityNames are present. This allows for the statementDisplay to calculate the entityNames once
     * on changes, rather than requiring a binding to constantly calculate the names.
     *
     * @param {string} recordId The IRI of the OntologyRecord referenced by a MergeRequest
     * @param {string} sourceBranchId The IRI of the source Branch of an OntologyRecord referenced by a MergeRequest
     * @param {string} commitId The IRI of the source Commit referenced by a Merge Request
     * @param {HttpResponse<CommitDifference>} diffResponse A response containing a Difference object to set once
     * entityNames are populated
     * @return {Observable} An Observable indicating the success of retrieving entityNames
     */
    processDifferenceResponse(recordId: string, sourceBranchId: string, commitId: string,
        diffResponse: HttpResponse<CommitDifference>, type: string): Observable<null> {
        if (!diffResponse) {
            return throwError('Difference is not set. Cannot get ontology entity names.');
        }
        const difference = diffResponse.body;
        const diffIris = union(map(difference.additions as JSONLDObject[], '@id'), map(difference.deletions as JSONLDObject[], '@id'));
        const iris = union(diffIris, this.util.getObjIrisFromDifference(difference.additions as JSONLDObject[]), this.util.getObjIrisFromDifference(difference.deletions as JSONLDObject[]));

        if (iris.length > 0) {
            if (type === ONTOLOGYEDITOR + 'OntologyRecord') {
                return this.om.getOntologyEntityNames(recordId, sourceBranchId, commitId, false, false, iris)
                    .pipe(
                        switchMap(data => {
                            merge(this.entityNames, data);
                            this.setDifference(diffResponse);
                            return of(null);
                        }),
                        catchError(error => {
                            this.setDifference(diffResponse);
                            return throwError(error);
                        })
                    );
            } else {
                this.entityNames = {};
                this.setDifference(diffResponse);
                return of(null);
            }
            
        } else {
            this.difference = new Difference();
            return of(null);
        }
    }
    /**
     * Sets the `difference` variable given the response from a CatalogManagerService.getDifference call.
     * 
     * @param {HttpResponse<CommitDifference>} diffResponse A response from a CatalogManagerService.getDifference call
     */
    setDifference(diffResponse: HttpResponse<CommitDifference>): void {
        const difference = diffResponse.body;
        if (!this.difference) {
            this.difference = new Difference();
        }
        this.difference.additions = concat(this.difference.additions as JSONLDObject[], difference.additions as JSONLDObject[]);
        this.difference.deletions = concat(this.difference.deletions as JSONLDObject[], difference.deletions as JSONLDObject[]);
        const headers = diffResponse.headers;
        this.difference.hasMoreResults = headers.get('has-more-results') === 'true';
    }
    /**
     * If the iri exists in requestConfig.entityNames or selected.entityNames, returns the label. Otherwise,
     * returns the beautiful iri.
     *
     * @param {string} iri The iri of an entity in the merge request
     * @return {string} The entity name of the provided IRI
     */
    getEntityNameLabel(iri: string): string {
        if (get(this.entityNames, [iri, 'label'])) {
            return this.entityNames[iri].label;
        } else {
            return this.util.getBeautifulIRI(iri);
        }
    }
    /**
     * Updates `difference` with the Difference for the Merge Request being generated, `requestConfig` between the
     * source Branch and the target Branch.
     *
     * @return {Observable} An Observable indicating the success of updating the requestConfig difference
     */
    updateRequestConfigDifference(): Observable<null> {
        this.clearDifference();
        return this.cm.getDifference(this.util.getPropertyId(this.requestConfig.sourceBranch, CATALOG + 'head'), this.util.getPropertyId(this.requestConfig.targetBranch, CATALOG + 'head'), this.cm.differencePageSize, 0)
            .pipe(
                switchMap((response: HttpResponse<CommitDifference>) => {
                    return this.processDifferenceResponse(this.requestConfig.recordId, this.requestConfig.sourceBranchId, this.util.getPropertyId(this.requestConfig.sourceBranch, CATALOG + 'head'), response, this.selected ? this.selected.recordType : this.cm.getType(this.selectedRecord));
                }),
                catchError(errorMessage => {
                    this.clearDifference();
                    return throwError(errorMessage);
                })
            );
    }
    /**
     * Checks the current `branchType` of 'sourceBranch' or 'targetBranch' against the `branches` provided for newer
     * head commits or if the branch has been deleted. Updates the requestConfig[branchType] accordingly.
     *
     * @param {string} branchType A string indicating if it is a 'sourceBranch' or a 'targetBranch'
     * @param {JSONLDObject[]} branches The list of branches to check against
     */
    updateRequestConfigBranch(branchType: string, branches: JSONLDObject[]): void {
        if (!['sourceBranch', 'targetBranch'].includes(branchType)) {
            return;
        }
        const branchId = get(this.requestConfig, [branchType, '@id']);
        if (!branchId) {
            return;
        }
        const latestBranch = find(branches, {'@id': branchId});
        if (latestBranch) {
            this.requestConfig[branchType] = latestBranch;
        } else {
            this.requestConfig[branchType] = undefined;
        }
    }
    /**
     * Updates the request difference based on the provided limit and offset. Combines the results with any previous
     * difference information.
     *
     * @param limit {int} The limit of results to retrieve
     * @param offset {int} The paged offset specifying where to continue retrieval from
     */
    retrieveMoreResults(paginationDetails: {limit: number, offset: number}): void {
        if (!this.selected && !this.requestConfig.recordId) {
            this.util.createErrorToast('Could not load more results.');
            return;
        }
        const sourceBranch = this.selected ? this.selected.sourceBranch : this.requestConfig.sourceBranch;
        const sourceHead = this.util.getPropertyId(sourceBranch, CATALOG + 'head') || this.selected.sourceCommit;
        const targetBranch = this.selected ? this.selected.targetBranch : this.requestConfig.targetBranch;
        const targetHead = this.util.getPropertyId(targetBranch, CATALOG + 'head') || this.selected.targetCommit;
        this.startIndex = paginationDetails.offset;
        this.cm.getDifference(sourceHead, targetHead, paginationDetails.limit, paginationDetails.offset)
            .pipe(switchMap((response: HttpResponse<CommitDifference>) => {
                return this.processDifferenceResponse(this.selected ? this.selected.recordIri : this.requestConfig.recordId, sourceBranch['@id'], sourceHead, response, this.selected ? this.selected.recordType : this.cm.getType(this.selectedRecord));
            }))
            .subscribe(noop, this.util.createErrorToast);
    }

    private _getDate(jsonld: JSONLDObject) {
        const dateStr = this.util.getDctermsValue(jsonld, 'issued');
        return this.util.getDate(dateStr, 'shortDate');
    }
    private _getCreator(jsonld: JSONLDObject) {
        const iri = this.util.getDctermsId(jsonld, 'creator');
        return get(find(this.um.users, {iri}), 'username');
    }
}
