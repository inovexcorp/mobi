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
         * @name createRequestTabset
         *
         * @description
         * The `createRequestTabset` module only provides the `createRequestTabset` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('createRequestTabset', [])
        /**
         * @ngdoc directive
         * @name createRequestTabset.directive:createRequestTabset
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `createRequestTabset` is a directive which creates a div containing a
         * {@link tabset.directive:tabset} with the main tabs of the Merge Requests page. These tabs
         * are the {@link openTab.directive:openTab}. The directive is replaced by the contents
         * of its template.
         */
        .directive('createRequestTabset', createRequestTabset);

    createRequestTabset.$inject = ['mergeRequestManagerService', 'mergeRequestsStateService', 'utilService'];

    function createRequestTabset(mergeRequestManagerService, mergeRequestsStateService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/createRequestTabset/createRequestTabset.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var util = utilService;
                var mm = mergeRequestManagerService;
                dvm.state = mergeRequestsStateService;

                dvm.next = function() {
                    if (dvm.state.createRequestStep < 2) {
                        dvm.state.createRequestStep++;
                    } else {
                        console.log('Submit', dvm.state.requestConfig);
                        mm.createRequest(dvm.state.requestConfig)
                            .then(iri => {
                                util.createSuccessToast('Successfully created request');
                                dvm.state.createRequest = false;
                            }, util.createErrorToast);
                    }
                }
                dvm.back = function() {
                    if (dvm.state.createRequestStep > 0) {
                        dvm.state.createRequestStep--;
                        if (dvm.state.createRequestStep === 1) {
                            dvm.state.requestConfig.title = '';
                            dvm.state.requestConfig.description = '';
                        } else if (dvm.state.createRequestStep === 0) {
                            dvm.state.requestConfig.sourceBranchId = '';
                            dvm.state.requestConfig.targetBranchId = '';
                            delete dvm.state.requestConfig.sourceBranch;
                            delete dvm.state.requestConfig.targetBranch;
                            delete dvm.state.requestConfig.difference;
                        }
                     } else {
                        dvm.state.createRequest = false;
                    }
                }
                dvm.isDisabled = function() {
                    if (dvm.state.createRequestStep === 0) {
                        return !dvm.state.requestConfig.recordId;
                    } else if (dvm.state.createRequestStep === 1) {
                        return !dvm.state.requestConfig.sourceBranchId || !dvm.state.requestConfig.targetBranchId;
                    } else {
                        return !dvm.state.requestConfig.title;
                    }
                }
            }
        }
    }
})();