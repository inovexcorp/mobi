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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name merge-requests.component:createRequest
     * @requires shared.service:mergeRequestsStateService
     *
     * @description
     * `createRequest` is a component which creates a div containing a
     * {@link shared.component:block} with the workflow steps of creating a MergeRequest. These steps are
     * {@link merge-requests.component:requestRecordSelect},
     * {@link merge-requests.component:requestBranchSelect}, and
     * {@link merge-requests.component:requestDetailsForm}.
     */
    const createRequestComponent = {
        templateUrl: 'merge-requests/components/createRequest/createRequest.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: createRequestComponentCtrl
    };

    createRequestComponent.$inject = ['mergeRequestManagerService', 'mergeRequestsStateService', 'utilService'];

    function createRequestComponentCtrl(mergeRequestManagerService, mergeRequestsStateService, utilService) {
        var dvm = this;
        var util = utilService;
        var mm = mergeRequestManagerService;
        dvm.state = mergeRequestsStateService;

        dvm.next = function() {
            if (dvm.state.createRequestStep < 2) {
                dvm.state.createRequestStep++;
            } else {
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
                    dvm.state.requestConfig.assignees = [];
                    dvm.state.requestConfig.removeSource = false;
                } else if (dvm.state.createRequestStep === 0) {
                    dvm.state.requestConfig.sourceBranchId = '';
                    dvm.state.requestConfig.targetBranchId = '';
                    delete dvm.state.requestConfig.sourceBranch;
                    delete dvm.state.requestConfig.targetBranch;
                    delete dvm.state.requestConfig.difference;
                    delete dvm.state.requestConfig.removeSource;
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

    angular.module('merge-requests')
        .component('createRequest', createRequestComponent);
})();