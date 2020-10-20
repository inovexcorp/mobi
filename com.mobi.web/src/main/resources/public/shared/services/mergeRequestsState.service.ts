/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { get, map, uniq, noop, forEach, filter, find, union, concat, difference, merge } from 'lodash';

mergeRequestsStateService.$inject = ['mergeRequestManagerService', 'catalogManagerService', 'userManagerService', 'ontologyManagerService', 'utilService', 'prefixes', '$q'];

/**
 * @ngdoc service
 * @name shared.service:mergeRequestsStateService
 * @requires shared.service:mergeRequestManagerService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:userManagerService
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `mergeRequestsStateService` is a service which contains various variables to hold the
 * state of the Merge Requests page and utility functions to update those variables.
 */
function mergeRequestsStateService(mergeRequestManagerService, catalogManagerService, userManagerService, ontologyManagerService, utilService, prefixes, $q) {
    var self = this;
    var mm = mergeRequestManagerService;
    var cm = catalogManagerService;
    var um = userManagerService;
    var om = ontologyManagerService;
    var util = utilService;

    var catalogId = '';

    /**
     * @ngdoc property
     * @name selected
     * @propertyOf shared.service:mergeRequestsStateService
     * @type {Object}
     *
     * @description
     * `selected` contains an object representing the currently selected request.
     */
    self.selected = undefined;
    /**
     * @ngdoc property
     * @name acceptedFilter
     * @propertyOf mergeRequestsState.service.mergeRequestsStateService
     * @type {boolean}
     *
     * @description
     * `acceptedFilter` determines whether accepted or open Merge Requests should be shown in the
     * {@link mergeRequestList.directive:mergeRequestList}.
     */
    self.acceptedFilter = false
    /**
     * @ngdoc property
     * @name createRequest
     * @propertyOf shared.service:mergeRequestsStateService
     * @type {boolean}
     *
     * @description
     * `createRequest` determines whether a Merge Request is being created and thus whether the
     * {@link createMergeRequest.directive:createMergeRequest} should be shown.
     */
    self.createRequest = false;
    /**
     * @ngdoc property
     * @name createRequestStep
     * @propertyOf shared.service:mergeRequestsStateService
     * @type {number}
     *
     * @description
     * `createRequestStep` contains the index of the current step of the Create Merge Request process.
     * Currently, there are only 3 steps.
     */
    self.createRequestStep = 0;
    /**
     * @ngdoc property
     * @name requestConfig
     * @propertyOf shared.service:mergeRequestsStateService
     * @type {Object}
     *
     * @description
     * `requestConfig` contains an object with the configurations for a new Merge Request. The structure of
     * the object looks like the following:
     * ```
     * {
     *     recordId: '', // The IRI of the VersionedRDFRecord that the Merge Request is related to,
     *     sourceBranchId: '', // The IRI of the source Branch for the Merge Request
     *     targetBranchId: '', // The IRI of the target Branch for the Merge Request
     *     title: '', // The title for the Merge Request
     *     description: '' // The description for the Merge Request
     *     removeSource: false // A boolean indicating whether the source branch should be removed upon acceptance
     *     entityNames: {} // An object representing the entity names associated with the source record
     *     startIndex: 0 // The startIndex indicating how many differences have been loaded for usage when navigating between tabs
     * }
     * ```
     */
    self.requestConfig = {
        recordId: '',
        sourceBranchId: '',
        targetBranchId: '',
        title: '',
        description: '',
        assignees: [],
        removeSource: false,
        entityNames: {},
        startIndex: 0
    };
    /**
     * @ngdoc property
     * @name requests
     * @propertyOf shared.service:mergeRequestsStateService
     * @type {Object[]}
     *
     * @description
     * `requests` contains an array of objects representing the currently displayed list of Merge Requests.
     * The structure of the objects looks like the following:
     * ```
     * {
     *     jsonld: {...}, // The JSON-LD object of the Merge Request
     *     title: '', // The title of the Merge Request
     *     date: '', // A string representation of the date the Merge Request was created
     *     creator: {...}, // The object representing the user that created the Merge Request
     *     recordIri: '', // The IRI of the VersionedRDFRecord the Merge Request relates to,
     *     recordTitle: '' // The title of the related VersionedRDFRecord
     * }
     * ```
     */
    self.requests = [];

    /**
     * @ngdoc method
     * @name startCreate
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Starts the Create Merge Request process by setting the appropriate state variables.
     */
    self.startCreate = function() {
        self.createRequest = true;
        self.createRequestStep = 0;
        self.requestConfig = {
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            title: '',
            description: '',
            assignees: [],
            entityNames: {},
            startIndex: 0
        };
    }
    /**
     * @ngdoc method
     * @name initialize
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Initializes the service by retrieving the
     * {@link shared.service:catalogManagerService local catalog} id.
     */
    self.initialize = function() {
        catalogId = get(cm.localCatalog, '@id', '');
    }
    /**
     * @ngdoc method
     * @name reset
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Resets important state variables.
     */
    self.reset = function() {
        self.requestConfig = {
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            title: '',
            description: '',
            assignees: [],
            entityNames: {},
            startIndex: 0
        };
        self.createRequest = false;
        self.createRequestStep = 0;
        self.selected = undefined;
    }
    /**
     * @ngdoc method
     * @name setRequests
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Sets `requests` using the {@link shared.service:mergeRequestManagerService}
     * and retrieving any needed metadata about the related VersionedRDFRecord and Branches.
     *
     * @param {boolean} [accepted=false] Whether the list should be accepted Merge Requests or just open ones.
     */
    self.setRequests = function(accepted = false) {
        var recordsToRetrieve;
        mm.getRequests({accepted})
            .then(data => {
                self.requests = map(data, self.getRequestObj);
                recordsToRetrieve = uniq(map(self.requests, 'recordIri'));
                return $q.all(map(recordsToRetrieve, iri => cm.getRecord(iri, catalogId)));
            }, $q.reject)
            .then(responses => {
                var matchingRecords = map(responses, response => find(response, mr => recordsToRetrieve.includes(mr['@id'])));
                forEach(matchingRecords, record => {
                    var title = util.getDctermsValue(record, 'title');
                    forEach(filter(self.requests, {recordIri: record['@id']}), request => request.recordTitle = title);
                });
            }, error => {
                self.requests = [];
                util.createErrorToast(error);
            });
    }
    /**
     * @ngdoc method
     * @name setRequestDetails
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Adds more metadata on the provided object that represents a merge request using the
     * {@link shared.service:catalogManagerService}. This metadata includes the source and target
     * branch with their titles, source and target commits, and the difference between the two commits.
     *
     * @param {Object} request An item from the `requests` array that represents the request to select
     *
     * @return {Promise} A Promise indicating the success of the resolution
     */
    self.setRequestDetails = function(request) {
        request.sourceTitle = '';
        request.targetTitle = '';
        request.sourceBranch = '';
        request.targetBranch = '';
        request.sourceCommit = '';
        request.targetCommit = '';
        request.removeSource = '';
        request.difference = '';
        request.comments = [];
        request.entityNames = {};
        request.startIndex = 0;
        return mm.getComments(request.jsonld['@id'])
            .then(comments => {
                request.comments = comments;
                if (mm.isAccepted(request.jsonld)) {
                    request.sourceTitle = util.getPropertyValue(request.jsonld, prefixes.mergereq + 'sourceBranchTitle');
                    request.targetTitle = util.getPropertyValue(request.jsonld, prefixes.mergereq + 'targetBranchTitle');
                    request.sourceCommit = util.getPropertyId(request.jsonld, prefixes.mergereq + 'sourceCommit')
                    request.targetCommit = util.getPropertyId(request.jsonld, prefixes.mergereq + 'targetCommit')
                    return cm.getDifference(request.sourceCommit, request.targetCommit, cm.differencePageSize, 0)
                        .then(response => {
                            return self.getSourceEntityNames(request, response);
                        }, $q.reject)
                        .then(noop, util.createErrorToast);
                } else {
                    var sourceIri = util.getPropertyId(request.jsonld, prefixes.mergereq + 'sourceBranch');
                    var targetIri = util.getPropertyId(request.jsonld, prefixes.mergereq + 'targetBranch');
                    var promise = cm.getRecordBranch(sourceIri, request.recordIri, catalogId)
                        .then(branch => {
                            request.sourceBranch = branch;
                            request.sourceCommit = util.getPropertyId(branch, prefixes.catalog + 'head')
                            request.sourceTitle = util.getDctermsValue(branch, 'title');
                            request.removeSource = self.removeSource(request.jsonld);
                        }, $q.reject);

                    if (targetIri) {
                        return promise.then(() => cm.getRecordBranch(targetIri, request.recordIri, catalogId), $q.reject)
                            .then(branch => {
                                request.targetBranch = branch;
                                request.targetCommit = util.getPropertyId(branch, prefixes.catalog + 'head')
                                request.targetTitle = util.getDctermsValue(branch, 'title');
                                return cm.getDifference(request.sourceCommit, request.targetCommit, cm.differencePageSize, 0);
                            }, $q.reject)
                            .then(response => {
                                return self.getSourceEntityNames(request, response);
                            }, $q.reject)
                            .then(() => {
                                return cm.getBranchConflicts(sourceIri, targetIri, request.recordIri, catalogId)
                            }, $q.reject)
                            .then(conflicts => request.conflicts = conflicts, util.createErrorToast);
                    } else {
                        return promise.then(noop, util.createErrorToast);
                    }
                }
            }, util.createErrorToast);
    }
    /**
     * @ngdoc method
     * @name resolveRequestConflicts
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Resolves the conflicts for the provided Merge Request by making a merge from the request's target into
     * the source with the provided resolution statements. Will also reset the details on the provided request
     * after a successful merge.
     *
     * @param {Object} request An item from the `requests` array that represents the request to resolve
     * conflicts for
     * @param {Object} resolutions An object with keys for the `additions` and `deletions` JSON-LD objects for
     * the merge commit
     * @return {Promise} A Promise indicating the success of the resolution
     */
    self.resolveRequestConflicts = function(request, resolutions) {
        return cm.mergeBranches(request.targetBranch['@id'], request.sourceBranch['@id'], request.recordIri, catalogId, resolutions)
            .then(() => {
                self.setRequestDetails(request);
            }, $q.reject);
    }
    /**
     * @ngdoc method
     * @name removeSource
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Checks if the JSON-LD for a Merge Request has the removeSource property set to true. Returns boolean result.
     *
     * @param {Object} jsonld The JSON-LD of a Merge Request
     * @returns {boolean} True if the removeSource property is true, otherwise false
     */
    self.removeSource = function(jsonld) {
        return util.getPropertyValue(jsonld, prefixes.mergereq + 'removeSource') === 'true';
    }
    /**
     * @ngdoc method
     * @name deleteRequest
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Deletes the provided Merge Request from the application. If successful, unselects the current `selected`
     * request and updates the list of requests. Displays an error toast if unsuccessful.
     *
     * @param {Object} request An item from the `requests` array that represents the request to delete
     */
    self.deleteRequest = function(request) {
        mm.deleteRequest(request.jsonld['@id'])
            .then(() => {
                var hasSelected = !!self.selected;
                self.selected = undefined;
                util.createSuccessToast('Request successfully deleted');
                if (!hasSelected) {
                    self.setRequests(self.acceptedFilter);
                }
            }, util.createErrorToast);
    }
    /**
     * @ngdoc method
     * @name getRequestObj
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Transforms the provided JSON-LD into a `requests` object.
     *
     * @param {Object} jsonld The JSON-LD representation of the `requests` object
     */
    self.getRequestObj = function(jsonld) {
        return {
            jsonld,
            title: util.getDctermsValue(jsonld, 'title'),
            date: getDate(jsonld),
            creator: getCreator(jsonld),
            recordIri: util.getPropertyId(jsonld, prefixes.mergereq + 'onRecord'),
            assignees: map(get(jsonld, "['" + prefixes.mergereq + "assignee']"), obj => get(find(um.users, {iri: obj['@id']}), 'username'))
        };
    }
    /**
     * @ngdoc method
     * @name getSourceEntityNames
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Populates the request.entityNames object with EntityNames of entities with an addition or deletion. Difference setting
     * is delayed until after the entityNames are present. This allows for the statementDisplay to calculate the entityNames
     * once on changes, rather than requiring a binding to constantly calculate the names.
     *
     * @param {Object} request A request or requestConfig object that contains branch information
     * @param {Object} response A response containing a difference object to update the request with once entityNames are populated
     *
     * @return {Promise} A Promise indicating the success of retrieving entityNames
     */
    self.getSourceEntityNames = function(request, response) {
        if (!response) {
            return $q.reject('Difference is not set. Cannot get ontology entity names.');
        }
        var difference = response.data;
        var recordIri = request.recordId ? request.recordId : request.recordIri;
        var diffIris = union(map(difference.additions, '@id'), map(difference.deletions, '@id'));
        var iris = union(diffIris, util.getObjIrisFromDifference(difference.additions), util.getObjIrisFromDifference(difference.deletions));

        if (iris.length > 0) {
            return om.getOntologyEntityNames(recordIri, get(request.sourceBranch, '@id'), request.sourceCommit, false, false, iris)
                .then(data => {
                    merge(request.entityNames, data);
                    if (!request.difference) {
                        request.difference = {
                            additions: [],
                            deletions: []
                        }
                    }
                    request.difference.additions = concat(request.difference.additions, difference.additions);
                    request.difference.deletions = concat(request.difference.deletions, difference.deletions);
                    var headers = response.headers();
                    request.difference.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
                    return $q.when();
                }, error => {
                    if (!request.difference) {
                        request.difference = {
                            additions: [],
                            deletions: []
                        }
                    }
                    request.difference.additions = concat(request.difference.additions, difference.additions);
                    request.difference.deletions = concat(request.difference.deletions, difference.deletions);
                    var headers = response.headers();
                    request.difference.hasMoreResults = get(headers, 'has-more-results', false) === 'true';
                    return $q.reject(error);
                });
        } else {
            return $q.when();
        }
    }
    /**
     * @ngdoc method
     * @name getEntityNameLabel
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * If the iri exists in self.requestConfig.entityNames or self.selected.entityNames, returns the label. Otherwise,
     * returns the beautiful iri.
     *
     * @param {string} iri The iri of an entity in the merge request
     *
     * @return {string} The entity name of the provided IRI
     */
    self.getEntityNameLabel = function(iri) {
        if (get(self, ['requestConfig', 'entityNames', iri, 'label'])) {
            return self.requestConfig.entityNames[iri].label;
        } else if (get(self, ['selected', 'entityNames', iri, 'label'])) {
            return self.selected.entityNames[iri].label;
        } else {
            return util.getBeautifulIRI(iri);
        }
    }
    /**
     * @ngdoc method
     * @name updateRequestConfigDifference
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Updates the requestConfig.difference with the difference between the requestConfig.sourceBranch and
     * requestConfig.targetBranch. Once successful
     *
     * @return {Promise} A Promise indicating the success of updating the requestConfig difference
     */
    self.updateRequestConfigDifference = function() {
        self.requestConfig.difference = undefined;
        return cm.getDifference(util.getPropertyId(self.requestConfig.sourceBranch, prefixes.catalog + 'head'), util.getPropertyId(self.requestConfig.targetBranch, prefixes.catalog + 'head'), cm.differencePageSize, 0)
            .then(response => {
                return self.getSourceEntityNames(self.requestConfig, response);
            }, $q.reject)
            .then(noop, errorMessage => {
                self.requestConfig.difference = undefined;
                self.requestConfig.entityNames = undefined;
                return $q.reject(errorMessage);
            });
    }
    /**
     * @ngdoc method
     * @name updateRequestConfigBranch
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Checks the current `branchType` of 'sourceBranch' or 'targetBranch' against the `branches` provided for newer
     * head commits or if the branch has been deleted. Updates the requestConfig[branchType] accordingly.
     *
     * @param {string} branchType A string indicating if it is a 'sourceBranch' or a 'targetBranch'
     * @param {Object[]} branches The list of branches to check against
     */
    self.updateRequestConfigBranch = function(branchType, branches) {
        var branchId = get(self, ['requestConfig', branchType, '@id']);
        if (!branchId) {
            return;
        }
        var latestBranch = find(branches, {'@id': branchId});
        if (latestBranch) {
            var latestHead = util.getPropertyId(latestBranch, prefixes.catalog + 'head');
            var selectedHead = util.getPropertyId(self.requestConfig[branchType], prefixes.catalog + 'head');
            if (latestHead !== selectedHead) {
                self.requestConfig[branchType] = latestBranch;
            }
        } else {
            self.requestConfig[branchType] = undefined;
        }
    }
    /**
     * @ngdoc method
     * @name retrieveMoreResults
     * @propertyOf shared.service:mergeRequestsStateService
     *
     * @description
     * Updates the request difference based on the provided limit and offset. Combines the results with any previous
     * difference information.
     *
     * @param limit {int} The limit of results to retrieve
     * @param offset {int} The paged offset specifying where to continue retrieval from
     */
    self.retrieveMoreResults = function(limit, offset) {
        var request;
        if (self.selected && self.selected.difference) {
            request = self.selected;
        } else if (self.requestConfig && self.requestConfig.difference) {
            request = self.requestConfig;
        } else {
            util.createErrorToast("Could not load more results.");
        }
        var sourceHead = util.getPropertyId(request.sourceBranch, prefixes.catalog + 'head');
        if (!sourceHead) {
            sourceHead = request.sourceCommit;
        }
        var targetHead = util.getPropertyId(request.targetBranch, prefixes.catalog + 'head');
        if (!targetHead) {
            targetHead = request.targetCommit;
        }
        request.startIndex = offset;
        cm.getDifference(sourceHead, targetHead, limit, offset)
            .then(response => {
                return self.getSourceEntityNames(request, response);
            }, $q.reject)
            .then(noop, util.createErrorToast);
    }

    function getDate(jsonld) {
        var dateStr = util.getDctermsValue(jsonld, 'issued');
        return util.getDate(dateStr, 'shortDate');
    }
    function getCreator(jsonld) {
        var iri = util.getDctermsId(jsonld, 'creator');
        return get(find(um.users, {iri}), 'username');
    }
}

export default mergeRequestsStateService;