/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestsState
         *
         * @description
         * The `mergeRequestsState` module only provides the `mergeRequestsStateService` service which
         * contains various variables to hold the state of the Merge Requests page and utility functions
         * to update those variables.
         */
        .module('mergeRequestsState', [])
        /**
         * @ngdoc service
         * @name mergeRequestsState.service:mergeRequestsStateService
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires catalogManager.service:catalogManagerService
         * @requires userManager.service:userManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `mergeRequestsStateService` is a service which contains various variables to hold the
         * state of the Merge Requests page and utility functions to update those variables.
         */
        .service('mergeRequestsStateService', mergeRequestsStateService);

        mergeRequestsStateService.$inject = ['mergeRequestManagerService', 'catalogManagerService', 'userManagerService', 'utilService', 'prefixes', '$q'];

        function mergeRequestsStateService(mergeRequestManagerService, catalogManagerService, userManagerService, utilService, prefixes, $q) {
            var self = this;
            var mm = mergeRequestManagerService;
            var cm = catalogManagerService;
            var um = userManagerService;
            var util = utilService;

            var catalogId = '';

            /**
             * @ngdoc property
             * @name open
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             * @type {Object}
             *
             * @description
             * `open` contains an object with the state of the {@link openTab.directive:openTab open tab}. The structure
             * looks like the following:
             * ```
             * {
             *     active: true // Whether the tab is displayed
             *     selected: {...} // An object representing the currently selected request
             * }
             * ```
             */
            self.open = {
                active: true,
                selected: undefined
            };
            /**
             * @ngdoc property
             * @name showDelete
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             * @type {boolean}
             *
             * @description
             * `showDelete` determines whether the Delete Merge Request {@link confirmationOverlay.directive:confirmationOverlay}
             * should be shown.
             */
            self.showDelete = false;
            /**
             * @ngdoc property
             * @name requestToDelete
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             * @type {Object}
             *
             * @description
             * `requestToDelete` contains an object representing the request that will be deleted from the
             * Delete Merge Request {@link confirmationOverlay.directive:confirmationOverlay}.
             */
            self.requestToDelete = undefined;
            /**
             * @ngdoc property
             * @name createRequest
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
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
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
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
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
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
             * }
             * ```
             */
            self.requestConfig = {
                recordId: '',
                sourceBranchId: '',
                targetBranchId: '',
                title: '',
                description: ''
            };
            /**
             * @ngdoc property
             * @name requests
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             * @type {Object[]}
             *
             * @description
             * `requests` contains an array of objects representing the currently displayed list of Merge Requests.
             * The structure of the objects looks like the following:
             * ```
             * {
             *     request: {...}, // The JSON-LD object of the Merge Request
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
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
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
                    description: ''
                };
            }
            /**
             * @ngdoc method
             * @name initialize
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             *
             * @description
             * Initializes the service by retrieving the
             * {@link catalogManager.service:catalogManagerService local catalog} id.
             */
            self.initialize = function() {
                catalogId = _.get(cm.localCatalog, '@id', '');
            }
            /**
             * @ngdoc method
             * @name initialize
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             *
             * @description
             * Sets `requests` using the {@link mergeRequestManager.service:mergeRequestManagerService}
             * and retrieving any needed metadata about the related VersionedRDFRecord and Branches.
             *
             * @param {boolean} [accepted=false] Whether the list should be accepted Merge Requests or just open ones.
             */
            self.setRequests = function(accepted = false) {
                mm.getRequests()
                    .then(data => {
                        self.requests = _.map(data, request => ({
                            request,
                            title: util.getDctermsValue(request, 'title'),
                            date: getDate(request),
                            creator: getCreator(request),
                            recordIri: util.getPropertyId(request, prefixes.mergereq + 'onRecord')
                        }));
                        var recordsToRetrieve = _.uniq(_.map(self.requests, 'recordIri'));
                        return $q.all(_.map(recordsToRetrieve, iri => cm.getRecord(iri, catalogId)));
                    }, $q.reject)
                    .then(responses => {
                        _.forEach(responses, record => {
                            var title = util.getDctermsValue(record, 'title');
                            _.forEach(_.filter(self.requests, {recordIri: record['@id']}), request => request.recordTitle = title);
                        });
                    }, error => {
                        self.requests = [];
                        util.createErrorToast(error);
                    });
            }
            /**
             * @ngdoc method
             * @name selectRequest
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             *
             * @description
             * Selects the request represented with the provided object for the provided tab and adds
             * more metadata to the request object using the {@link catalogManager.service:catalogManagerService}.
             * This metadata includes the source and target branch with their titles, source and target commits,
             * and the difference between the two commits.
             *
             * @param {Object} request An item from the `requests` arrya that represents the request to select
             * @param {Object} tabObj Either the `open` tab or the `accepted` tab
             */
            self.selectRequest = function(request, tabObj) {
                if (mm.isAccepted(request.request)) {
                    request.sourceTitle = util.getPropertyValue(request.request, prefixes.mergereq + 'sourceBranchTitle');
                    request.targetTitle = util.getPropertyValue(request.request, prefixes.mergereq + 'targetBranchTitle');
                    request.sourceCommit = util.getPropertyId(request.request, prefixes.mergereq + 'sourceCommit')
                    request.targetCommit = util.getPropertyId(request.request, prefixes.mergereq + 'targetCommit')
                    // TODO: Set the difference using the two commits
                    tabObj.selected = request;
                } else {
                    var sourceIri = util.getPropertyId(request.request, prefixes.mergereq + 'sourceBranch');
                    var targetIri = util.getPropertyId(request.request, prefixes.mergereq + 'targetBranch');
                    cm.getRecordBranch(sourceIri, request.recordIri, catalogId)
                        .then(branch => {
                            request.sourceBranch = branch;
                            request.sourceCommit = util.getPropertyId(branch, prefixes.catalog + 'head')
                            request.sourceTitle = util.getDctermsValue(branch, 'title');
                            return cm.getRecordBranch(targetIri, request.recordIri, catalogId)
                        }, $q.reject)
                        .then(branch => {
                            request.targetBranch = branch;
                            request.targetCommit = util.getPropertyId(branch, prefixes.catalog + 'head')
                            request.targetTitle = util.getDctermsValue(branch, 'title');
                            return cm.getBranchDifference(sourceIri, targetIri, request.recordIri, catalogId);
                        }, $q.reject)
                        .then(diff => {
                            request.difference = diff;
                            tabObj.selected = request;
                            return cm.getBranchConflicts(sourceIri, targetIri, request.recordIri, catalogId);
                        }, $q.reject)
                        .then(conflicts => request.hasConflicts = !_.isEmpty(conflicts), util.createErrorToast);
                }
            }
            /**
             * @ngdoc method
             * @name getCurrentTab
             * @propertyOf mergeRequestsState.service:mergeRequestsStateService
             *
             * @description
             * Retrieves the current tab of the Merge Requests module, either `open` or `accepted`.
             *
             * @return {Object} Either the `open` object or the `accepted` object
             */
            self.getCurrentTab = function() {
                return _.find([self.open], 'active');
            }

            function getDate(request) {
                var dateStr = util.getDctermsValue(request, 'issued');
                return util.getDate(dateStr, 'shortDate');
            }
            function getCreator(request) {
                var iri = util.getDctermsId(request, 'creator');
                return _.get(_.find(um.users, {iri}), 'username');
            }
        }
})();
