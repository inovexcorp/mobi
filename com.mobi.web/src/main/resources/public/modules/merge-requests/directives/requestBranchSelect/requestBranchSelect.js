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
         * @name requestBranchSelect
         *
         * @description
         * The `requestBranchSelect` module only provides the `requestBranchSelect` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('requestBranchSelect', [])
        /**
         * @ngdoc directive
         * @name requestBranchSelect.directive:requestBranchSelect
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `requestBranchSelect` is a directive which creates a div containing a
         * {@link tabset.directive:tabset} with the main tabs of the Merge Requests page. These tabs
         * are the {@link openTab.directive:openTab}. The directive is replaced by the contents
         * of its template.
         */
        .directive('requestBranchSelect', requestBranchSelect);

    requestBranchSelect.$inject = ['mergeRequestsStateService', 'mergeRequestManagerService', 'catalogManagerService', 'utilService'];

    function requestBranchSelect(mergeRequestsStateService, mergeRequestManagerService, catalogManagerService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/requestBranchSelect/requestBranchSelect.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var cm = catalogManagerService;
                var mm = mergeRequestManagerService;
                var catalogId = _.get(cm.localCatalog, '@id');
                dvm.util = utilService;
                dvm.state = mergeRequestsStateService;

                dvm.state.requestConfig.difference = undefined;
                dvm.branches = [];

                if (dvm.state.requestConfig.sourceBranch && dvm.state.requestConfig.targetBranch) {
                    updateDifference();
                }

                // TODO: Sort by title
                cm.getRecordBranches(dvm.state.requestConfig.recordId, catalogId)
                    .then(response => dvm.branches = response.data, error => {
                        util.createErrorToast(error);
                        dvm.branches = [];
                    });

                dvm.changeSource = function() {
                    if (dvm.state.requestConfig.sourceBranch) {
                        dvm.state.requestConfig.sourceBranchId = dvm.state.requestConfig.sourceBranch['@id'];
                        if (dvm.state.requestConfig.targetBranch) {
                            updateDifference();
                        } else {
                            dvm.state.requestConfig.difference = undefined;
                        }
                    } else {
                        dvm.state.requestConfig.difference = undefined;
                    }
                }
                dvm.changeTarget = function() {
                    if (dvm.state.requestConfig.targetBranch) {
                        dvm.state.requestConfig.targetBranchId = dvm.state.requestConfig.targetBranch['@id'];
                        if (dvm.state.requestConfig.sourceBranch) {
                            updateDifference();
                        } else {
                            dvm.state.requestConfig.difference = undefined;
                        }
                    } else {
                        dvm.state.requestConfig.difference = undefined;
                    }
                }

                function updateDifference() {
                    cm.getBranchDifference(dvm.state.requestConfig.sourceBranchId, dvm.state.requestConfig.targetBranchId, dvm.state.requestConfig.recordId, catalogId)
                        .then(diff => {
                            dvm.state.requestConfig.difference = diff;
                        }, errorMessage => {
                            dvm.util.createErrorToast(errorMessage);
                            dvm.state.requestConfig.difference = undefined;
                        });
                }
            }
        }
    }
})();