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
             *     selected: {...} // The currently selected request
             * }
             * ```
             */
            self.open = {
                active: true,
                selected: undefined
            };

            self.showDelete = false;

            self.requestToDelete = undefined;

            self.requests = [];

            self.initialize = function() {
                catalogId = _.get(cm.localCatalog, '@id', '');
            }
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
                        }, util.createErrorToast);
                }
            }
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
